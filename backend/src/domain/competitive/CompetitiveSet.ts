// Domain aggregate — a competitive set for a single restaurant
// Pure domain — zero framework dependencies

import { Competitor } from './Competitor';
import { Benchmark } from './Benchmark';
import { CompetitiveInsight } from './CompetitiveInsight';

export type CompetitiveSetStatus = 'initialized' | 'generated' | 'stale';

export interface CompetitiveSetProps {
  readonly id: string;
  readonly restaurantId: string;
  readonly competitors: Competitor[];
  readonly benchmarks: Benchmark[];
  readonly insights: CompetitiveInsight[];
  readonly generatedAt: Date | null;
  readonly status: CompetitiveSetStatus;
}

export class CompetitiveSet {
  public readonly id: string;
  public readonly restaurantId: string;
  public readonly competitors: readonly Competitor[];
  public readonly benchmarks: readonly Benchmark[];
  public readonly insights: readonly CompetitiveInsight[];
  public readonly generatedAt: Date | null;
  public readonly status: CompetitiveSetStatus;

  constructor(props: CompetitiveSetProps) {
    this.id = props.id;
    this.restaurantId = props.restaurantId;
    this.competitors = Object.freeze([...props.competitors]);
    this.benchmarks = Object.freeze([...props.benchmarks]);
    this.insights = Object.freeze([...props.insights]);
    this.generatedAt = props.generatedAt;
    this.status = props.status;
  }

  get competitorCount(): number {
    return this.competitors.length;
  }

  get topStrength(): CompetitiveInsight | undefined {
    return this.insights
      .filter(i => i.type === 'strength')
      .sort((a, b) => b.gapSize - a.gapSize)[0];
  }

  get topWeakness(): CompetitiveInsight | undefined {
    return this.insights
      .filter(i => i.type === 'weakness')
      .sort((a, b) => Math.abs(b.gapSize) - Math.abs(a.gapSize))[0];
  }
}
