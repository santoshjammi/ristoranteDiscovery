// Application service: Market Intelligence Engine
// Deterministic — area clustering, cuisine distribution, saturation, gaps, benchmarks
// No AI dependency

import { MarketArea } from '../../domain/market/MarketArea';
import { MarketInsight } from '../../domain/market/MarketInsight';
import { MarketTrend, type SentimentTrend } from '../../domain/market/MarketTrend';

// --- Input types ---

export interface RestaurantProfile {
  id: string;
  name: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  cuisineTypes: string[];
  priceRange: string | null;
  scores: Record<string, number>;
  reviewCount: number;
  averageRating: number;
}

export interface MarketAnalysisInput {
  restaurants: RestaurantProfile[];
}

// --- Area clustering ---

function clusterByCity(restaurants: RestaurantProfile[]): Map<string, RestaurantProfile[]> {
  const clusters = new Map<string, RestaurantProfile[]>();
  for (const r of restaurants) {
    const key = r.city;
    const existing = clusters.get(key) || [];
    existing.push(r);
    clusters.set(key, existing);
  }
  return clusters;
}

// --- Cuisine family mapping (reuse from Competitive Intelligence) ---

const CUISINE_FAMILIES: Record<string, string> = {
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
  'health food': 'health',
  'meal prep': 'health',
  'cloud kitchen': 'cloud-kitchen',
  'light fare': 'cafe',
  'coffee shop': 'cafe',
  'desserts': 'bakery',
  'french': 'french',
  'european': 'european',
  'contemporary': 'contemporary',
  'fine dining': 'fine-dining',
  'tex-mex': 'mexican',
  'cajun': 'cajun',
  'southern': 'southern',
  'asian': 'asian',
  'indian': 'indian',
};

function getCuisineFamily(cuisineTypes: string[]): string | null {
  for (const ct of cuisineTypes) {
    const key = ct.toLowerCase().trim();
    if (CUISINE_FAMILIES[key]) return CUISINE_FAMILIES[key];
  }
  return null;
}

// --- Score dimensions ---

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

// --- Main engine ---

export class MarketIntelligenceEngine {
  analyze(input: MarketAnalysisInput): {
    areas: MarketArea[];
    insights: MarketInsight[];
    trends: MarketTrend[];
  } {
    const { restaurants } = input;

    // Step 1: Cluster by city
    const cityClusters = clusterByCity(restaurants);

    const areas: MarketArea[] = [];
    const insights: MarketInsight[] = [];
    const trends: MarketTrend[] = [];

    for (const [city, cityRestaurants] of cityClusters) {
      // Calculate center
      const coords = cityRestaurants
        .filter(r => r.latitude !== null && r.longitude !== null);
      const centerLat = coords.length > 0
        ? coords.reduce((s, r) => s + r.latitude!, 0) / coords.length
        : 0;
      const centerLng = coords.length > 0
        ? coords.reduce((s, r) => s + r.longitude!, 0) / coords.length
        : 0;

      // Cuisine distribution (by family)
      const cuisineDistribution: Record<string, number> = {};
      for (const r of cityRestaurants) {
        const family = getCuisineFamily(r.cuisineTypes);
        if (family) {
          cuisineDistribution[family] = (cuisineDistribution[family] || 0) + 1;
        }
      }

      // Price distribution
      const priceDistribution: Record<string, number> = {};
      for (const r of cityRestaurants) {
        if (r.priceRange) {
          priceDistribution[r.priceRange] = (priceDistribution[r.priceRange] || 0) + 1;
        }
      }

      // Average scores
      const averageScores: Record<string, number> = {};
      for (const dim of SCORE_DIMENSIONS) {
        const scores = cityRestaurants.map(r => r.scores[dim] ?? 0);
        averageScores[dim] = scores.length > 0
          ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length)
          : 0;
      }

      // Review activity
      const totalReviews = cityRestaurants.reduce((s, r) => s + r.reviewCount, 0);
      const avgRating = cityRestaurants.length > 0
        ? Math.round((cityRestaurants.reduce((s, r) => s + r.averageRating, 0) / cityRestaurants.length) * 100) / 100
        : 0;

      const area = new MarketArea({
        id: `area-${city.toLowerCase().replace(/\s+/g, '-')}`,
        name: city,
        city,
        centerLat,
        centerLng,
        restaurantCount: cityRestaurants.length,
        cuisineDistribution,
        priceDistribution,
        averageScores,
        totalReviews,
        averageRating: avgRating,
      });

      areas.push(area);

      // --- Generate insights ---

      // Saturation: restaurants per cuisine
      const totalInArea = cityRestaurants.length;
      for (const [cuisine, count] of Object.entries(cuisineDistribution)) {
        const saturation = Math.round((count / totalInArea) * 100);
        if (saturation >= 30) {
          insights.push(new MarketInsight({
            type: 'saturation',
            area: city,
            cuisine,
            description: `${cuisine} is saturated (${saturation}% of restaurants in ${city})`,
            metric: saturation,
            severity: 'warning',
          }));
        }
      }

      // Gaps: cuisines with 0 restaurants
      const presentCuisines = new Set(Object.keys(cuisineDistribution));
      const allCuisines = new Set(Object.values(CUISINE_FAMILIES));
      for (const cuisine of allCuisines) {
        if (!presentCuisines.has(cuisine) && cuisine !== 'cloud-kitchen') {
          insights.push(new MarketInsight({
            type: 'gap',
            area: city,
            cuisine,
            description: `No ${cuisine} restaurants found in ${city}`,
            metric: 0,
            severity: 'neutral',
          }));
        }
      }

      // Benchmarks: compare area scores to overall average
      const overallScores: Record<string, number> = {};
      for (const dim of SCORE_DIMENSIONS) {
        const allScores = restaurants.map(r => r.scores[dim] ?? 0);
        overallScores[dim] = allScores.length > 0
          ? Math.round(allScores.reduce((s, v) => s + v, 0) / allScores.length)
          : 0;
      }

      for (const dim of SCORE_DIMENSIONS) {
        const areaAvg = averageScores[dim];
        const overallAvg = overallScores[dim];
        const diff = areaAvg - overallAvg;
        if (Math.abs(diff) >= 10) {
          insights.push(new MarketInsight({
            type: 'benchmark',
            area: city,
            cuisine: null,
            description: `${city} ${diff > 0 ? 'leads' : 'lags'} by ${Math.abs(diff)} points in ${dim} (${areaAvg} vs ${overallAvg} avg)`,
            metric: diff,
            severity: diff >= 0 ? 'positive' : 'warning',
          }));
        }
      }

      // Trends: observed review activity per cuisine
      for (const [cuisine, count] of Object.entries(cuisineDistribution)) {
        const cuisineRestaurants = cityRestaurants.filter(r => {
          const family = getCuisineFamily(r.cuisineTypes);
          return family === cuisine;
        });
        const cuisineReviews = cuisineRestaurants.reduce((s, r) => s + r.reviewCount, 0);
        const cuisineRating = cuisineRestaurants.length > 0
          ? Math.round((cuisineRestaurants.reduce((s, r) => s + r.averageRating, 0) / cuisineRestaurants.length) * 100) / 100
          : 0;

        let sentimentTrend: SentimentTrend = 'stable';
        if (cuisineRating >= 4.0 && cuisineReviews > 0) {
          sentimentTrend = 'improving';
        } else if (cuisineRating < 3.0 && cuisineReviews > 0) {
          sentimentTrend = 'declining';
        }

        trends.push(new MarketTrend({
          cuisine,
          area: city,
          reviewVolume: cuisineReviews,
          averageRating: cuisineRating,
          sentimentTrend,
          period: 'all-time',
        }));
      }
    }

    return { areas, insights, trends };
  }
}
