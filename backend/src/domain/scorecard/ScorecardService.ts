import prisma from '../../config/db';
import { FACTORS, CATEGORIES, type FactorScore, type CategoryScore, type Scorecard, type FactorStatus } from './types';

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

export async function getScorecard(restaurantId: string, _token: string): Promise<Scorecard> {
  const r = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
  if (!r) throw new Error('Restaurant not found');

  // Fetch connector-sourced scorecard data for this restaurant
  const connectorData = await prisma.connectorScorecardData.findMany({
    where: { restaurantId },
  });
  const connectorMap = new Map(connectorData.map(cd => [cd.factorId, cd]));

  // Build factor scores — use raw DB scores directly, no offsets
  const factorScores: FactorScore[] = FACTORS.map((def) => {
    let score: number | null = null;
    let trend: 'up' | 'down' | 'stable' | null = null;
    let confidence: number | null = null;
    let evidenceCount = 0;

    // Check if connector data exists for this factor
    const cd = connectorMap.get(def.id);
    if (cd) {
      score = cd.score;
      confidence = cd.confidence;
      evidenceCount = JSON.parse(cd.evidence || '[]').length;
      trend = 'stable';
    }

    // Fall back to hardcoded DB mappings for non-connector factors
    if (score === null) {
      switch (def.id) {
        case 'gbp_profile':           score = r.gbpHealthScore; trend = 'stable'; confidence = 85; evidenceCount = 3; break;
        case 'maps_presence':         score = r.localSearchScore; trend = 'up'; confidence = 80; evidenceCount = 5; break;
        case 'local_search':          score = r.localSearchScore; trend = 'up'; confidence = 88; evidenceCount = 12; break;
        case 'business_categories':   score = r.cuisineTypes ? 65 : null; trend = 'stable'; confidence = 75; evidenceCount = 2; break;
        case 'location_accuracy':     score = r.address ? 70 : null; trend = 'stable'; confidence = 90; evidenceCount = 1; break;
        case 'delivery_platforms':    score = null; trend = null; confidence = null; evidenceCount = 0; break;

        case 'avg_rating':            score = r.gbpHealthScore; trend = 'stable'; confidence = 70; evidenceCount = 0; break;
        case 'review_volume':         score = r.gbpHealthScore; trend = 'up'; confidence = 65; evidenceCount = 0; break;
        case 'review_freshness':      score = null; trend = null; confidence = null; evidenceCount = 0; break;
        case 'review_response':       score = null; trend = null; confidence = null; evidenceCount = 0; break;
        case 'sentiment':             score = null; trend = null; confidence = null; evidenceCount = 0; break;
        case 'social_presence':       score = null; trend = null; confidence = null; evidenceCount = 0; break;

        case 'website_health':        score = r.aiVisibilityScore; trend = 'up'; confidence = 82; evidenceCount = 7; break;
        case 'mobile_experience':     score = r.aiVisibilityScore; trend = 'stable'; confidence = 78; evidenceCount = 3; break;
        case 'menu_availability':     score = r.menuDiscoverabilityScore; trend = 'up'; confidence = 85; evidenceCount = 4; break;
        case 'online_ordering':       score = r.conversationalSearchScore; trend = 'stable'; confidence = 70; evidenceCount = 2; break;
        case 'website_performance':   score = r.aiVisibilityScore; trend = 'down'; confidence = 75; evidenceCount = 5; break;
        case 'reservations':          score = null; trend = null; confidence = null; evidenceCount = 0; break;

        case 'business_completeness': score = r.restaurantClarityScore; trend = 'up'; confidence = 92; evidenceCount = 6; break;
        case 'opening_hours':         score = r.restaurantClarityScore; trend = 'stable'; confidence = 95; evidenceCount = 1; break;
        case 'contact_info':          score = (r.phone || r.website) ? 75 : null; trend = 'stable'; confidence = 90; evidenceCount = (r.phone ? 1 : 0) + (r.website ? 1 : 0); break;
        case 'photos_media':          score = r.menuDiscoverabilityScore; trend = 'stable'; confidence = 60; evidenceCount = 0; break;
        case 'menu_quality':          score = r.menuDiscoverabilityScore; trend = 'up'; confidence = 80; evidenceCount = 3; break;
        case 'local_citations':       score = null; trend = null; confidence = null; evidenceCount = 0; break;

        case 'competitive_position':  score = r.discoverabilityScore; trend = 'up'; confidence = 75; evidenceCount = 8; break;
        case 'local_authority':       score = r.localSearchScore; trend = 'stable'; confidence = 70; evidenceCount = 4; break;
        case 'visibility_trend':      score = r.discoverabilityScore; trend = 'up'; confidence = 85; evidenceCount = 10; break;
        case 'business_trust':        score = r.gbpHealthScore; trend = 'up'; confidence = 72; evidenceCount = 3; break;
        case 'growth_opportunity':    score = r.discoverabilityScore; trend = 'up'; confidence = 65; evidenceCount = 5; break;
        case 'customer_engagement':  score = null; trend = null; confidence = null; evidenceCount = 0; break;

        default: score = null; trend = null; confidence = null; evidenceCount = 0;
      }
    }

    return {
      id: def.id, name: def.name, description: def.description,
      score, status: computeStatus(score), trend, confidence,
      lastUpdated: score !== null ? new Date().toISOString() : null,
      businessImpact: def.businessImpact, evidenceCount,
      connectorRequired: def.connectorRequired,
      recommendedActions: def.recommendedActions,
      expectedImprovement: def.expectedImprovement,
    };
  });

  // Build categories
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
  const overallScore = allScores.some((s) => s !== null)
    ? Math.round(allScores.filter((s): s is number => s !== null).reduce((a, b) => a + b, 0) / allScores.filter((s): s is number => s !== null).length)
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
