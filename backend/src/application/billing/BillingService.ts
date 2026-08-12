// Application — Billing Service
import { PrismaClient } from '@prisma/client';
export class BillingService {
  constructor(private prisma: PrismaClient) {}
  async getPlans() { return this.prisma.subscriptionPlan.findMany({ where: { isActive: true } }); }
  async getSubscription(orgId: string) { return this.prisma.subscription.findUnique({ where: { organizationId: orgId }, include: { plan: true } }); }
  async createSubscription(orgId: string, planId: string) {
    const plan = await this.prisma.subscriptionPlan.findUnique({ where: { id: planId } });
    if (!plan) throw new Error('Plan not found');
    const now = new Date(); const end = new Date(now); end.setMonth(end.getMonth() + 1);
    return this.prisma.subscription.create({ data: { organizationId: orgId, planId, currentPeriodStart: now, currentPeriodEnd: end } });
  }
  async getInvoices(orgId: string) { return this.prisma.invoice.findMany({ where: { organizationId: orgId }, orderBy: { createdAt: 'desc' } }); }
}
