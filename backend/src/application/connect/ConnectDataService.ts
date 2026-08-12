// Application — Connect Data Service
import { PrismaClient } from '@prisma/client';
export class ConnectDataService {
  constructor(private prisma: PrismaClient) {}
  async scanWebsite(restaurantId: string) {
    // MSP: simulate website scan
    const restaurant = await this.prisma.restaurant.findUnique({ where: { id: restaurantId } });
    if (!restaurant) throw new Error('Restaurant not found');
    return {
      status: 'completed',
      findings: {
        hasWebsite: !!restaurant.website,
        hasSchema: false,
        hasMenu: false,
        hasReviews: false,
        hasSocialLinks: false,
        loadTime: 'N/A',
        mobileFriendly: true,
      },
      recommendations: [],
    };
  }
  async connectGBP(restaurantId: string, gbpUrl: string) {
    // MSP: simulate GBP connection
    return {
      status: 'connected',
      gbpUrl,
      data: {
        rating: 4.2,
        reviewCount: 45,
        category: 'Restaurant',
        claimed: true,
        completeness: 65,
      },
    };
  }
  async getConnectedSources(restaurantId: string) {
    const restaurant = await this.prisma.restaurant.findUnique({ where: { id: restaurantId } });
    if (!restaurant) return [];
    const sources = [];
    if (restaurant.website) sources.push({ type: 'website', status: 'connected', url: restaurant.website });
    sources.push({ type: 'gbp', status: 'simulated', url: null });
    return sources;
  }
}
