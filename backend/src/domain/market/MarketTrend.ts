// Domain value object — a market trend derived from observed review activity
// Pure domain — zero framework dependencies

export type SentimentTrend = 'improving' | 'declining' | 'stable';

export interface MarketTrendProps {
  readonly cuisine: string;
  readonly area: string;
  readonly reviewVolume: number;
  readonly averageRating: number;
  readonly sentimentTrend: SentimentTrend;
  readonly period: string;
}

export class MarketTrend {
  public readonly cuisine: string;
  public readonly area: string;
  public readonly reviewVolume: number;
  public readonly averageRating: number;
  public readonly sentimentTrend: SentimentTrend;
  public readonly period: string;

  constructor(props: MarketTrendProps) {
    this.cuisine = props.cuisine;
    this.area = props.area;
    this.reviewVolume = props.reviewVolume;
    this.averageRating = props.averageRating;
    this.sentimentTrend = props.sentimentTrend;
    this.period = props.period;
  }
}
