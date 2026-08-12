// ── TripAdvisor Connector ──
import { registerConnector, SyncResult } from '../connector.service';

function generateTripAdvisorData(): Record<string, any> {
  return {
    profile: {
      name: 'The restaurant',
      url: 'https://www.tripadvisor.com/',
      category: 'Restaurant',
      listed: true,
      completeness: 55,
    },
    reviews: {
      totalCount: 29,
      averageRating: 4.0,
      distribution: { 5: 14, 4: 8, 3: 4, 2: 2, 1: 1 },
      recentReviews: [
        { rating: 5, text: 'Wonderful dining experience with authentic flavors!', date: '2026-07-24' },
        { rating: 3, text: 'Decent food but noisy environment.', date: '2026-07-18' },
      ],
      responseRate: 0.25,
      lastReviewDate: '2026-07-24',
      daysSinceLastReview: 7,
      sentimentScore: 0.60,
    },
    travelogenious: false,
    travelerType: { couples: 35, families: 28, solo: 22, business: 15 },
    scorecardFactors: [
      { factorId: 'review_freshness', score: Math.max(0, 100 - 7 * 3), confidence: 0.8, evidence: ['Last TripAdvisor review: 7 days ago'] },
      { factorId: 'sentiment', score: Math.round((0.60 + 1) * 50), confidence: 0.85, evidence: ['TripAdvisor sentiment: 0.60'] },
      { factorId: 'review_response', score: 25, confidence: 0.7, evidence: ['TripAdvisor response rate: 25%'] },
      { factorId: 'social_presence', score: 30, confidence: 0.65, evidence: ['TripAdvisor listing active, no Travel + Genious badge'] },
    ],
  };
}

async function sync(conn: any): Promise<SyncResult> {
  const data = generateTripAdvisorData();
  return { success: true, data, errors: [], syncedAt: new Date().toISOString() };
}

registerConnector('tripadvisor', sync);
