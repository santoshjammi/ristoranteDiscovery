import { reviewInterpretationCapability } from '../infrastructure/ai/capabilities/ReviewInterpretationCapability';

export interface IngestedReview {
  rating: number;
  text: string;
  date?: string;
}

export interface ReviewAnalysisResult {
  overallSentiment: number; // between -1.0 and 1.0
  sentimentSummary: string;
  popularDishes: Array<{
    dishName: string;
    sentiment: "Positive" | "Negative" | "Neutral";
    mentions: number;
  }>;
  ambienceTags: string[];
  serviceInsights: string;
  topicClusters: Array<{
    topic: string;
    summary: string;
  }>;
  complaints: string[];
  audienceProfile: {
    families: string; // percentage or descriptive
    couples: string;
    business: string;
    solo: string;
  };
}

export class ReviewService {
  /**
   * Run AI interpretation on a batch of reviews via the ReviewInterpretationCapability.
   * Degrades gracefully to a deterministic envelope if all providers fail.
   */
  async analyzeReviews(reviews: IngestedReview[]): Promise<ReviewAnalysisResult> {
    if (reviews.length === 0) {
      throw new Error('No reviews provided for analysis');
    }

    const result = await reviewInterpretationCapability.analyze({ reviews });

    if (!result.ok) {
      console.warn(
        `⚠️ [Review] capability failed (${result.failure.kind}: ${result.failure.message}); returning deterministic fallback.`,
      );
      return {
        overallSentiment: 0,
        sentimentSummary: 'Review analysis unavailable.',
        popularDishes: [],
        ambienceTags: [],
        serviceInsights: '',
        topicClusters: [],
        complaints: [],
        audienceProfile: { families: '', couples: '', business: '', solo: '' },
      };
    }

    return {
      overallSentiment: result.data.overallSentiment,
      sentimentSummary: result.data.sentimentSummary,
      popularDishes: result.data.popularDishes ?? [],
      ambienceTags: result.data.ambienceTags ?? [],
      serviceInsights: result.data.serviceInsights ?? '',
      topicClusters: result.data.topicClusters ?? [],
      complaints: result.data.complaints ?? [],
      audienceProfile: {
        families: result.data.audienceProfile?.families ?? '',
        couples: result.data.audienceProfile?.couples ?? '',
        business: result.data.audienceProfile?.business ?? '',
        solo: result.data.audienceProfile?.solo ?? '',
      },
    };
  }
}

export const reviewService = new ReviewService();
