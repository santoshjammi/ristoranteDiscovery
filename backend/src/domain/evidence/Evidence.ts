// Domain value object — a normalized, immutable record of one or more observations
// Pure domain — zero framework dependencies
// Immutable — once created, never modified

export type EvidenceStatus = 'active' | 'superseded' | 'expired';

export interface EvidenceProps {
  readonly id: string;
  readonly observationIds: string[];
  readonly sourceId: string;
  readonly sourceType: string;
  readonly entityType: string;
  readonly entityId: string;
  readonly payload: Record<string, unknown>;
  readonly observedAt: Date;
  readonly ingestedAt: Date;
  readonly confidence: number;
  readonly checksum: string;
  readonly status: EvidenceStatus;
}

export class Evidence {
  public readonly id: string;
  public readonly observationIds: readonly string[];
  public readonly sourceId: string;
  public readonly sourceType: string;
  public readonly entityType: string;
  public readonly entityId: string;
  public readonly payload: Record<string, unknown>;
  public readonly observedAt: Date;
  public readonly ingestedAt: Date;
  public readonly confidence: number;
  public readonly checksum: string;
  public readonly status: EvidenceStatus;

  constructor(props: EvidenceProps) {
    this.id = props.id;
    this.observationIds = Object.freeze([...props.observationIds]);
    this.sourceId = props.sourceId;
    this.sourceType = props.sourceType;
    this.entityType = props.entityType;
    this.entityId = props.entityId;
    this.payload = { ...props.payload };
    this.observedAt = props.observedAt;
    this.ingestedAt = props.ingestedAt;
    this.confidence = props.confidence;
    this.checksum = props.checksum;
    this.status = props.status;
  }
}
