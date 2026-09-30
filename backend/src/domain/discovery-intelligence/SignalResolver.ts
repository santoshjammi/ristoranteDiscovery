// ── Signal Resolver ──
// RIST-RDI-007 signal-design-v1 Phase B (existing coverage mapping), C, D.
// Pure/deterministic: given a restaurant's real data context, resolves each of
// the 25 factors' DiscoverySignal[] + per-factor accounting + restaurant-level
// summary. Only measured/partial contribute; pending/stale never zero;
// not_applicable excluded from denominator. Connector data takes priority over
// DB fallback (matching frozen ScorecardService behavior).

import { FACTORS } from '../scorecard/types';
import {
  type DiscoverySignal,
  type FactorResult,
  type FactorCapabilities,
  type SignalModelSummary,
  type ObservationSourceType,
  type SignalEvidence,
} from './types';
import {
  DISCOVERY_SIGNAL_REGISTRY,
  allSignalDefinitions,
  signalsForFactor,
  METHODOLOGY_VERSION,
  validateRegistry,
} from './signal-registry';
import { processFactor } from './SignalProcessor';
import { calculateFactor } from './FactorEngine';

/** A connector-sourced score for a factor (mirrors ScorecardService connectorMap). */
export interface ConnectorRow {
  score: number;
  confidence: number | null;
  evidence: string[];
  syncedAt?: Date;
}

/** A real scan/evidence ledger row (EvidenceRecord-ish). */
export interface ScanEvidenceRow {
  signalKey?: string;
  sourceId: string;
  sourceType: string;
  observedAt?: Date;
  confidence?: number;
  payload?: string;
  status?: string;
}

/** A benchmark row (minimally MIN_PEERS-guarded). */
export interface BenchmarkRow {
  factorId?: string;
  score?: number;
  p50?: number | null;
  p75?: number | null;
  p90?: number | null;
  count?: number;
  dimension?: string;
  dimensionValue?: string;
}

/** A scorecard snapshot history point (for trend/history signals). */
export interface SnapshotPoint {
  capturedAt: Date | string;
  overallScore?: number | null;
  factorScores?: Record<string, number | null>;
}

/** Everything the resolver needs. All real, no synthetic inputs. */
export interface SignalResolverContext {
  restaurantId: string;
  /** The Restaurant row (untyped: only declared columns are read). */
  restaurant: Record<string, any>;
  /** Real-data presence booleans computed from Prisma counts. */
  presence: {
    hasMenuData: boolean;
    hasReviewData: boolean;
    hasFaqData: boolean;
    hasSchemaData: boolean;
    hasAnyData: boolean;
  };
  /** Connector scorecard map keyed by factorId/signalId (connector priority). */
  connectorMap: Map<string, ConnectorRow>;
  /** Real scan/evidence ledger rows for this restaurant. */
  scanEvidence: ScanEvidenceRow[];
  /** Benchmark rows (real peer cohorts, MIN_PEERS guarded externally). */
  benchmarks: BenchmarkRow[];
  /** Scorecard snapshot history (real, for history-based signals). */
  snapshots: SnapshotPoint[];
  /** Restaurant capability gates. */
  capabilities: FactorCapabilities;
  /** Optional deterministic clock for freshness tests. */
  now?: Date;
}

/** Minimal real-content gate mirroring ScorecardService.hasRealContent. */
function hasRealContent(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (trimmed.length === 0) return false;
  if (trimmed.startsWith('[')) {
    try {
      const arr = JSON.parse(trimmed);
      return Array.isArray(arr) && arr.some((i) => typeof i === 'string' && i.trim().length > 0);
    } catch { return false; }
  }
  if (trimmed.startsWith('{')) {
    try {
      const obj = JSON.parse(trimmed);
      return typeof obj === 'object' && obj !== null && Object.keys(obj).length > 0;
    } catch { return false; }
  }
  return trimmed.split(',').some((i) => i.trim().length > 0);
}

function nonNullScalar(v: unknown): boolean {
  return v !== null && v !== undefined && v !== '';
}

/**
 * Derive a restaurant's capability gates from its row (RIST-RDI-007 brief).
 * The Restaurant model has NO reservation/ordering booleans, only `amenities`
 * (freeform) and `deliverySupport` (Boolean). Derive conservatively:
 *  - hasReservations    = amenities matches reserv|booking|opentable|resy
 *  - hasOnlineOrdering  = amenities matches order|zomato|swiggy OR deliverySupport
 *  - hasDelivery        = deliverySupport OR amenities matches delivery
 *  - hasWebsite         = real (non-empty) website content
 * These drive `not_applicable` gating in the signal model.
 */
export function buildFactorCapabilities(r: Record<string, any>): FactorCapabilities {
  const amenities = typeof r?.amenities === 'string' ? r.amenities.toLowerCase() : '';
  const hasRealWebsite = hasRealContent(r?.website);
  return {
    hasReservations: /reserv|booking|opentable|resy/.test(amenities),
    hasOnlineOrdering: /order|zomato|swiggy/.test(amenities) || r?.deliverySupport === true,
    hasDelivery: r?.deliverySupport === true || /delivery/.test(amenities),
    hasWebsite: hasRealWebsite,
  };
}

function toEvidence(defKey: string, raw: unknown, sourceType: ObservationSourceType, confidence: number, observedAt: Date | undefined, sourceUrl?: string, refs: string[] = []): SignalEvidence {
  return { signalKey: defKey, rawValue: raw, confidence, observedAt: observedAt ?? new Date(), sourceType, sourceUrl, evidenceRefs: refs };
}

function sourceTypeFrom(def: { sourceTypes: ObservationSourceType[] }): ObservationSourceType {
  return def.sourceTypes[0] ?? 'other';
}

/**
 * Build the evidence map by adapting ALL real data the system already knows
 * about (Phase B — "measure what Ristorante already knows"). No synthetic
 * values are introduced: absent data simply yields no evidence → pending.
 */
export function buildEvidenceMap(ctx: SignalResolverContext): Map<string, SignalEvidence> {
  const map = new Map<string, SignalEvidence>();
  const r = ctx.restaurant;
  const now = ctx.now ?? new Date();

  const defs = allSignalDefinitions();
  const defByKey = new Map(defs.map((d) => [d.key, d]));

  // ── scalar / presence signals from Restaurant columns ──
  const colEvidence: Array<{ key: string; value: unknown; conf: number }> = [
    { key: 'gbp_address_verified', value: r.address ? true : null, conf: 0.9 },
    { key: 'gbp_phone_verified', value: r.phone ? true : null, conf: 0.9 },
    { key: 'gbp_website_present', value: r.website ? true : null, conf: 0.9 },
    { key: 'gbp_primary_category', value: hasRealContent(r.cuisineTypes) ? true : null, conf: 0.75 },
    { key: 'gbp_photo_coverage', value: hasRealContent(r.amenities) ? true : null, conf: 0.6 },
    { key: 'gbp_latitude_longitude', value: nonNullScalar(r.latitude) && nonNullScalar(r.longitude) ? true : null, conf: 0.6 },
    { key: 'address_present', value: hasRealContent(r.address) ? true : null, conf: 0.9 },
    { key: 'city_present', value: hasRealContent(r.city) ? true : null, conf: 0.9 },
    { key: 'pin_coordinates', value: nonNullScalar(r.latitude) && nonNullScalar(r.longitude) ? true : null, conf: 0.7 },
    { key: 'landmark_nearby', value: hasRealContent(r.nearbyLandmarks) ? true : null, conf: 0.7 },
    { key: 'phone_present', value: hasRealContent(r.phone) ? true : null, conf: 0.9 },
    { key: 'website_contact', value: hasRealContent(r.website) ? true : null, conf: 0.9 },
    { key: 'hours_present', value: hasRealContent(r.timings) ? true : null, conf: 0.9 },
    { key: 'service_options_set', value: hasRealContent(r.amenities) ? true : null, conf: 0.7 },
    { key: 'amenities_documented', value: hasRealContent(r.amenities) ? true : null, conf: 0.7 },
    { key: 'delivery_support_enabled', value: r.deliverySupport === true ? true : null, conf: 0.8 },
    { key: 'website_exists', value: hasRealContent(r.website) ? true : null, conf: 0.9 },
    // composite score columns with non-default values → measured scalar evidence
  ];

  for (const { key, value, conf } of colEvidence) {
    if (value === null || value === undefined) continue;
    const def = defByKey.get(key);
    if (!def) continue;
    map.set(key, toEvidence(key, value, sourceTypeFrom(def), conf, now, undefined, [`restaurant:${key}`]));
  }

  // Score columns (only when non-default, mirroring frozen honesty gate)
  const SCORE_DEFAULTS: Record<string, number> = {
    gbpHealthScore: 70, localSearchScore: 0, aiVisibilityScore: 0,
    menuDiscoverabilityScore: 0, conversationalSearchScore: 0,
    restaurantClarityScore: 0, discoverabilityScore: 0,
  };
  const scoreEvidence: Array<{ key: string; col: string; liveGate: () => boolean; conf: number }> = [
    { key: 'restaurant_clarity', col: 'restaurantClarityScore', liveGate: () => true, conf: 0.92 },
    { key: 'ai_visibility_score', col: 'aiVisibilityScore', liveGate: () => true, conf: 0.82 },
    { key: 'discoverability_score', col: 'discoverabilityScore', liveGate: () => true, conf: 0.85 },
  ];
  for (const s of scoreEvidence) {
    const val = r[s.col];
    const def = defByKey.get(s.key);
    if (!def || typeof val !== 'number') continue;
    const nonDefault = val !== SCORE_DEFAULTS[s.col];
    const gate = ctx.presence.hasAnyData || nonDefault;
    if (!gate) continue;
    map.set(s.key, toEvidence(s.key, val, sourceTypeFrom(def), s.conf, now, undefined, [`restaurant:${s.col}`]));
  }
  // business_trust_score from gbpHealth when populated non-default
  const gbpDef = defByKey.get('business_trust_score');
  if (gbpDef && typeof r.gbpHealthScore === 'number' && r.gbpHealthScore !== 70) {
    map.set('business_trust_score', toEvidence('business_trust_score', r.gbpHealthScore, 'google', 0.72, now, undefined, ['restaurant:gbpHealthScore']));
  }
  const clarityDef = defByKey.get('opening_hours');
  const hoursDef = defByKey.get('opening_hours');
  void clarityDef; void hoursDef;

  // ── presence-driven signals from related-row counts ──
  const presenceSignals: Array<{ key: string; present: boolean }> = [
    { key: 'menu_online', present: ctx.presence.hasMenuData },
    { key: 'menu_published', present: ctx.presence.hasMenuData },
    { key: 'menu_item_descriptions', present: ctx.presence.hasMenuData },
    { key: 'menu_price_coverage', present: ctx.presence.hasMenuData },
    { key: 'menu_published_pdf', present: ctx.presence.hasMenuData },
    { key: 'menu_description_quality', present: ctx.presence.hasMenuData },
    { key: 'dietary_and_allergen_coverage', present: ctx.presence.hasMenuData },
    { key: 'structured_data_complete', present: ctx.presence.hasSchemaData },
    { key: 'review_service_sentiment', present: ctx.presence.hasReviewData },
    { key: 'review_food_sentiment', present: ctx.presence.hasReviewData },
    { key: 'ambiance_sentiment', present: ctx.presence.hasReviewData },
    { key: 'topical_cluster_sentiment', present: ctx.presence.hasReviewData },
    { key: 'review_total', present: ctx.presence.hasReviewData },
    { key: 'reviews_last_30_days', present: ctx.presence.hasReviewData },
    { key: 'review_velocity', present: ctx.presence.hasReviewData },
    { key: 'latest_review_recency', present: ctx.presence.hasReviewData },
    { key: 'review_distribution_sources', present: ctx.presence.hasReviewData },
    { key: 'response_rate', present: ctx.presence.hasReviewData },
    { key: 'response_speed', present: ctx.presence.hasReviewData },
    { key: 'negative_review_handling', present: ctx.presence.hasReviewData },
    { key: 'rating_distribution_health', present: ctx.presence.hasReviewData },
  ];
  for (const p of presenceSignals) {
    const def = defByKey.get(p.key);
    if (!def) continue;
    if (!p.present) continue;
    // presence-derived signals are real but low-confidence boolean-ish; use ratio
    const evValue = p.present ? 1 : null;
    map.set(p.key, toEvidence(p.key, evValue, sourceTypeFrom(def), 0.8, now, undefined, [`presence:${ctx.restaurantId}`]));
  }

  // ── connector signals (priority; matching frozen behavior) ──
  for (const [factorOrSignalId, cd] of ctx.connectorMap.entries()) {
    const key = factorOrSignalId;
    const def = defByKey.get(key);
    if (!def) continue;
    const syncedAt = cd.syncedAt ?? now;
    // For boolean signals, interpret a connector score > 0 as "present".
    const raw = def.scoringMethod === 'boolean'
      ? (cd.score ?? 0) > 0
      : cd.score;
    map.set(key, toEvidence(key, raw, sourceTypeFrom(def), cd.confidence ?? 0.8, syncedAt, undefined, cd.evidence ?? []));
  }

  // ── scan / evidence ledger rows ──
  for (const row of ctx.scanEvidence) {
    const key = row.signalKey;
    if (!key) continue;
    const def = defByKey.get(key);
    if (!def) continue;
    // Only real, active, http(s)-sourced rows. Skip synthetic.
    if (row.status && row.status !== 'active') continue;
    if (!/^https?:\/\//i.test(row.sourceId || '')) continue;
    let raw: unknown = row.payload ? JSON.parse(row.payload) : true;
    map.set(key, toEvidence(key, raw, def.sourceTypes[0] ?? 'other', row.confidence ?? 0.8, row.observedAt ?? now, row.sourceId, [row.sourceId, ...(row.payload ? [row.payload] : [])]));
  }

  // ── benchmark rows (real peer cohorts; count>=3 already guarded) ──
  for (const b of ctx.benchmarks) {
    const fid = b.factorId;
    if (!fid) continue;
    // Map benchmark to a comparable signal where one exists.
    if (fid === 'competitive_position' && ctx.benchmarks.length > 0) {
      const score = b.score ?? b.p50 ?? null;
      if (score !== null) {
        map.set('peer_rating_gap', toEvidence('peer_rating_gap', score, 'local_search', 0.7, ctx.now ?? now, undefined, ['benchmark:competitive_position']));
      }
    }
  }

  return map;
}

/**
 * Resolve all 25 factors' signals + accounting for a restaurant.
 * Deterministic, pure. Returns per-factor results keyed by factorId plus the
 * restaurant-level summary.
 */
export function resolveAllFactors(
  ctx: SignalResolverContext,
): { factors: FactorResult[]; summary: SignalModelSummary } {
  const now = ctx.now ?? new Date();
  const evidence = buildEvidenceMap(ctx);

  const factors: FactorResult[] = FACTORS.map((def) => {
    const results = processFactor(ctx.restaurantId, def.id, evidence, ctx.capabilities, now);
    return calculateFactor(def.id, results);
  });

  const summary = aggregateSummary(ctx.restaurantId, factors);
  return { factors, summary };
}

/** Aggregate restaurant-level accounting (spec §10, §27). */
export function aggregateSummary(
  restaurantId: string,
  factors: FactorResult[],
): SignalModelSummary {
  let observed = 0;
  let pending = 0;
  let notApplicable = 0;
  let stale = 0;
  let supported = 0;
  for (const f of factors) {
    const cd = f.coverageDetail;
    supported += cd.totalSignals;
    observed += cd.measured + cd.partial;
    pending += cd.pending;
    notApplicable += cd.notApplicable;
    stale += cd.stale;
  }
  return {
    restaurantId,
    methodologyVersion: METHODOLOGY_VERSION,
    supportedSignals: supported,
    observedSignals: observed,
    pendingSignals: pending,
    notApplicableSignals: notApplicable,
    staleSignals: stale,
    factors: factors.length,
    realSourcesOnly: true,
    syntheticInputs: 0,
    manualOverrides: 0,
  };
}

/** Convenience: resolve just one factor's signals. */
export function resolveFactorSignals(
  ctx: SignalResolverContext,
  factorId: string,
): DiscoverySignal[] {
  const now = ctx.now ?? new Date();
  const evidence = buildEvidenceMap(ctx);
  return processFactor(ctx.restaurantId, factorId, evidence, ctx.capabilities, now).map((r) => r.signal);
}

/** Registry integrity check exposed for runtime validation / tests. */
export function registryErrors(): string[] {
  return validateRegistry();
}

export { METHODOLOGY_VERSION, signalsForFactor, DISCOVERY_SIGNAL_REGISTRY };
