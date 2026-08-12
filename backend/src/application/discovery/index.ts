// Application layer — Discovery bounded context
// Use cases and application services

export { CalculateScoreUseCase, type ScoreInput, type CalculateScoreResult } from './CalculateScoreUseCase';
export { EvidenceEngine, type EvidenceInput } from './EvidenceEngine';
export { RecommendationEngine } from './RecommendationEngine';
export { GenerateReportUseCase, type VisibilityReport, type ReportSection } from './GenerateReportUseCase';
export {
  type DigitalTwinRepository,
  type ScorecardRepository,
  type EvidenceRepository,
  type RecommendationRepository,
} from './repositories';
