// ── Benchmark Service ──
// Computes per-factor aggregates across dimensions (city/cuisine/price/competitors).
// Enables "Compared to…" on every factor.

import prisma from '../../config/db';
import { getScorecard } from './ScorecardService';

export type BenchmarkDimension = 'city' | 'cuisine' | 'price' | 'competitors';

export interface BenchmarkResult {
  factorId: string;
  dimension: BenchmarkDimension;
  dimensionValue: string;
  score: number | null;
  p50: number | null;
  p75: number | null;
  p90: number | null;
  count: number;
}

/**
 * Compute percentile thresholds from a sorted list of scores.
 */
function percentiles(scores: number[]): { p50: number | null; p75: number | null; p90: number | null } {
  if (scores.length === 0) return { p50: null, p75: null, p90: null };
  const sorted = [...scores].sort((a, b) => a - b);
  const at = (p: number) => {
    const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
    return sorted[idx];
  };
  return { p50: at(50), p75: at(75), p90: at(90) };
}

/**
 * Compute benchmarks for a restaurant across all dimensions.
 * Each peer's scorecard is computed ONCE and reused across all factors/dimensions.
 * Persists results to the Benchmark model for caching.
 */
export async function computeBenchmarks(restaurantId: string): Promise<BenchmarkResult[]> {
  const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
  if (!restaurant) throw new Error('Restaurant not found');

  // Peers by city
  const cityPeers = await prisma.restaurant.findMany({
    where: { city: restaurant.city, disabled: false },
    select: { id: true },
  });
  const cityIds = cityPeers.map((r) => r.id);

  // Peers by cuisine (first cuisine token)
  const cuisines = JSON.parse(restaurant.cuisineTypes || '[]') as string[];
  const primaryCuisine = cuisines[0] || '';
  let cuisineIds: string[] = [];
  if (primaryCuisine) {
    const cuisinePeers = await prisma.restaurant.findMany({
      where: { disabled: false },
      select: { id: true, cuisineTypes: true },
    });
    cuisineIds = cuisinePeers
      .filter((r) => (JSON.parse(r.cuisineTypes || '[]') as string[]).includes(primaryCuisine))
      .map((r) => r.id);
  }

  // Peers by price range
  const pricePeers = await prisma.restaurant.findMany({
    where: { priceRange: restaurant.priceRange, disabled: false },
    select: { id: true },
  });
  const priceIds = pricePeers.map((r) => r.id);

  // Competitors (from CompetitiveSet)
  const compSets = await prisma.competitiveSet.findMany({
    where: { restaurantId },
    include: { competitors: true },
  });
  const competitorIds = compSets.flatMap((cs) => cs.competitors.map((c) => c.id));

  const dimensions: { dimension: BenchmarkDimension; value: string; ids: string[] }[] = [
    { dimension: 'city', value: restaurant.city, ids: cityIds },
    { dimension: 'cuisine', value: primaryCuisine || 'Unknown', ids: cuisineIds },
    { dimension: 'price', value: restaurant.priceRange || 'Unknown', ids: priceIds },
    { dimension: 'competitors', value: 'Top Competitors', ids: competitorIds },
  ];

  // The 25 factors
  const ownScorecard = await getScorecard(restaurantId, '');
  const factorIds = ownScorecard.categories.flatMap((c) => c.factors.map((f) => f.id));

  // Compute each peer's scorecard ONCE, keyed by restaurant id.
  const peerScorecards = new Map<string, Map<string, number | null>>();
  const allPeerIds = Array.from(new Set(dimensions.flatMap((d) => d.ids).filter((id) => id !== restaurantId)));
  for (const pid of allPeerIds) {
    try {
      const sc = await getScorecard(pid, '');
      const factorMap = new Map<string, number | null>();
      for (const cat of sc.categories) {
        for (const f of cat.factors) {
          factorMap.set(f.id, f.score);
        }
      }
      peerScorecards.set(pid, factorMap);
    } catch {
      // Skip peers that fail to compute.
    }
  }

  const results: BenchmarkResult[] = [];

  for (const dim of dimensions) {
    for (const factorId of factorIds) {
      const ownScore = ownScorecard.categories
        .flatMap((c) => c.factors)
        .find((f) => f.id === factorId)?.score ?? null;

      const peerScores: number[] = [];
      for (const pid of dim.ids) {
        if (pid === restaurantId) continue;
        const s = peerScorecards.get(pid)?.get(factorId) ?? null;
        if (s !== null) peerScores.push(s);
      }
      const { p50, p75, p90 } = percentiles(peerScores);

      const result: BenchmarkResult = {
        factorId,
        dimension: dim.dimension,
        dimensionValue: dim.value,
        score: ownScore,
        p50, p75, p90,
        count: peerScores.length,
      };
      results.push(result);

      // Persist for caching
      await prisma.benchmark.upsert({
        where: {
          restaurantId_factorId_dimension: {
            restaurantId,
            factorId,
            dimension: dim.dimension,
          },
        },
        update: {
          dimensionValue: dim.value,
          score: ownScore ?? 0,
          p50, p75, p90,
          count: peerScores.length,
          computedAt: new Date(),
        },
        create: {
          restaurantId,
          factorId,
          dimension: dim.dimension,
          dimensionValue: dim.value,
          score: ownScore ?? 0,
          p50, p75, p90,
          count: peerScores.length,
        },
      });
    }
  }

  return results;
}

/**
 * Get the most recent benchmark computation time for a restaurant.
 */
export async function latestBenchmarkTime(restaurantId: string): Promise<number> {
  const latest = await prisma.benchmark.findFirst({
    where: { restaurantId },
    orderBy: { computedAt: 'desc' },
    select: { computedAt: true },
  });
  return latest ? latest.computedAt.getTime() : 0;
}

/**
 * Get cached benchmarks for a restaurant (optionally filtered by dimension).
 */
export async function getBenchmarks(restaurantId: string, dimension?: BenchmarkDimension): Promise<BenchmarkResult[]> {
  const rows = await prisma.benchmark.findMany({
    where: {
      restaurantId,
      ...(dimension ? { dimension } : {}),
    },
    orderBy: { factorId: 'asc' },
  });
  return rows.map((r) => ({
    factorId: r.factorId,
    dimension: r.dimension as BenchmarkDimension,
    dimensionValue: r.dimensionValue,
    score: r.score,
    p50: r.p50,
    p75: r.p75,
    p90: r.p90,
    count: r.count,
  }));
}
