// Domain aggregate — the complete discoverability scorecard
// Pure domain — zero framework dependencies

import { ScoreDimension } from './ScoreDimension';
import { FrictionFunction } from './FrictionFunction';

export type ScorecardStatus = 'initialized' | 'calculating' | 'calculated' | 'validated' | 'published' | 'stale';

export interface ScorecardProps {
  readonly id: string;
  readonly restaurantId: string;
  readonly dimensions: ScoreDimension[];
  readonly calculatedAt: Date | null;
  readonly status: ScorecardStatus;
  readonly previousOverallScore: number | null;
}

export class Scorecard {
  public readonly id: string;
  public readonly restaurantId: string;
  public readonly dimensions: readonly ScoreDimension[];
  public readonly calculatedAt: Date | null;
  public readonly status: ScorecardStatus;
  public readonly previousOverallScore: number | null;

  constructor(props: ScorecardProps) {
    this.id = props.id;
    this.restaurantId = props.restaurantId;
    this.dimensions = Object.freeze([...props.dimensions]);
    this.calculatedAt = props.calculatedAt;
    this.status = props.status;
    this.previousOverallScore = props.previousOverallScore;
    Object.freeze(this);
  }

  get overallScore(): number {
    const weighted = this.dimensions
      .filter(d => !d.isInformational && d.finalScore !== null)
      .reduce((sum, d) => sum + (d.finalScore as number) * (d.weight / 100), 0);
    return Math.round(weighted);
  }

  get weightedDimensions(): ScoreDimension[] {
    return this.dimensions.filter(d => !d.isInformational);
  }

  get informationalDimensions(): ScoreDimension[] {
    return this.dimensions.filter(d => d.isInformational);
  }

  get hasChanged(): boolean {
    if (this.previousOverallScore === null) return true;
    return this.overallScore !== this.previousOverallScore;
  }

  get scoreChange(): number {
    if (this.previousOverallScore === null) return 0;
    return this.overallScore - this.previousOverallScore;
  }

  get trend(): 'up' | 'down' | 'stable' {
    if (this.scoreChange > 0) return 'up';
    if (this.scoreChange < 0) return 'down';
    return 'stable';
  }

  get allEvidenceIds(): string[] {
    return this.dimensions.flatMap(d => [...d.evidenceIds]);
  }

  static create(restaurantId: string, dimensions: ScoreDimension[]): Scorecard {
    return new Scorecard({
      id: crypto.randomUUID(),
      restaurantId,
      dimensions,
      calculatedAt: null,
      status: 'initialized',
      previousOverallScore: null,
    });
  }

  static recalculate(
    previous: Scorecard,
    rawScores: Array<{ name: string; rawScore: number | null; weight: number; evidenceIds: string[]; isInformational: boolean }>,
  ): Scorecard {
    const dimensions = rawScores.map(r => new ScoreDimension({
      name: r.name,
      rawScore: r.rawScore,
      finalScore: FrictionFunction.apply(r.rawScore),
      weight: r.weight,
      evidenceIds: r.evidenceIds,
      isInformational: r.isInformational,
    }));

    return new Scorecard({
      id: previous.id,
      restaurantId: previous.restaurantId,
      dimensions,
      calculatedAt: new Date(),
      status: 'calculated',
      previousOverallScore: previous.overallScore,
    });
  }
}
