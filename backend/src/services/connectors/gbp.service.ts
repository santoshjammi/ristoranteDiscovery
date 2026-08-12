// ── Google Business Profile Connector ──
import { registerConnector, SyncResult } from '../connector.service';

function generateGBPData(): Record<string, any> {
  return {
    profile: {
      name: 'The restaurant',
      url: 'https://business.google.com/',
      category: 'Restaurant',
      claimed: true,
      completeness: 78,
    },
    reviews: {
      totalCount: 53,
      averageRating: 4.3,
      distribution: { 5: 32, 4: 11, 3: 6, 2: 3, 1: 1 },
      recentReviews: [
        { rating: 5, text: 'Amazing biryani and great service!', date: '2026-07-28' },
        { rating: 4, text: 'Good food, but wait time was long.', date: '2026-07-25' },
        { rating: 5, text: 'Best Italian in the area. Will come back!', date: '2026-07-20' },
        { rating: 3, text: 'Average experience. Food was ok.', date: '2026-07-15' },
      ],
      responseRate: 0.42,
      lastReviewDate: '2026-07-28',
      daysSinceLastReview: 3,
      sentimentScore: 0.68,
    },
    photos: { totalCount: 15, hasInterior: true, hasExterior: true, hasFood: true, hasMenu: true },
    businessInfo: {
      hoursCompleteness: 90,
      descriptionCompleteness: 72,
      hasWebsite: true,
      hasPhone: true,
      hasDelivery: false,
      hasOnlineOrdering: false,
    },
    scorecardFactors: [
      { factorId: 'review_volume_freshness', score: Math.max(0, 100 - 3 * 3), confidence: 0.85, evidence: ['Last review: 3 days ago'] },
      { factorId: 'review_response', score: 42, confidence: 0.75, evidence: ['Response rate: 42%'] },
      { factorId: 'sentiment', score: Math.round((0.68 + 1) * 50), confidence: 0.85, evidence: ['Sentiment score: 0.68'] },
      { factorId: 'social_presence', score: 20, confidence: 0.6, evidence: ['No social links found'] },
      { factorId: 'delivery_platforms', score: 20, confidence: 0.7, evidence: ['Delivery: No'] },
    ],
  };
}

async function sync(conn: any): Promise<SyncResult> {
  const data = generateGBPData();
  return { success: true, data, errors: [], syncedAt: new Date().toISOString() };
}

registerConnector('gbp', sync);
