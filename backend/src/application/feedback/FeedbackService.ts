// Application — Feedback Service
import { PrismaClient } from '@prisma/client';
export class FeedbackService {
  constructor(private prisma: PrismaClient) {}
  async submit(data: { decisionId?: string; restaurantId: string; type: string; rating?: number; comment?: string }) {
    return this.prisma.feedback.create({ data });
  }
  async getByRestaurant(restaurantId: string) { return this.prisma.feedback.findMany({ where: { restaurantId }, orderBy: { createdAt: 'desc' }, take: 50 }); }
  async getStats() {
    const [helpful, notHelpful, avgRating] = await Promise.all([
      this.prisma.feedback.count({ where: { type: 'helpful' } }),
      this.prisma.feedback.count({ where: { type: 'not_helpful' } }),
      this.prisma.feedback.aggregate({ _avg: { rating: true } }),
    ]);
    return { helpful, notHelpful, helpfulRate: (helpful + notHelpful) > 0 ? Math.round((helpful / (helpful + notHelpful)) * 100) : 0, avgRating: avgRating._avg.rating || 0 };
  }
}
