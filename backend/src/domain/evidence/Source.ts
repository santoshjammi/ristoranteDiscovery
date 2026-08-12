// Domain value object — the origin of observations
// Pure domain — zero framework dependencies

export type SourceType = 'api' | 'crawl' | 'feed' | 'manual' | 'internal';

export interface SourceProps {
  readonly id: string;
  readonly name: string;
  readonly type: SourceType;
  readonly version: string;
}

export class Source {
  public readonly id: string;
  public readonly name: string;
  public readonly type: SourceType;
  public readonly version: string;

  constructor(props: SourceProps) {
    this.id = props.id;
    this.name = props.name;
    this.type = props.type;
    this.version = props.version;
  }
}
