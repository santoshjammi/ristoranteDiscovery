// Application — Notification Service
import { PrismaClient } from '@prisma/client';
export class NotificationService {
  constructor(private prisma: PrismaClient) {}
  async send(restaurantId: string, type: string, title: string, message: string) {
    // MSP: log notification (in production, send email/in-app)
    return { type, title, message, sentAt: new Date().toISOString() };
  }
  async sendWeeklySummary(restaurantId: string) {
    const summary = await this.generateSummary(restaurantId);
    return this.send(restaurantId, 'weekly_summary', 'Your Weekly Restaurant Intelligence Summary', JSON.stringify(summary));
  }
  async sendNewRecommendations(restaurantId: string) {
    const recent = await this.prisma.decision.findMany({ where: { restaurantId, status: 'pending' }, orderBy: { createdAt: 'desc' }, take: 3 });
    if (recent.length === 0) return null;
    return this.send(restaurantId, 'new_recommendations', `${recent.length} new recommendations`, `You have ${recent.length} recommendations waiting. ${recent[0].title} — ${recent[0].businessImpact}`);
  }
  private async generateSummary(restaurantId: string) {
    const decisions = await this.prisma.decision.findMany({ where: { restaurantId } });
    return { total: decisions.length, pending: decisions.filter(d => d.status === 'pending').length, completed: decisions.filter(d => d.status === 'completed').length };
  }
}
