// Domain events for the Market Intelligence bounded context
// Past-tense, typed, carry defined payloads

import { BaseDomainEvent } from '../discovery/events';

export class MarketAnalysisCompleted extends BaseDomainEvent {
  public readonly eventName = 'market.analysis.completed';

  constructor(
    aggregateId: string,
    public readonly areaCount: number,
    public readonly insightCount: number,
    public readonly topGap: string,
  ) {
    super(aggregateId);
  }
}

export class CuisineGapDetected extends BaseDomainEvent {
  public readonly eventName = 'market.cuisine-gap.detected';

  constructor(
    aggregateId: string,
    public readonly area: string,
    public readonly cuisine: string,
  ) {
    super(aggregateId);
  }
}
