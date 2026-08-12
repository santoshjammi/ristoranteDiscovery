// Domain value object — a raw observation from a source
// Pure domain — zero framework dependencies
// Immutable — once created, never modified

export interface ObservationProps {
  readonly id: string;
  readonly sourceId: string;
  readonly sourceType: string;
  readonly entityType: string;
  readonly entityExternalId: string;
  readonly payload: Record<string, unknown>;
  readonly observedAt: Date;
  readonly metadata: Record<string, unknown>;
}

export class Observation {
  public readonly id: string;
  public readonly sourceId: string;
  public readonly sourceType: string;
  public readonly entityType: string;
  public readonly entityExternalId: string;
  public readonly payload: Record<string, unknown>;
  public readonly observedAt: Date;
  public readonly metadata: Record<string, unknown>;

  constructor(props: ObservationProps) {
    this.id = props.id;
    this.sourceId = props.sourceId;
    this.sourceType = props.sourceType;
    this.entityType = props.entityType;
    this.entityExternalId = props.entityExternalId;
    this.payload = { ...props.payload };
    this.observedAt = props.observedAt;
    this.metadata = { ...props.metadata };
  }
}
