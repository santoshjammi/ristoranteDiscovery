// Infrastructure: Prisma implementation of DigitalTwinRepository
// Maps between domain entities and Prisma persistence model

import { PrismaClient } from '@prisma/client';
import { DigitalTwin } from '../../domain/discovery/DigitalTwin';
import { Scorecard } from '../../domain/discovery/Scorecard';
import { ScoreDimension } from '../../domain/discovery/ScoreDimension';
import { Evidence, type EvidenceSource, type ConfidenceLevel } from '../../domain/discovery/Evidence';
import { Recommendation, type RecommendationPriority, type RecommendationStatus } from '../../domain/discovery/Recommendation';
import { DigitalTwinRepository, ScorecardRepository, EvidenceRepository, RecommendationRepository } from '../../application/discovery/repositories';

export class PrismaDigitalTwinRepository implements DigitalTwinRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<DigitalTwin | null> {
    // DigitalTwin is a view aggregate — reconstructed from Restaurant + Scorecard + Evidence
    const restaurant = await this.prisma.restaurant.findUnique({ where: { id } });
    if (!restaurant) return null;
    return this.buildTwin(restaurant);
  }

  async findByRestaurantId(restaurantId: string): Promise<DigitalTwin | null> {
    const restaurant = await this.prisma.restaurant.findUnique({ where: { id: restaurantId } });
    if (!restaurant) return null;
    return this.buildTwin(restaurant);
  }

  async save(twin: DigitalTwin): Promise<void> {
    // DigitalTwin is a read model — persistence happens through individual repositories
    // This is a no-op; the ScorecardRepository and EvidenceRepository handle persistence
    return;
  }

  private async buildTwin(restaurant: any): Promise<DigitalTwin> {
    const scorecard = await this.buildScorecard(restaurant.id);
    const evidence = await this.buildEvidence(restaurant.id);

    return new DigitalTwin({
      id: restaurant.id,
      restaurantId: restaurant.id,
      scorecard,
      evidence,
      status: scorecard ? 'active' : 'initialized',
      createdAt: restaurant.createdAt,
      updatedAt: restaurant.updatedAt,
    });
  }

  private async buildScorecard(restaurantId: string): Promise<Scorecard | null> {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });
    if (!restaurant) return null;

    const dimensions: ScoreDimension[] = [
      new ScoreDimension({ name: 'DishRecognition', rawScore: 0, finalScore: restaurant.discoverabilityScore || 0, weight: 18, evidenceIds: [], isInformational: false }),
      new ScoreDimension({ name: 'AIDiscoverability', rawScore: 0, finalScore: restaurant.aiVisibilityScore || 0, weight: 18, evidenceIds: [], isInformational: false }),
      new ScoreDimension({ name: 'RestaurantClarity', rawScore: 0, finalScore: restaurant.restaurantClarityScore || 0, weight: 14, evidenceIds: [], isInformational: false }),
      new ScoreDimension({ name: 'AISearchVisibility', rawScore: 0, finalScore: restaurant.conversationalSearchScore || 0, weight: 18, evidenceIds: [], isInformational: false }),
      new ScoreDimension({ name: 'DishUnderstanding', rawScore: 0, finalScore: restaurant.dishRetrievalScore || 0, weight: 14, evidenceIds: [], isInformational: false }),
      new ScoreDimension({ name: 'LocalIntentAlignment', rawScore: 0, finalScore: restaurant.localSearchScore || 0, weight: 10, evidenceIds: [], isInformational: false }),
      new ScoreDimension({ name: 'RetrievalReadiness', rawScore: 0, finalScore: restaurant.retrievalValidationScore || 0, weight: 5, evidenceIds: [], isInformational: false }),
      new ScoreDimension({ name: 'CompetitiveVisibility', rawScore: 0, finalScore: restaurant.competitiveVisibilityScore || 0, weight: 3, evidenceIds: [], isInformational: false }),
      new ScoreDimension({ name: 'OptimizationCompleteness', rawScore: 0, finalScore: restaurant.optimizationCompleteness || 0, weight: 0, evidenceIds: [], isInformational: true }),
      new ScoreDimension({ name: 'RetrievalConfidence', rawScore: 0, finalScore: restaurant.retrievalConfidence || 0, weight: 0, evidenceIds: [], isInformational: true }),
      new ScoreDimension({ name: 'GBPHealthScore', rawScore: 0, finalScore: restaurant.gbpHealthScore || 0, weight: 0, evidenceIds: [], isInformational: true }),
    ];

    return new Scorecard({
      id: restaurantId,
      restaurantId,
      dimensions,
      calculatedAt: restaurant.updatedAt,
      status: 'published',
      previousOverallScore: null,
    });
  }

  private async buildEvidence(restaurantId: string): Promise<Evidence[]> {
    const evidence: Evidence[] = [];
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: { menuItems: true, reviewAnalyses: { take: 1, orderBy: { createdAt: 'desc' } }, faqs: true },
    });
    if (!restaurant) return evidence;

    // Menu item evidence
    for (const item of restaurant.menuItems || []) {
      evidence.push(new Evidence({
        id: `ev-mit-${item.id}`,
        recommendationId: null,
        description: `Menu item: ${item.name} ($${item.price})`,
        source: { entityType: 'MenuItem', entityId: item.id, field: 'name', value: item.name },
        confidence: 'high',
        supportingResearch: null,
      }));
    }

    // Review evidence
    const review = restaurant.reviewAnalyses?.[0];
    if (review) {
      evidence.push(new Evidence({
        id: `ev-rev-${review.id}`,
        recommendationId: null,
        description: `Review analysis: sentiment ${review.overallSentiment}`,
        source: { entityType: 'ReviewAnalysis', entityId: review.id, field: 'overallSentiment', value: String(review.overallSentiment) },
        confidence: 'high',
        supportingResearch: null,
      }));
    }

    return evidence;
  }
}

export class PrismaScorecardRepository implements ScorecardRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<Scorecard | null> {
    const restaurant = await this.prisma.restaurant.findUnique({ where: { id } });
    if (!restaurant) return null;
    return this.buildScorecard(restaurant);
  }

  async findByRestaurantId(restaurantId: string): Promise<Scorecard | null> {
    return this.findById(restaurantId);
  }

  async save(scorecard: Scorecard): Promise<void> {
    // Scorecard columns are on the Restaurant table
    // The controller handles saving after use case execution
    return;
  }

  private buildScorecard(restaurant: any): Scorecard {
    const dimensions: ScoreDimension[] = [
      new ScoreDimension({ name: 'DishRecognition', rawScore: 0, finalScore: restaurant.discoverabilityScore || 0, weight: 18, evidenceIds: [], isInformational: false }),
      new ScoreDimension({ name: 'AIDiscoverability', rawScore: 0, finalScore: restaurant.aiVisibilityScore || 0, weight: 18, evidenceIds: [], isInformational: false }),
      new ScoreDimension({ name: 'RestaurantClarity', rawScore: 0, finalScore: restaurant.restaurantClarityScore || 0, weight: 14, evidenceIds: [], isInformational: false }),
      new ScoreDimension({ name: 'AISearchVisibility', rawScore: 0, finalScore: restaurant.conversationalSearchScore || 0, weight: 18, evidenceIds: [], isInformational: false }),
      new ScoreDimension({ name: 'DishUnderstanding', rawScore: 0, finalScore: restaurant.dishRetrievalScore || 0, weight: 14, evidenceIds: [], isInformational: false }),
      new ScoreDimension({ name: 'LocalIntentAlignment', rawScore: 0, finalScore: restaurant.localSearchScore || 0, weight: 10, evidenceIds: [], isInformational: false }),
      new ScoreDimension({ name: 'RetrievalReadiness', rawScore: 0, finalScore: restaurant.retrievalValidationScore || 0, weight: 5, evidenceIds: [], isInformational: false }),
      new ScoreDimension({ name: 'CompetitiveVisibility', rawScore: 0, finalScore: restaurant.competitiveVisibilityScore || 0, weight: 3, evidenceIds: [], isInformational: false }),
      new ScoreDimension({ name: 'OptimizationCompleteness', rawScore: 0, finalScore: restaurant.optimizationCompleteness || 0, weight: 0, evidenceIds: [], isInformational: true }),
      new ScoreDimension({ name: 'RetrievalConfidence', rawScore: 0, finalScore: restaurant.retrievalConfidence || 0, weight: 0, evidenceIds: [], isInformational: true }),
      new ScoreDimension({ name: 'GBPHealthScore', rawScore: 0, finalScore: restaurant.gbpHealthScore || 0, weight: 0, evidenceIds: [], isInformational: true }),
    ];

    return new Scorecard({
      id: restaurant.id,
      restaurantId: restaurant.id,
      dimensions,
      calculatedAt: restaurant.updatedAt,
      status: 'published',
      previousOverallScore: null,
    });
  }
}

export class PrismaEvidenceRepository implements EvidenceRepository {
  constructor(private prisma: PrismaClient) {}

  async findByIds(ids: string[]): Promise<Evidence[]> {
    // Evidence is reconstructed from multiple tables
    // For RVS-001, return empty — evidence is built by the EvidenceEngine
    return [];
  }

  async findByRestaurantId(restaurantId: string): Promise<Evidence[]> {
    const repo = new PrismaDigitalTwinRepository(this.prisma);
    const twin = await repo.findByRestaurantId(restaurantId);
    return twin ? [...twin.evidence] : [];
  }

  async save(evidence: Evidence[]): Promise<void> {
    // Evidence is derived, not persisted directly
    return;
  }
}

export class PrismaRecommendationRepository implements RecommendationRepository {
  constructor(private prisma: PrismaClient) {}

  async findByRestaurantId(restaurantId: string): Promise<Recommendation[]> {
    // Recommendations are computed by the RecommendationEngine
    return [];
  }

  async save(recommendations: Recommendation[]): Promise<void> {
    // Recommendations are derived, not persisted directly
    return;
  }
}
