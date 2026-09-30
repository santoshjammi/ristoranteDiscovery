// ── Methodology Registry (blueprint §9) ──
// Resolves a factor's declared methodology type to a reusable scoring strategy.
// Strategies land in strategies/ (later step); this file defines the contract +
// a name -> strategy map that will hold them. Domain-pure: no infra imports.
import { MarketingFactorMethodology } from '../types/marketing-factor';
import { MarketingSignalObservation } from '../types/marketing-signal';

export interface SignalScore {
  value: number | null;    // normalized 0..100; null when not scoreable
  rawValue?: unknown;
  confidence: number;      // 0..1
  supported: boolean;      // true when a score is computable
}

export interface SignalScoringStrategyPort {
  readonly type: MarketingFactorMethodology['type'];
  evaluate(definition: MarketingFactorMethodology, signals: MarketingSignalObservation[]): SignalScore;
}

/** Unimplemented placeholder — strategies land in a later step. Non-supported, deterministic. */
export function createUnimplementedStrategy(type: MarketingFactorMethodology['type']): SignalScoringStrategyPort {
  return { type, evaluate: () => ({ value: null, confidence: 0, supported: false }) };
}

/** Canonical methodology-type -> strategy registry. */
export const METHODOLOGY_REGISTRY = new Map<MarketingFactorMethodology['type'], SignalScoringStrategyPort>();

export function resolveMethodology(type: MarketingFactorMethodology['type']): SignalScoringStrategyPort {
  const existing = METHODOLOGY_REGISTRY.get(type);
  if (existing) return existing;
  const placeholder = createUnimplementedStrategy(type);
  METHODOLOGY_REGISTRY.set(type, placeholder);
  return placeholder;
}

export { MarketingFactorMethodology };
