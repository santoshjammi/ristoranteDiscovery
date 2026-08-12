// Domain value object — an insight derived from competitive analysis
// Pure domain — zero framework dependencies

export type CompetitiveInsightType = 'strength' | 'weakness' | 'opportunity' | 'threat';
export type InsightSeverity = 'positive' | 'neutral' | 'warning' | 'critical';

export interface CompetitiveInsightProps {
  readonly type: CompetitiveInsightType;
  readonly dimension: string;
  readonly description: string;
  readonly gapSize: number;
  readonly severity: InsightSeverity;
}

export class CompetitiveInsight {
  public readonly type: CompetitiveInsightType;
  public readonly dimension: string;
  public readonly description: string;
  public readonly gapSize: number;
  public readonly severity: InsightSeverity;

  constructor(props: CompetitiveInsightProps) {
    this.type = props.type;
    this.dimension = props.dimension;
    this.description = props.description;
    this.gapSize = props.gapSize;
    this.severity = props.severity;
  }
}
