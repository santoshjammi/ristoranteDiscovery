// ── Portfolio Service ──
// Aggregates all restaurants' scores, categories, top issue, trend, last scan,
// critical alerts, and pending actions into a single portfolio view.
// Enables the executive Restaurant List view and the Portfolio Heat Map.

import prisma from '../../config/db';
import { getScorecard } from '../../domain/scorecard/ScorecardService';
import { getLatestSnapshot } from '../../domain/scorecard/ScorecardSnapshotService';

export interface PortfolioRestaurant {
  id: string;
  name: string;
  city: string;
  cuisineTypes: string[];
  priceRange: string | null;
  overallScore: number | null;
  overallStatus: string | null;
  categoryScores: Record<string, number | null>;
  topIssue: { factorId: string; name: string; score: number | null; status: string } | null;
  trend: 'up' | 'down' | 'stable' | 'new' | null;
  lastScan: string | null;
  criticalAlerts: number;
  pendingActions: number;
  disabled: boolean;
}

export interface PortfolioSummary {
  total: number;
  active: number;
  disabled: number;
  averageScore: number | null;
  criticalCount: number;
  attentionCount: number;
  healthyCount: number;
  pendingCount: number;
}

export interface Portfolio {
  summary: PortfolioSummary;
  restaurants: PortfolioRestaurant[];
}

/**
 * Compute the trend for a restaurant from its snapshot history.
 * Compares the latest snapshot to the earliest snapshot in the last 30 days.
 */
async function computeTrend(restaurantId: string): Promise<'up' | 'down' | 'stable' | 'new' | null> {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const snapshots = await prisma.scorecardSnapshot.findMany({
    where: { restaurantId, capturedAt: { gte: since } },
    orderBy: { capturedAt: 'asc' },
    select: { overallScore: true },
  });
  if (snapshots.length === 0) return 'new';
  const first = snapshots[0].overallScore;
  const last = snapshots[snapshots.length - 1].overallScore;
  if (first === null || last === null) return 'stable';
  if (last > first + 1) return 'up';
  if (last < first - 1) return 'down';
  return 'stable';
}

/**
 * Build the full portfolio view.
 */
export async function getPortfolio(): Promise<Portfolio> {
  const restaurants = await prisma.restaurant.findMany({
    where: { disabled: false },
    orderBy: { name: 'asc' },
  });

  const items: PortfolioRestaurant[] = [];
  let totalScore = 0;
  let scored = 0;
  let criticalCount = 0;
  let attentionCount = 0;
  let healthyCount = 0;
  let pendingCount = 0;

  for (const r of restaurants) {
    const scorecard = await getScorecard(r.id, '');
    const latest = await getLatestSnapshot(r.id);
    const trend = await computeTrend(r.id);

    const categoryScores: Record<string, number | null> = {};
    for (const cat of scorecard.categories) {
      categoryScores[cat.id] = cat.score;
    }

    // Top issue = lowest-scoring live factor
    const allFactors = scorecard.categories.flatMap((c) => c.factors);
    const live = allFactors.filter((f) => f.score !== null);
    const topIssue = live.length > 0
      ? live.reduce((a, b) => (a.score! <= b.score! ? a : b))
      : null;

    const criticalAlerts = allFactors.filter((f) => f.status === 'critical').length;
    const pendingActions = allFactors.filter((f) => f.status === 'pending_observation').length;

    if (scorecard.overallScore !== null) {
      totalScore += scorecard.overallScore;
      scored++;
    }
    criticalCount += allFactors.filter((f) => f.status === 'critical').length;
    attentionCount += allFactors.filter((f) => f.status === 'needs_attention' || f.status === 'fair').length;
    healthyCount += allFactors.filter((f) => f.status === 'excellent' || f.status === 'good').length;
    pendingCount += pendingActions;

    items.push({
      id: r.id,
      name: r.name,
      city: r.city,
      cuisineTypes: JSON.parse(r.cuisineTypes || '[]'),
      priceRange: r.priceRange,
      overallScore: scorecard.overallScore,
      overallStatus: scorecard.overallStatus,
      categoryScores,
      topIssue: topIssue ? { factorId: topIssue.id, name: topIssue.name, score: topIssue.score, status: topIssue.status } : null,
      trend,
      lastScan: latest?.capturedAt ?? null,
      criticalAlerts,
      pendingActions,
      disabled: r.disabled,
    });
  }

  const summary: PortfolioSummary = {
    total: restaurants.length,
    active: restaurants.filter((r) => !r.disabled).length,
    disabled: restaurants.filter((r) => r.disabled).length,
    averageScore: scored > 0 ? Math.round(totalScore / scored) : null,
    criticalCount,
    attentionCount,
    healthyCount,
    pendingCount,
  };

  return { summary, restaurants: items };
}
