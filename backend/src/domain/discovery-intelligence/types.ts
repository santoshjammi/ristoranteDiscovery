// ── Discovery Intelligence — Core Domain Objects ──
// RIST-RDI-007 signal-design-v1 §2, §3, §5, §15.
// Observation tells us what exists. Signal tells us what an observation means.
// Factor tells us how the restaurant performs in that area.

export type ObservationSourceType =
  | 'google'
  | 'website'
  | 'menu'
  | 'review'
  | 'delivery'
  | 'reservation'
  | 'citation'
  | 'local_search'
  | 'ai_visibility'
  | 'other';

export type SignalStatus =
  | 'measured'
  | 'partial'
  | 'pending_observation'
  | 'not_applicable'
  | 'stale';

export type SignalValueStatus = SignalStatus;

export type ScoringMethod =
  | 'boolean'
  | 'threshold'
  | 'range'
  | 'benchmark'
  | 'categorical'
  | 'ratio'
  | 'custom';

export type FreshnessStatus = 'fresh' | 'aging' | 'stale';

export type FactorStatus =
  | 'excellent'
  | 'good'
  | 'fair'
  | 'needs_attention'
  | 'critical'
  | 'pending_observation';

/** A factor id from the frozen 25-factor model (see FACTORS in scorecard/types.ts). */
export type DiscoveryFactorId = string;

/** What a restaurant provably does or does not offer (drives not_applicable). */
export interface FactorCapabilities {
  /** Restaurant genuinely offers reservations capability. */
  hasReservations: boolean;
  /** Restaurant offers online ordering capability. */
  hasOnlineOrdering: boolean;
  /** Restaurant participates in food delivery. */
  hasDelivery: boolean;
  /** Restaurant has a website (real content). */
  hasWebsite: boolean;
}

// ── Observation (spec §2) ──
export interface Observation {
  id: string;
  restaurantId: string;
  sourceType: ObservationSourceType;
  sourceUrl?: string;
  observedAt: Date;
  rawValue: unknown;
  normalizedValue?: unknown;
  confidence: number;
  freshnessStatus: FreshnessStatus;
  provenance: {
    sourceName: string;
    retrievalMethod: string;
    evidenceRef?: string;
  };
}

// ── SignalDefinition contract (spec §5) ──
export interface SignalDefinition {
  key: string;
  factorId: DiscoveryFactorId;
  label: string;
  description: string;
  sourceTypes: ObservationSourceType[];
  /** Relative weight within its factor. Per-factor weights normalize to ~1. */
  weight: number;
  scoringMethod: ScoringMethod;
  /** e.g. 'continuous' | 'hours:24' | 'days:30' | 'months:6'. Drives staleness. */
  freshnessPolicy: string;
  /** Minimum observation confidence required to trust a measured value. */
  minimumConfidence: number;
  /** When true, the signal can only be 'measured' with real, referenced evidence. */
  requiredEvidence: boolean;
  methodologyVersion: string;
  /** Optional per-capability gate: when the capability is absent → not_applicable. */
  capabilityKey?: 'hasReservations' | 'hasOnlineOrdering' | 'hasDelivery' | 'hasWebsite';
  /** Optional deterministic custom normalizer key (for scoringMethod 'custom'). */
  customNormalizer?: string;
  /** Threshold/range tuning embedded so controllers never invent numbers (spec §6). */
  thresholds?: number[];
  range?: { min: number; max: number };
  categoricalMap?: Record<string, number>;
}

// ── DiscoverySignal (spec §3) ──
export interface DiscoverySignal {
  id: string;
  restaurantId: string;
  factorId: DiscoveryFactorId;
  signalKey: string;
  label: string;
  description: string;
  status: SignalStatus;
  rawValue?: unknown;
  normalizedValue?: number;
  normalizedScale?: { min: number; max: number };
  /** Score (0..100) × weight × confidence modifier — only set when contributing. */
  scoreContribution?: number;
  weight: number;
  confidence: number;
  observedAt?: Date;
  evidenceRefs: string[];
  methodologyVersion: string;
  normalizedScaleDefault?: never;
}

// ── Persisted observation/result (spec §13 DiscoverySignalObservation) ──
export interface DiscoverySignalObservation {
  id: string;
  restaurantId: string;
  signalKey: string;
  factorId: DiscoveryFactorId;
  label?: string;
  status?: SignalStatus;
  rawValue?: unknown;
  normalizedValue?: number;
  confidence: number;
  observedAt?: Date;
  methodologyVersion?: string;
  evidenceRefs?: string[];
}

/** Raw evidence fed to the processor, mapped to signals (before normalization). */
export interface SignalEvidence {
  signalKey: string;
  rawValue: unknown;
  confidence: number;
  observedAt: Date;
  sourceType: ObservationSourceType;
  sourceUrl?: string;
  evidenceRefs: string[];
}

// ── Factor coverage / results (spec §10, §15) ──
export interface FactorCoverage {
  totalSignals: number;
  measured: number;
  partial: number;
  pending: number;
  notApplicable: number;
  stale: number;
}

export interface FactorResult {
  factorId: DiscoveryFactorId;
  score: number | null;
  status: FactorStatus;
  confidence: number;
  coverage: { measured: number; total: number };
  coverageDetail: FactorCoverage;
  signals: DiscoverySignal[];
  evidenceCount: number;
  lastObservedAt?: Date;
}

export interface SignalModelSummary {
  restaurantId: string;
  methodologyVersion: string;
  supportedSignals: number;
  observedSignals: number;
  pendingSignals: number;
  notApplicableSignals: number;
  staleSignals: number;
  factors: number;
  realSourcesOnly: boolean;
  syntheticInputs: number;
  manualOverrides: number;
}
