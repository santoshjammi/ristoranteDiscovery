// Domain value object — a scheduled execution of a connector
// Pure domain — zero framework dependencies

export type CrawlStatus = 'scheduled' | 'running' | 'completed' | 'failed' | 'cancelled';
export type CrawlType = 'full' | 'incremental' | 'webhook';

export interface CrawlError {
  readonly message: string;
  readonly code: string;
  readonly timestamp: Date;
}

export interface CrawlProps {
  readonly id: string;
  readonly sourceId: string;
  readonly connectorId: string;
  readonly type: CrawlType;
  readonly status: CrawlStatus;
  readonly scheduledAt: Date;
  readonly startedAt: Date | null;
  readonly completedAt: Date | null;
  readonly observationsCollected: number;
  readonly observationsNormalized: number;
  readonly errors: CrawlError[];
  readonly duration: number | null; // milliseconds
}

export class Crawl {
  public readonly id: string;
  public readonly sourceId: string;
  public readonly connectorId: string;
  public readonly type: CrawlType;
  public readonly status: CrawlStatus;
  public readonly scheduledAt: Date;
  public readonly startedAt: Date | null;
  public readonly completedAt: Date | null;
  public readonly observationsCollected: number;
  public readonly observationsNormalized: number;
  public readonly errors: readonly CrawlError[];
  public readonly duration: number | null;

  constructor(props: CrawlProps) {
    this.id = props.id;
    this.sourceId = props.sourceId;
    this.connectorId = props.connectorId;
    this.type = props.type;
    this.status = props.status;
    this.scheduledAt = props.scheduledAt;
    this.startedAt = props.startedAt;
    this.completedAt = props.completedAt;
    this.observationsCollected = props.observationsCollected;
    this.observationsNormalized = props.observationsNormalized;
    this.errors = Object.freeze([...props.errors]);
    this.duration = props.duration;
  }
}
