// Interface adapter: Market Intelligence Controller
// Thin — delegates to domain/application logic, formats HTTP responses

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { MarketIntelligenceEngine, type RestaurantProfile } from '../../application/market/MarketIntelligenceEngine';

const SCORE_FIELDS = [
  'gbpHealthScore',
  'discoverabilityScore',
  'aiVisibilityScore',
  'localSearchScore',
  'menuDiscoverabilityScore',
  'conversationalSearchScore',
  'dishRetrievalScore',
  'restaurantClarityScore',
  'retrievalValidationScore',
  'competitiveVisibilityScore',
  'optimizationCompleteness',
  'retrievalConfidence',
] as const;

export class MarketController {
  private readonly engine: MarketIntelligenceEngine;

  constructor(private readonly prisma: PrismaClient) {
    this.engine = new MarketIntelligenceEngine();
  }

  analyze = async (_req: Request, res: Response): Promise<void> => {
    try {
      const allRestaurants = await this.prisma.restaurant.findMany({
        include: {
          reviewAnalyses: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
      });

      const profiles: RestaurantProfile[] = allRestaurants.map(r => ({
        id: r.id,
        name: r.name,
        city: r.city,
        latitude: r.latitude,
        longitude: r.longitude,
        cuisineTypes: JSON.parse(r.cuisineTypes || '[]'),
        priceRange: r.priceRange,
        scores: this.extractScores(r),
        reviewCount: r.reviewAnalyses.length,
        averageRating: r.reviewAnalyses.length > 0 ? r.reviewAnalyses[0].overallSentiment : 0,
      }));

      const result = this.engine.analyze({ restaurants: profiles });

      res.json({
        data: {
          areas: result.areas.map(a => ({
            name: a.name,
            restaurantCount: a.restaurantCount,
            cuisineDistribution: a.cuisineDistribution,
            priceDistribution: a.priceDistribution,
            averageScores: a.averageScores,
            totalReviews: a.totalReviews,
            averageRating: a.averageRating,
            topCuisines: a.topCuisines,
            dominantPriceTier: a.dominantPriceTier,
          })),
          insights: result.insights.map(i => ({
            type: i.type,
            area: i.area,
            cuisine: i.cuisine,
            description: i.description,
            metric: i.metric,
            severity: i.severity,
          })),
          trends: result.trends.map(t => ({
            cuisine: t.cuisine,
            area: t.area,
            reviewVolume: t.reviewVolume,
            averageRating: t.averageRating,
            sentimentTrend: t.sentimentTrend,
            period: t.period,
          })),
        },
      });
    } catch (error) {
      console.error('Market analysis error:', error);
      res.status(500).json({ error: 'Failed to analyze market' });
    }
  };

  private extractScores(r: any): Record<string, number> {
    const scores: Record<string, number> = {};
    for (const field of SCORE_FIELDS) {
      scores[field] = (r as any)[field] ?? 0;
    }
    return scores;
  }
}
