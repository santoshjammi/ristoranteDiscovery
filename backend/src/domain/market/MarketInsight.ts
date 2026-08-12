// Domain value object — an insight derived from market analysis
// Pure domain — zero framework dependencies

export type MarketInsightType = 'saturation' | 'gap' | 'trend' | 'benchmark';
export type InsightSeverity = 'positive' | 'neutral' | 'warning' | 'critical';

export interface MarketInsightProps {
  readonly type: MarketInsightType;
  readonly area: string;
  readonly cuisine: string | null;
  readonly description: string;
  readonly metric: number;
  readonly severity: InsightSeverity;
}

export class MarketInsight {
  public readonly type: MarketInsightType;
  public readonly area: string;
  public readonly cuisine: string | null;
  public readonly description: string;
  public readonly metric: number;
  public readonly severity: InsightSeverity;

  constructor(props: MarketInsightProps) {
    this.type = props.type;
    this.area = props.area;
    this.cuisine = props.cuisine;
    this.description = props.description;
    this.metric = props.metric;
    this.severity = props.severity;
  }
}
