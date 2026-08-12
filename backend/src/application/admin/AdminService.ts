// Application — Admin Service
import { PrismaClient } from '@prisma/client';
export class AdminService {
  constructor(private prisma: PrismaClient) {}
  async getStats() {
    const [users, orgs, restaurants, subscriptions] = await Promise.all([
      this.prisma.user.count(), this.prisma.organization.count(), this.prisma.restaurant.count(),
      this.prisma.subscription.count({ where: { status: 'active' } }),
    ]);
    return { users, organizations: orgs, restaurants, activeSubscriptions: subscriptions };
  }
  async getUsers(page = 1, limit = 20) { return this.prisma.user.findMany({ skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' } }); }
  async getOrganizations(page = 1, limit = 20) { return this.prisma.organization.findMany({ skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' }, include: { owner: { select: { name: true, email: true } } } }); }
  async logAudit(actorId: string, action: string, resourceType: string, resourceId: string, details?: Record<string, unknown>, ip?: string) {
    return this.prisma.adminAuditLog.create({ data: { actorId, action, resourceType, resourceId, details: JSON.stringify(details || {}), ip } });
  }
  async getAuditLog(page = 1, limit = 50) { return this.prisma.adminAuditLog.findMany({ skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' } }); }
  async getConnectorJobs() { return this.prisma.connectorSyncJob.findMany({ orderBy: { createdAt: 'desc' }, take: 50 }); }
}
