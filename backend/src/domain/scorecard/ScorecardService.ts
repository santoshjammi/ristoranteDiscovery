import prisma from '../../config/db';
import {
  FACTORS, CATEGORIES, SUBSIGNAL_SOURCE_MAP,
  type FactorScore, type CategoryScore, type Scorecard, type FactorStatus, type SubSignal,
} from './types';

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
 * Resolve a single source signal's score.
 * Connector data takes priority; DB fallback provides hardcoded mappings for
 * signals not yet fed by a connector. `requiresEvidence` signals never use the
 * DB fallback — they stay pending until a connector/evidence source provides a score.
 */
function resolveSignalScore(
  signalId: string,
  connectorMap: Map<string, { score: number; confidence: number | null; evidence: string[] }>,
  r: any,
  requiresEvidence: boolean,
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

  switch (signalId) {
    case 'gbp_profile':           return { score: r.gbpHealthScore, trend: 'stable', confidence: 85, evidence: ['GBP profile completeness'] };
    case 'maps_presence':         return { score: r.localSearchScore, trend: 'up', confidence: 80, evidence: ['Google Maps presence'] };
    case 'local_search':
    case 'local_search_score':    return { score: r.localSearchScore, trend: 'up', confidence: 88, evidence: ['Local search ranking'] };
    case 'business_categories':   return { score: r.cuisineTypes ? 65 : null, trend: 'stable', confidence: 75, evidence: r.cuisineTypes ? ['Business categories set'] : [] };
    case 'location_accuracy':     return { score: r.address ? 70 : null, trend: 'stable', confidence: 90, evidence: r.address ? ['Location verified'] : [] };
    case 'delivery_platforms':    return { score: null, trend: null, confidence: null, evidence: [] };

    case 'avg_rating':            return { score: r.gbpHealthScore, trend: 'stable', confidence: 70, evidence: [] };
    case 'review_volume':         return { score: r.gbpHealthScore, trend: 'up', confidence: 65, evidence: [] };
    case 'review_freshness':      return { score: null, trend: null, confidence: null, evidence: [] };
    case 'review_response':       return { score: null, trend: null, confidence: null, evidence: [] };
    case 'sentiment':             return { score: null, trend: null, confidence: null, evidence: [] };
    case 'social_presence':       return { score: null, trend: null, confidence: null, evidence: [] };
    case 'business_trust':        return { score: r.gbpHealthScore, trend: 'up', confidence: 72, evidence: ['Trust signals present'] };

    case 'website_health':
    case 'website_performance':   return { score: r.aiVisibilityScore, trend: 'up', confidence: 82, evidence: ['Website health checks'] };
    case 'mobile_experience':     return { score: r.aiVisibilityScore, trend: 'stable', confidence: 78, evidence: ['Mobile experience'] };
    case 'menu_availability':
    case 'menu_quality':
    case 'menu_publishing':       return { score: r.menuDiscoverabilityScore, trend: 'up', confidence: 85, evidence: ['Menu availability'] };
    case 'online_ordering':       return { score: r.conversationalSearchScore, trend: 'stable', confidence: 70, evidence: ['Online ordering'] };
    case 'reservations':          return { score: null, trend: null, confidence: null, evidence: [] };

    case 'business_completeness':
    case 'restaurant_clarity':    return { score: r.restaurantClarityScore, trend: 'up', confidence: 92, evidence: ['Business completeness'] };
    case 'opening_hours':         return { score: r.restaurantClarityScore, trend: 'stable', confidence: 95, evidence: ['Opening hours verified'] };
    case 'contact_info':          return { score: (r.phone || r.website) ? 75 : null, trend: 'stable', confidence: 90, evidence: r.phone ? ['Phone on file'] : (r.website ? ['Website on file'] : []) };
    case 'photos_media':          return { score: r.menuDiscoverabilityScore, trend: 'stable', confidence: 60, evidence: [] };
    case 'local_citations':       return { score: null, trend: null, confidence: null, evidence: [] };

    case 'competitive_position':  return { score: r.discoverabilityScore, trend: 'up', confidence: 75, evidence: ['Competitive benchmark'] };
    case 'local_authority':       return { score: r.localSearchScore, trend: 'stable', confidence: 70, evidence: ['Local authority signals'] };
    case 'visibility_trend':      return { score: r.discoverabilityScore, trend: 'up', confidence: 85, evidence: ['Visibility trend'] };
    case 'growth_opportunity':    return { score: r.discoverabilityScore, trend: 'up', confidence: 65, evidence: ['Growth opportunity analysis'] };
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

  // Build the 25 factor scores, each with its sub-signals.
  const factorScores: FactorScore[] = FACTORS.map((def) => {
    const requiresEvidence = !!def.requiresEvidence;

    // Source signal ids: the factor's own id + its sub-signal source ids.
    const sourceIds = Array.from(new Set([def.id, ...def.subSignals.map(s => s.id)]));

    // Compute sub-signals (merged v1.0 factors preserved as evidence).
    const subSignals: SubSignal[] = def.subSignals.map((ss) => {
      const src = resolveSignalScore(ss.id, connectorMap, r, requiresEvidence);
      return {
        id: ss.id,
        name: ss.name,
        score: src.score,
        status: computeStatus(src.score),
        evidence: src.evidence,
      };
    });

    // Direct source for the factor's own id (e.g. sentiment, delivery_platforms).
    const own = resolveSignalScore(def.id, connectorMap, r, requiresEvidence);

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
