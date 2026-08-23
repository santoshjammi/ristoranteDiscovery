// Domain entity for the Discovery bounded context
// Pure domain — zero framework dependencies

export type ScoreValue = number | null; // null = pending observation

export interface ScoreDimensionProps {
  name: string;
  rawScore: ScoreValue;
  finalScore: ScoreValue;
  weight: number; // 0-100, sum of weighted dimensions = 100
  evidenceIds: string[];
  isInformational: boolean;
}

export class ScoreDimension {
  public readonly name: string;
  public readonly rawScore: ScoreValue;
  public readonly finalScore: ScoreValue;
  public readonly weight: number;
  public readonly evidenceIds: readonly string[];
  public readonly isInformational: boolean;

  constructor(props: ScoreDimensionProps) {
    this.name = props.name;
    this.rawScore = props.rawScore;
    this.finalScore = props.finalScore;
    this.weight = props.weight;
    this.evidenceIds = Object.freeze([...props.evidenceIds]);
    this.isInformational = props.isInformational;
    Object.freeze(this);
  }

  get hasEvidence(): boolean {
    return this.evidenceIds.length > 0;
  }
}
