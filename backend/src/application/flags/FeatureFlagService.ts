// Application — Feature Flag Service
import { PrismaClient } from '@prisma/client';
export class FeatureFlagService {
  constructor(private prisma: PrismaClient) {}
  async getAll() { return this.prisma.featureFlag.findMany({ orderBy: { name: 'asc' } }); }
  async isEnabled(name: string, orgId?: string): Promise<boolean> {
    const flag = await this.prisma.featureFlag.findUnique({ where: { name } });
    if (!flag) return false;
    if (flag.enabled) return true;
    if (orgId) { const orgs: string[] = JSON.parse(flag.enabledOrgs); return orgs.includes(orgId); }
    return false;
  }
  async enable(name: string, orgId?: string) {
    const flag = await this.prisma.featureFlag.findUnique({ where: { name } });
    if (!flag) throw new Error('Flag not found');
    if (orgId) {
      const orgs: string[] = JSON.parse(flag.enabledOrgs);
      if (!orgs.includes(orgId)) orgs.push(orgId);
      return this.prisma.featureFlag.update({ where: { name }, data: { enabledOrgs: JSON.stringify(orgs) } });
    }
    return this.prisma.featureFlag.update({ where: { name }, data: { enabled: true } });
  }
  async create(name: string, description: string) { return this.prisma.featureFlag.create({ data: { name, description } }); }
}
