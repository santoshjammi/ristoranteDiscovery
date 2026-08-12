// ── Weekly Intelligence Service ──
// Answers four questions for a restaurant owner:
//   1. What changed?   — score deltas, new decisions, source updates
//   2. What improved?  — factors whose score went up
//   3. What worsened?  — factors whose score went down
//   4. What should I do next? — top problem factors + recommended actions
//
// Reuses snapshot history, scorecard, decisions — no new scoring engine.

import prisma from '../../config/db';
import { getScorecard } from '../../domain/scorecard/ScorecardService';
import { getSnapshotHistory } from '../../domain/scorecard/ScorecardSnapshotService';

export interface WeeklyChange {
  factorId: string;
  factorName: string;
  delta: number;
  fromScore: number | null;
  toScore: number | null;
}

export interface WeeklyAction {
  factorId: string;
  factorName: string;
  score: number | null;
  status: string;
  recommendedAction: string;
  expectedImprovement: string;
}

export interface WeeklyIntelligenceReport {
  restaurantId: string;
  restaurantName: string;
  period: { start: string; end: string };
  overallScore: number | null;
  overallStatus: string | null;
  changed: WeeklyChange[];     // What changed?
  improved: WeeklyChange[];    // What improved?
  worsened: WeeklyChange[];    // What worsened?
  actions: WeeklyAction[];     // What should I do next?
  newDecisions: number;
  sourceUpdates: number;
  generatedAt: string;
}

const FACTOR_NAMES: Record<string, string> = {
  gbp_profile: 'Google Business Profile',
  local_search: 'Local Search Visibility',
  location_accuracy: 'Location Accuracy',
  delivery_platforms: 'Delivery Platforms',
  ai_visibility: 'AI Visibility',
  avg_rating: 'Average Rating',
  review_volume_freshness: 'Review Volume & Freshness',
  review_response: 'Review Response Rate',
  sentiment: 'Customer Sentiment',
  overall_trust: 'Overall Trust',
  website_health: 'Website Health',
  mobile_experience: 'Mobile Experience',
  menu_availability_quality: 'Menu Availability & Quality',
  online_ordering: 'Online Ordering',
  reservations: 'Reservations',
  business_completeness: 'Business Completeness',
  opening_hours: 'Opening Hours',
  contact_info: 'Contact Information',
  photos_media: 'Photos & Media',
  local_citations: 'Local Citations',
  competitive_position: 'Competitive Position',
  local_authority: 'Local Authority',
  visibility_trend: 'Visibility Trend',
  growth_opportunity: 'Growth Opportunity',
  customer_engagement: 'Customer Engagement',
};

function factorName(id: string): string {
  return FACTOR_NAMES[id] || id.replace(/_/g, ' ');
}

/**
 * Generate the weekly intelligence report for a restaurant.
 * Compares the latest snapshot to the snapshot ~7 days prior.
 */
export async function generateWeeklyIntelligence(restaurantId: string): Promise<WeeklyIntelligenceReport> {
  const scorecard = await getScorecard(restaurantId, '');
  const history = await getSnapshotHistory(restaurantId, '30d');

  const now = Date.now();
  const weekAgo = now - 7 * 86400000;

  // Find the latest snapshot and the closest snapshot to ~7 days ago
  const points = history.points;
  const latest = points.length > 0 ? points[points.length - 1] : null;
  const baseline = points.length > 0
    ? points.reduce((closest, p) => {
        const pTime = new Date(p.capturedAt).getTime();
        const closestTime = new Date(closest.capturedAt).getTime();
        return Math.abs(pTime - weekAgo) < Math.abs(closestTime - weekAgo) ? p : closest;
      })
    : null;

  const changed: WeeklyChange[] = [];

  // Compare factor scores between baseline and latest
  if (latest && baseline) {
    for (const cat of scorecard.categories) {
      for (const f of cat.factors) {
        const from = baseline.categoryScores && latest.categoryScores
          ? null // factor-level not in snapshot; fall back to category delta
          : null;
        void from;
        const latestCat = latest.categoryScores[cat.id];
        const baseCat = baseline.categoryScores[cat.id];
        if (latestCat !== null && baseCat !== null && latestCat !== undefined && baseCat !== undefined) {
          const delta = latestCat - baseCat;
          if (delta !== 0) {
            changed.push({
              factorId: cat.id,
              factorName: cat.name,
              delta,
              fromScore: baseCat,
              toScore: latestCat,
            });
          }
        }
      }
    }
  }

  const improved = changed.filter((c) => c.delta > 0);
  const worsened = changed.filter((c) => c.delta < 0);

  // Top actions: worst live factors with recommended actions
  const allFactors = scorecard.categories.flatMap((c) => c.factors);
  const actions: WeeklyAction[] = allFactors
    .filter((f) => f.score !== null && (f.status === 'critical' || f.status === 'needs_attention'))
    .sort((a, b) => (a.score ?? 0) - (b.score ?? 0))
    .slice(0, 5)
    .map((f) => ({
      factorId: f.id,
      factorName: f.name,
      score: f.score,
      status: f.status,
      recommendedAction: f.recommendedActions[0] || 'Review factor',
      expectedImprovement: f.expectedImprovement,
    }));

  // New decisions in the last 7 days
  const newDecisions = await prisma.decision.count({
    where: { restaurantId, createdAt: { gte: new Date(weekAgo) } },
  });

  // Source updates in the last 7 days
  const sourceUpdates = await prisma.connectorScorecardData.count({
    where: { restaurantId, syncedAt: { gte: new Date(weekAgo) } },
  });

  return {
    restaurantId,
    restaurantName: scorecard.restaurantName,
    period: { start: new Date(weekAgo).toISOString(), end: new Date().toISOString() },
    overallScore: scorecard.overallScore,
    overallStatus: scorecard.overallStatus,
    changed,
    improved,
    worsened,
    actions,
    newDecisions,
    sourceUpdates,
    generatedAt: new Date().toISOString(),
  };
}
