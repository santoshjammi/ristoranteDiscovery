// Infrastructure: Prisma implementation of the Recommendation repository

import { PrismaClient } from '@prisma/client';
import { Recommendation } from '../../../domain/recommendation/Recommendation';
import { type RecommendationRepository } from '../../../application/recommendation-platform/RecommendationPlatform';

export class PrismaRecommendationRepository implements RecommendationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async saveRecommendation(recommendation: Recommendation): Promise<void> {
    await this.prisma.knowledgeRecommendation.create({
      data: {
        id: recommendation.id,
        restaurantId: recommendation.restaurantId,
        category: recommendation.category,
        title: recommendation.title,
        description: recommendation.description,
        priority: recommendation.priority,
        businessImpact: recommendation.businessImpact,
        implementationEffort: recommendation.implementationEffort,
        factIds: JSON.stringify(recommendation.factIds),
        assertionIds: JSON.stringify(recommendation.assertionIds),
        evidenceIds: JSON.stringify(recommendation.evidenceIds),
        generatedAt: recommendation.generatedAt,
      },
    });
  }

  async findRecommendationsByRestaurant(restaurantId: string): Promise<Recommendation[]> {
    const records = await this.prisma.knowledgeRecommendation.findMany({
      where: { restaurantId },
      orderBy: { priority: 'asc' },
    });

    return records.map(r => new Recommendation({
      id: r.id,
      restaurantId: r.restaurantId,
      category: r.category as any,
      title: r.title,
      description: r.description,
      priority: r.priority as any,
      businessImpact: r.businessImpact,
      implementationEffort: r.implementationEffort,
      factIds: JSON.parse(r.factIds),
      assertionIds: JSON.parse(r.assertionIds),
      evidenceIds: JSON.parse(r.evidenceIds),
      generatedAt: r.generatedAt,
    }));
  }

  async deleteRecommendationsByRestaurant(restaurantId: string): Promise<void> {
    await this.prisma.knowledgeRecommendation.deleteMany({
      where: { restaurantId },
    });
  }
}
