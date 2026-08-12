// Application — Settings Service
import { PrismaClient } from '@prisma/client';
export class SettingsService {
  constructor(private prisma: PrismaClient) {}
  async get(orgId: string) {
    let settings = await this.prisma.organizationSetting.findUnique({ where: { organizationId: orgId } });
    if (!settings) settings = await this.prisma.organizationSetting.create({ data: { organizationId: orgId } });
    return { branding: JSON.parse(settings.branding), notifications: JSON.parse(settings.notifications), preferences: JSON.parse(settings.preferences) };
  }
  async updateBranding(orgId: string, branding: Record<string, unknown>) {
    const settings = await this.get(orgId);
    return this.prisma.organizationSetting.upsert({
      where: { organizationId: orgId }, update: { branding: JSON.stringify({ ...settings.branding, ...branding }) },
      create: { organizationId: orgId, branding: JSON.stringify(branding) },
    });
  }
  async updateNotifications(orgId: string, notifications: Record<string, unknown>) {
    const settings = await this.get(orgId);
    return this.prisma.organizationSetting.upsert({
      where: { organizationId: orgId }, update: { notifications: JSON.stringify({ ...settings.notifications, ...notifications }) },
      create: { organizationId: orgId, notifications: JSON.stringify(notifications) },
    });
  }
}
