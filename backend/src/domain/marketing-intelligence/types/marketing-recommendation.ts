export type MarketingRecommendationTimeToImpact =
  | 'immediate'
  | '7_days'
  | '30_days'
  | '90_days'
  | 'long_term';

export interface MarketingRecommendation {
  id: string;
  restaurantId: string;
  opportunityId: string;
  factorId: string;
  factorNumber: number;
  title: string;
  internalReason: string;
  evidenceRefs: string[];
  recommendedAction: string;
  successMetric: string;
  expectedTimeToImpact: MarketingRecommendationTimeToImpact;
  confidence: number;          // 0..1
  status: 'IDENTIFIED' | 'RECOMMENDED' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'MEASURING' | 'IMPROVED' | 'NO_EFFECT' | 'REGRESSED';
}
