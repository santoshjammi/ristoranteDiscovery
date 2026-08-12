// Domain events for the Review Intelligence bounded context
// Past-tense, typed, carry defined payloads

import { BaseDomainEvent } from '../discovery/events';

export class ReviewsAnalyzed extends BaseDomainEvent {
  public readonly eventName = 'reviews.analyzed';

  constructor(
    aggregateId: string,
    public readonly restaurantId: string,
    public readonly totalReviews: number,
    public readonly averageRating: number,
    public readonly positivePercentage: number,
    public readonly negativePercentage: number,
    public readonly responseRate: number,
    public readonly ratingTrend: string,
  ) {
    super(aggregateId);
  }
}

export class CriticalReviewDetected extends BaseDomainEvent {
  public readonly eventName = 'reviews.critical.detected';

  constructor(
    aggregateId: string,
    public readonly restaurantId: string,
    public readonly reviewId: string,
    public readonly rating: number,
    public readonly isResponded: boolean,
  ) {
    super(aggregateId);
  }
}

export class RatingThresholdCrossed extends BaseDomainEvent {
  public readonly eventName = 'reviews.rating.threshold-crossed';

  constructor(
    aggregateId: string,
    public readonly restaurantId: string,
    public readonly previousAverage: number,
    public readonly newAverage: number,
    public readonly threshold: number,
  ) {
    super(aggregateId);
  }
}
