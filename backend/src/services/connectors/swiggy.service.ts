// ── Swiggy Connector ──
import { registerConnector, SyncResult } from '../connector.service';

function generateSwiggyData(): Record<string, any> {
  return {
    profile: {
      name: 'The restaurant',
      url: 'https://www.swiggy.com/',
      category: 'Restaurant',
      listed: true,
      completeness: 58,
    },
    orders: {
      totalOrders: 127,
      averageRating: 3.9,
      recentRatings: [4, 5, 3, 4, 4],
      popularItems: ['Butter Chicken', 'Garlic Bread', 'Paneer Tikka'],
    },
    deliveryInfo: {
      available: true,
      deliveryTime: '35-40 min',
      deliveryFee: 40,
      minimumOrder: 199,
      isPrime: false,
    },
    scorecardFactors: [
      { factorId: 'delivery_platforms', score: 65, confidence: 0.85, evidence: ['Swiggy delivery active', 'Avg rating: 3.9'] },
      { factorId: 'menu_publishing', score: 50, confidence: 0.75, evidence: ['Limited menu items on Swiggy'] },
      { factorId: 'review_freshness', score: Math.max(0, 100 - 4 * 3), confidence: 0.8, evidence: ['Recent order: 4 days ago'] },
    ],
  };
}

async function sync(conn: any): Promise<SyncResult> {
  const data = generateSwiggyData();
  return { success: true, data, errors: [], syncedAt: new Date().toISOString() };
}

registerConnector('swiggy', sync);
