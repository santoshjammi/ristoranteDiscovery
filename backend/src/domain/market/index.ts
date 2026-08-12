// Domain layer — Market Intelligence bounded context
// Pure domain. Zero framework dependencies.

export { MarketArea, type MarketAreaProps } from './MarketArea';
export { MarketInsight, type MarketInsightProps, type MarketInsightType, type InsightSeverity } from './MarketInsight';
export { MarketTrend, type MarketTrendProps, type SentimentTrend } from './MarketTrend';
export { MarketAnalysisCompleted, CuisineGapDetected } from './events';
