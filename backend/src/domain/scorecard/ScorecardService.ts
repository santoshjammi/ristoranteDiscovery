import prisma from '../../config/db';
import {
  FACTORS, CATEGORIES, SUBSIGNAL_SOURCE_MAP,
  type FactorScore, type CategoryScore, type Scorecard, type FactorStatus, type SubSignal,
} from './types';

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
    };
  }

  // No connector data — use DB fallback unless the factor requires evidence.
  if (requiresEvidence) {
    return { score: null, trend: null, confidence: null, evidence: [] };
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

  switch (signalId) {
    case 'gbp_profile':           return { score: live('gbpHealthScore', gbpLive), trend: 'stable', confidence: 85, evidence: gbpLive ? ['GBP profile completeness'] : [] };
    case 'maps_presence':         return { score: live('localSearchScore', lsLive), trend: 'up', confidence: 80, evidence: lsLive ? ['Google Maps presence'] : [] };
    case 'local_search':
    case 'local_search_score':    return { score: live('localSearchScore', lsLive), trend: 'up', confidence: 88, evidence: lsLive ? ['Local search ranking'] : [] };
    case 'business_categories':   return { score: hasRealContent(r.cuisineTypes) ? 65 : null, trend: 'stable', confidence: 75, evidence: hasRealContent(r.cuisineTypes) ? ['Business categories set'] : [] };
    case 'location_accuracy':     return { score: hasRealContent(r.address) ? 70 : null, trend: 'stable', confidence: 90, evidence: hasRealContent(r.address) ? ['Location verified'] : [] };
    case 'delivery_platforms':    return { score: null, trend: null, confidence: null, evidence: [] };

    case 'avg_rating':            return { score: live('gbpHealthScore', gbpLive), trend: 'stable', confidence: 70, evidence: [] };
    case 'review_volume':         return { score: live('gbpHealthScore', gbpLive), trend: 'up', confidence: 65, evidence: [] };
    case 'review_freshness':      return { score: null, trend: null, confidence: null, evidence: [] };
    case 'review_response':       return { score: null, trend: null, confidence: null, evidence: [] };
    case 'sentiment':             return { score: null, trend: null, confidence: null, evidence: [] };
    case 'social_presence':       return { score: null, trend: null, confidence: null, evidence: [] };
    case 'business_trust':        return { score: live('gbpHealthScore', gbpLive), trend: 'up', confidence: 72, evidence: gbpLive ? ['Trust signals present'] : [] };

    case 'website_health':
    case 'website_performance':   return { score: live('aiVisibilityScore', aiLive), trend: 'up', confidence: 82, evidence: aiLive ? ['Website health checks'] : [] };
    case 'mobile_experience':     return { score: live('aiVisibilityScore', aiLive), trend: 'stable', confidence: 78, evidence: aiLive ? ['Mobile experience'] : [] };
    case 'menu_availability':
    case 'menu_quality':
    case 'menu_publishing':       return { score: live('menuDiscoverabilityScore', menuLive), trend: 'up', confidence: 85, evidence: menuLive ? ['Menu availability'] : [] };
    case 'online_ordering':       return { score: live('conversationalSearchScore', convLive), trend: 'stable', confidence: 70, evidence: convLive ? ['Online ordering'] : [] };
    case 'reservations':          return { score: null, trend: null, confidence: null, evidence: [] };

    case 'business_completeness':
    case 'restaurant_clarity':    return { score: live('restaurantClarityScore', clarityLive), trend: 'up', confidence: 92, evidence: clarityLive ? ['Business completeness'] : [] };
    case 'opening_hours':         return { score: live('restaurantClarityScore', clarityLive), trend: 'stable', confidence: 95, evidence: clarityLive ? ['Opening hours verified'] : [] };
    case 'contact_info':          return { score: (hasRealContent(r.phone) || hasRealContent(r.website)) ? 75 : null, trend: 'stable', confidence: 90, evidence: hasRealContent(r.phone) ? ['Phone on file'] : (hasRealContent(r.website) ? ['Website on file'] : []) };
    case 'photos_media':          return { score: live('menuDiscoverabilityScore', menuLive), trend: 'stable', confidence: 60, evidence: [] };
    case 'local_citations':       return { score: null, trend: null, confidence: null, evidence: [] };

    case 'competitive_position':  return { score: live('discoverabilityScore', discoLive), trend: 'up', confidence: 75, evidence: discoLive ? ['Competitive benchmark'] : [] };
    case 'local_authority':       return { score: live('localSearchScore', lsLive), trend: 'stable', confidence: 70, evidence: lsLive ? ['Local authority signals'] : [] };
    case 'visibility_trend':      return { score: live('discoverabilityScore', discoLive), trend: 'up', confidence: 85, evidence: discoLive ? ['Visibility trend'] : [] };
    case 'growth_opportunity':    return { score: live('discoverabilityScore', discoLive), trend: 'up', confidence: 65, evidence: discoLive ? ['Growth opportunity analysis'] : [] };
    case 'customer_engagement':   return { score: null, trend: null, confidence: null, evidence: [] };

    default:                      return { score: null, trend: null, confidence: null, evidence: [] };
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

    return {
      id: def.id, name: def.name, description: def.description,
      score, status: computeStatus(score), trend, confidence,
      lastUpdated: score !== null ? new Date().toISOString() : null,
      businessImpact: def.businessImpact,
      evidenceCount: evidence.length,
      subSignals,
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

  return {
    restaurantId, restaurantName: r.name,
    overallScore, overallStatus: computeOverallStatus(allScores),
    categories, totalFactors: FACTORS.length,
    liveFactors: factorScores.filter((f) => f.score !== null).length,
    pendingFactors: factorScores.filter((f) => f.score === null).length,
    lastUpdated: new Date().toISOString(),
  };
}

// Re-export the sub-signal source map for any consumers that need it.
export { SUBSIGNAL_SOURCE_MAP };
