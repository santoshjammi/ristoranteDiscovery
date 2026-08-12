// ── Portfolio Prioritization Service ──
// Ranks restaurants by urgency, opportunity, and weakest factors.
// Deterministic — uses the existing portfolio aggregation + impact simulation.
// No new scoring engine.

import { getPortfolio } from '../../application/portfolio/PortfolioService';
import { simulateImpact } from './ImpactSimulationService';

export interface PrioritizedRestaurant {
  id: string;
  name: string;
  city: string;
  overallScore: number | null;
  overallStatus: string | null;
  criticalAlerts: number;
  pendingActions: number;
  urgencyScore: number;      // higher = needs attention sooner
  opportunityScore: number;  // higher = more upside available
  weakestFactor: { factorId: string; name: string; score: number | null } | null;
  topGain: { factorId: string; name: string; expectedGain: number | null } | null;
  rank: number;
}

export interface PrioritizedPortfolio {
  restaurants: PrioritizedRestaurant[];
  sortedBy: 'urgency' | 'opportunity' | 'weakest';
  generatedAt: string;
}

/**
 * Rank the portfolio. `sortBy` selects the ranking dimension.
 * urgency:   low overall score + high critical alerts
 * opportunity: highest total expected gain from top factors
 * weakest:   lowest overall score (weakest first)
 * `limit` caps how many restaurants are scored/ranked.
 */
export async function getPrioritizedPortfolio(sortBy: 'urgency' | 'opportunity' | 'weakest' = 'urgency', limit?: number): Promise<PrioritizedPortfolio> {
  const portfolio = await getPortfolio(limit);

  const rows: PrioritizedRestaurant[] = [];

  for (const r of portfolio.restaurants) {
    const criticalAlerts = r.criticalAlerts;
    const pendingActions = r.pendingActions;
    const overallScore = r.overallScore ?? 0;

    // Weakest factor (lowest live factor)
    let weakestFactor: PrioritizedRestaurant['weakestFactor'] = null;
    if (r.topIssue) {
      weakestFactor = { factorId: r.topIssue.factorId, name: r.topIssue.name, score: r.topIssue.score };
    }

    // Top gain via impact simulation
    let topGain: PrioritizedRestaurant['topGain'] = null;
    try {
      const candidateIds = ['delivery_platforms', 'online_ordering', 'photos_media', 'customer_engagement', 'growth_opportunity'];
      let best: { factorId: string; name: string; expectedGain: number | null } | null = null;
      for (const fid of candidateIds) {
        try {
          const sim = await simulateImpact(r.id, fid);
          if (sim.expectedGain !== null && (!best || sim.expectedGain > (best.expectedGain ?? 0))) {
            best = { factorId: sim.factorId, name: sim.factorName, expectedGain: sim.expectedGain };
          }
        } catch { /* skip */ }
      }
      topGain = best;
    } catch { /* skip */ }

    // urgency: lower score and more critical alerts raise urgency
    const urgencyScore = Math.round((100 - overallScore) + criticalAlerts * 5 + pendingActions * 1);
    // opportunity: top expected gain
    const opportunityScore = topGain?.expectedGain ?? 0;

    rows.push({
      id: r.id,
      name: r.name,
      city: r.city,
      overallScore: r.overallScore,
      overallStatus: r.overallStatus,
      criticalAlerts,
      pendingActions,
      urgencyScore,
      opportunityScore,
      weakestFactor,
      topGain,
      rank: 0,
    });
  }

  // Sort by the requested dimension
  const sorted = [...rows].sort((a, b) => {
    if (sortBy === 'urgency') return b.urgencyScore - a.urgencyScore;
    if (sortBy === 'opportunity') return b.opportunityScore - a.opportunityScore;
    return (a.overallScore ?? 999) - (b.overallScore ?? 999); // weakest first
  });
  sorted.forEach((r, i) => { r.rank = i + 1; });

  return { restaurants: sorted, sortedBy: sortBy, generatedAt: new Date().toISOString() };
}
