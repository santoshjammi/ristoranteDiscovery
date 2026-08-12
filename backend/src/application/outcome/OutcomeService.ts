// Application — Outcome Service
import { PrismaClient } from '@prisma/client';
export class OutcomeService {
  constructor(private prisma: PrismaClient) {}
  async record(data: { decisionId: string; status: string; effort?: string; perceivedImpact?: string; beforeMetric?: number; afterMetric?: number; notes?: string }) {
    return this.prisma.outcome.create({ data });
  }
  async getByDecision(decisionId: string) { return this.prisma.outcome.findMany({ where: { decisionId }, orderBy: { recordedAt: 'desc' } }); }
  async getStats(restaurantId: string) {
    const outcomes = await this.prisma.outcome.findMany({
      where: { decision: { restaurantId } },
      include: { decision: { select: { category: true } } },
    });
    return {
      total: outcomes.length,
      completed: outcomes.filter(o => o.status === 'completed').length,
      inProgress: outcomes.filter(o => o.status === 'in_progress').length,
      blocked: outcomes.filter(o => o.status === 'blocked').length,
      highImpact: outcomes.filter(o => o.perceivedImpact === 'high').length,
    };
  }
  async getStatsByRestaurants(restaurantIds: string[]) {
    const outcomes = await this.prisma.outcome.findMany({
      where: { decision: { restaurantId: { in: restaurantIds } } },
      include: { decision: { select: { restaurantId: true, category: true } } },
    });
    const map = new Map<string, { total: number; completed: number; inProgress: number; blocked: number; highImpact: number }>();
    for (const o of outcomes) {
      const rid = o.decision.restaurantId;
      if (!map.has(rid)) map.set(rid, { total: 0, completed: 0, inProgress: 0, blocked: 0, highImpact: 0 });
      const s = map.get(rid)!;
      s.total++;
      if (o.status === 'completed') s.completed++;
      if (o.status === 'in_progress') s.inProgress++;
      if (o.status === 'blocked') s.blocked++;
      if (o.perceivedImpact === 'high') s.highImpact++;
    }
    return map;
  }
}
