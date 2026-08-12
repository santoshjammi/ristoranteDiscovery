// Domain value object — pure, immutable, framework-free

export type ConfidenceLevel = 'very-high' | 'high' | 'medium' | 'low' | 'very-low';

export interface EvidenceSource {
  readonly entityType: string;
  readonly entityId: string;
  readonly field: string;
  readonly value: string;
}

export interface EvidenceProps {
  readonly id: string;
  readonly recommendationId: string | null;
  readonly description: string;
  readonly source: EvidenceSource;
  readonly confidence: ConfidenceLevel;
  readonly supportingResearch: string | null;
}

export class Evidence {
  public readonly id: string;
  public readonly recommendationId: string | null;
  public readonly description: string;
  public readonly source: EvidenceSource;
  public readonly confidence: ConfidenceLevel;
  public readonly supportingResearch: string | null;

  constructor(props: EvidenceProps) {
    this.id = props.id;
    this.recommendationId = props.recommendationId;
    this.description = props.description;
    this.source = Object.freeze({ ...props.source });
    this.confidence = props.confidence;
    this.supportingResearch = props.supportingResearch;
    Object.freeze(this);
  }

  get isHighConfidence(): boolean {
    return this.confidence === 'very-high' || this.confidence === 'high';
  }
}
