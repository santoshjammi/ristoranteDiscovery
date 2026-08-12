// Interface adapter: Discovery Controller
// Thin — delegates to use cases, formats HTTP responses

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { PrismaDigitalTwinRepository, PrismaScorecardRepository, PrismaEvidenceRepository, PrismaRecommendationRepository } from '../../infrastructure/persistence/PrismaDiscoveryRepositories';
import { CalculateScoreUseCase } from '../../application/discovery/CalculateScoreUseCase';
import { EvidenceEngine } from '../../application/discovery/EvidenceEngine';
import { RecommendationEngine } from '../../application/discovery/RecommendationEngine';
import { GenerateReportUseCase } from '../../application/discovery/GenerateReportUseCase';

export class DiscoveryController {
  private calculateScore: CalculateScoreUseCase;
  private evidenceEngine: EvidenceEngine;
  private recommendationEngine: RecommendationEngine;
  private reportGenerator: GenerateReportUseCase;
  private twinRepo: PrismaDigitalTwinRepository;
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
    this.twinRepo = new PrismaDigitalTwinRepository(this.prisma);
    const scorecardRepo = new PrismaScorecardRepository(this.prisma);
    const evidenceRepo = new PrismaEvidenceRepository(this.prisma);
    this.calculateScore = new CalculateScoreUseCase(this.twinRepo, scorecardRepo, evidenceRepo);
    this.evidenceEngine = new EvidenceEngine();
    this.recommendationEngine = new RecommendationEngine();
    this.reportGenerator = new GenerateReportUseCase();
  }

  /**
   * POST /api/v1/discovery/restaurants/:id/analyze
   * Analyze a restaurant: build evidence, calculate scores, generate recommendations
   */
  analyze = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const restaurant = await this.prisma.restaurant.findUnique({
        where: { id },
        include: {
          menuItems: true,
          reviewAnalyses: { orderBy: { createdAt: 'desc' }, take: 1 },
          faqs: true,
        },
      });

      if (!restaurant) {
        res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Restaurant not found' } });
        return;
      }

      // 1. Generate evidence
      const evidence = this.evidenceEngine.generate({
        menuItems: restaurant.menuItems.map(i => ({
          id: i.id, name: i.name, price: i.price,
          description: i.description, ingredients: i.ingredients, dietaryType: i.dietaryType,
        })),
        reviewAnalysis: restaurant.reviewAnalyses[0] ? {
          overallSentiment: restaurant.reviewAnalyses[0].overallSentiment,
          sentimentSummary: restaurant.reviewAnalyses[0].sentimentSummary,
          popularDishes: restaurant.reviewAnalyses[0].popularDishes,
          complaints: restaurant.reviewAnalyses[0].complaints,
        } : null,
        faqs: restaurant.faqs.map(f => ({ id: f.id, question: f.question, answer: f.answer, category: f.category })),
        restaurantName: restaurant.name,
        city: restaurant.city,
        cuisineTypes: this.safeParseJSON(restaurant.cuisineTypes),
        regionalCuisine: restaurant.regionalCuisine,
        nearbyLandmarks: this.safeParseJSON(restaurant.nearbyLandmarks),
      });

      // 2. Calculate scores (deterministic — no AI)
      const rawScores = [
        { name: 'DishRecognition', rawScore: this.computeDishRecognition(restaurant), weight: 18, evidenceIds: evidence.filter(e => e.source.entityType === 'MenuItem').map(e => e.id), isInformational: false },
        { name: 'AIDiscoverability', rawScore: this.computeAIDiscoverability(restaurant), weight: 18, evidenceIds: evidence.filter(e => e.source.entityType === 'FAQ').map(e => e.id), isInformational: false },
        { name: 'RestaurantClarity', rawScore: this.computeRestaurantClarity(restaurant), weight: 14, evidenceIds: [], isInformational: false },
        { name: 'AISearchVisibility', rawScore: 50, weight: 18, evidenceIds: [], isInformational: false },
        { name: 'DishUnderstanding', rawScore: this.computeDishUnderstanding(restaurant), weight: 14, evidenceIds: evidence.filter(e => e.source.field === 'description').map(e => e.id), isInformational: false },
        { name: 'LocalIntentAlignment', rawScore: this.computeLocalIntent(restaurant), weight: 10, evidenceIds: evidence.filter(e => e.source.field === 'nearbyLandmarks').map(e => e.id), isInformational: false },
        { name: 'RetrievalReadiness', rawScore: 40, weight: 5, evidenceIds: [], isInformational: false },
        { name: 'CompetitiveVisibility', rawScore: 30, weight: 3, evidenceIds: [], isInformational: false },
        { name: 'OptimizationCompleteness', rawScore: 50, weight: 0, evidenceIds: [], isInformational: true },
        { name: 'RetrievalConfidence', rawScore: 40, weight: 0, evidenceIds: [], isInformational: true },
        { name: 'GBPHealthScore', rawScore: restaurant.gbpHealthScore, weight: 0, evidenceIds: [], isInformational: true },
      ];

      const { twin, scorecard, events } = await this.calculateScore.execute({
        restaurantId: id,
        rawScores,
      });

      // 3. Generate recommendations
      const recommendations = this.recommendationEngine.generate(evidence, id);

      // 4. Generate report
      const report = this.reportGenerator.execute(twin, recommendations, restaurant.name);

      res.json({
        data: {
          twin: this.serializeTwin(twin),
          scorecard: { overallScore: scorecard.overallScore, dimensions: scorecard.dimensions.map(d => ({ name: d.name, score: d.finalScore, weight: d.weight })) },
          evidence: evidence.map(e => ({ id: e.id, description: e.description, confidence: e.confidence, source: e.source })),
          recommendations: recommendations.map(r => ({
            id: r.id, title: r.title, description: r.description, priority: r.priority,
            businessImpact: r.businessImpact, implementationEffort: r.implementationEffort,
            confidence: r.confidence, evidenceIds: [...r.evidenceIds], priorityScore: r.priorityScore,
          })),
          report,
          events: events.map(e => ({ name: e.eventName, version: e.eventVersion })),
        },
      });
    } catch (error: any) {
      console.error('Discovery analysis failed:', error);
      res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message } });
    }
  };

  /**
   * GET /api/v1/discovery/restaurants/:id/twin
   * Get the current Digital Twin state
   */
  getTwin = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const twin = await this.twinRepo.findByRestaurantId(id);

      if (!twin) {
        res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Digital Twin not found. Run analysis first.' } });
        return;
      }

      res.json({ data: this.serializeTwin(twin) });
    } catch (error: any) {
      res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message } });
    }
  };

  private serializeTwin(twin: any): any {
    return {
      id: twin.id,
      restaurantId: twin.restaurantId,
      status: twin.status,
      hasScorecard: twin.hasScorecard,
      evidenceCount: twin.evidenceCount,
      scorecard: twin.scorecard ? {
        overallScore: twin.scorecard.overallScore,
        trend: twin.scorecard.trend,
        dimensions: twin.scorecard.dimensions.map((d: any) => ({
          name: d.name, score: d.finalScore, weight: d.weight, isInformational: d.isInformational,
        })),
      } : null,
    };
  }

  // Scoring helpers (deterministic — no AI)
  private computeDishRecognition(restaurant: any): number {
    const items = restaurant.menuItems || [];
    if (items.length === 0) return 0;
    const canonicalKeywords = ['biryani', 'dosa', 'curry', 'samosa', 'korma', 'paneer', 'naan', 'tikka', 'chana', 'gobi'];
    const matches = items.filter((i: any) => canonicalKeywords.some(k => i.name.toLowerCase().includes(k)));
    return Math.round((matches.length / items.length) * 100);
  }

  private computeAIDiscoverability(restaurant: any): number {
    const faqs = restaurant.faqs || [];
    if (faqs.length === 0) return 20;
    return Math.min(100, 20 + faqs.length * 10);
  }

  private computeRestaurantClarity(restaurant: any): number {
    let score = 0;
    if (restaurant.cuisineTypes && restaurant.cuisineTypes !== '[]') score += 25;
    if (restaurant.regionalCuisine) score += 25;
    if (restaurant.priceRange) score += 15;
    if (restaurant.amenities && restaurant.amenities !== '[]') score += 20;
    if (restaurant.timings && restaurant.timings !== '{}') score += 15;
    return score;
  }

  private computeDishUnderstanding(restaurant: any): number {
    const items = restaurant.menuItems || [];
    if (items.length === 0) return 0;
    const withDesc = items.filter((i: any) => i.description && i.description.length > 15);
    return Math.round((withDesc.length / items.length) * 100);
  }

  private computeLocalIntent(restaurant: any): number {
    let score = 20;
    if (restaurant.latitude && restaurant.longitude) score += 30;
    const landmarks = this.safeParseJSON(restaurant.nearbyLandmarks);
    if (landmarks.length > 0) score += Math.min(50, landmarks.length * 15);
    return score;
  }

  private safeParseJSON(str: string | null): string[] {
    if (!str) return [];
    try { const p = JSON.parse(str); return Array.isArray(p) ? p : []; }
    catch { return str.split(',').map(s => s.trim()).filter(Boolean); }
  }
}
