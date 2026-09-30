export interface MarketingEvidenceRef {
  ref: string;
  source: string;
  sourceUrl?: string;
  observedAt?: Date;
  confidence: number;          // 0..1
}
