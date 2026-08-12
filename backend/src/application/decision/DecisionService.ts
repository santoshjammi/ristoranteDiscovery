// Application — Decision Service
import { PrismaClient } from '@prisma/client';
export class DecisionService {
  constructor(private prisma: PrismaClient) {}
  async create(data: { restaurantId: string; analysisId?: string; title: string; priority: number; confidence: number; businessImpact: string; effort: string; category: string; observation: string; evidence: any[]; reasoning: { engines: string[]; explanation: string }; actionSteps: string[] }) {
    return this.prisma.decision.create({
      data: {
        restaurantId: data.restaurantId, analysisId: data.analysisId, title: data.title,
        priority: data.priority, confidence: data.confidence, businessImpact: data.businessImpact,
        effort: data.effort, category: data.category, observation: data.observation,
        evidence: JSON.stringify(data.evidence), reasoning: JSON.stringify(data.reasoning),
        actionSteps: JSON.stringify(data.actionSteps),
      },
    });
  }
  async getByRestaurant(restaurantId: string, status?: string) {
    const where: any = { restaurantId };
    if (status) where.status = status;
    return this.prisma.decision.findMany({ where, orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }] });
  }
  async getByRestaurants(restaurantIds: string[], status?: string) {
    const where: any = { restaurantId: { in: restaurantIds } };
    if (status) where.status = status;
    return this.prisma.decision.findMany({ where, orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }] });
  }
  async accept(id: string) { return this.prisma.decision.update({ where: { id }, data: { status: 'accepted', acceptedAt: new Date() } }); }
  async dismiss(id: string) { return this.prisma.decision.update({ where: { id }, data: { status: 'dismissed' } }); }
  async complete(id: string) { return this.prisma.decision.update({ where: { id }, data: { status: 'completed', completedAt: new Date() } }); }
  async getById(id: string) { return this.prisma.decision.findUnique({ where: { id }, include: { outcomes: true } }); }
  async getStats(restaurantId: string) {
    const [total, accepted, completed, dismissed] = await Promise.all([
      this.prisma.decision.count({ where: { restaurantId } }),
      this.prisma.decision.count({ where: { restaurantId, status: 'accepted' } }),
      this.prisma.decision.count({ where: { restaurantId, status: 'completed' } }),
      this.prisma.decision.count({ where: { restaurantId, status: 'dismissed' } }),
    ]);
    return { total, accepted, completed, dismissed, acceptanceRate: total > 0 ? Math.round((accepted / total) * 100) : 0 };
  }
}
