// Domain events for the Competitive Intelligence bounded context
// Past-tense, typed, carry defined payloads

import { BaseDomainEvent } from '../discovery/events';

export class CompetitiveSetGenerated extends BaseDomainEvent {
  public readonly eventName = 'competitive.set.generated';

  constructor(
    aggregateId: string,
    public readonly restaurantId: string,
    public readonly competitorCount: number,
    public readonly topStrength: string,
    public readonly topWeakness: string,
  ) {
    super(aggregateId);
  }
}

export class CompetitiveInsightDetected extends BaseDomainEvent {
  public readonly eventName = 'competitive.insight.detected';

  constructor(
    aggregateId: string,
    public readonly restaurantId: string,
    public readonly insightType: string,
    public readonly dimension: string,
    public readonly gapSize: number,
  ) {
    super(aggregateId);
  }
}
