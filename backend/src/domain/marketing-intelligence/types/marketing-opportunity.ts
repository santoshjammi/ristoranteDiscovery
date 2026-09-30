export type OpportunitySeverity = 'low' | 'medium' | 'high' | 'critical';
export type OpportunityImpact = 'low' | 'medium' | 'high';
export type OpportunityEffort = 'low' | 'medium' | 'high';

export interface MarketingOpportunity {
  id: string;
  restaurantId: string;
  factorId: string;
  factorNumber: number;
  name: string;
  rootCauseSignalIds: string[];
  severity: OpportunitySeverity;
  expectedImpact: OpportunityImpact;
  effort: OpportunityEffort;
  confidence: number;          // 0..1
  strategicRelevance: number;  // 0..1
  controllability: number;     // 0..1
  evidenceRefs: string[];
  score: number | null;
}
