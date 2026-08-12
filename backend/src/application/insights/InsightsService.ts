// Application — Insights Service
import { PrismaClient } from '@prisma/client';
export class InsightsService {
  constructor(private prisma: PrismaClient) {}
  async getTemplates(category?: string) {
    const where: any = { isActive: true };
    if (category) where.category = category;
    return this.prisma.insightTemplate.findMany({ where, orderBy: { priority: 'asc' } });
  }
  async createTemplate(data: { category: string; title: string; description: string; priority: number; businessImpact: string; effort: string }) {
    return this.prisma.insightTemplate.create({ data });
  }
  async getInsightsForRestaurant(restaurantId: string) {
    // Compose insights from all intelligence engines
    const [menu, reviews, competitive, seo, market] = await Promise.all([
      this.prisma.menuItem.findMany({ where: { restaurantId } }).catch(() => []),
      this.prisma.reviewAnalysis.findMany({ where: { restaurantId } }).catch(() => []),
      this.prisma.competitiveSet.findUnique({ where: { restaurantId }, include: { competitors: true } }).catch(() => null),
      this.prisma.sEOMarkup.findMany({ where: { restaurantId } }).catch(() => []),
      this.prisma.restaurant.findUnique({ where: { id: restaurantId } }).catch(() => null),
    ]);
    return { menuItemCount: menu.length, reviewCount: reviews.length, competitorCount: competitive?.competitors?.length || 0, seoSchemaCount: seo.length };
  }
}
