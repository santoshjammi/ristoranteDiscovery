// Application service: Crawl Scheduler
// Manages crawl scheduling, execution tracking, and retry logic
// No AI dependency

import { Crawl, type CrawlStatus, type CrawlType, type CrawlError } from '../../domain/crawl/Crawl';

export interface CrawlRepository {
  save(crawl: Crawl): Promise<void>;
  findById(id: string): Promise<Crawl | null>;
  findBySourceId(sourceId: string): Promise<Crawl[]>;
  findActiveBySourceId(sourceId: string): Promise<Crawl[]>;
  findRecentBySourceId(sourceId: string, limit: number): Promise<Crawl[]>;
}

export class CrawlScheduler {
  constructor(private readonly repository: CrawlRepository) {}

  async schedule(input: {
    sourceId: string;
    connectorId: string;
    type: CrawlType;
  }): Promise<Crawl> {
    const crawl = new Crawl({
      id: `crw-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      sourceId: input.sourceId,
      connectorId: input.connectorId,
      type: input.type,
      status: 'scheduled',
      scheduledAt: new Date(),
      startedAt: null,
      completedAt: null,
      observationsCollected: 0,
      observationsNormalized: 0,
      errors: [],
      duration: null,
    });

    await this.repository.save(crawl);
    return crawl;
  }

  async start(id: string): Promise<void> {
    const crawl = await this.repository.findById(id);
    if (!crawl) throw new Error(`Crawl not found: ${id}`);
    const updated = new Crawl({
      id: crawl.id,
      sourceId: crawl.sourceId,
      connectorId: crawl.connectorId,
      type: crawl.type,
      status: 'running',
      scheduledAt: crawl.scheduledAt,
      startedAt: new Date(),
      completedAt: crawl.completedAt,
      observationsCollected: crawl.observationsCollected,
      observationsNormalized: crawl.observationsNormalized,
      errors: [...crawl.errors],
      duration: crawl.duration,
    });
    await this.repository.save(updated);
  }

  async complete(id: string, collected: number, normalized: number): Promise<void> {
    const crawl = await this.repository.findById(id);
    if (!crawl) throw new Error(`Crawl not found: ${id}`);
    const now = new Date();
    const duration = crawl.startedAt ? now.getTime() - crawl.startedAt.getTime() : null;
    const updated = new Crawl({
      id: crawl.id,
      sourceId: crawl.sourceId,
      connectorId: crawl.connectorId,
      type: crawl.type,
      status: 'completed',
      scheduledAt: crawl.scheduledAt,
      startedAt: crawl.startedAt,
      completedAt: now,
      observationsCollected: collected,
      observationsNormalized: normalized,
      errors: [...crawl.errors],
      duration,
    });
    await this.repository.save(updated);
  }

  async fail(id: string, error: CrawlError): Promise<void> {
    const crawl = await this.repository.findById(id);
    if (!crawl) throw new Error(`Crawl not found: ${id}`);
    const updated = new Crawl({
      id: crawl.id,
      sourceId: crawl.sourceId,
      connectorId: crawl.connectorId,
      type: crawl.type,
      status: 'failed',
      scheduledAt: crawl.scheduledAt,
      startedAt: crawl.startedAt,
      completedAt: new Date(),
      observationsCollected: crawl.observationsCollected,
      observationsNormalized: crawl.observationsNormalized,
      errors: [...crawl.errors, error],
      duration: crawl.duration,
    });
    await this.repository.save(updated);
  }

  async getRecentCrawls(sourceId: string, limit: number = 10): Promise<Crawl[]> {
    return this.repository.findRecentBySourceId(sourceId, limit);
  }

  async hasActiveCrawl(sourceId: string): Promise<boolean> {
    const active = await this.repository.findActiveBySourceId(sourceId);
    return active.length > 0;
  }
}
