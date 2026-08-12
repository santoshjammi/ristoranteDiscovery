// Application service: Freshness Tracker
// Tracks how current the knowledge is for each entity
// No AI dependency

import { Freshness, type StalenessLevel, type SourceFreshness } from '../../domain/freshness/Freshness';

export interface FreshnessRepository {
  save(freshness: Freshness): Promise<void>;
  findByEntity(entityType: string, entityId: string): Promise<Freshness | null>;
  findStaleEntities(staleness: StalenessLevel): Promise<Freshness[]>;
  findAll(): Promise<Freshness[]>;
}

export class FreshnessTracker {
  constructor(private readonly repository: FreshnessRepository) {}

  /**
   * Compute freshness for an entity based on its sources.
   */
  compute(input: {
    entityType: string;
    entityId: string;
    lastObservationAt: Date | null;
    lastEvidenceAt: Date | null;
    sources: Array<{
      sourceId: string;
      lastCrawlAt: Date | null;
      freshnessTTL: number;
    }>;
  }): Freshness {
    const now = new Date();
    const sourceFreshness: SourceFreshness[] = input.sources.map(s => {
      let staleness: StalenessLevel = 'expired';
      if (s.lastCrawlAt) {
        const age = (now.getTime() - s.lastCrawlAt.getTime()) / 1000;
        if (age < s.freshnessTTL * 0.5) staleness = 'fresh';
        else if (age < s.freshnessTTL * 0.8) staleness = 'aging';
        else if (age < s.freshnessTTL) staleness = 'stale';
        else staleness = 'expired';
      }
      return { sourceId: s.sourceId, lastCrawlAt: s.lastCrawlAt, staleness };
    });

    // Overall staleness = worst of all sources
    const levels: StalenessLevel[] = ['fresh', 'aging', 'stale', 'expired'];
    const overall = levels.reduce((worst, level) => {
      if (sourceFreshness.some(s => s.staleness === level)) return level;
      return worst;
    }, 'expired' as StalenessLevel);

    return new Freshness({
      entityId: input.entityId,
      entityType: input.entityType,
      lastObservationAt: input.lastObservationAt,
      lastEvidenceAt: input.lastEvidenceAt,
      staleness: overall,
      sources: sourceFreshness,
      checkedAt: now,
    });
  }

  async save(freshness: Freshness): Promise<void> {
    await this.repository.save(freshness);
  }

  async getStaleEntities(staleness: StalenessLevel): Promise<Freshness[]> {
    return this.repository.findStaleEntities(staleness);
  }
}
