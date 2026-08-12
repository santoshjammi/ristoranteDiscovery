// Application — Analysis Service
import { PrismaClient } from '@prisma/client';
export class AnalysisService {
  constructor(private prisma: PrismaClient) {}
  async start(restaurantId: string) {
    return this.prisma.analysis.create({ data: { restaurantId, status: 'running', startedAt: new Date() } });
  }
  async complete(id: string) {
    return this.prisma.analysis.update({ where: { id }, data: { status: 'completed', completedAt: new Date() } });
  }
  async fail(id: string, errorLog: string) {
    return this.prisma.analysis.update({ where: { id }, data: { status: 'failed', errorLog, completedAt: new Date() } });
  }
  async getByRestaurant(restaurantId: string) {
    return this.prisma.analysis.findMany({ where: { restaurantId }, orderBy: { createdAt: 'desc' }, take: 10 });
  }
  async getLatest(restaurantId: string) {
    return this.prisma.analysis.findFirst({ where: { restaurantId, status: 'completed' }, orderBy: { completedAt: 'desc' } });
  }
}
