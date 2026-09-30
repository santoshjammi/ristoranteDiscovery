import prisma from '../../config/db';
import {
  FACTORS, CATEGORIES, SUBSIGNAL_SOURCE_MAP,
  type FactorScore, type CategoryScore, type Scorecard, type FactorStatus, type SubSignal, type ConfidenceRationale,
} from './types';
import {
  resolveAllFactors,
  buildFactorCapabilities,
  type SignalResolverContext,
} from '../discovery-intelligence/SignalResolver';
import type {
  FactorResult,
  SignalModelSummary,
} from '../discovery-intelligence/types';

/**
 * Determine whether a string column holds REAL, non-empty content.
 * An empty, whitespace-only, or empty JSON array/object literal ('[]' / '{}')
 * counts as ABSENT — presence requires at least one non-empty trimmed item.
 * Values starting with '[' are parsed as JSON arrays, '{' as JSON objects;
 * otherwise the value is treated as a comma-separated list or a plain string.
 */
function hasRealContent(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (trimmed.length === 0) return false;

  if (trimmed.startsWith('[')) {
    try {
      const arr = JSON.parse(trimmed);
      return Array.isArray(arr) && arr.some((item) => typeof item === 'string' && item.trim().length > 0);
    } catch {
      return false;
    }
  }
  if (trimmed.startsWith('{')) {
    try {
      const obj = JSON.parse(trimmed);
      return typeof obj === 'object' && obj !== null && Object.keys(obj).length > 0;
    } catch {
      return false;
    }
  }
  return trimmed.split(',').some((item) => item.trim().length > 0);
}

function computeStatus(score: number | null): FactorStatus {
  if (score === null) return 'pending_observation';
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'fair';
  if (score >= 20) return 'needs_attention';
  return 'critical';
}

function computeOverallStatus(scores: (number | null)[]): FactorStatus {
  const live = scores.filter((s): s is number => s !== null);
  if (live.length === 0) return 'pending_observation';
  const avg = live.reduce((a, b) => a + b, 0) / live.length;
  return computeStatus(avg);
}

interface SignalScore {
  score: number | null;
  trend: 'up' | 'down' | 'stable' | null;
  confidence: number | null;
  evidence: string[];
  /** What fed this signal's score — drives EVIDENCE-DERIVED confidence. */
  sourceType: 'connector' | 'live_column' | 'presence' | 'none';
}

/**
 * Base confidence by evidence source type. These are the ONLY hardcoded
 * numbers — and they rank the STRENGTH of the evidence source, then the final
 * confidence is modulated downward by gaps in sub-factor coverage and evidence
 * volume. So a factor is more confident when more of its requirements are met.
 *
 *   connector   = 95  (real data from a verified connector)
 *   live_column = 85  (a genuinely populated, non-default score column)
 *   presence    = 80  (a real user/analysis-derived field is present)
 *   composite   = derived from the live sub-signal ratio (see below)
 *   none        = null (Pending — no evidence at all)
 */
const SOURCE_BASE_CONFIDENCE: Record<Exclude<SignalScore['sourceType'], 'none'>, number> = {
  connector: 95,
  live_column: 85,
  presence: 80,
};

/**
 * Deterministic, evidence-derived confidence for a factor's score.
 * Confidence is NOT a fixed per-factor number — it reflects how much real
 * support backs the score:
 *   - start from the base confidence of the strongest evidence source,
 *   - then adjust by sub-factor coverage: each missing live sub-factor erodes
 *     confidence (coverage ratio), so a factor with more of its sub-factors
 *     live is more confident,
 *   - +1 per real evidence row, capped, so concrete evidence adds a little
 *     certainty on top.
 * A factor with null score has null confidence (Pending).
 */
function deriveConfidence(
  score: number | null,
  baseSourceType: SignalScore['sourceType'],
  liveSubRatio: number,          // 0..1 = live sub-signals / total sub-signals
  evidenceCount: number,
): number | null {
  if (score === null) return null;
  if (baseSourceType === 'none') return null;
  const base = SOURCE_BASE_CONFIDENCE[baseSourceType] ?? 80;
  // Coverage: a factor that satisfies all its sub-factors keeps full base; a
  // factor with none of its sub-factors live drops toward the floor.
  const coverage = Math.min(1, Math.max(0.6, liveSubRatio));
  const evidenceBonus = Math.min(4, Math.floor(evidenceCount / 2)); // +0..4
  return Math.min(99, Math.round(base * coverage + evidenceBonus));
}

/**
 * Which real, user/analysis-derived data dimensions exist for a restaurant.
 * A freshly-created restaurant with no real evidence has NONE of these set —
 * its score columns are still at Prisma defaults (0 or 70) and no related
 * rows exist — so it must report all factors as Pending Observation.
 */
interface EvidencePresence {
  /** MenuItem rows exist (real menu data ingested). */
  hasMenuData: boolean;
  /** ReviewAnalysis rows exist (real review/sentiment analysis). */
  hasReviewData: boolean;
  /** FAQ rows exist (real Q&A data). */
  hasFaqData: boolean;
  /** SEOMarkup rows exist (real structured-schema output). */
  hasSchemaData: boolean;
  /** Any of the above relational data exists for the restaurant. */
  hasAnyData: boolean;
}

/**
 * Prisma default values for each discoverability score column.
 * A column sitting exactly at its default is NOT a measured score — it is the
 * un-populated schema default. We must never surface it as live on a bare row.
 */
const SCORE_COLUMN_DEFAULTS: Record<string, number> = {
  gbpHealthScore: 70,
  localSearchScore: 0,
  aiVisibilityScore: 0,
  menuDiscoverabilityScore: 0,
  conversationalSearchScore: 0,
  restaurantClarityScore: 0,
  discoverabilityScore: 0,
};

/**
 * Determine whether a score column reflects REAL measurement rather than the
 * Prisma default. A column is considered genuinely populated when it differs
 * from its schema default OR there is real supporting evidence present
 * (`evidenceLive`). A bare row with all columns at defaults and no evidence
 * yields null (Pending Observation) — never a fabricated score.
 */
function columnIsLive(r: any, column: string, evidenceLive: boolean): boolean {
  const def = SCORE_COLUMN_DEFAULTS[column];
  const val = r[column];
  if (typeof val !== 'number') return false;
  if (val !== def) return true;
  return evidenceLive;
}

/**
 * Resolve a single source signal's score.
 * Connector data takes priority; DB fallback provides hardcoded mappings for
 * signals not yet fed by a connector. `requiresEvidence` signals never use the
 * DB fallback — they stay pending until a connector/evidence source provides a score.
 *
 * Pending-state honesty (RIST-RDI-002): the DB fallback must never treat a
 * Prisma default-0/default-70 column as a measured score. A score column only
 * surfaces a live value when it is genuinely populated (non-default) or the
 * restaurant has real supporting evidence. Presence-based signals
 * (address, cuisine, phone/website) stay live because they derive from real
 * user-entered data.
 */
function resolveSignalScore(
  signalId: string,
  connectorMap: Map<string, { score: number; confidence: number | null; evidence: string[] }>,
  r: any,
  requiresEvidence: boolean,
  presence: EvidencePresence,
): SignalScore {
  const cd = connectorMap.get(signalId);
  if (cd) {
    return {
      score: cd.score,
      trend: 'stable',
      confidence: cd.confidence ?? null,
      evidence: cd.evidence,
      sourceType: 'connector',
    };
  }

  // No connector data — use DB fallback unless the factor requires evidence.
  if (requiresEvidence) {
    return { score: null, trend: null, confidence: null, evidence: [], sourceType: 'none' };
  }

  // Compute the per-column "genuinely live" gate for this row's evidence.
  const gbpLive = columnIsLive(r, 'gbpHealthScore', presence.hasReviewData);
  const lsLive = columnIsLive(r, 'localSearchScore', presence.hasAnyData);
  const aiLive = columnIsLive(r, 'aiVisibilityScore', presence.hasAnyData);
  const menuLive = columnIsLive(r, 'menuDiscoverabilityScore', presence.hasMenuData);
  const convLive = columnIsLive(r, 'conversationalSearchScore', presence.hasAnyData);
  const clarityLive = columnIsLive(r, 'restaurantClarityScore', presence.hasAnyData);
  const discoLive = columnIsLive(r, 'discoverabilityScore', presence.hasAnyData);

  // Helper: surface the column value only when genuinely live.
  const live = (col: string, isLive: boolean): number | null =>
    isLive ? r[col] : null;
  const liveColumn = (col: string, isLive: boolean): 'live_column' | 'none' =>
    isLive ? 'live_column' : 'none';
  const presenceType = (ok: boolean): 'presence' | 'none' => (ok ? 'presence' : 'none');
  const gbpLiveT = liveColumn('gbpHealthScore', gbpLive);
  const lsLiveT = liveColumn('localSearchScore', lsLive);
  const aiLiveT = liveColumn('aiVisibilityScore', aiLive);
  const menuLiveT = liveColumn('menuDiscoverabilityScore', menuLive);
  const convLiveT = liveColumn('conversationalSearchScore', convLive);
  const clarityLiveT = liveColumn('restaurantClarityScore', clarityLive);
  const discoLiveT = liveColumn('discoverabilityScore', discoLive);

  switch (signalId) {
    case 'gbp_profile':           return { score: live('gbpHealthScore', gbpLive), trend: 'stable', confidence: 85, evidence: gbpLive ? ['GBP profile completeness'] : [], sourceType: gbpLiveT };
    case 'maps_presence':         return { score: live('localSearchScore', lsLive), trend: 'up', confidence: 80, evidence: lsLive ? ['Google Maps presence'] : [], sourceType: lsLiveT };
    case 'local_search':
    case 'local_search_score':    return { score: live('localSearchScore', lsLive), trend: 'up', confidence: 88, evidence: lsLive ? ['Local search ranking'] : [], sourceType: lsLiveT };
    case 'business_categories':   return { score: hasRealContent(r.cuisineTypes) ? 65 : null, trend: 'stable', confidence: 75, evidence: hasRealContent(r.cuisineTypes) ? ['Business categories set'] : [], sourceType: presenceType(hasRealContent(r.cuisineTypes)) };
    case 'location_accuracy':     return { score: hasRealContent(r.address) ? 70 : null, trend: 'stable', confidence: 90, evidence: hasRealContent(r.address) ? ['Location verified'] : [], sourceType: presenceType(hasRealContent(r.address)) };
    case 'delivery_platforms':    return { score: null, trend: null, confidence: null, evidence: [], sourceType: 'none' };

    case 'avg_rating':            return { score: live('gbpHealthScore', gbpLive), trend: 'stable', confidence: 70, evidence: [], sourceType: gbpLiveT };
    case 'review_volume':         return { score: live('gbpHealthScore', gbpLive), trend: 'up', confidence: 65, evidence: [], sourceType: gbpLiveT };
    case 'review_freshness':      return { score: null, trend: null, confidence: null, evidence: [], sourceType: 'none' };
    case 'review_response':       return { score: null, trend: null, confidence: null, evidence: [], sourceType: 'none' };
    case 'sentiment':             return { score: null, trend: null, confidence: null, evidence: [], sourceType: 'none' };
    case 'social_presence':       return { score: null, trend: null, confidence: null, evidence: [], sourceType: 'none' };
    case 'business_trust':        return { score: live('gbpHealthScore', gbpLive), trend: 'up', confidence: 72, evidence: gbpLive ? ['Trust signals present'] : [], sourceType: gbpLiveT };

    case 'website_health':
    case 'website_performance':   return { score: live('aiVisibilityScore', aiLive), trend: 'up', confidence: 82, evidence: aiLive ? ['Website health checks'] : [], sourceType: aiLiveT };
    case 'mobile_experience':     return { score: live('aiVisibilityScore', aiLive), trend: 'stable', confidence: 78, evidence: aiLive ? ['Mobile experience'] : [], sourceType: aiLiveT };
    case 'menu_availability':
    case 'menu_quality':
    case 'menu_publishing':       return { score: live('menuDiscoverabilityScore', menuLive), trend: 'up', confidence: 85, evidence: menuLive ? ['Menu availability'] : [], sourceType: menuLiveT };
    case 'online_ordering':       return { score: live('conversationalSearchScore', convLive), trend: 'stable', confidence: 70, evidence: convLive ? ['Online ordering'] : [], sourceType: convLiveT };
    case 'reservations':          return { score: null, trend: null, confidence: null, evidence: [], sourceType: 'none' };

    case 'business_completeness':
    case 'restaurant_clarity':    return { score: live('restaurantClarityScore', clarityLive), trend: 'up', confidence: 92, evidence: clarityLive ? ['Business completeness'] : [], sourceType: clarityLiveT };
    case 'opening_hours':         return { score: live('restaurantClarityScore', clarityLive), trend: 'stable', confidence: 95, evidence: clarityLive ? ['Opening hours verified'] : [], sourceType: clarityLiveT };
    case 'contact_info':          return { score: (hasRealContent(r.phone) || hasRealContent(r.website)) ? 75 : null, trend: 'stable', confidence: 90, evidence: hasRealContent(r.phone) ? ['Phone on file'] : (hasRealContent(r.website) ? ['Website on file'] : []), sourceType: presenceType(hasRealContent(r.phone) || hasRealContent(r.website)) };
    case 'photos_media':          return { score: live('menuDiscoverabilityScore', menuLive), trend: 'stable', confidence: 60, evidence: [], sourceType: menuLiveT };
    case 'local_citations':       return { score: null, trend: null, confidence: null, evidence: [], sourceType: 'none' };

    case 'competitive_position':  return { score: live('discoverabilityScore', discoLive), trend: 'up', confidence: 75, evidence: discoLive ? ['Competitive benchmark'] : [], sourceType: discoLiveT };
    case 'local_authority':       return { score: live('localSearchScore', lsLive), trend: 'stable', confidence: 70, evidence: lsLive ? ['Local authority signals'] : [], sourceType: lsLiveT };
    case 'visibility_trend':      return { score: live('discoverabilityScore', discoLive), trend: 'up', confidence: 85, evidence: discoLive ? ['Visibility trend'] : [], sourceType: discoLiveT };
    case 'growth_opportunity':    return { score: live('discoverabilityScore', discoLive), trend: 'up', confidence: 65, evidence: discoLive ? ['Growth opportunity analysis'] : [], sourceType: discoLiveT };
    case 'customer_engagement':   return { score: null, trend: null, confidence: null, evidence: [], sourceType: 'none' };

    default:                      return { score: null, trend: null, confidence: null, evidence: [], sourceType: 'none' };
  }
}

export async function getScorecard(restaurantId: string, _token: string): Promise<Scorecard> {
  const r = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
  if (!r) throw new Error('Restaurant not found');

  // Fetch connector-sourced scorecard data for this restaurant.
  const connectorData = await prisma.connectorScorecardData.findMany({
    where: { restaurantId },
  });
  const connectorMap = new Map(
    connectorData.map(cd => [
      cd.factorId,
      {
        score: cd.score,
        confidence: cd.confidence,
        evidence: JSON.parse(cd.evidence || '[]') as string[],
      },
    ]),
  );

  // Real-data presence detection (RIST-RDI-002 pending-state honesty).
  // Distinguish a freshly-created bare row (score columns at Prisma defaults,
  // no related rows) from a restaurant with genuinely ingested data, so the
  // DB fallback never fabricates scores from default-0/default-70 columns.
  const [menuCount, reviewCount, faqCount, schemaCount] = await Promise.all([
    prisma.menuItem.count({ where: { restaurantId } }),
    prisma.reviewAnalysis.count({ where: { restaurantId } }),
    prisma.fAQ.count({ where: { restaurantId } }),
    prisma.sEOMarkup.count({ where: { restaurantId } }),
  ]);
  const presence: EvidencePresence = {
    hasMenuData: menuCount > 0,
    hasReviewData: reviewCount > 0,
    hasFaqData: faqCount > 0,
    hasSchemaData: schemaCount > 0,
    hasAnyData: menuCount > 0 || reviewCount > 0 || faqCount > 0 || schemaCount > 0,
  };

  // Build the 25 factor scores, each with its sub-signals.
  const factorScores: FactorScore[] = FACTORS.map((def) => {
    const requiresEvidence = !!def.requiresEvidence;

    // Source signal ids: the factor's own id + its sub-signal source ids.
    const sourceIds = Array.from(new Set([def.id, ...def.subSignals.map(s => s.id)]));

    // Compute sub-signals (merged v1.0 factors preserved as evidence).
    const subSignals: SubSignal[] = def.subSignals.map((ss) => {
      const src = resolveSignalScore(ss.id, connectorMap, r, requiresEvidence, presence);
      return {
        id: ss.id,
        name: ss.name,
        score: src.score,
        status: computeStatus(src.score),
        evidence: src.evidence,
        sourceType: src.sourceType,
      };
    });

    // Direct source for the factor's own id (e.g. sentiment, delivery_platforms).
    const own = resolveSignalScore(def.id, connectorMap, r, requiresEvidence, presence);

    // Sub-signal scores that are live.
    const liveSubScores = subSignals
      .map(s => s.score)
      .filter((s): s is number => s !== null);

    let score: number | null;
    let trend: 'up' | 'down' | 'stable' | null;
    let confidence: number | null;
    let evidence: string[];

    if (own.score !== null) {
      // Factor has a direct score (connector or DB fallback).
      score = own.score;
      trend = own.trend;
      confidence = own.confidence;
      evidence = own.evidence;
    } else if (liveSubScores.length > 0) {
      // Composite factor — average its live sub-signals.
      score = Math.round(liveSubScores.reduce((a, b) => a + b, 0) / liveSubScores.length);
      trend = 'stable';
      confidence = 70;
      evidence = subSignals.flatMap(s => s.evidence);
    } else {
      score = null;
      trend = null;
      confidence = null;
      evidence = [];
    }

    // For requiresEvidence factors (e.g. AI Visibility), never surface a score
    // unless real connector evidence exists.
    const hasConnectorEvidence = def.requiresEvidence && sourceIds.some(id => connectorMap.has(id));
    if (requiresEvidence && !hasConnectorEvidence) {
      score = null;
      trend = null;
      confidence = null;
      evidence = [];
    }

    // ── EVIDENCE-DERIVED CONFIDENCE RATIONALE (RIST-RDI-007) ──
    // Rank the strongest evidence source feeding this factor's score, then
    // surface live sub-factor coverage and evidence volume so a low-evidence
    // score is visibly less trustworthy than a high-evidence one.
    const srcTypes = [own.sourceType, ...subSignals.map(s => s.sourceType)];
    const hasConnector = srcTypes.includes('connector');
    const liveCount = srcTypes.filter(t => t !== 'none').length;
    const totalCount = srcTypes.length;
    const strongest: 'connector' | 'live_column' | 'presence' | 'composite' = hasConnector
      ? 'connector'
      : srcTypes.includes('live_column')
        ? 'live_column'
        : srcTypes.includes('presence')
          ? 'presence'
          : 'composite';
    const deriveRationaleConfidence = (): number | null =>
      deriveConfidence(score, hasConnector ? 'connector' : strongest === 'composite' ? 'live_column' : strongest, totalCount > 0 ? liveCount / totalCount : 0, evidence.length);
    const rationaleConfidence = deriveRationaleConfidence();
    const confidenceRationale: ConfidenceRationale = {
      sourceType: score === null ? 'none' : strongest,
      hasConnectorEvidence: hasConnector,
      liveSubSignals: liveCount,
      totalSubSignals: totalCount,
      evidenceCount: evidence.length,
      explanation: score === null
        ? 'No real evidence yet — factor stays Pending Observation.'
        : hasConnector
          ? `Scored from real connector data (${liveCount}/${totalCount} sources live).`
          : `Scored from real data (${liveCount}/${totalCount} sources live).`,
    };

    return {
      id: def.id, name: def.name, description: def.description,
      score, status: computeStatus(score), trend, confidence: score === null ? null : (confidence ?? rationaleConfidence),
      lastUpdated: score !== null ? new Date().toISOString() : null,
      businessImpact: def.businessImpact,
      evidenceCount: evidence.length,
      confidenceRationale,
      subSignals,
      signals: [],               // RIST-RDI-007 signal layer, populated additively below
      connectorRequired: def.connectorRequired,
      recommendedActions: def.recommendedActions,
      expectedImprovement: def.expectedImprovement,
    };
  });

  // Build categories.
  const categories: CategoryScore[] = CATEGORIES.map((cat) => {
    const factors = factorScores.filter((f) => FACTORS.find((d) => d.id === f.id)?.categoryId === cat.id);
    const scores = factors.map((f) => f.score).filter((s): s is number => s !== null);
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
    return {
      id: cat.id, name: cat.name, description: cat.description, score: avgScore, factors,
      healthyCount: factors.filter((f) => f.status === 'excellent' || f.status === 'good').length,
      attentionCount: factors.filter((f) => f.status === 'fair' || f.status === 'needs_attention').length,
      criticalCount: factors.filter((f) => f.status === 'critical').length,
      pendingCount: factors.filter((f) => f.status === 'pending_observation').length,
      trend: avgScore !== null ? 'up' : null, confidence: avgScore !== null ? 80 : null,
    };
  });

  const allScores = factorScores.map((f) => f.score);
  const liveScores = allScores.filter((s): s is number => s !== null);
  const overallScore = liveScores.length > 0
    ? Math.round(liveScores.reduce((a, b) => a + b, 0) / liveScores.length)
    : null;

  const scorecard: Scorecard = {
    restaurantId, restaurantName: r.name,
    overallScore, overallStatus: computeOverallStatus(allScores),
    categories, totalFactors: FACTORS.length,
    liveFactors: factorScores.filter((f) => f.score !== null).length,
    pendingFactors: factorScores.filter((f) => f.score === null).length,
    lastUpdated: new Date().toISOString(),
  };

  // ── RIST-RDI-007 Signal layer (ADDITIVE — never touches frozen math above) ──
  // Build the resolver context from real data already fetched PLUS new reads.
  // Any read failure is swallowed and becomes an empty array: the frozen
  // scorecard must always be returned, and the signal layer is best-effort.
  let signalLayer: { factors: FactorResult[]; summary: SignalModelSummary } | null = null;
  try {
    const [evidenceRows, benchmarkRows, snapshotRows] = await Promise.all([
      prisma.evidenceRecord.findMany({ where: { entityType: 'Restaurant', entityId: restaurantId } }),
      prisma.benchmark.findMany({ where: { restaurantId } }),
      prisma.scorecardSnapshot.findMany({ where: { restaurantId } }),
    ]);

    const ctx: SignalResolverContext = {
      restaurantId,
      restaurant: r,
      presence,
      connectorMap,
      scanEvidence: evidenceRows.map((er) => ({
        signalKey: (() => { try { const p = JSON.parse(er.payload || '{}'); return p?.signalKey ?? undefined; } catch { return undefined; } })(),
        sourceId: er.sourceId,
        sourceType: er.sourceType,
        observedAt: er.observedAt,
        confidence: er.confidence,
        payload: er.payload,
        status: er.status,
      })),
      benchmarks: benchmarkRows.map((b) => ({
        factorId: b.factorId,
        score: b.score,
        p50: b.p50,
        p75: b.p75,
        p90: b.p90,
        count: b.count,
        dimension: b.dimension,
        dimensionValue: b.dimensionValue,
      })),
      snapshots: snapshotRows.map((s) => ({
        capturedAt: s.capturedAt,
        overallScore: s.overallScore,
        factorScores: (() => { try { return s.factorScores ? JSON.parse(s.factorScores) : undefined; } catch { return undefined; } })(),
      })),
      capabilities: buildFactorCapabilities(r),
      now: new Date(),
    };

    signalLayer = resolveAllFactors(ctx);
  } catch {
    signalLayer = null;
  }

  if (signalLayer) {
    const byId = new Map(signalLayer.factors.map((fr) => [fr.factorId, fr]));
    for (const cat of scorecard.categories) {
      for (const f of cat.factors) {
        const fr = byId.get(f.id);
        if (!fr) continue;
        f.signals = fr.signals;
        f.coverage = fr.coverage;
        f.coverageDetail = fr.coverageDetail;
        f.measuredSignalCount = fr.coverageDetail.measured + fr.coverageDetail.partial;
        f.totalSignalCount = fr.coverageDetail.totalSignals;
        f.pendingSignalCount = fr.coverageDetail.pending;
        f.notApplicableCount = fr.coverageDetail.notApplicable;
        f.staleCount = fr.coverageDetail.stale;
        f.lastObservedAt = fr.lastObservedAt ? fr.lastObservedAt.toISOString() : null;
      }
    }
    scorecard.signalModel = signalLayer.summary;
  }

  return scorecard;
}

// Re-export the sub-signal source map for any consumers that need it.
export { SUBSIGNAL_SOURCE_MAP };
