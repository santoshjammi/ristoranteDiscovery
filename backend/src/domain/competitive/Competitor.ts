// Domain value object — a single competitor in a competitive set
// Pure domain — zero framework dependencies

export interface CompetitorProps {
  readonly restaurantId: string;
  readonly name: string;
  readonly distance: number;
  readonly cuisineSimilarity: number;
  readonly priceTierMatch: boolean;
  readonly serviceModelMatch: boolean;
  readonly overallScore: number;
  readonly scoreGaps: ScoreGap[];
}

export interface ScoreGap {
  readonly dimension: string;
  readonly focalScore: number;
  readonly competitorScore: number;
  readonly gap: number; // positive = focal ahead, negative = focal behind
}

export class Competitor {
  public readonly restaurantId: string;
  public readonly name: string;
  public readonly distance: number;
  public readonly cuisineSimilarity: number;
  public readonly priceTierMatch: boolean;
  public readonly serviceModelMatch: boolean;
  public readonly overallScore: number;
  public readonly scoreGaps: readonly ScoreGap[];

  constructor(props: CompetitorProps) {
    this.restaurantId = props.restaurantId;
    this.name = props.name;
    this.distance = props.distance;
    this.cuisineSimilarity = props.cuisineSimilarity;
    this.priceTierMatch = props.priceTierMatch;
    this.serviceModelMatch = props.serviceModelMatch;
    this.overallScore = props.overallScore;
    this.scoreGaps = Object.freeze([...props.scoreGaps]);
  }
}
