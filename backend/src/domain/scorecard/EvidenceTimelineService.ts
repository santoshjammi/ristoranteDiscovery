// ── Evidence Timeline Service ──
// Derives a chronological, grouped-by-date timeline for a restaurant from
// snapshot history (overall score changes), connector evidence, and decisions.
// Reuses existing history/scorecard APIs — no new scoring logic.

import prisma from '../../config/db';
import { getSnapshotHistory } from '../scorecard/ScorecardSnapshotService';

export interface TimelineEvent {
  id: string;
  date: string;         // ISO
  groupLabel: string;   // "Today", "Yesterday", "3 days ago", "Last week"
  title: string;
  description: string;
  kind: 'score_change' | 'evidence' | 'decision' | 'source';
  delta?: number;       // signed overall score change (score_change only)
}

export interface EvidenceTimeline {
  restaurantId: string;
  events: TimelineEvent[];
}

function groupLabel(dateIso: string): string {
  const then = new Date(dateIso).getTime();
  const days = Math.floor((Date.now() - then) / 86400000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return 'Last week';
}

function factorName(id: string): string {
  const map: Record<string, string> = {
    gbp_profile: 'Google Business Profile',
    local_search: 'Local Search Visibility',
    delivery_platforms: 'Delivery Platforms',
    ai_visibility: 'AI Visibility',
    review_volume_freshness: 'Review Volume & Freshness',
    sentiment: 'Customer Sentiment',
    overall_trust: 'Overall Trust',
    website_health: 'Website Health',
    menu_availability_quality: 'Menu Availability & Quality',
    business_completeness: 'Business Completeness',
    photos_media: 'Photos & Media',
    competitive_position: 'Competitive Position',
  };
  return map[id] || id.replace(/_/g, ' ');
}

/**
 * Build the full evidence timeline for a restaurant.
 */
export async function getEvidenceTimeline(restaurantId: string): Promise<EvidenceTimeline> {
  const events: TimelineEvent[] = [];

  // 1. Overall score-change events from snapshot history
  const history = await getSnapshotHistory(restaurantId, '90d');
  for (let i = 1; i < history.points.length; i++) {
    const prev = history.points[i - 1];
    const curr = history.points[i];
    if (prev.overallScore === null || curr.overallScore === null) continue;
    const delta = curr.overallScore - prev.overallScore;
    if (delta === 0) continue;
    events.push({
      id: `sc-${curr.capturedAt}`,
      date: curr.capturedAt,
      groupLabel: groupLabel(curr.capturedAt),
      title: `Overall intelligence score ${delta > 0 ? 'improved' : 'declined'}`,
      description: `${delta > 0 ? '+' : ''}${delta} points → ${curr.overallScore}/100`,
      kind: 'score_change',
      delta,
    });
  }

  // 2. Connector evidence events (recent)
  const connectorData = await prisma.connectorScorecardData.findMany({
    where: { restaurantId },
    orderBy: { syncedAt: 'desc' },
    take: 20,
  });
  for (const cd of connectorData) {
    const evidence = JSON.parse(cd.evidence || '[]') as string[];
    for (const e of evidence.slice(0, 2)) {
      events.push({
        id: `ev-${cd.id}-${e.slice(0, 24)}`,
        date: cd.syncedAt.toISOString(),
        groupLabel: groupLabel(cd.syncedAt.toISOString()),
        title: `${factorName(cd.factorId)} data updated`,
        description: e,
        kind: 'source',
      });
    }
  }

  // 3. Decision events (recent)
  const decisions = await prisma.decision.findMany({
    where: { restaurantId },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });
  for (const d of decisions) {
    events.push({
      id: `dec-${d.id}`,
      date: d.createdAt.toISOString(),
      groupLabel: groupLabel(d.createdAt.toISOString()),
      title: d.title,
      description: d.businessImpact || '',
      kind: 'decision',
    });
  }

  // Sort by date descending (most recent first)
  events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return { restaurantId, events };
}
