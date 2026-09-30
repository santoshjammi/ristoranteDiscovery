export type MarketingFunnelStage = 'awareness' | 'conversion' | 'loyalty';
export type EvidenceClass = 'PUBLIC' | 'CONNECTED' | 'HYBRID' | 'DERIVED' | 'DIRECT';
export type Controllability = 'controlled' | 'partial' | 'uncontrollable';
export type ExpectedTimeToImpact = 'immediate' | 'near-term' | 'medium' | 'long-term';
export type ImpactLevel = 'high' | 'medium' | 'low';

export type MarketingFactorStatus =
  | 'HEALTHY'
  | 'OPPORTUNITY'
  | 'WEAK'
  | 'CRITICAL'
  | 'NOT_APPLICABLE'
  | 'NOT_CONNECTED'
  | 'PENDING_DATA'
  | 'INSUFFICIENT_HISTORY';

export interface MarketingDomain {
  id: string;
  name: string;
  description: string;
}

export interface MarketingFactorMethodology {
  type:
    | 'boolean'
    | 'threshold'
    | 'range'
    | 'ratio'
    | 'benchmark'
    | 'categorical'
    | 'trend'
    | 'composite'
    | 'custom';
  version: string;
}

export interface MarketingFactorDefinition {
  factorNumber: number;
  domainId: string;
  name: string;
  label?: string;
  description: string;
  funnelStages: MarketingFunnelStage[];
  impactLevel: ImpactLevel;
  evidenceClass: EvidenceClass;
  controllability: Controllability;
  expectedTimeToImpact: ExpectedTimeToImpact;
  recommendedActions: string[];
  /** Canonical methodology this factor is evaluated with (resolved via methodology registry). */
  methodology?: MarketingFactorMethodology;
  /** Signal ids this factor requires/uses (declarative per blueprint §5). */
  requiredSignals?: string[];
  optionalSignals?: string[];
  /** Declarative applicability rule (e.g. 'capability:hasOnlineOrdering'). Absent = always applicable. */
  applicabilityRule?: string;
  /** Expected freshness expectation, e.g. 'days:30'. */
  freshnessExpectation?: string;
  methodologyVersion: 'marketing-model-v1.0';
  /** Frozen RDI factor this marketing factor maps from, if any. */
  rdiFactorId: string | null;
}

export interface MarketingFactorObservation {
  factorNumber: number;
  domainId: string;
  factorId: string;
  name: string;
  label?: string;
  score: number | null;
  status: MarketingFactorStatus;
  confidence: number;                       // 0..100
  coverage: { measured: number; total: number };
  evidenceCount: number;
  lastObservedAt?: Date;
  /** Signal ids that contributed to this observation (blueprint root-cause chain). */
  contributorSignalIds?: string[];
}

export interface MarketingIntelligenceSnapshot {
  restaurantId: string;
  methodologyVersion: 'marketing-model-v1.0';
  domains: number;
  factors: number;
  healthyFactors: number;
  opportunityFactors: number;
  weakFactors: number;
  criticalFactors: number;
  notApplicableFactors: number;
  notConnectedFactors: number;
  pendingDataFactors: number;
  insufficientHistoryFactors: number;
  realSourcesOnly: true;
}
