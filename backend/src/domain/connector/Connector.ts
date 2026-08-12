// Domain value object — a connector that connects to a source
// Pure domain — zero framework dependencies

export type ConnectorType = 'rest-api' | 'graphql' | 'web-scraper' | 'rss-feed' | 'file-import' | 'webhook';

export type ConnectorStatus = 'active' | 'paused' | 'error' | 'deprecated';

export interface ConnectorConfig {
  readonly baseUrl?: string;
  readonly apiKeyRef?: string;
  readonly headers?: Record<string, string>;
  readonly timeout?: number;
  readonly retryCount?: number;
  readonly retryDelay?: number;
}

export interface ConnectorProps {
  readonly id: string;
  readonly sourceId: string;
  readonly name: string;
  readonly type: ConnectorType;
  readonly version: string;
  readonly config: ConnectorConfig;
  readonly status: ConnectorStatus;
  readonly registeredAt: Date;
  readonly lastHealthCheckAt: Date | null;
  readonly lastError: string | null;
}

export class Connector {
  public readonly id: string;
  public readonly sourceId: string;
  public readonly name: string;
  public readonly type: ConnectorType;
  public readonly version: string;
  public readonly config: ConnectorConfig;
  public readonly status: ConnectorStatus;
  public readonly registeredAt: Date;
  public readonly lastHealthCheckAt: Date | null;
  public readonly lastError: string | null;

  constructor(props: ConnectorProps) {
    this.id = props.id;
    this.sourceId = props.sourceId;
    this.name = props.name;
    this.type = props.type;
    this.version = props.version;
    this.config = { ...props.config };
    this.status = props.status;
    this.registeredAt = props.registeredAt;
    this.lastHealthCheckAt = props.lastHealthCheckAt;
    this.lastError = props.lastError;
  }
}
