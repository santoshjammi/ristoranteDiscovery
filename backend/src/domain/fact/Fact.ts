// Domain value object — a canonical fact derived from assertions
// Pure domain — zero framework dependencies
// Versioned — facts may evolve as new evidence arrives

export type FactStatus = 'current' | 'superseded' | 'invalidated';

export interface FactProps {
  readonly id: string;
  readonly assertionIds: string[];
  readonly entityType: string;
  readonly entityId: string;
  readonly attribute: string;
  readonly value: unknown;
  readonly confidence: number;
  readonly validFrom: Date;
  readonly validTo: Date | null;
  readonly status: FactStatus;
  readonly version: number;
}

export class Fact {
  public readonly id: string;
  public readonly assertionIds: readonly string[];
  public readonly entityType: string;
  public readonly entityId: string;
  public readonly attribute: string;
  public readonly value: unknown;
  public readonly confidence: number;
  public readonly validFrom: Date;
  public readonly validTo: Date | null;
  public readonly status: FactStatus;
  public readonly version: number;

  constructor(props: FactProps) {
    this.id = props.id;
    this.assertionIds = Object.freeze([...props.assertionIds]);
    this.entityType = props.entityType;
    this.entityId = props.entityId;
    this.attribute = props.attribute;
    this.value = props.value;
    this.confidence = props.confidence;
    this.validFrom = props.validFrom;
    this.validTo = props.validTo;
    this.status = props.status;
    this.version = props.version;
  }
}
