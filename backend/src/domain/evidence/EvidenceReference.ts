// Domain value object — a lightweight reference to evidence
// Pure domain — zero framework dependencies
// Used by Facts, Assertions, Recommendations, and Timeline events to point back to evidence

export interface EvidenceReferenceProps {
  readonly evidenceId: string;
  readonly observationId: string;
  readonly sourceId: string;
  readonly observedAt: Date;
}

export class EvidenceReference {
  public readonly evidenceId: string;
  public readonly observationId: string;
  public readonly sourceId: string;
  public readonly observedAt: Date;

  constructor(props: EvidenceReferenceProps) {
    this.evidenceId = props.evidenceId;
    this.observationId = props.observationId;
    this.sourceId = props.sourceId;
    this.observedAt = props.observedAt;
  }
}
