// Domain layer — Review Intelligence bounded context
// Pure domain. Zero framework dependencies.

export { Review, type ReviewProps, type ReviewSentiment } from './Review';
export { ReviewAggregate, type ReviewAggregateProps } from './ReviewAggregate';
export { ReviewsAnalyzed, CriticalReviewDetected, RatingThresholdCrossed } from './events';
