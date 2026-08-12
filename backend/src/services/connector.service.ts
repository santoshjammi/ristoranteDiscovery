// ── Connector Platform Service ──
// Manages the Connector model (platform definitions), per-connector lifecycle,
// and delegates sync work to registered connector implementations.

import { PrismaClient } from '@prisma/client';

/* ── public interface ─────────────────────────────────────── */

export interface ConnectorRecord {
  id: string;
  type: string;
  label: string;
  status: 'not_configured' | 'connected' | 'disconnected' | 'error';
  credentials: string | null;
  config: string | null;
  lastSyncAt: string | null;
  lastError: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConnectorDefinition {
  id: string;
  name: string;
  type: string;
  description: string;
  icon: string;
}

export interface SyncResult {
  success: boolean;
  data: Record<string, any>;
  errors: string[];
  syncedAt: string;
}

type ConnectorImpl = (connector: ConnectorRecord) => Promise<SyncResult>;

/* ── registry of connector implementations ────────────────── */

const implementations = new Map<string, ConnectorImpl>();

export function registerConnector(type: string, impl: ConnectorImpl): void {
  implementations.set(type, impl);
}

/* ── service ──────────────────────────────────────────────── */

export class ConnectorService {
  constructor(private prisma: PrismaClient) {}

  // ── list all connectors (platform definitions + config) ──
  async listConnectors(): Promise<ConnectorRecord[]> {
    const connectors = await this.prisma.connector.findMany({
      orderBy: { createdAt: 'asc' },
    });
    return connectors as unknown as ConnectorRecord[];
  }

  // ── connect a platform (create or update) ──
  async connect(type: string, label: string, credentials: Record<string, any>): Promise<ConnectorRecord> {
    const connector = await this.prisma.connector.upsert({
      where: { type },
      update: {
        status: 'connected',
        credentials: JSON.stringify(credentials),
        config: JSON.stringify({}),
        label,
        lastError: null,
      },
      create: {
        type,
        label,
        credentials: JSON.stringify(credentials),
        config: JSON.stringify({}),
        status: 'connected',
      },
    });
    return connector as unknown as ConnectorRecord;
  }

  // ── disconnect a connector ──
  async disconnect(id: string): Promise<ConnectorRecord> {
    const connector = await this.prisma.connector.update({
      where: { id },
      data: { status: 'disconnected', lastError: null },
    });
    return connector as unknown as ConnectorRecord;
  }

  // ── sync a connector by type ──
  async syncConnector(type: string): Promise<SyncResult> {
    const connector = await this.prisma.connector.findUnique({ where: { type } });
    if (!connector) throw new Error(`Connector type "${type}" not found`);

    const conn = connector as unknown as ConnectorRecord;
    if (conn.status === 'disconnected' || conn.status === 'not_configured') {
      throw new Error(`Connector "${type}" is not connected`);
    }

    const impl = implementations.get(type);
    if (!impl) throw new Error(`No implementation registered for "${type}"`);

    try {
      const result = await impl(conn);

      // Update connector record
      await this.prisma.connector.update({
        where: { type },
        data: {
          lastSyncAt: new Date(),
          lastError: result.success ? null : result.errors.join('; '),
          status: result.success ? 'connected' : 'error',
        },
      });

      return result;
    } catch (err: any) {
      await this.prisma.connector.update({
        where: { type },
        data: {
          lastError: err.message,
          status: 'error',
        },
      });
      return { success: false, data: {}, errors: [err.message], syncedAt: new Date().toISOString() };
    }
  }

  // ── find connector by type ──
  async getConnectorByType(type: string): Promise<ConnectorRecord | null> {
    const conn = await this.prisma.connector.findUnique({ where: { type } });
    return (conn as unknown as ConnectorRecord) || null;
  }

  // ── remove a connector entirely ──
  async deleteConnector(id: string): Promise<void> {
    await this.prisma.connector.delete({ where: { id } });
  }
}
