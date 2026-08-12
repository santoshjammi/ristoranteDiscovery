// Domain layer — Discovery bounded context
// Pure domain. Zero framework dependencies.

export { ScoreDimension, type ScoreDimensionProps, type ScoreValue } from './ScoreDimension';
export { FrictionFunction } from './FrictionFunction';
export { Scorecard, type ScorecardStatus, type ScorecardProps } from './Scorecard';
export { Evidence, type EvidenceProps, type EvidenceSource, type ConfidenceLevel } from './Evidence';
export { DigitalTwin, type DigitalTwinProps, type TwinStatus } from './DigitalTwin';
export { Recommendation, type RecommendationProps, type RecommendationPriority, type RecommendationStatus } from './Recommendation';
export {
  type DomainEvent,
  DigitalTwinCreated,
  ScoresRecalculated,
  ScoreThresholdCrossed,
  RecommendationsGenerated,
} from './events';
