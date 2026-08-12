// ── Zomato Connector ──
import { registerConnector, SyncResult } from '../connector.service';

function generateZomatoData(): Record<string, any> {
  return {
    profile: {
      name: 'The restaurant',
      url: 'https://www.zomato.com/',
      category: 'Fine Dining',
      rated: true,
      completeness: 65,
    },
    reviews: {
      totalCount: 38,
      averageRating: 4.1,
      distribution: { 5: 20, 4: 9, 3: 5, 2: 3, 1: 1 },
      recentReviews: [
        { rating: 5, text: 'Fantastic ambience and delicious pasta!', date: '2026-07-26' },
        { rating: 4, text: 'Good food but a bit pricey.', date: '2026-07-22' },
      ],
      responseRate: 0.30,
      lastReviewDate: '2026-07-26',
      daysSinceLastReview: 5,
      sentimentScore: 0.65,
    },
    menuPublished: true,
    onlineOrdering: false,
    tableReservation: true,
    scorecardFactors: [
      { factorId: 'review_volume_freshness', score: Math.max(0, 100 - 5 * 3), confidence: 0.8, evidence: ['Last review: 5 days ago on Zomato'] },
      { factorId: 'review_response', score: 30, confidence: 0.75, evidence: ['Zomato response rate: 30%'] },
      { factorId: 'sentiment', score: Math.round((0.65 + 1) * 50), confidence: 0.85, evidence: ['Zomato sentiment: 0.65'] },
      { factorId: 'menu_availability_quality', score: 70, confidence: 0.8, evidence: ['Menu published on Zomato'] },
      { factorId: 'delivery_platforms', score: 30, confidence: 0.7, evidence: ['Online ordering: No'] },
    ],
  };
}

async function sync(conn: any): Promise<SyncResult> {
  const data = generateZomatoData();
  return { success: true, data, errors: [], syncedAt: new Date().toISOString() };
}

registerConnector('zomato', sync);
