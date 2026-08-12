// Domain events for the Discovery bounded context
// Past-tense, typed, carry defined payloads

export interface DomainEvent {
  readonly eventName: string;
  readonly eventVersion: number;
  readonly occurredAt: Date;
  readonly aggregateId: string;
}

export abstract class BaseDomainEvent implements DomainEvent {
  public abstract readonly eventName: string;
  public readonly eventVersion: number = 1;
  public readonly occurredAt: Date;

  constructor(public readonly aggregateId: string) {
    this.occurredAt = new Date();
  }
}

export class DigitalTwinCreated extends BaseDomainEvent {
  public readonly eventName = 'discovery.digital-twin.created';

  constructor(
    aggregateId: string,
    public readonly restaurantId: string,
  ) {
    super(aggregateId);
  }
}

export class ScoresRecalculated extends BaseDomainEvent {
  public readonly eventName = 'discovery.scores.recalculated';

  constructor(
    aggregateId: string,
    public readonly restaurantId: string,
    public readonly previousOverallScore: number | null,
    public readonly newOverallScore: number,
    public readonly changedDimensions: string[],
  ) {
    super(aggregateId);
  }
}

export class ScoreThresholdCrossed extends BaseDomainEvent {
  public readonly eventName = 'discovery.score.threshold-crossed';

  constructor(
    aggregateId: string,
    public readonly restaurantId: string,
    public readonly dimension: string,
    public readonly previousScore: number,
    public readonly newScore: number,
    public readonly threshold: number,
  ) {
    super(aggregateId);
  }
}

export class RecommendationsGenerated extends BaseDomainEvent {
  public readonly eventName = 'discovery.recommendations.generated';

  constructor(
    aggregateId: string,
    public readonly restaurantId: string,
    public readonly count: number,
    public readonly topPriority: string,
  ) {
    super(aggregateId);
  }
}
