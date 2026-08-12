// ── JustDial Connector ──
import { registerConnector, SyncResult } from '../connector.service';

function generateJustDialData(): Record<string, any> {
  return {
    profile: {
      name: 'The restaurant',
      url: 'https://www.justdial.com/',
      category: 'Restaurants',
      listed: true,
      completeness: 45,
    },
    listings: {
      phoneVerified: true,
      addressVerified: false,
      photosCount: 3,
      hasWebsiteLink: false,
      hasTimings: true,
    },
    reviews: {
      totalCount: 12,
      averageRating: 3.5,
      recentReviews: [
        { rating: 4, text: 'Good food quality.', date: '2026-07-20' },
        { rating: 3, text: 'Average service.', date: '2026-07-10' },
      ],
      responseRate: 0.15,
    },
    scorecardFactors: [
      { factorId: 'business_completeness', score: 40, confidence: 0.7, evidence: ['Incomplete listing on JustDial'] },
      { factorId: 'review_response', score: 15, confidence: 0.6, evidence: ['JustDial response rate: 15%'] },
      { factorId: 'local_search', score: 35, confidence: 0.65, evidence: ['Limited JustDial presence'] },
    ],
  };
}

async function sync(conn: any): Promise<SyncResult> {
  const data = generateJustDialData();
  return { success: true, data, errors: [], syncedAt: new Date().toISOString() };
}

registerConnector('justdial', sync);
