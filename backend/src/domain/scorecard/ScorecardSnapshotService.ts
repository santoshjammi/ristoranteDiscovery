// ── Scorecard Snapshot Service ──
// Captures point-in-time scorecard snapshots and queries history for trends.
// Enables 7/30/90-day/since-onboarding trends and "last scan" on the portfolio view.

import prisma from '../../config/db';
import { getScorecard } from './ScorecardService';

export interface SnapshotPoint {
  capturedAt: string;
  overallScore: number | null;
  overallStatus: string | null;
  liveFactors: number;
  pendingFactors: number;
  categoryScores: Record<string, number | null>;
}

export interface SnapshotHistory {
  restaurantId: string;
  range: '7d' | '30d' | '90d' | 'all';
  points: SnapshotPoint[];
}

const RANGE_DAYS: Record<SnapshotHistory['range'], number | null> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
  'all': null,
};

/**
 * Capture a snapshot of the current scorecard for a restaurant.
 * Called on every scorecard read so history accumulates naturally.
 */
export async function captureSnapshot(restaurantId: string): Promise<void> {
  try {
    const scorecard = await getScorecard(restaurantId, '');
    const categoryScores: Record<string, number | null> = {};
    for (const cat of scorecard.categories) {
      categoryScores[cat.id] = cat.score;
    }
    const factorScores: Record<string, { score: number | null; status: string; confidence: number | null; evidenceCount: number }> = {};
    for (const cat of scorecard.categories) {
      for (const f of cat.factors) {
        factorScores[f.id] = {
          score: f.score,
          status: f.status,
          confidence: f.confidence,
          evidenceCount: f.evidenceCount,
        };
      }
    }
    await prisma.scorecardSnapshot.create({
      data: {
        restaurantId,
        overallScore: scorecard.overallScore,
        overallStatus: scorecard.overallStatus,
        categoryScores: JSON.stringify(categoryScores),
        factorScores: JSON.stringify(factorScores),
        liveFactors: scorecard.liveFactors,
        pendingFactors: scorecard.pendingFactors,
      },
    });
  } catch (err) {
    // Snapshot capture must never break the scorecard read.
    console.warn('Snapshot capture failed:', (err as Error).message);
  }
}

/**
 * Query snapshot history for a restaurant over a range.
 */
export async function getSnapshotHistory(restaurantId: string, range: SnapshotHistory['range'] = '30d'): Promise<SnapshotHistory> {
  const days = RANGE_DAYS[range];
  const since = days !== null ? new Date(Date.now() - days * 24 * 60 * 60 * 1000) : undefined;

  const snapshots = await prisma.scorecardSnapshot.findMany({
    where: {
      restaurantId,
      ...(since ? { capturedAt: { gte: since } } : {}),
    },
    orderBy: { capturedAt: 'asc' },
  });

  const points: SnapshotPoint[] = snapshots.map((s) => ({
    capturedAt: s.capturedAt.toISOString(),
    overallScore: s.overallScore,
    overallStatus: s.overallStatus,
    liveFactors: s.liveFactors,
    pendingFactors: s.pendingFactors,
    categoryScores: JSON.parse(s.categoryScores || '{}'),
  }));

  return { restaurantId, range, points };
}

/**
 * Get the most recent snapshot for a restaurant (for "last scan" on portfolio view).
 */
export async function getLatestSnapshot(restaurantId: string): Promise<SnapshotPoint | null> {
  const latest = await prisma.scorecardSnapshot.findFirst({
    where: { restaurantId },
    orderBy: { capturedAt: 'desc' },
  });
  if (!latest) return null;
  return {
    capturedAt: latest.capturedAt.toISOString(),
    overallScore: latest.overallScore,
    overallStatus: latest.overallStatus,
    liveFactors: latest.liveFactors,
    pendingFactors: latest.pendingFactors,
    categoryScores: JSON.parse(latest.categoryScores || '{}'),
  };
}
