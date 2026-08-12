// Application — Connector Service (updated)
// Integrates with the new Connector Platform registry and scorecard data
import { PrismaClient } from '@prisma/client';
import { registry, ConnectorService as CoreConnectorService } from '../connector/ConnectorService';
import '../connector/GBPConnector'; // Register GBP connector

export class ConnectorService {
  private core: CoreConnectorService;

  constructor(private prisma: PrismaClient) {
    this.core = new CoreConnectorService(prisma);
  }

  async getConnectors(orgId: string) {
    return this.core.getConnectors(orgId);
  }

  async connect(orgId: string, type: string, label: string, credentials: Record<string, unknown>) {
    await this.core.saveConfig(orgId, type, credentials as Record<string, string>, label);
    return { status: 'connected', type, label };
  }

  async disconnect(id: string) {
    return this.prisma.connectorConfig.update({ where: { id }, data: { status: 'disconnected' } });
  }

  async sync(id: string) {
    const config = await this.prisma.connectorConfig.findUnique({ where: { id } });
    if (!config) throw new Error('Connector config not found');
    // Sync for all restaurants in the org
    const orgRestaurants = await this.prisma.organizationRestaurant.findMany({
      where: { organizationId: config.organizationId },
    });
    const results = [];
    for (const link of orgRestaurants) {
      const result = await this.core.sync(config.organizationId, config.type, link.restaurantId);
      results.push({ restaurantId: link.restaurantId, ...result });
    }
    return { results };
  }

  async getSyncHistory(connectorId: string) {
    return this.prisma.connectorSyncJob.findMany({
      where: { connectorId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }
}
