// Infrastructure: Prisma implementation of Competitive Intelligence repository
// Maps between domain entities and Prisma persistence model

import { PrismaClient } from '@prisma/client';
import { Competitor } from '../../../domain/competitive/Competitor';
import { Benchmark } from '../../../domain/competitive/Benchmark';
import { CompetitiveInsight } from '../../../domain/competitive/CompetitiveInsight';
import { CompetitiveSet } from '../../../domain/competitive/CompetitiveSet';

export class PrismaCompetitiveRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(set: CompetitiveSet): Promise<void> {
    // Delete existing competitors for this restaurant
    const existing = await this.prisma.competitiveSet.findUnique({
      where: { restaurantId: set.restaurantId },
    });

    if (existing) {
      await this.prisma.competitor.deleteMany({
        where: { competitiveSetId: existing.id },
      });
      await this.prisma.competitiveSet.delete({
        where: { id: existing.id },
      });
    }

    // Create fresh
    await this.prisma.competitiveSet.create({
      data: {
        id: set.id,
        restaurantId: set.restaurantId,
        status: set.status,
        generatedAt: set.generatedAt ?? new Date(),
        competitors: {
          create: set.competitors.map(c => ({
            competitorId: c.restaurantId,
            name: c.name,
            distance: c.distance,
            cuisineSimilarity: c.cuisineSimilarity,
            priceTierMatch: c.priceTierMatch,
            serviceModelMatch: c.serviceModelMatch,
            overallScore: c.overallScore,
            scoreGaps: JSON.stringify(c.scoreGaps),
          })),
        },
      },
    });
  }

  async findByRestaurantId(restaurantId: string): Promise<CompetitiveSet | null> {
    const record = await this.prisma.competitiveSet.findUnique({
      where: { restaurantId },
      include: { competitors: true },
    });

    if (!record) return null;

    const competitors = record.competitors.map(c => new Competitor({
      restaurantId: c.competitorId,
      name: c.name,
      distance: c.distance,
      cuisineSimilarity: c.cuisineSimilarity,
      priceTierMatch: c.priceTierMatch,
      serviceModelMatch: c.serviceModelMatch,
      overallScore: c.overallScore,
      scoreGaps: JSON.parse(c.scoreGaps),
    }));

    return new CompetitiveSet({
      id: record.id,
      restaurantId: record.restaurantId,
      competitors,
      benchmarks: [],
      insights: [],
      generatedAt: record.generatedAt,
      status: record.status as any,
    });
  }
}
