// ── Cross-Factor Relationships Service ──
// Shows which weak factors influence others. Deterministic only — no
// speculative causal claims. The relationship map is a fixed, editorial
// dependency model (not learned), and the service reports which linked
// factors are currently weak so an owner can see influence chains.

import { getScorecard } from './ScorecardService';
import type { FactorScore } from './types';

// Fixed editorial dependency model: a factor is influenced BY these upstream
// factors (cause → effect). This is a product decision, not a learned model.
// A weak upstream factor can drag down the downstream factor.
const INFLUENCES: Record<string, string[]> = {
  // Discoverability
  gbp_profile: ['business_completeness', 'photos_media', 'contact_info'],
  local_search: ['gbp_profile', 'local_citations', 'website_health'],
  location_accuracy: ['business_completeness'],
  delivery_platforms: ['menu_availability_quality'],
  ai_visibility: ['website_health', 'menu_availability_quality', 'gbp_profile', 'review_volume_freshness'],

  // Reputation
  avg_rating: ['sentiment', 'review_response'],
  review_volume_freshness: ['avg_rating', 'customer_engagement'],
  review_response: [],
  sentiment: ['review_volume_freshness'],
  overall_trust: ['avg_rating', 'review_volume_freshness', 'review_response'],

  // Digital
  website_health: ['business_completeness'],
  mobile_experience: ['website_health'],
  menu_availability_quality: ['business_completeness', 'photos_media'],
  online_ordering: ['delivery_platforms', 'menu_availability_quality'],
  reservations: ['mobile_experience', 'online_ordering'],

  // Information
  business_completeness: [],
  opening_hours: ['business_completeness'],
  contact_info: ['business_completeness'],
  photos_media: ['business_completeness'],
  local_citations: ['gbp_profile', 'business_completeness'],

  // Market
  competitive_position: ['local_search', 'overall_trust'],
  local_authority: ['gbp_profile', 'local_citations'],
  visibility_trend: ['local_search', 'ai_visibility', 'competitive_position'],
  growth_opportunity: ['competitive_position', 'online_ordering', 'delivery_platforms'],
  customer_engagement: ['review_volume_freshness', 'overall_trust'],
};

export interface FactorInfluence {
  factorId: string;
  factorName: string;
  score: number | null;
  status: string;
  influenceOn: InfluenceLink[];
  influencedBy: InfluenceLink[];
}

export interface InfluenceLink {
  factorId: string;
  factorName: string;
  score: number | null;
  status: string;
  weak: boolean; // true if the linked factor is needs_attention / critical
}

export interface CrossFactorReport {
  restaurantId: string;
  factors: FactorInfluence[];
  chains: string[][]; // deterministic influence chains (weak → downstream)
  generatedAt: string;
}

const WEAK_STATUSES = new Set(['needs_attention', 'critical', 'pending_observation']);

function isWeak(f: FactorScore): boolean {
  return WEAK_STATUSES.has(f.status);
}

/**
 * Build the cross-factor relationship report for a restaurant.
 */
export async function getCrossFactorReport(restaurantId: string): Promise<CrossFactorReport> {
  const scorecard = await getScorecard(restaurantId, '');
  const byId = new Map<string, FactorScore>();
  for (const cat of scorecard.categories) {
    for (const f of cat.factors) byId.set(f.id, f);
  }

  const factors: FactorInfluence[] = [];
  for (const [factorId, upstreamIds] of Object.entries(INFLUENCES)) {
    const f = byId.get(factorId);
    if (!f) continue;
    factors.push({
      factorId: f.id,
      factorName: f.name,
      score: f.score,
      status: f.status,
      // influencedBy = the upstream factors listed in INFLUENCES[factorId]
      // (these feed INTO this factor)
      influencedBy: upstreamIds
        .map((uid) => byId.get(uid))
        .filter((x): x is FactorScore => !!x)
        .map((up) => ({
          factorId: up.id,
          factorName: up.name,
          score: up.score,
          status: up.status,
          weak: isWeak(up),
        })),
      // influenceOn = downstream factors whose INFLUENCES list includes this factor
      influenceOn: Object.entries(INFLUENCES)
        .filter(([, downstream]) => downstream.includes(factorId))
        .map(([downstreamId]) => byId.get(downstreamId))
        .filter((x): x is FactorScore => !!x)
        .map((down) => ({
          factorId: down.id,
          factorName: down.name,
          score: down.score,
          status: down.status,
          weak: isWeak(down),
        })),
    });
  }

  // Deterministic influence chains: walk from a weak source factor down through
  // downstream factors that are also weak, up to depth 3.
  const chains: string[][] = [];
  for (const [sourceId, downstreamIds] of Object.entries(INFLUENCES)) {
    const source = byId.get(sourceId);
    if (!source || !isWeak(source)) continue;
    for (const nextId of downstreamIds) {
      const next = byId.get(nextId);
      if (!next || !isWeak(next)) continue;
      const chain = [source.name, next.name];
      // extend one more level
      for (const deeperId of INFLUENCES[nextId] || []) {
        const deeper = byId.get(deeperId);
        if (deeper && isWeak(deeper)) {
          chain.push(deeper.name);
          break;
        }
      }
      chains.push(chain);
    }
  }

  return {
    restaurantId,
    factors,
    chains,
    generatedAt: new Date().toISOString(),
  };
}
