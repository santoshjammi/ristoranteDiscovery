// Interface adapter: Review Intelligence Controller
// Thin — delegates to domain/application logic, formats HTTP responses

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { PrismaReviewRepository } from '../../infrastructure/persistence/reviews/PrismaReviewRepository';
import { ReviewIntelligenceEngine } from '../../application/reviews/ReviewIntelligenceEngine';

export class ReviewController {
  private prisma: PrismaClient;
  private reviewRepo: PrismaReviewRepository;
  private engine: ReviewIntelligenceEngine;

  constructor() {
    this.prisma = new PrismaClient();
    this.reviewRepo = new PrismaReviewRepository(this.prisma);
    this.engine = new ReviewIntelligenceEngine();
  }

  /**
   * POST /api/v1/reviews/restaurants/:id/analyze
   * Analyze reviews for a restaurant: deterministic sentiment, themes, insights
   */
  analyze = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      // Fetch existing review analyses from the database
      const analyses = await this.prisma.reviewAnalysis.findMany({
        where: { restaurantId: id },
        orderBy: { createdAt: 'desc' },
      });

      if (analyses.length === 0) {
        res.status(404).json({ error: { code: 'NO_REVIEWS', message: 'No review data found for this restaurant. Ingest reviews first.' } });
        return;
      }

      // Build review input from stored analyses
      const reviews = analyses.flatMap(a => {
        const complaints = this.safeParseArray(a.complaints);
        const popularDishes = this.safeParseArray(a.popularDishes);
        const items: Array<{ id: string; rating: number; text: string; date: Date; source: string; responseText: string | null; responseDate: Date | null }> = [];

        // Main analysis as a review
        items.push({
          id: a.id,
          rating: Math.round((a.overallSentiment + 1) * 2.5),
          text: a.sentimentSummary || 'No summary',
          date: a.createdAt,
          source: 'aggregated',
          responseText: null,
          responseDate: null,
        });

        // Complaints as individual reviews
        for (let i = 0; i < complaints.length; i++) {
          items.push({
            id: `${a.id}-c-${i}`,
            rating: 2,
            text: complaints[i],
            date: a.createdAt,
            source: 'aggregated',
            responseText: null,
            responseDate: null,
          });
        }

        return items;
      });

      // 1. Analyze reviews (pure domain logic — deterministic)
      const { aggregate, insights, themes } = this.engine.analyze({
        restaurantId: id,
        reviews,
      });

      res.json({
        data: {
          aggregate: {
            totalReviews: aggregate.totalReviews,
            averageRating: aggregate.averageRating,
            ratingDistribution: aggregate.ratingDistribution,
            sentimentBreakdown: aggregate.sentimentBreakdown,
            positivePercentage: aggregate.positivePercentage,
            negativePercentage: aggregate.negativePercentage,
            responseRate: aggregate.responseRate,
            ratingTrend: aggregate.ratingTrend,
            sourceBreakdown: aggregate.sourceBreakdown,
            monthlyTrend: aggregate.monthlyTrend,
            unreviewedCritical: aggregate.unreviewedCritical.length,
          },
          themes: themes.map(t => ({
            name: t.name,
            label: t.label,
            mentionCount: t.mentionCount,
            sentiment: t.sentiment,
            sampleQuotes: t.sampleQuotes,
          })),
          insights: insights.map(i => ({
            type: i.type,
            title: i.title,
            description: i.description,
            severity: i.severity,
            value: i.value,
          })),
        },
      });
    } catch (error: any) {
      console.error('Review analysis failed:', error);
      res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message } });
    }
  };

  private safeParseArray(str: string): string[] {
    if (!str) return [];
    try {
      const parsed = JSON.parse(str);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return str.split(',').map(s => s.trim()).filter(Boolean);
    }
  }
}
