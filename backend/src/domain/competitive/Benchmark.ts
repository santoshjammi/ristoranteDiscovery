// Domain value object — benchmark metrics for a competitive set
// Pure domain — zero framework dependencies

export interface BenchmarkProps {
  readonly dimension: string;
  readonly average: number;
  readonly median: number;
  readonly min: number;
  readonly max: number;
  readonly focalScore: number;
  readonly focalPercentile: number;
  readonly competitorCount: number;
}

export class Benchmark {
  public readonly dimension: string;
  public readonly average: number;
  public readonly median: number;
  public readonly min: number;
  public readonly max: number;
  public readonly focalScore: number;
  public readonly focalPercentile: number;
  public readonly competitorCount: number;

  constructor(props: BenchmarkProps) {
    this.dimension = props.dimension;
    this.average = props.average;
    this.median = props.median;
    this.min = props.min;
    this.max = props.max;
    this.focalScore = props.focalScore;
    this.focalPercentile = props.focalPercentile;
    this.competitorCount = props.competitorCount;
  }
}
