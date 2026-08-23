// Interface adapter: Discovery Controller
// Thin — delegates to use cases, formats HTTP responses

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { PrismaDigitalTwinRepository, PrismaScorecardRepository, PrismaEvidenceRepository } from '../../infrastructure/persistence/PrismaDiscoveryRepositories';
import { CalculateScoreUseCase } from '../../application/discovery/CalculateScoreUseCase';
import { EvidenceEngine } from '../../application/discovery/EvidenceEngine';
import { RecommendationEngine } from '../../application/discovery/RecommendationEngine';
import { GenerateReportUseCase } from '../../application/discovery/GenerateReportUseCase';
import { captureSnapshot } from '../../domain/scorecard/ScorecardSnapshotService';
import { AuditService } from '../../application/audit/AuditService';
import { getScorecard } from '../../domain/scorecard/ScorecardService';
import {
  determineEnrichment,
  isChallengePage,
  hasRealContent,
  type EnrichmentCandidate,
} from '../../application/discovery/evidenceEnrichment';

export class DiscoveryController {
  private calculateScore: CalculateScoreUseCase;
  private evidenceEngine: EvidenceEngine;
  private recommendationEngine: RecommendationEngine;
  private reportGenerator: GenerateReportUseCase;
  private twinRepo: PrismaDigitalTwinRepository;
  private auditService: AuditService;
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
    this.twinRepo = new PrismaDigitalTwinRepository(this.prisma);
    const scorecardRepo = new PrismaScorecardRepository(this.prisma);
    const evidenceRepo = new PrismaEvidenceRepository(this.prisma);
    this.calculateScore = new CalculateScoreUseCase(this.twinRepo, scorecardRepo, evidenceRepo);
    this.evidenceEngine = new EvidenceEngine();
    this.recommendationEngine = new RecommendationEngine();
    this.reportGenerator = new GenerateReportUseCase();
    this.auditService = new AuditService(this.prisma);
  }

  /**
   * POST /api/v1/discovery/intake
   * Resolve identity, absorb public evidence, score if unambiguous, and return audit
   */
  intake = async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, address, city, googleShareUrl, website, menuUrl } = req.body ?? {};
      if (!name || !address) {
        res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'name and address are required' } });
        return;
      }

      const haystackName = this.normalizeText(name);
      const haystackAddress = this.normalizeText(address);
      const haystackCity = city ? this.normalizeText(city) : null;
      const haystackWebsite = website ? this.normalizeText(website) : null;
      const candidates = await this.prisma.restaurant.findMany({
        where: {
          OR: [
            { name: { contains: haystackName } },
            { address: { contains: haystackAddress } },
            ...(city ? [{ city: { contains: city } }] : []),
            ...(website ? [{ website: { contains: website } }] : []),
          ],
        },
      });

      const exactMatches = candidates.filter((candidate) => {
        const sameName = this.normalizeText(candidate.name) === haystackName;
        const sameAddress = this.normalizeText(candidate.address) === haystackAddress;
        const sameCity = !haystackCity || this.normalizeText(candidate.city) === haystackCity;
        const sameWebsite = !haystackWebsite || this.normalizeText(candidate.website || '') === haystackWebsite;
        return sameName && sameAddress && sameCity && sameWebsite;
      });

      let identityState: 'confirmed' | 'probable' | 'ambiguous' | 'unresolved' = 'unresolved';
      let restaurant = exactMatches[0] ?? candidates[0] ?? null;

      if (exactMatches.length === 1) {
        identityState = 'confirmed';
      } else if (exactMatches.length > 1) {
        identityState = 'confirmed';
      } else if (candidates.length === 1) {
        identityState = this.normalizeText(candidates[0].name) === this.normalizeText(name) && this.normalizeText(candidates[0].address) === this.normalizeText(address)
          ? 'confirmed'
          : 'probable';
      } else if (candidates.length > 1) {
        identityState = 'ambiguous';
      }

      if (!restaurant && identityState !== 'ambiguous') {
        restaurant = await this.prisma.restaurant.create({
          data: {
            name,
            address,
            city: city || this.inferCity(address) || 'Unknown',
            website: website || null,
            cuisineTypes: JSON.stringify([]),
            dietarySupport: JSON.stringify([]),
            amenities: JSON.stringify([]),
            ambience: JSON.stringify([]),
            nearbyLandmarks: JSON.stringify([]),
          },
        });
        identityState = 'confirmed';
      }

      if (!restaurant) {
        res.json({ data: { identityState, restaurant: null, evidence: [], scorecard: null, audit: null } });
        return;
      }

      const evidence = await this.absorbPublicEvidence(restaurant.id, { googleShareUrl, website, menuUrl, name, address, city });
      if (identityState === 'ambiguous') {
        res.json({ data: { identityState, restaurant: { id: restaurant.id, name: restaurant.name, address: restaurant.address }, evidence, scorecard: null, audit: null } });
        return;
      }

      const scorecard = await getScorecard(restaurant.id, '');
      const audit = await this.auditService.runAudit(restaurant.id);
      await captureSnapshot(restaurant.id);

      res.json({
        data: {
          identityState,
          restaurant: { id: restaurant.id, name: restaurant.name, address: restaurant.address, city: restaurant.city, website: restaurant.website },
          evidence,
          scorecard,
          audit,
        },
      });
    } catch (error: any) {
      console.error('Restaurant intake failed:', error);
      res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message } });
    }
  };

  /**
   * POST /api/v1/discovery/restaurants/:id/analyze
   * Analyze a restaurant: build evidence, calculate scores, generate recommendations
   */
  analyze = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const restaurant = await this.prisma.restaurant.findUnique({
        where: { id },
        include: {
          menuItems: true,
          reviewAnalyses: { orderBy: { createdAt: 'desc' }, take: 1 },
          faqs: true,
        },
      });

      if (!restaurant) {
        res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Restaurant not found' } });
        return;
      }

      const evidence = this.evidenceEngine.generate({
        menuItems: restaurant.menuItems.map(i => ({ id: i.id, name: i.name, price: i.price, description: i.description, ingredients: i.ingredients, dietaryType: i.dietaryType })),
        reviewAnalysis: restaurant.reviewAnalyses[0] ? { overallSentiment: restaurant.reviewAnalyses[0].overallSentiment, sentimentSummary: restaurant.reviewAnalyses[0].sentimentSummary, popularDishes: restaurant.reviewAnalyses[0].popularDishes, complaints: restaurant.reviewAnalyses[0].complaints } : null,
        faqs: restaurant.faqs.map(f => ({ id: f.id, question: f.question, answer: f.answer, category: f.category })),
        restaurantName: restaurant.name,
        city: restaurant.city,
        cuisineTypes: this.safeParseJSON(restaurant.cuisineTypes),
        regionalCuisine: restaurant.regionalCuisine,
        nearbyLandmarks: this.safeParseJSON(restaurant.nearbyLandmarks),
      });

      const rawScores = [
        { name: 'DishRecognition', rawScore: this.computeDishRecognition(restaurant), weight: 18, evidenceIds: evidence.filter(e => e.source.entityType === 'MenuItem').map(e => e.id), isInformational: false },
        { name: 'AIDiscoverability', rawScore: this.computeAIDiscoverability(restaurant), weight: 18, evidenceIds: evidence.filter(e => e.source.entityType === 'FAQ').map(e => e.id), isInformational: false },
        { name: 'RestaurantClarity', rawScore: this.computeRestaurantClarity(restaurant), weight: 14, evidenceIds: [], isInformational: false },
        { name: 'AISearchVisibility', rawScore: null, weight: 18, evidenceIds: [], isInformational: false },
        { name: 'DishUnderstanding', rawScore: this.computeDishUnderstanding(restaurant), weight: 14, evidenceIds: evidence.filter(e => e.source.field === 'description').map(e => e.id), isInformational: false },
        { name: 'LocalIntentAlignment', rawScore: this.computeLocalIntent(restaurant), weight: 10, evidenceIds: evidence.filter(e => e.source.field === 'nearbyLandmarks').map(e => e.id), isInformational: false },
        { name: 'RetrievalReadiness', rawScore: null, weight: 5, evidenceIds: [], isInformational: false },
        { name: 'CompetitiveVisibility', rawScore: null, weight: 3, evidenceIds: [], isInformational: false },
        { name: 'OptimizationCompleteness', rawScore: 50, weight: 0, evidenceIds: [], isInformational: true },
        { name: 'RetrievalConfidence', rawScore: 40, weight: 0, evidenceIds: [], isInformational: true },
        { name: 'GBPHealthScore', rawScore: restaurant.gbpHealthScore, weight: 0, evidenceIds: [], isInformational: true },
      ];

      const { twin, scorecard, events } = await this.calculateScore.execute({ restaurantId: id, rawScores });
      await captureSnapshot(id);
      const recommendations = this.recommendationEngine.generate(evidence, id);
      const report = this.reportGenerator.execute(twin, recommendations, restaurant.name);

      res.json({
        data: {
          twin: this.serializeTwin(twin),
          scorecard: { overallScore: scorecard.overallScore, dimensions: scorecard.dimensions.map(d => ({ name: d.name, score: d.finalScore, weight: d.weight })) },
          evidence: evidence.map(e => ({ id: e.id, description: e.description, confidence: e.confidence, source: e.source })),
          recommendations: recommendations.map(r => ({ id: r.id, title: r.title, description: r.description, priority: r.priority, businessImpact: r.businessImpact, implementationEffort: r.implementationEffort, confidence: r.confidence, evidenceIds: [...r.evidenceIds], priorityScore: r.priorityScore })),
          report,
          events: events.map(e => ({ name: e.eventName, version: e.eventVersion })),
        },
      });
    } catch (error: any) {
      console.error('Discovery analysis failed:', error);
      res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message } });
    }
  };

  /**
   * GET /api/v1/discovery/restaurants/:id/twin
   * Get the current Digital Twin state
   */
  getTwin = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const twin = await this.twinRepo.findByRestaurantId(id);

      if (!twin) {
        res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Digital Twin not found. Run analysis first.' } });
        return;
      }

      res.json({ data: this.serializeTwin(twin) });
    } catch (error: any) {
      res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message } });
    }
  };

  private normalizeText(value: string): string {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  }

  private inferCity(address: string): string | null {
    const parts = address.split(',').map(p => p.trim()).filter(Boolean);
    return parts.length >= 2 ? parts[parts.length - 2] : null;
  }

  private async absorbPublicEvidence(restaurantId: string, input: { googleShareUrl?: string; website?: string; menuUrl?: string; name?: string; address?: string; city?: string }): Promise<any[]> {
    const seedUrls = [input.googleShareUrl, input.website, input.menuUrl].filter(Boolean) as string[];
    const discovered = await this.discoverPublicSourceUrls({ name: input.name, address: input.address, city: input.city, website: input.website, menuUrl: input.menuUrl });
    const discoveredUrls = discovered.map(item => item.url);
    const urls = Array.from(new Set([...seedUrls, ...discoveredUrls])).slice(0, 8);
    const queryByUrl = new Map(discovered.map(item => [item.url, item.query] as const));
    const rankByUrl = new Map(discovered.map(item => [item.url, item.rank] as const));
    const discoveredByUrl = new Map(discovered.map(item => [item.url, item.discoveredBy] as const));
    const out: any[] = [];
    const enrichmentCandidates: EnrichmentCandidate[] = [];

    for (const url of urls) {
      try {
        if (this.isLikelyNoiseUrl(url)) {
          out.push({ sourceUrl: url, sourceType: this.sourceTypeForUrl(url), status: 'skipped_noise' });
          continue;
        }

        const observedAt = new Date();
        const response = await fetch(url, { redirect: 'follow', headers: { 'user-agent': 'Mozilla/5.0' } });
        const html = await response.text();
        const title = /<title[^>]*>([^<]{1,200})<\/title>/i.exec(html)?.[1]?.trim() || url;
        const plain = html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        const observedMenuHint = /menu|biryani|dosa|curry|tikka|thali|naan|starters|appetizers|specials/i.test(plain) ? plain.slice(0, 400) : title;
        const sourceType = this.sourceTypeForUrl(url);
        const checksum = `${restaurantId}:${this.normalizeText(url)}`;
        const observationId = `evi-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const provenance = {
          discoveredBy: discoveredByUrl.get(url) ?? (seedUrls.includes(url) ? 'seed-url' : 'public-search'),
          query: queryByUrl.get(url) ?? this.buildDiscoveryQuery(input),
          rank: rankByUrl.get(url) ?? (urls.indexOf(url) + 1),
          sourceType,
        };
        await this.prisma.evidenceObservation.create({
          data: {
            id: observationId,
            sourceId: url,
            sourceType,
            entityType: 'Restaurant',
            entityExternalId: restaurantId,
            payload: JSON.stringify({ rawObservation: html.slice(0, 4000), normalizedValue: { title, observedMenuHint } }),
            observedAt,
            metadata: JSON.stringify({ sourceUrl: url, freshness: 'public-live', provenance }),
          },
        });
        await this.prisma.evidenceRecord.create({
          data: {
            id: `evr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            observationIds: JSON.stringify([observationId]),
            sourceId: url,
            sourceType,
            entityType: 'Restaurant',
            entityId: restaurantId,
            payload: JSON.stringify({ rawObservation: html.slice(0, 4000), normalizedValue: { title, observedMenuHint } }),
            observedAt,
            ingestedAt: new Date(),
            confidence: response.ok ? 0.78 : 0.42,
            checksum,
          },
        });
        // Collect ONLY high-confidence, non-challenge pages as enrichment candidates.
        // Challenge/interstitial/noise pages (Cloudflare, "Just a moment", etc.)
        // contain no real business content and are never used for enrichment.
        const confidence = response.ok ? 0.78 : 0.42;
        if (confidence >= 0.70 && !isChallengePage(title, html)) {
          enrichmentCandidates.push({ sourceUrl: url, sourceType, confidence, title, html });
        }
        out.push({ sourceUrl: url, sourceType, observedAt, confidence, normalizedValue: { title, observedMenuHint }, provenance });
      } catch {
        out.push({ sourceUrl: url, sourceType: this.sourceTypeForUrl(url), status: 'unavailable' });
      }
    }

    if (urls.length === 0) {
      out.push({ status: 'pending_observation', reason: 'No public sources found yet', factor: 'source_coverage' });
    }

    // Evidence-grounded structured enrichment (RIST-RDI-002): persist ONLY real,
    // verifiable signals from high-confidence, non-challenge evidence into the
    // restaurant profile so the frozen scorecard can honestly move presence-based
    // factors (website, phone, cuisine, hours) out of Pending. Deterministic,
    // never fabricated, never overwrites existing real values.
    if (enrichmentCandidates.length > 0) {
      await this.enrichRestaurantFromEvidence(restaurantId, input.name || 'Unknown', enrichmentCandidates);
    }

    return out;
  }

  /**
   * Persist real, verifiable signals from high-confidence, non-challenge evidence
   * into the restaurant profile. Deterministic and evidence-grounded — never
   * fabricates, never extracts from challenge/noise pages, and never overwrites
   * existing real values. See determineEnrichment in evidenceEnrichment.ts.
   */
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
  private async discoverPublicSourceUrls(input: { name?: string; address?: string; city?: string; website?: string; menuUrl?: string }): Promise<Array<{ url: string; query: string; rank: number; discoveredBy: string }>> {
    const queries = this.buildDiscoveryQueries(input);
    const seen = new Set<string>();
    const results: Array<{ url: string; query: string; rank: number; discoveredBy: string }> = [];

    for (const query of queries) {
      try {
        const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
        const response = await fetch(searchUrl, { redirect: 'follow', headers: { 'user-agent': 'Mozilla/5.0' } });
        const html = await response.text();
        const links = Array.from(html.matchAll(/<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)).map(match => ({
          href: match[1],
          title: match[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
        }));
        let rank = 0;
        for (const link of links) {
          rank += 1;
          const url = this.normalizeSearchResultUrl(link.href);
          if (!url) continue;
          if (!/^https?:\/\//i.test(url)) continue;
          if (/duckduckgo\.com|facebook\.com\/login|instagram\.com\/accounts|linkedin\.com\/auth/i.test(url)) continue;
          if (this.isLikelyNoiseUrl(url)) continue;
          if (seen.has(url)) continue;
          seen.add(url);
          results.push({ url, query, rank, discoveredBy: 'public-search' });
          if (results.length >= 8) return results;
        }
      } catch {
        continue;
      }
    }

    return results;
  }

  private buildDiscoveryQueries(input: { name?: string; address?: string; city?: string; website?: string; menuUrl?: string }): string[] {
    const name = input.name?.trim();
    const address = input.address?.trim();
    const city = input.city?.trim();
    const host = input.website ? this.hostFromUrl(input.website) : null;
    const menuHost = input.menuUrl ? this.hostFromUrl(input.menuUrl) : null;
    const base = [name, city, address].filter(Boolean).join(' ').trim();
    const queries = [
      [base, 'menu'].filter(Boolean).join(' ').trim(),
      [base, 'website'].filter(Boolean).join(' ').trim(),
      [base, 'reviews'].filter(Boolean).join(' ').trim(),
      [base, 'google maps'].filter(Boolean).join(' ').trim(),
      [base, 'order online'].filter(Boolean).join(' ').trim(),
      [name, city, 'menu'].filter(Boolean).join(' ').trim(),
      [name, city, 'hours'].filter(Boolean).join(' ').trim(),
      [name, city, 'address'].filter(Boolean).join(' ').trim(),
      [host, name, city].filter(Boolean).join(' ').trim(),
      [menuHost, name, city].filter(Boolean).join(' ').trim(),
    ].filter(Boolean) as string[];
    return Array.from(new Set(queries));
  }

  private buildDiscoveryQuery(input: { name?: string; address?: string; city?: string; website?: string; menuUrl?: string }): string {
    return this.buildDiscoveryQueries(input)[0] ?? '';
  }

  private hostFromUrl(url: string): string {
    try { return new URL(url).hostname.replace(/^www\./i, ''); } catch { return url; }
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
 
  private sourceTypeForUrl(url: string): string {
    if (/google\./i.test(url) || /maps\.google/i.test(url)) return 'google_share';
    if (/menu/i.test(url)) return 'menu_page';
    if (/yelp\.|tripadvisor\.|opentable\.|ubereats\.|doordash\.|grubhub\.|restaurantji\.|zomato\.|swiggy\./i.test(url)) return 'listing_page';
    if (/facebook\.|instagram\.|tiktok\.|linkedin\./i.test(url)) return 'social_profile';
    return 'website';
  }

  private isLikelyNoiseUrl(url: string): boolean {
    return /(?:\/login|\/signup|\/account|\/privacy|\/terms|\/jobs|\/careers|\/blog|\/press|\/contact-us\/thank-you|\/cart|\/checkout)/i.test(url)
      || /(?:facebook\.com\/login|instagram\.com\/accounts|linkedin\.com\/auth|duckduckgo\.com)/i.test(url);
  }

  private serializeTwin(twin: any): any {
    return {
      id: twin.id,
      restaurantId: twin.restaurantId,
      status: twin.status,
      hasScorecard: twin.hasScorecard,
      evidenceCount: twin.evidenceCount,
      scorecard: twin.scorecard ? {
        overallScore: twin.scorecard.overallScore,
        trend: twin.scorecard.trend,
        dimensions: twin.scorecard.dimensions.map((d: any) => ({ name: d.name, score: d.finalScore, weight: d.weight, isInformational: d.isInformational })),
      } : null,
    };
  }

  // Scoring helpers (deterministic — no AI)
  private computeDishRecognition(restaurant: any): number {
    const items = restaurant.menuItems || [];
    if (items.length === 0) return 0;
    const canonicalKeywords = ['biryani', 'dosa', 'curry', 'samosa', 'korma', 'paneer', 'naan', 'tikka', 'chana', 'gobi'];
    const matches = items.filter((i: any) => canonicalKeywords.some(k => i.name.toLowerCase().includes(k)));
    return Math.round((matches.length / items.length) * 100);
  }

  private computeAIDiscoverability(restaurant: any): number {
    const faqs = restaurant.faqs || [];
    if (faqs.length === 0) return 20;
    return Math.min(100, 20 + faqs.length * 10);
  }

  private computeRestaurantClarity(restaurant: any): number {
    let score = 0;
    if (restaurant.cuisineTypes && restaurant.cuisineTypes !== '[]') score += 25;
    if (restaurant.regionalCuisine) score += 25;
    if (restaurant.priceRange) score += 15;
    if (restaurant.amenities && restaurant.amenities !== '[]') score += 20;
    if (restaurant.timings && restaurant.timings !== '{}') score += 15;
    return score;
  }

  private computeDishUnderstanding(restaurant: any): number {
    const items = restaurant.menuItems || [];
    if (items.length === 0) return 0;
    const withDesc = items.filter((i: any) => i.description && i.description.length > 15);
    return Math.round((withDesc.length / items.length) * 100);
  }

  private computeLocalIntent(restaurant: any): number {
    let score = 20;
    if (restaurant.latitude && restaurant.longitude) score += 30;
    const landmarks = this.safeParseJSON(restaurant.nearbyLandmarks);
    if (landmarks.length > 0) score += Math.min(50, landmarks.length * 15);
    return score;
  }

  private safeParseJSON(str: string | null): string[] {
    if (!str) return [];
    try { const p = JSON.parse(str); return Array.isArray(p) ? p : []; }
    catch { return str.split(',').map(s => s.trim()).filter(Boolean); }
  }
}
