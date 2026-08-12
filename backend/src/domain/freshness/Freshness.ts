// Domain value object — freshness tracking for observed entities
// Pure domain — zero framework dependencies

export type StalenessLevel = 'fresh' | 'aging' | 'stale' | 'expired';

export interface SourceFreshness {
  readonly sourceId: string;
  readonly lastCrawlAt: Date | null;
  readonly staleness: StalenessLevel;
}

export interface FreshnessProps {
  readonly entityId: string;
  readonly entityType: string;
  readonly lastObservationAt: Date | null;
  readonly lastEvidenceAt: Date | null;
  readonly staleness: StalenessLevel;
  readonly sources: SourceFreshness[];
  readonly checkedAt: Date;
}

export class Freshness {
  public readonly entityId: string;
  public readonly entityType: string;
  public readonly lastObservationAt: Date | null;
  public readonly lastEvidenceAt: Date | null;
  public readonly staleness: StalenessLevel;
  public readonly sources: readonly SourceFreshness[];
  public readonly checkedAt: Date;

  constructor(props: FreshnessProps) {
    this.entityId = props.entityId;
    this.entityType = props.entityType;
    this.lastObservationAt = props.lastObservationAt;
    this.lastEvidenceAt = props.lastEvidenceAt;
    this.staleness = props.staleness;
    this.sources = Object.freeze([...props.sources]);
    this.checkedAt = props.checkedAt;
  }
}
