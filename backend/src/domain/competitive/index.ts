// Domain layer — Competitive Intelligence bounded context
// Pure domain. Zero framework dependencies.

export { Competitor, type CompetitorProps, type ScoreGap } from './Competitor';
export { Benchmark, type BenchmarkProps } from './Benchmark';
export { CompetitiveInsight, type CompetitiveInsightProps, type CompetitiveInsightType, type InsightSeverity } from './CompetitiveInsight';
export { CompetitiveSet, type CompetitiveSetProps, type CompetitiveSetStatus } from './CompetitiveSet';
export { CompetitiveSetGenerated, CompetitiveInsightDetected } from './events';
