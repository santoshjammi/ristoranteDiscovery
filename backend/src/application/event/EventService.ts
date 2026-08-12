// Application — Event Service (Product Analytics)
import { PrismaClient } from '@prisma/client';
export class EventService {
  constructor(private prisma: PrismaClient) {}
  async track(eventType: string, data: { organizationId?: string; restaurantId?: string; userId?: string; properties?: Record<string, unknown> }) {
    return this.prisma.productEvent.create({
      data: { eventType, organizationId: data.organizationId, restaurantId: data.restaurantId, userId: data.userId, properties: JSON.stringify(data.properties || {}) },
    });
  }
  async getByType(eventType: string, since?: Date) {
    const where: any = { eventType };
    if (since) where.createdAt = { gte: since };
    return this.prisma.productEvent.findMany({ where, orderBy: { createdAt: 'desc' }, take: 100 });
  }
  async getFunnel(stages: string[], since?: Date) {
    const results: Record<string, number> = {};
    for (const stage of stages) {
      const where: any = { eventType: stage };
      if (since) where.createdAt = { gte: since };
      results[stage] = await this.prisma.productEvent.count({ where });
    }
    return results;
  }
  async getStats(since?: Date) {
    const where: any = {};
    if (since) where.createdAt = { gte: since };
    const [total, uniqueUsers, uniqueRestaurants] = await Promise.all([
      this.prisma.productEvent.count({ where }),
      this.prisma.productEvent.groupBy({ by: ['userId'], where, _count: true }),
      this.prisma.productEvent.groupBy({ by: ['restaurantId'], where, _count: true }),
    ]);
    return { total, uniqueUsers: uniqueUsers.length, uniqueRestaurants: uniqueRestaurants.length };
  }
}
