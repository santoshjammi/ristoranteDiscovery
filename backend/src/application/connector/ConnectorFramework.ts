// Application service: Connector Framework
// Manages connector registration, health checks, and lifecycle
// No AI dependency

import { Connector, type ConnectorType, type ConnectorConfig, type ConnectorStatus } from '../../domain/connector/Connector';

export interface ConnectorRepository {
  save(connector: Connector): Promise<void>;
  findById(id: string): Promise<Connector | null>;
  findBySourceId(sourceId: string): Promise<Connector[]>;
  findAll(): Promise<Connector[]>;
  findByType(type: ConnectorType): Promise<Connector[]>;
}

export class ConnectorFramework {
  constructor(private readonly repository: ConnectorRepository) {}

  async register(input: {
    sourceId: string;
    name: string;
    type: ConnectorType;
    version: string;
    config: ConnectorConfig;
  }): Promise<Connector> {
    const connector = new Connector({
      id: `conn-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      sourceId: input.sourceId,
      name: input.name,
      type: input.type,
      version: input.version,
      config: input.config,
      status: 'active',
      registeredAt: new Date(),
      lastHealthCheckAt: null,
      lastError: null,
    });

    await this.repository.save(connector);
    return connector;
  }

  async pause(id: string): Promise<void> {
    const connector = await this.repository.findById(id);
    if (!connector) throw new Error(`Connector not found: ${id}`);
    const updated = new Connector({ ...connector, status: 'paused' as ConnectorStatus });
    await this.repository.save(updated);
  }

  async resume(id: string): Promise<void> {
    const connector = await this.repository.findById(id);
    if (!connector) throw new Error(`Connector not found: ${id}`);
    const updated = new Connector({ ...connector, status: 'active' as ConnectorStatus });
    await this.repository.save(updated);
  }

  async getConnectorsBySource(sourceId: string): Promise<Connector[]> {
    return this.repository.findBySourceId(sourceId);
  }

  async getAllConnectors(): Promise<Connector[]> {
    return this.repository.findAll();
  }
}
