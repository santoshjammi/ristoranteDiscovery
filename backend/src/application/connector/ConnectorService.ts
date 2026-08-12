// ── Connector Platform — Core Service ──
// Manages connector registration, health checks, data fetching, and scorecard integration.

import { PrismaClient } from '@prisma/client';
import { captureSnapshot } from '../../domain/scorecard/ScorecardSnapshotService';

export interface ConnectorConfig {
  id: string;
  name: string;
  type: string;
  description: string;
  icon: string;
  status: 'disconnected' | 'connected' | 'error' | 'not_configured';
  lastSyncAt: string | null;
  lastError: string | null;
}

export interface ConnectorSyncResult {
  success: boolean;
  data: Record<string, any>;
  errors: string[];
  syncedAt: string;
}

export interface ConnectorScorecardUpdate {
  factorId: string;
  score: number;
  confidence: number;
  evidence: string[];
}

// ── Connector Interface ──
export interface Connector {
  id: string;
  name: string;
  type: string;
  description: string;
  icon: string;
  validate(credentials: Record<string, string>): Promise<string[]>;
  sync(credentials: Record<string, string>, restaurantId: string): Promise<ConnectorSyncResult>;
  getScorecardUpdates(data: Record<string, any>): ConnectorScorecardUpdate[];
}

// ── Connector Registry ──
class ConnectorRegistry {
  private connectors = new Map<string, Connector>();

  register(connector: Connector): void {
    this.connectors.set(connector.id, connector);
  }

  get(id: string): Connector | undefined {
    return this.connectors.get(id);
  }

  getAll(): Connector[] {
    return Array.from(this.connectors.values());
  }
}

export const registry = new ConnectorRegistry();

// ── Connector Service ──
export class ConnectorService {
  constructor(private prisma: PrismaClient) {}

  async getConnectors(organizationId: string): Promise<ConnectorConfig[]> {
    const configs = await this.prisma.connectorConfig.findMany({
      where: { organizationId },
    });
    const configMap = new Map(configs.map(c => [c.type, c]));

    return registry.getAll().map(connector => {
      const config = configMap.get(connector.type);
      return {
        id: connector.id,
        name: connector.name,
        type: connector.type,
        description: connector.description,
        icon: connector.icon,
        status: (config?.status as ConnectorConfig['status']) || 'not_configured',
        lastSyncAt: config?.lastSyncAt?.toISOString() || null,
        lastError: config?.lastError || null,
      };
    });
  }

  async saveConfig(organizationId: string, type: string, credentials: Record<string, string>, label?: string): Promise<void> {
    const connector = Array.from(registry.getAll()).find(c => c.type === type);
    if (!connector) throw new Error(`Connector type ${type} not found`);

    const errors = await connector.validate(credentials);
    if (errors.length > 0) throw new Error(`Validation failed: ${errors.join(', ')}`);

    await this.prisma.connectorConfig.upsert({
      where: { organizationId_type: { organizationId, type } },
      update: { credentials: JSON.stringify(credentials), status: 'connected', lastError: null, label: label || connector.name },
      create: { organizationId, type, credentials: JSON.stringify(credentials), status: 'connected', label: label || connector.name },
    });
  }

  async sync(organizationId: string, type: string, restaurantId: string): Promise<ConnectorSyncResult> {
    const connector = Array.from(registry.getAll()).find(c => c.type === type);
    if (!connector) throw new Error(`Connector type ${type} not found`);

    const config = await this.prisma.connectorConfig.findUnique({
      where: { organizationId_type: { organizationId, type } },
    });
    if (!config || config.status !== 'connected') throw new Error('Connector not configured');

    const parsedCredentials = JSON.parse(config.credentials);
    const result = await connector.sync(parsedCredentials, restaurantId);

    // Update connector config status
    await this.prisma.connectorConfig.update({
      where: { id: config.id },
      data: {
        lastSyncAt: new Date(),
        lastError: result.success ? null : result.errors.join('; '),
        status: result.success ? 'connected' : 'error',
      },
    });

    // Log sync job
    await this.prisma.connectorSyncJob.create({
      data: {
        connectorId: config.id,
        status: result.success ? 'completed' : 'failed',
        completedAt: new Date(),
        itemsProcessed: result.success ? 1 : 0,
        itemsFailed: result.success ? 0 : result.errors.length,
        errorLog: result.errors.length > 0 ? result.errors.join('; ') : null,
      },
    });

    // Apply scorecard updates
    if (result.success) {
      const updates = connector.getScorecardUpdates(result.data);
      for (const update of updates) {
        await this.prisma.connectorScorecardData.upsert({
          where: { restaurantId_factorId: { restaurantId, factorId: update.factorId } },
          update: {
            score: update.score,
            confidence: update.confidence,
            evidence: JSON.stringify(update.evidence),
            syncedAt: new Date(),
          },
          create: {
            restaurantId,
            factorId: update.factorId,
            score: update.score,
            confidence: update.confidence,
            evidence: JSON.stringify(update.evidence),
            syncedAt: new Date(),
          },
        });
      }
      // Capture a snapshot after source-data change (connector sync).
      await captureSnapshot(restaurantId);
    }

    return result;
  }

  async getSyncHistory(organizationId: string, type: string, limit = 10) {
    const config = await this.prisma.connectorConfig.findUnique({
      where: { organizationId_type: { organizationId, type } },
    });
    if (!config) return [];
    return this.prisma.connectorSyncJob.findMany({
      where: { connectorId: config.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
