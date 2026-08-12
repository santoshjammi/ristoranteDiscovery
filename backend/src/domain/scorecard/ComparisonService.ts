// ── Restaurant Comparison Service ──
// Compares a selected restaurant against 3-5 relevant competitors on the same
// 25 factors / 5 categories. Deterministic — uses the existing scorecard
// service for every restaurant, then ranks competitors by similarity.

import prisma from '../../config/db';
import { getScorecard } from './ScorecardService';

export interface ComparisonFactor {
  factorId: string;
  factorName: string;
  focalScore: number | null;
  competitorScores: Record<string, number | null>;
  focalWins: number;      // number of competitors the focal beats
  focalLoses: number;
  advantage: 'win' | 'lose' | 'tie' | 'pending';
}

export interface ComparisonCategory {
  categoryId: string;
  categoryName: string;
  focalScore: number | null;
  competitorScores: Record<string, number | null>;
}

export interface RestaurantComparison {
  focalId: string;
  focalName: string;
  competitors: { id: string; name: string; overallScore: number | null }[];
  categories: ComparisonCategory[];
  factors: ComparisonFactor[];
  overallAdvantage: 'win' | 'lose' | 'tie';
  generatedAt: string;
}

/**
 * Compare a restaurant against the most relevant competitors (same city and/or
 * overlapping cuisine), capped at 5.
 */
export async function compareRestaurant(focalId: string, competitorIds?: string[]): Promise<RestaurantComparison> {
  const focal = await prisma.restaurant.findUnique({ where: { id: focalId } });
  if (!focal) throw new Error('Restaurant not found');

  // If specific competitors provided, use them; else derive from same city/cuisine.
  let ids: string[] = [];
  if (competitorIds && competitorIds.length > 0) {
    ids = competitorIds;
  } else {
    const focalCuisines = parseCuisines(focal.cuisineTypes);
    const candidates = await prisma.restaurant.findMany({
      where: { id: { not: focalId }, disabled: false },
      select: { id: true, city: true, cuisineTypes: true },
    });
    const scored = candidates.map((c) => {
      let score = 0;
      if (c.city === focal.city) score += 2;
      const cuisines = parseCuisines(c.cuisineTypes);
      const overlap = cuisines.filter((cu) => focalCuisines.includes(cu)).length;
      score += overlap;
      return { id: c.id, score };
    });
    scored.sort((a, b) => b.score - a.score);
    ids = scored.slice(0, 5).map((s) => s.id);
  }

  // Load scorecards for focal + competitors once each.
  const focalScorecard = await getScorecard(focalId, '');
  const competitorCards: { id: string; name: string; overallScore: number | null; categories: { id: string; name: string; score: number | null; factors: { id: string; name: string; score: number | null }[] }[] }[] = [];
  for (const cid of ids) {
    try {
      const sc = await getScorecard(cid, '');
      competitorCards.push({
        id: cid,
        name: sc.restaurantName,
        overallScore: sc.overallScore,
        categories: sc.categories.map((c) => ({
          id: c.id,
          name: c.name,
          score: c.score,
          factors: c.factors.map((f) => ({ id: f.id, name: f.name, score: f.score })),
        })),
      });
    } catch { /* skip unreachable competitor */ }
  }

  const competitors = competitorCards.map((c) => ({ id: c.id, name: c.name, overallScore: c.overallScore }));

  // Category comparison
  const categories: ComparisonCategory[] = focalScorecard.categories.map((cat) => ({
    categoryId: cat.id,
    categoryName: cat.name,
    focalScore: cat.score,
    competitorScores: Object.fromEntries(competitorCards.map((c) => {
      const cc = c.categories.find((x) => x.id === cat.id);
      return [c.id, cc?.score ?? null];
    })),
  }));

  // Factor comparison
  const factors: ComparisonFactor[] = focalScorecard.categories.flatMap((cat) =>
    cat.factors.map((f) => {
      const competitorScores: Record<string, number | null> = {};
      let wins = 0;
      let loses = 0;
      for (const c of competitorCards) {
        const cf = c.categories.flatMap((x) => x.factors).find((x) => x.id === f.id);
        competitorScores[c.id] = cf?.score ?? null;
        if (f.score !== null && cf !== undefined && cf.score !== null) {
          if (f.score > cf.score) wins++;
          else if (f.score < cf.score) loses++;
        }
      }
      let advantage: ComparisonFactor['advantage'] = 'pending';
      if (f.score === null) advantage = 'pending';
      else if (wins > loses) advantage = 'win';
      else if (loses > wins) advantage = 'lose';
      else advantage = 'tie';
      return { factorId: f.id, factorName: f.name, focalScore: f.score, competitorScores, focalWins: wins, focalLoses: loses, advantage };
    }),
  );

  // Overall advantage
  const wins = factors.filter((f) => f.advantage === 'win').length;
  const loses = factors.filter((f) => f.advantage === 'lose').length;
  const overallAdvantage = wins > loses ? 'win' : loses > wins ? 'lose' : 'tie';

  return {
    focalId,
    focalName: focalScorecard.restaurantName,
    competitors,
    categories,
    factors,
    overallAdvantage,
    generatedAt: new Date().toISOString(),
  };
}

function parseCuisines(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const p = JSON.parse(raw);
    return Array.isArray(p) ? p.map((x: unknown) => String(x)) : [String(p)];
  } catch {
    return raw.split(',').map((s) => s.trim()).filter(Boolean);
  }
}
