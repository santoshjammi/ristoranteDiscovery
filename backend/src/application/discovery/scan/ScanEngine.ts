// ── Scan Engine (RIST-RDI-006) ──
// Orchestrates ALL scan types for a restaurant. This is the pure, reusable scan
// path: discover URLs per scan type → fetch each → classify → persist
// idempotently to the evidence ledger → return typed, grouped results.
//
// It is DB-agnostic for discovery/fetch/classify (pure functions) and only the
// persist step touches Prisma. The controller and any future caller delegate
// HERE instead of duplicating the scan loop.

import { PrismaClient } from '@prisma/client';
import { determineEnrichment, isChallengePage, hasRealContent, type EnrichmentCandidate } from '../evidenceEnrichment';
import {
  ALL_SCAN_TYPES, SCAN_TYPE_LABEL, classifySourceType, isHttpUrl, isSyntheticUrl, isNoiseUrl, type ScanType,
} from './scan-types';
import { buildScanTypeQueries, type ScanInput } from './scan-query';

export interface DiscoveredSource {
  url: string;
  query: string;
  rank: number;
  discoveredBy: 'public-search' | 'seed-url';
  scanType: ScanType;
}

export interface ScanResultSource {
  sourceUrl: string;
  scanType: ScanType;
  sourceType: string;
  sourceTypeLabel: string;
  observedAt: string | null;
  confidence: number | null;
  status: 'real' | 'synthetic' | 'pending' | 'noise' | 'unavailable';
  category: string;
  normalizedValue?: { title?: string; observedMenuHint?: string };
  provenance?: Record<string, unknown>;
}

export interface ScanSummary {
  restaurantId: string;
  restaurantName: string;
  scannedAt: string;
  integrity: { real: number; pending: number; unavailable: number; synthetic: number };
  groups: Record<string, ScanResultSource[]>;
  total: number;
  /** Per-type source counts (real only) — e.g. "how many real menu sources". */
  byType: Record<ScanType, number>;
}

const FETCH_USER_AGENT = 'Mozilla/5.0';

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

export class ScanEngine {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Run every scan type for a restaurant and return typed, grouped results.
   * Seed URLs (googleShareUrl/menuUrl/website) are attributed to their scan
   * type via the URL classifier.
   */
  async runAll(input: ScanInput, restaurantId: string, restaurantName: string): Promise<ScanSummary> {
    // 1. Seeds attributed to their scan type.
    const seedUrls = [input.googleShareUrl, input.website, input.menuUrl].filter(Boolean) as string[];

    // 2. Discover per scan type.
    const discovered = await this.discover(input);
    const discoveredByType: Record<ScanType, DiscoveredSource[]> = {} as Record<ScanType, DiscoveredSource[]>;
    for (const t of ALL_SCAN_TYPES) discoveredByType[t] = [];
    for (const d of discovered) discoveredByType[d.scanType].push(d);

    const queryByUrl = new Map(discovered.map((d) => [d.url, d.query] as const));
    const rankByUrl = new Map(discovered.map((d) => [d.url, d.rank] as const));
    const typeByUrl = new Map(discovered.map((d) => [d.url, d.scanType] as const));

    // Dedupe across all URLs (seeds + discovered), prioritize seeds.
    const urls = Array.from(new Set([...seedUrls, ...discovered.map((d) => d.url)])).slice(0, 10);

    const out: ScanResultSource[] = [];
    const enrichmentCandidates: EnrichmentCandidate[] = [];

    for (const url of urls) {
      const scanType = typeByUrl.get(url) ?? classifySourceType(url);
      const provenance: Record<string, unknown> = {
        discoveredBy: seedUrls.includes(url) ? 'seed-url' : 'public-search',
        query: seedUrls.includes(url) ? 'seed-url' : (queryByUrl.get(url) ?? this.firstQuery(input)),
        rank: rankByUrl.get(url) ?? (urls.indexOf(url) + 1),
        scanType,
      };

      if (isNoiseUrl(url)) {
        out.push({ sourceUrl: url, scanType, sourceType: scanType, sourceTypeLabel: SCAN_TYPE_LABEL[scanType], observedAt: null, confidence: null, status: 'noise', category: scanType, provenance });
        continue;
      }

      try {
        const observedAt = new Date();
        const response = await fetch(url, { redirect: 'follow', headers: { 'user-agent': FETCH_USER_AGENT } });
        const html = await response.text();
        const title = /<title[^>]*>([^<]{1,200})<\/title>/i.exec(html)?.[1]?.trim() || url;
        const plain = html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        const observedMenuHint = /menu|biryani|dosa|curry|tikka|thali|naan|starters|appetizers|specials/i.test(plain) ? plain.slice(0, 400) : title;
        const normalizedValue = { title, observedMenuHint };

        const isSynthetic = isSyntheticUrl(url);
        const status: ScanResultSource['status'] = isSynthetic ? 'synthetic' : 'real';
        const confidence = response.ok ? 0.78 : 0.42;

        // Persist idempotently (deterministic checksum → upsert).
        const checksum = `${restaurantId}:${normalizeText(url)}`;
        const observationId = `evi-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        await this.persist(url, scanType, restaurantId, html, normalizedValue, observedAt, confidence, observationId, checksum, provenance);

        if (confidence >= 0.70 && !isChallengePage(title, html) && !isSynthetic) {
          enrichmentCandidates.push({ sourceUrl: url, sourceType: scanType, confidence, title, html });
        }

        out.push({ sourceUrl: url, scanType, sourceType: scanType, sourceTypeLabel: SCAN_TYPE_LABEL[scanType], observedAt: observedAt.toISOString(), confidence, status, category: scanType, normalizedValue, provenance });
      } catch (error: any) {
        console.error(`[scan] source ${url} (${scanType}) unavailable:`, error?.message ?? error);
        out.push({ sourceUrl: url, scanType, sourceType: scanType, sourceTypeLabel: SCAN_TYPE_LABEL[scanType], observedAt: null, confidence: null, status: 'unavailable', category: scanType, provenance });
      }
    }

    if (urls.length === 0) {
      out.push({ sourceUrl: '', scanType: 'listings', sourceType: 'pending', sourceTypeLabel: 'Not found yet', observedAt: null, confidence: null, status: 'pending', category: 'pending' });
    }

    // Evidence-grounded enrichment (persist real signals into profile).
    if (enrichmentCandidates.length > 0) {
      await this.enrichRestaurantFromEvidence(restaurantId, restaurantName, enrichmentCandidates);
    }

    return this.summarize(restaurantId, restaurantName, out);
  }

  private async persist(
    url: string, scanType: ScanType, restaurantId: string, html: string,
    normalizedValue: { title: string; observedMenuHint: string }, observedAt: Date,
    confidence: number, observationId: string, checksum: string, provenance: Record<string, unknown>,
  ): Promise<void> {
    const payload = JSON.stringify({ rawObservation: html.slice(0, 4000), normalizedValue });
    await this.prisma.evidenceObservation.create({
      data: {
        id: observationId,
        sourceId: url,
        sourceType: scanType,
        entityType: 'Restaurant',
        entityExternalId: restaurantId,
        payload,
        observedAt,
        metadata: JSON.stringify({ sourceUrl: url, freshness: 'public-live', provenance }),
      },
    });
    await this.prisma.evidenceRecord.upsert({
      where: { checksum },
      update: {
        observationIds: JSON.stringify([observationId]),
        sourceId: url,
        sourceType: scanType,
        entityType: 'Restaurant',
        entityId: restaurantId,
        payload,
        observedAt,
        ingestedAt: new Date(),
        confidence,
        status: 'active',
      },
      create: {
        id: `evr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        observationIds: JSON.stringify([observationId]),
        sourceId: url,
        sourceType: scanType,
        entityType: 'Restaurant',
        entityId: restaurantId,
        payload,
        observedAt,
        ingestedAt: new Date(),
        confidence,
        checksum,
      },
    });
  }

  private async enrichRestaurantFromEvidence(restaurantId: string, restaurantName: string, candidates: EnrichmentCandidate[]): Promise<void> {
    const current = await this.prisma.restaurant.findUnique({ where: { id: restaurantId } });
    if (!current) return;
    const enrichment = determineEnrichment(candidates, restaurantName, {
      website: current.website,
      phone: current.phone,
      cuisineTypes: current.cuisineTypes,
      timings: current.timings,
    });
    const data: any = {};
    if (enrichment.website && !hasRealContent(current.website)) data.website = enrichment.website;
    if (enrichment.phone && !hasRealContent(current.phone)) data.phone = enrichment.phone;
    if (enrichment.cuisineTypes && !hasRealContent(current.cuisineTypes)) data.cuisineTypes = JSON.stringify(enrichment.cuisineTypes);
    if (enrichment.timings && !hasRealContent(current.timings)) data.timings = JSON.stringify(enrichment.timings);
    if (Object.keys(data).length === 0) return;
    await this.prisma.restaurant.update({ where: { id: restaurantId }, data });
  }

  private summarize(restaurantId: string, restaurantName: string, out: ScanResultSource[]): ScanSummary {
    const groups: Record<string, ScanResultSource[]> = {};
    const integrity = { real: 0, pending: 0, unavailable: 0, synthetic: 0 };
    const byType: Record<ScanType, number> = {} as Record<ScanType, number>;
    for (const t of ALL_SCAN_TYPES) byType[t] = 0;

    for (const s of out) {
      (groups[s.category] = groups[s.category] || []).push(s);
      if (s.status === 'real') integrity.real++;
      else if (s.status === 'pending') integrity.pending++;
      else if (s.status === 'unavailable') integrity.unavailable++;
      else integrity.synthetic++;
      if (s.status === 'real') byType[s.scanType] = (byType[s.scanType] || 0) + 1;
    }

    return {
      restaurantId,
      restaurantName,
      scannedAt: new Date().toISOString(),
      integrity,
      groups,
      total: out.length,
      byType,
    };
  }

  private async discover(input: ScanInput): Promise<DiscoveredSource[]> {
    const seeds = [input.googleShareUrl, input.website, input.menuUrl].filter(Boolean) as string[];
    const seen = new Set<string>(seeds.map((u) => normalizeText(u)));
    const results: DiscoveredSource[] = [];

    // Run queries per scan type (seeded URL types not re-queried as seeds, but
    // still allow discovery to find more for every type).
    for (const type of ALL_SCAN_TYPES) {
      for (const query of buildScanTypeQueries(type, input)) {
        try {
          const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
          const response = await fetch(searchUrl, { redirect: 'follow', headers: { 'user-agent': FETCH_USER_AGENT } });
          const html = await response.text();
          const links = Array.from(html.matchAll(/<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)).map((m) => ({
            href: m[1],
            title: m[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
          }));
          let rank = 0;
          for (const link of links) {
            rank += 1;
            const url = this.normalizeSearchResultUrl(link.href);
            if (!url || !isHttpUrl(url) || isNoiseUrl(url)) continue;
            const key = normalizeText(url);
            if (seen.has(key)) continue;
            seen.add(key);
            results.push({ url, query, rank, discoveredBy: 'public-search', scanType: classifySourceType(url) });
            if (results.length >= 9) return results;
          }
        } catch {
          continue;
        }
      }
    }
    // Fall back to a broad "menu/website/reviews" pass if per-type found little.
    if (results.length < 4) {
      const fallbackQueries = buildScanTypeQueries('website', input).concat(buildScanTypeQueries('menu', input)).concat(buildScanTypeQueries('reviews', input));
      for (const query of fallbackQueries) {
        try {
          const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
          const response = await fetch(searchUrl, { redirect: 'follow', headers: { 'user-agent': FETCH_USER_AGENT } });
          const html = await response.text();
          const links = Array.from(html.matchAll(/<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>/gi)).map((m) => m[1]);
          for (const rawHref of links) {
            const url = this.normalizeSearchResultUrl(rawHref);
            if (!url || !isHttpUrl(url) || isNoiseUrl(url)) continue;
            const key = normalizeText(url);
            if (seen.has(key)) continue;
            seen.add(key);
            results.push({ url, query, rank: results.length + 1, discoveredBy: 'public-search', scanType: classifySourceType(url) });
            if (results.length >= 9) return results;
          }
        } catch { continue; }
      }
    }
    return results;
  }

  private normalizeSearchResultUrl(url: string): string | null {
    try {
      const cleaned = url.startsWith('//') ? `https:${url}` : url;
      const parsed = new URL(cleaned);
      const uddg = parsed.searchParams.get('uddg');
      return uddg ? decodeURIComponent(uddg) : cleaned;
    } catch {
      return null;
    }
  }

  private firstQuery(input: ScanInput): string {
    return buildScanTypeQueries('website', input)[0] ?? '';
  }
}
