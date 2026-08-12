// Domain value object — identity resolution between external and internal entities
// Pure domain — zero framework dependencies

export type MatchMethod = 'exact' | 'fuzzy' | 'manual';

export interface IdentityResolutionProps {
  readonly id: string;
  readonly externalId: string;
  readonly externalSource: string;
  readonly internalEntityId: string;
  readonly internalEntityType: string;
  readonly matchConfidence: number;
  readonly matchMethod: MatchMethod;
  readonly matchedAt: Date;
  readonly evidenceIds: string[];
}

export class IdentityResolution {
  public readonly id: string;
  public readonly externalId: string;
  public readonly externalSource: string;
  public readonly internalEntityId: string;
  public readonly internalEntityType: string;
  public readonly matchConfidence: number;
  public readonly matchMethod: MatchMethod;
  public readonly matchedAt: Date;
  public readonly evidenceIds: readonly string[];

  constructor(props: IdentityResolutionProps) {
    this.id = props.id;
    this.externalId = props.externalId;
    this.externalSource = props.externalSource;
    this.internalEntityId = props.internalEntityId;
    this.internalEntityType = props.internalEntityType;
    this.matchConfidence = props.matchConfidence;
    this.matchMethod = props.matchMethod;
    this.matchedAt = props.matchedAt;
    this.evidenceIds = Object.freeze([...props.evidenceIds]);
  }
}
