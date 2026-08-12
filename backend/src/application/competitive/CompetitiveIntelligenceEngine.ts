// Application service: Competitive Intelligence Engine
// Deterministic — distance, cuisine, price tier, service model
// No AI dependency

import { Competitor, type ScoreGap } from '../../domain/competitive/Competitor';
import { Benchmark } from '../../domain/competitive/Benchmark';
import { CompetitiveInsight, type CompetitiveInsightType, type InsightSeverity } from '../../domain/competitive/CompetitiveInsight';
import { CompetitiveSet } from '../../domain/competitive/CompetitiveSet';

// --- Input types ---

export interface RestaurantProfile {
  id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  city: string;
  cuisineTypes: string[];
  priceRange: string | null;
  deliverySupport: boolean;
  scores: Record<string, number>;
}

export interface CompetitiveAnalysisInput {
  focalRestaurant: RestaurantProfile;
  candidates: RestaurantProfile[];
  radiusMiles: number;
  maxCompetitors: number;
  cuisineFamilyMap: Record<string, string>;
}

// --- Cuisine family mapping ---

const DEFAULT_CUISINE_FAMILIES: Record<string, string> = {
  'north indian': 'indian',
  'south indian': 'indian',
  'punjabi': 'indian',
  'mughlai': 'indian',
  'gujarati': 'indian',
  'rajasthani': 'indian',
  'bengali': 'indian',
  'kerala': 'indian',
  'andhra': 'indian',
  'hyderabadi': 'indian',
  'chinese': 'chinese',
  'sichuan': 'chinese',
  'cantonese': 'chinese',
  'japanese': 'japanese',
  'sushi': 'japanese',
  'ramen': 'japanese',
  'italian': 'italian',
  'pizza': 'italian',
  'pasta': 'italian',
  'mexican': 'mexican',
  'taco': 'mexican',
  'american': 'american',
  'burger': 'american',
  'bbq': 'american',
  'seafood': 'seafood',
  'mediterranean': 'mediterranean',
  'middle eastern': 'mediterranean',
  'thai': 'thai',
  'vietnamese': 'vietnamese',
  'korean': 'korean',
  'continental': 'continental',
  'bakery': 'bakery',
  'cafe': 'cafe',
  'fast food': 'fast-food',
  'street food': 'fast-food',
};

// --- Haversine distance ---

function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
): number {
  const R = 3959; // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// --- Cuisine family ---

function getCuisineFamily(cuisineTypes: string[], map: Record<string, string>): string | null {
  for (const ct of cuisineTypes) {
    const key = ct.toLowerCase().trim();
    if (map[key]) return map[key];
  }
  return null;
}

// --- Similarity score ---

function calculateSimilarityScore(
  focal: RestaurantProfile,
  candidate: RestaurantProfile,
  cuisineFamilyMap: Record<string, string>,
): number {
  let score = 0;

  // Cuisine family match (primary, weight 40)
  const focalFamily = getCuisineFamily(focal.cuisineTypes, cuisineFamilyMap);
  const candidateFamily = getCuisineFamily(candidate.cuisineTypes, cuisineFamilyMap);
  if (focalFamily && candidateFamily && focalFamily === candidateFamily) {
    score += 40;
  }

  // Price tier match (weight 25)
  if (focal.priceRange && candidate.priceRange && focal.priceRange === candidate.priceRange) {
    score += 25;
  }

  // Service model match (weight 20)
  if (focal.deliverySupport === candidate.deliverySupport) {
    score += 20;
  }

  // Same-chain exclusion: same name → score 0
  if (focal.name.toLowerCase().trim() === candidate.name.toLowerCase().trim()) {
    return 0;
  }

  return score;
}

// --- Score gap calculation ---

const SCORE_DIMENSIONS = [
  'gbpHealthScore',
  'discoverabilityScore',
  'aiVisibilityScore',
  'localSearchScore',
  'menuDiscoverabilityScore',
  'conversationalSearchScore',
  'dishRetrievalScore',
  'restaurantClarityScore',
  'competitiveVisibilityScore',
];

function calculateScoreGaps(focal: RestaurantProfile, competitor: RestaurantProfile): ScoreGap[] {
  const gaps: ScoreGap[] = [];
  for (const dim of SCORE_DIMENSIONS) {
    const fScore = focal.scores[dim] ?? 0;
    const cScore = competitor.scores[dim] ?? 0;
    gaps.push({
      dimension: dim,
      focalScore: fScore,
      competitorScore: cScore,
      gap: fScore - cScore,
    });
  }
  return gaps;
}

// --- Benchmark calculation ---

function calculateBenchmarks(
  focal: RestaurantProfile,
  competitors: Competitor[],
): Benchmark[] {
  return SCORE_DIMENSIONS.map(dim => {
    const focalScore = focal.scores[dim] ?? 0;
    const compScores = competitors.map(c => {
      const gap = c.scoreGaps.find(g => g.dimension === dim);
      return gap ? gap.competitorScore : 0;
    });
    const allScores = [focalScore, ...compScores];
    const sorted = [...allScores].sort((a, b) => a - b);
    const average = allScores.reduce((s, v) => s + v, 0) / allScores.length;
    const median = sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];
    const focalRank = sorted.indexOf(focalScore);
    const focalPercentile = sorted.length > 1
      ? Math.round((focalRank / (sorted.length - 1)) * 100)
      : 50;

    return new Benchmark({
      dimension: dim,
      average: Math.round(average * 100) / 100,
      median: Math.round(median * 100) / 100,
      min: Math.min(...allScores),
      max: Math.max(...allScores),
      focalScore,
      focalPercentile,
      competitorCount: competitors.length,
    });
  });
}

// --- Insight generation ---

function generateInsights(
  focal: RestaurantProfile,
  competitors: Competitor[],
  benchmarks: Benchmark[],
): CompetitiveInsight[] {
  const insights: CompetitiveInsight[] = [];

  for (const benchmark of benchmarks) {
    const gap = (focal.scores[benchmark.dimension] ?? 0) - benchmark.average;

    if (gap >= 15) {
      insights.push(new CompetitiveInsight({
        type: 'strength',
        dimension: benchmark.dimension,
        description: `Strongest in ${benchmark.dimension} — ${gap} points above average`,
        gapSize: gap,
        severity: 'positive',
      }));
    } else if (gap <= -15) {
      insights.push(new CompetitiveInsight({
        type: 'weakness',
        dimension: benchmark.dimension,
        description: `Weakest in ${benchmark.dimension} — ${Math.abs(gap)} points below average`,
        gapSize: gap,
        severity: gap <= -25 ? 'critical' : 'warning',
      }));
    }

    // Opportunity: dimension where focal is below average but has room to improve
    if (gap < 0 && gap > -15) {
      insights.push(new CompetitiveInsight({
        type: 'opportunity',
        dimension: benchmark.dimension,
        description: `Room to improve in ${benchmark.dimension} — ${Math.abs(gap)} points below average`,
        gapSize: gap,
        severity: 'neutral',
      }));
    }

    // Threat: dimension where a competitor significantly outperforms
    const biggestThreat = competitors
      .flatMap(c => c.scoreGaps)
      .filter(g => g.dimension === benchmark.dimension && g.gap < -20)
      .sort((a, b) => a.gap - b.gap)[0];

    if (biggestThreat) {
      insights.push(new CompetitiveInsight({
        type: 'threat',
        dimension: benchmark.dimension,
        description: `Competitor leads by ${Math.abs(biggestThreat.gap)} points in ${benchmark.dimension}`,
        gapSize: biggestThreat.gap,
        severity: 'warning',
      }));
    }
  }

  return insights;
}

// --- Main engine ---

export class CompetitiveIntelligenceEngine {
  private readonly cuisineFamilyMap: Record<string, string>;

  constructor(cuisineFamilyMap?: Record<string, string>) {
    this.cuisineFamilyMap = cuisineFamilyMap ?? DEFAULT_CUISINE_FAMILIES;
  }

  analyze(input: CompetitiveAnalysisInput): CompetitiveSet {
    const { focalRestaurant, candidates, radiusMiles, maxCompetitors } = input;

    // Step 1: Filter by distance
    const withinRadius = candidates.filter(c => {
      if (!focalRestaurant.latitude || !focalRestaurant.longitude ||
          !c.latitude || !c.longitude) {
        return false;
      }
      const dist = haversineDistance(
        focalRestaurant.latitude, focalRestaurant.longitude,
        c.latitude, c.longitude,
      );
      return dist <= radiusMiles;
    });

    // Step 2: Score similarity and filter
    const scored = withinRadius.map(c => ({
      candidate: c,
      similarityScore: calculateSimilarityScore(focalRestaurant, c, this.cuisineFamilyMap),
      distance: haversineDistance(
        focalRestaurant.latitude!, focalRestaurant.longitude!,
        c.latitude!, c.longitude!,
      ),
    }));

    const qualified = scored
      .filter(s => s.similarityScore >= 60)
      .sort((a, b) => b.similarityScore - a.similarityScore || a.distance - b.distance)
      .slice(0, maxCompetitors);

    // Step 3: Build Competitor objects
    const competitors = qualified.map(s => {
      const scoreGaps = calculateScoreGaps(focalRestaurant, s.candidate);
      return new Competitor({
        restaurantId: s.candidate.id,
        name: s.candidate.name,
        distance: Math.round(s.distance * 100) / 100,
        cuisineSimilarity: s.similarityScore >= 40 ? 1 : 0,
        priceTierMatch: focalRestaurant.priceRange === s.candidate.priceRange,
        serviceModelMatch: focalRestaurant.deliverySupport === s.candidate.deliverySupport,
        overallScore: s.similarityScore,
        scoreGaps,
      });
    });

    // Step 4: Calculate benchmarks
    const benchmarks = calculateBenchmarks(focalRestaurant, competitors);

    // Step 5: Generate insights
    const insights = generateInsights(focalRestaurant, competitors, benchmarks);

    // Step 6: Build aggregate
    return new CompetitiveSet({
      id: `cs-${focalRestaurant.id}-${Date.now()}`,
      restaurantId: focalRestaurant.id,
      competitors,
      benchmarks,
      insights,
      generatedAt: new Date(),
      status: 'generated',
    });
  }
}
