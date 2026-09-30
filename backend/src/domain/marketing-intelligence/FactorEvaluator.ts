import {
  MARKETING_FACTORS,
  factorByNumber,
} from './marketing-factor-registry';
import type {
  MarketingFactorObservation,
  MarketingFactorStatus,
} from './types';

export interface RdiScoreResult {
  factorId: string;
  score: number | null;
  confidence: number;
  coverage?: { measured: number; total: number };
}

export interface MarketingCapabilities {
  hasOnlineOrdering: boolean;
  hasReservations: boolean;
  hasDelivery: boolean;
  hasWebsite: boolean;
}

export interface FactorEvaluatorOptions {
  now?: Date;
}

const KEBAB_SLUG = /[a-z]+/gi;

function kebabSlug(name: string): string {
  const parts = name.toLowerCase().match(KEBAB_SLUG) ?? [];
  return parts.join('-');
}

export function statusFromScore(score: number | null): MarketingFactorStatus {
  if (score === null) return 'PENDING_DATA';
  if (score >= 80) return 'HEALTHY';
  if (score >= 60) return 'OPPORTUNITY';
  if (score >= 40) return 'WEAK';
  return 'CRITICAL';
}

export function evaluateFactors(
  _restaurantId: string,
  rdiResults: RdiScoreResult[],
  capabilities: MarketingCapabilities,
  options?: FactorEvaluatorOptions
): MarketingFactorObservation[] {
  const indexByRdi = new Map<string, RdiScoreResult>();
  for (const result of rdiResults) {
    indexByRdi.set(result.factorId, result);
  }

  const now: Date | undefined = options?.now ?? undefined;
  const observations: MarketingFactorObservation[] = [];

  for (const def of MARKETING_FACTORS) {
    const factorId =
      'mf_' + String(def.factorNumber).padStart(3, '0') + '_' + kebabSlug(def.name);

    // Case 3 — Capability-gated NOT_APPLICABLE
    if (def.factorNumber === 51 && !capabilities.hasOnlineOrdering) {
      observations.push({
        factorNumber: def.factorNumber,
        domainId: def.domainId,
        factorId,
        name: def.name,
        score: null,
        status: 'NOT_APPLICABLE',
        confidence: 0,
        coverage: { measured: 0, total: 0 },
        evidenceCount: 0,
      });
      continue;
    }

    if (def.factorNumber === 53 && !capabilities.hasReservations) {
      observations.push({
        factorNumber: def.factorNumber,
        domainId: def.domainId,
        factorId,
        name: def.name,
        score: null,
        status: 'NOT_APPLICABLE',
        confidence: 0,
        coverage: { measured: 0, total: 0 },
        evidenceCount: 0,
      });
      continue;
    }

    // Case 4 — RDI-mapped factors
    if (def.rdiFactorId !== null) {
      const src = indexByRdi.get(def.rdiFactorId);
      if (src && src.score !== null) {
        observations.push({
          factorNumber: def.factorNumber,
          domainId: def.domainId,
          factorId,
          name: def.name,
          score: src.score,
          status: statusFromScore(src.score),
          confidence: src.confidence,
          coverage: src.coverage ?? { measured: 0, total: 0 },
          evidenceCount: 1,
          lastObservedAt: now,
        });
      } else {
        observations.push({
          factorNumber: def.factorNumber,
          domainId: def.domainId,
          factorId,
          name: def.name,
          score: null,
          status: 'PENDING_DATA',
          confidence: 0,
          coverage: { measured: 0, total: 0 },
          evidenceCount: 0,
        });
      }
      continue;
    }

    // Case 5 — CONNECTED but no RDI mapping
    if (def.evidenceClass === 'CONNECTED') {
      observations.push({
        factorNumber: def.factorNumber,
        domainId: def.domainId,
        factorId,
        name: def.name,
        score: null,
        status: 'NOT_CONNECTED',
        confidence: 0,
        coverage: { measured: 0, total: 0 },
        evidenceCount: 0,
      });
      continue;
    }

    // Case 6 — Remaining (PUBLIC/HYBRID/DERIVED without rdiFactorId)
    observations.push({
      factorNumber: def.factorNumber,
      domainId: def.domainId,
      factorId,
      name: def.name,
      score: null,
      status: 'PENDING_DATA',
      confidence: 0,
      coverage: { measured: 0, total: 0 },
      evidenceCount: 0,
    });
  }

  return observations;
}
