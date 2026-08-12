// Application service: Recommendation Platform
// Merges, deduplicates, prioritizes, and consolidates recommendations
// Deterministic — same inputs → same output
// No AI dependency

import { Recommendation, type RecommendationPriority, type RecommendationCategory } from '../../domain/recommendation/Recommendation';

// --- Input: a raw recommendation from an intelligence engine ---

export interface RawRecommendation {
  category: RecommendationCategory;
  title: string;
  description: string;
  priority: RecommendationPriority;
  businessImpact: string;
  implementationEffort: string;
  factIds: string[];
  assertionIds: string[];
  evidenceIds: string[];
}

// --- Repository interface ---

export interface RecommendationRepository {
  saveRecommendation(recommendation: Recommendation): Promise<void>;
  findRecommendationsByRestaurant(restaurantId: string): Promise<Recommendation[]>;
  deleteRecommendationsByRestaurant(restaurantId: string): Promise<void>;
}

// --- Deduplication ---

function normalizeTitle(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
}

function isDuplicate(a: RawRecommendation, b: RawRecommendation): boolean {
  return normalizeTitle(a.title) === normalizeTitle(b.title);
}

// --- Priority normalization ---

const PRIORITY_WEIGHTS: Record<RecommendationCategory, number> = {
  'discovery': 1.0,
  'review': 0.95,
  'menu': 0.90,
  'competitive': 0.85,
  'seo': 0.80,
  'market': 0.75,
};

function normalizePriority(raw: RawRecommendation): RecommendationPriority {
  const categoryWeight = PRIORITY_WEIGHTS[raw.category] || 0.8;
  const adjusted = Math.round(raw.priority * categoryWeight);
  return Math.max(1, Math.min(5, adjusted)) as RecommendationPriority;
}

// --- Main service ---

export class RecommendationPlatform {
  constructor(private readonly repository: RecommendationRepository) {}

  /**
   * Process raw recommendations from all intelligence engines.
   * Merges, deduplicates, normalizes priority, and persists.
   */
  async process(restaurantId: string, rawRecommendations: RawRecommendation[]): Promise<Recommendation[]> {
    // Step 1: Deduplicate
    const unique: RawRecommendation[] = [];
    for (const raw of rawRecommendations) {
      const dup = unique.find(u => isDuplicate(u, raw));
      if (!dup) {
        unique.push(raw);
      }
    }

    // Step 2: Normalize priority
    const normalized = unique.map(raw => ({
      ...raw,
      priority: normalizePriority(raw),
    }));

    // Step 3: Sort by priority (1 = highest)
    normalized.sort((a, b) => a.priority - b.priority);

    // Step 4: Create domain objects
    const recommendations = normalized.map(raw => new Recommendation({
      id: `rec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      restaurantId,
      category: raw.category,
      title: raw.title,
      description: raw.description,
      priority: raw.priority,
      businessImpact: raw.businessImpact,
      implementationEffort: raw.implementationEffort,
      factIds: raw.factIds,
      assertionIds: raw.assertionIds,
      evidenceIds: raw.evidenceIds,
      generatedAt: new Date(),
    }));

    // Step 5: Replace all recommendations for this restaurant
    await this.repository.deleteRecommendationsByRestaurant(restaurantId);
    for (const rec of recommendations) {
      await this.repository.saveRecommendation(rec);
    }

    return recommendations;
  }

  /**
   * Get all recommendations for a restaurant, sorted by priority.
   */
  async getRecommendations(restaurantId: string): Promise<Recommendation[]> {
    const recommendations = await this.repository.findRecommendationsByRestaurant(restaurantId);
    return recommendations.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Get the top N recommendations for a restaurant.
   */
  async getTopRecommendations(restaurantId: string, limit: number = 5): Promise<Recommendation[]> {
    const all = await this.getRecommendations(restaurantId);
    return all.slice(0, limit);
  }
}
