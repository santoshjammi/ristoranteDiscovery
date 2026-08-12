// Application — Weekly Summary Service
import { PrismaClient } from '@prisma/client';
export class WeeklySummaryService {
  constructor(private prisma: PrismaClient) {}
  async generate(restaurantId: string) {
    const [decisions, outcomes, feedback, analysis] = await Promise.all([
      this.prisma.decision.findMany({ where: { restaurantId }, orderBy: { createdAt: 'desc' }, take: 20 }),
      this.prisma.outcome.findMany({ where: { decision: { restaurantId } }, orderBy: { recordedAt: 'desc' }, take: 10 }),
      this.prisma.feedback.findMany({ where: { restaurantId }, orderBy: { createdAt: 'desc' }, take: 10 }),
      this.prisma.analysis.findFirst({ where: { restaurantId, status: 'completed' }, orderBy: { completedAt: 'desc' } }),
    ]);
    const pending = decisions.filter(d => d.status === 'pending').length;
    const accepted = decisions.filter(d => d.status === 'accepted').length;
    const completed = decisions.filter(d => d.status === 'completed').length;
    const completedOutcomes = outcomes.filter(o => o.status === 'completed').length;
    return {
      period: { start: new Date(Date.now() - 7 * 86400000).toISOString(), end: new Date().toISOString() },
      stats: { totalDecisions: decisions.length, pending, accepted, completed, completedOutcomes },
      newDecisions: decisions.filter(d => new Date(d.createdAt).getTime() > Date.now() - 7 * 86400000).length,
      improvements: completedOutcomes,
      risks: pending > 5 ? [`${pending} pending decisions need attention`] : [],
      lastAnalysis: analysis?.completedAt,
    };
  }
}
