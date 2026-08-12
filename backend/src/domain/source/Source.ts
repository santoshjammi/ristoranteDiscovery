// Domain value object — a named origin of observations
// Pure domain — zero framework dependencies

export type SourceType = 'api' | 'crawl' | 'feed' | 'manual' | 'internal';
export type SourceStatus = 'active' | 'paused' | 'error' | 'deprecated';

export interface SourceProps {
  readonly id: string;
  readonly name: string;
  readonly type: SourceType;
  readonly description: string;
  readonly status: SourceStatus;
  readonly reliability: number;
  readonly freshnessTTL: number; // seconds
  readonly registeredAt: Date;
  readonly lastCrawlAt: Date | null;
  readonly lastErrorAt: Date | null;
}

export class Source {
  public readonly id: string;
  public readonly name: string;
  public readonly type: SourceType;
  public readonly description: string;
  public readonly status: SourceStatus;
  public readonly reliability: number;
  public readonly freshnessTTL: number;
  public readonly registeredAt: Date;
  public readonly lastCrawlAt: Date | null;
  public readonly lastErrorAt: Date | null;

  constructor(props: SourceProps) {
    this.id = props.id;
    this.name = props.name;
    this.type = props.type;
    this.description = props.description;
    this.status = props.status;
    this.reliability = props.reliability;
    this.freshnessTTL = props.freshnessTTL;
    this.registeredAt = props.registeredAt;
    this.lastCrawlAt = props.lastCrawlAt;
    this.lastErrorAt = props.lastErrorAt;
  }
}
