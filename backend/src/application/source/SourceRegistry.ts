// Application service: Source Registry
// Manages source registration, status, and discovery
// No AI dependency

import { Source, type SourceType, type SourceStatus } from '../../domain/source/Source';

export interface SourceRepository {
  save(source: Source): Promise<void>;
  findById(id: string): Promise<Source | null>;
  findAll(): Promise<Source[]>;
  findByType(type: SourceType): Promise<Source[]>;
  findByStatus(status: SourceStatus): Promise<Source[]>;
}

export class SourceRegistry {
  constructor(private readonly repository: SourceRepository) {}

  async register(input: {
    name: string;
    type: SourceType;
    description: string;
    reliability: number;
    freshnessTTL: number;
  }): Promise<Source> {
    const source = new Source({
      id: `src-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: input.name,
      type: input.type,
      description: input.description,
      status: 'active',
      reliability: input.reliability,
      freshnessTTL: input.freshnessTTL,
      registeredAt: new Date(),
      lastCrawlAt: null,
      lastErrorAt: null,
    });

    await this.repository.save(source);
    return source;
  }

  async pause(id: string): Promise<void> {
    const source = await this.repository.findById(id);
    if (!source) throw new Error(`Source not found: ${id}`);
    const updated = new Source({ ...source, status: 'paused' as SourceStatus });
    await this.repository.save(updated);
  }

  async resume(id: string): Promise<void> {
    const source = await this.repository.findById(id);
    if (!source) throw new Error(`Source not found: ${id}`);
    const updated = new Source({ ...source, status: 'active' as SourceStatus });
    await this.repository.save(updated);
  }

  async recordCrawl(id: string): Promise<void> {
    const source = await this.repository.findById(id);
    if (!source) throw new Error(`Source not found: ${id}`);
    const updated = new Source({ ...source, lastCrawlAt: new Date() });
    await this.repository.save(updated);
  }

  async recordError(id: string): Promise<void> {
    const source = await this.repository.findById(id);
    if (!source) throw new Error(`Source not found: ${id}`);
    const updated = new Source({ ...source, lastErrorAt: new Date(), status: 'error' as SourceStatus });
    await this.repository.save(updated);
  }

  async getAllSources(): Promise<Source[]> {
    return this.repository.findAll();
  }

  async getActiveSources(): Promise<Source[]> {
    return this.repository.findByStatus('active');
  }
}
