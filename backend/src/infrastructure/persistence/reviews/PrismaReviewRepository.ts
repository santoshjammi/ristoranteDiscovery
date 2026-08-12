// Infrastructure: Prisma implementation of Review repository
// Maps between domain entities and Prisma persistence model

import { PrismaClient } from '@prisma/client';
import { Review } from '../../../domain/reviews/Review';
import { ReviewAggregate } from '../../../domain/reviews/ReviewAggregate';

export interface ReviewRepository {
  findByRestaurantId(restaurantId: string): Promise<ReviewAggregate | null>;
  saveAnalysis(restaurantId: string, aggregate: ReviewAggregate): Promise<void>;
}

export class PrismaReviewRepository implements ReviewRepository {
  constructor(private prisma: PrismaClient) {}

  async findByRestaurantId(restaurantId: string): Promise<ReviewAggregate | null> {
    const analyses = await this.prisma.reviewAnalysis.findMany({
      where: { restaurantId },
      orderBy: { createdAt: 'desc' },
      take: 1,
    });

    if (analyses.length === 0) return null;

    const analysis = analyses[0];
    const popularDishes = this.safeParseArray(analysis.popularDishes);
    const complaints = this.safeParseArray(analysis.complaints);
    const ambienceTags = this.safeParseArray(analysis.ambienceTags);

    // Build synthetic reviews from the analysis data
    const reviews: Review[] = [];

    // Create a synthetic review from the analysis
    reviews.push(new Review({
      id: analysis.id,
      restaurantId,
      rating: Math.round((analysis.overallSentiment + 1) * 2.5), // Map -1..1 to 1..5
      text: analysis.sentimentSummary || 'No review text available',
      date: analysis.createdAt,
      source: 'aggregated',
      responseText: null,
      responseDate: null,
    }));

    // Add complaint-based reviews
    for (let i = 0; i < complaints.length; i++) {
      reviews.push(new Review({
        id: `${analysis.id}-complaint-${i}`,
        restaurantId,
        rating: 2,
        text: complaints[i],
        date: analysis.createdAt,
        source: 'aggregated',
        responseText: null,
        responseDate: null,
      }));
    }

    return new ReviewAggregate({
      restaurantId,
      reviews,
      analyzedAt: analysis.createdAt,
    });
  }

  async saveAnalysis(restaurantId: string, aggregate: ReviewAggregate): Promise<void> {
    // Analysis is persisted through the existing ReviewAnalysis model
    // The controller handles this; the repository is for reads
    return;
  }

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
