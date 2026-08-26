// ── Impact Simulation Service ──
// Deterministic estimation of the score gain from improving a factor.
// No AI, no new scoring engine — uses factor's current score and the
// expected improvement profile of the factor. Reuses scorecard factors.

import { getScorecard } from './ScorecardService';

export interface ImpactSimulation {
  factorId: string;
  factorName: string;
  currentScore: number | null;
  estimatedScore: number | null;
  expectedGain: number | null;
  level: 'critical' | 'needs_attention' | 'good' | 'excellent' | 'pending';
  basis: string;  // human-readable basis for the estimate
}

// Deterministic improvement model per factor: how much a factor can realistically
// gain when its recommended actions are followed. Derived from business impact
// guidance — NOT AI, NOT new scoring.
const IMPROVEMENT_POTENTIAL: Record<string, number> = {
  gbp_profile: 15,
  local_search: 25,
  location_accuracy: 8,
  delivery_platforms: 30,
  ai_visibility: 18,
  avg_rating: 5,
  review_volume_freshness: 20,
  review_response: 20,
  sentiment: 10,
  overall_trust: 25,
  website_health: 20,
  mobile_experience: 30,
  menu_availability_quality: 15,
  online_ordering: 40,
  reservations: 25,
  business_completeness: 10,
  opening_hours: 5,
  contact_info: 20,
  photos_media: 35,
  local_citations: 12,
  competitive_position: 15,
  local_authority: 20,
  visibility_trend: 10,
  growth_opportunity: 30,
  customer_engagement: 40,
};

const DEFAULT_POTENTIAL = 15;

function levelFor(score: number | null): ImpactSimulation['level'] {
  if (score === null) return 'pending';
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'needs_attention';
  return 'critical';
}

/**
 * Compute the deterministic impact estimate for a single factor.
 */
export async function simulateImpact(restaurantId: string, factorId: string): Promise<ImpactSimulation> {
  const scorecard = await getScorecard(restaurantId, '');
  let factor: { id: string; name: string; score: number | null } | null = null;
  for (const cat of scorecard.categories) {
    const f = cat.factors.find((x) => x.id === factorId);
    if (f) { factor = { id: f.id, name: f.name, score: f.score }; break; }
  }
  if (!factor) throw new Error(`Factor not found: ${factorId}`);

  const current = factor.score;
  if (current === null) {
    return {
      factorId,
      factorName: factor.name,
      currentScore: null,
      estimatedScore: null,
      expectedGain: null,
      level: 'pending',
      basis: 'Factor is pending observation — connect a data source to measure it before estimating impact.',
    };
  }

  const potential = IMPROVEMENT_POTENTIAL[factorId] ?? DEFAULT_POTENTIAL;
  // Estimated = current + a realistic portion of the potential (capped at 100).
  // The closer you already are to the ceiling, the less headroom remains.
  const headroom = 100 - current;
  const realisticGain = Math.min(potential, headroom);
  const estimated = Math.min(100, current + Math.max(1, Math.round(realisticGain)));

  return {
    factorId,
    factorName: factor.name,
    currentScore: current,
    estimatedScore: estimated,
    expectedGain: estimated - current,
    level: levelFor(current),
    basis: `Following suggested steps can add up to ~${potential} points. Estimated ${current} → ${estimated}.`,
  };
}

/**
 * Compute impact estimates for all 25 factors of a restaurant (for the details page).
 */
export async function simulateAllImpacts(restaurantId: string): Promise<ImpactSimulation[]> {
  const scorecard = await getScorecard(restaurantId, '');
  const factorIds = scorecard.categories.flatMap((c) => c.factors.map((f) => f.id));
  const results: ImpactSimulation[] = [];
  for (const fid of factorIds) {
    results.push(await simulateImpact(restaurantId, fid));
  }
  return results;
}
