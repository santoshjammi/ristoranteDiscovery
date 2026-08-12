// Application — Usage Service
import { PrismaClient } from '@prisma/client';
export class UsageService {
  constructor(private prisma: PrismaClient) {}
  async record(orgId: string, metric: string, value: number = 1) {
    const now = new Date(); const start = new Date(now.getFullYear(), now.getMonth(), 1); const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const existing = await this.prisma.usageRecord.findFirst({ where: { organizationId: orgId, metric, periodStart: start } });
    if (existing) return this.prisma.usageRecord.update({ where: { id: existing.id }, data: { value: existing.value + value } });
    return this.prisma.usageRecord.create({ data: { organizationId: orgId, metric, value, periodStart: start, periodEnd: end } });
  }
  async getUsage(orgId: string) { return this.prisma.usageRecord.findMany({ where: { organizationId: orgId }, orderBy: { periodStart: 'desc' } }); }
  async checkLimit(orgId: string, metric: string, limit: number): Promise<boolean> {
    const now = new Date(); const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const record = await this.prisma.usageRecord.findFirst({ where: { organizationId: orgId, metric, periodStart: start } });
    return !record || record.value < limit;
  }
}
