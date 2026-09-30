export type MarketingSignalValueType =
  | 'boolean'
  | 'number'
  | 'ratio'
  | 'categorical'
  | 'text'
  | 'trend'
  | 'currency';

export interface MarketingSignalDefinition {
  id: string;
  label: string;
  factorNumber?: number;       // owning factor (optional at definition time)
  sourceClasses: string[];     // e.g. ['public','google','website']
  valueType: MarketingSignalValueType;
  freshnessPolicy: string;     // e.g. 'days:30'
  minimumConfidence: number;
  methodologyVersion: string;
}

export interface MarketingSignalObservation {
  id: string;
  restaurantId: string;
  signalId: string;
  factorNumber?: number;
  rawValue?: unknown;
  normalizedValue?: number | null;
  confidence: number;          // 0..100
  evidenceRefs: string[];
  observedAt?: Date;
  freshnessStatus?: 'fresh' | 'aging' | 'stale' | 'unknown';
}
