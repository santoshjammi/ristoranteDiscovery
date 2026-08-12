// Interface adapter: Competitive Intelligence Controller
// Thin — delegates to domain/application logic, formats HTTP responses

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { CompetitiveIntelligenceEngine, type RestaurantProfile } from '../../application/competitive/CompetitiveIntelligenceEngine';
import { PrismaCompetitiveRepository } from '../../infrastructure/persistence/competitive/PrismaCompetitiveRepository';

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

export class CompetitiveController {
  private readonly engine: CompetitiveIntelligenceEngine;
  private readonly repository: PrismaCompetitiveRepository;

  constructor(private readonly prisma: PrismaClient) {
    this.engine = new CompetitiveIntelligenceEngine();
    this.repository = new PrismaCompetitiveRepository(this.prisma);
  }

  analyze = async (req: Request, res: Response): Promise<void> => {
    try {
      const { restaurantId } = req.params;
      const radiusMiles = parseInt(req.query.radius as string) || 5;
      const maxCompetitors = parseInt(req.query.max as string) || 10;

      // Load focal restaurant
      const focal = await this.prisma.restaurant.findUnique({
        where: { id: restaurantId },
      });

      if (!focal) {
        res.status(404).json({ error: 'Restaurant not found' });
        return;
      }

      // Load all other restaurants as candidates
      const allRestaurants = await this.prisma.restaurant.findMany({
        where: { id: { not: restaurantId } },
      });

      const focalProfile: RestaurantProfile = {
        id: focal.id,
        name: focal.name,
        latitude: focal.latitude,
        longitude: focal.longitude,
        city: focal.city,
        cuisineTypes: JSON.parse(focal.cuisineTypes || '[]'),
        priceRange: focal.priceRange,
        deliverySupport: focal.deliverySupport,
        scores: this.extractScores(focal),
      };

      const candidates: RestaurantProfile[] = allRestaurants.map(r => ({
        id: r.id,
        name: r.name,
        latitude: r.latitude,
        longitude: r.longitude,
        city: r.city,
        cuisineTypes: JSON.parse(r.cuisineTypes || '[]'),
        priceRange: r.priceRange,
        deliverySupport: r.deliverySupport,
        scores: this.extractScores(r),
      }));

      // Run engine
      const competitiveSet = this.engine.analyze({
        focalRestaurant: focalProfile,
        candidates,
        radiusMiles,
        maxCompetitors,
        cuisineFamilyMap: {},
      });

      // Persist
      await this.repository.save(competitiveSet);

      // Format response
      res.json({
        data: {
          restaurantId: competitiveSet.restaurantId,
          competitorCount: competitiveSet.competitorCount,
          competitors: competitiveSet.competitors.map(c => ({
            name: c.name,
            distance: c.distance,
            cuisineSimilarity: c.cuisineSimilarity,
            priceTierMatch: c.priceTierMatch,
            serviceModelMatch: c.serviceModelMatch,
            overallScore: c.overallScore,
            scoreGaps: c.scoreGaps,
          })),
          benchmarks: competitiveSet.benchmarks.map(b => ({
            dimension: b.dimension,
            average: b.average,
            median: b.median,
            min: b.min,
            max: b.max,
            focalScore: b.focalScore,
            focalPercentile: b.focalPercentile,
            competitorCount: b.competitorCount,
          })),
          insights: competitiveSet.insights.map(i => ({
            type: i.type,
            dimension: i.dimension,
            description: i.description,
            gapSize: i.gapSize,
            severity: i.severity,
          })),
          generatedAt: competitiveSet.generatedAt,
        },
      });
    } catch (error) {
      console.error('Competitive analysis error:', error);
      res.status(500).json({ error: 'Failed to analyze competitive landscape' });
    }
  };

  getCompetitiveSet = async (req: Request, res: Response): Promise<void> => {
    try {
      const { restaurantId } = req.params;
      const set = await this.repository.findByRestaurantId(restaurantId);

      if (!set) {
        res.status(404).json({ error: 'No competitive set found. Run analysis first.' });
        return;
      }

      res.json({
        data: {
          restaurantId: set.restaurantId,
          competitorCount: set.competitorCount,
          competitors: set.competitors.map(c => ({
            name: c.name,
            distance: c.distance,
            overallScore: c.overallScore,
          })),
          generatedAt: set.generatedAt,
        },
      });
    } catch (error) {
      console.error('Get competitive set error:', error);
      res.status(500).json({ error: 'Failed to retrieve competitive set' });
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
