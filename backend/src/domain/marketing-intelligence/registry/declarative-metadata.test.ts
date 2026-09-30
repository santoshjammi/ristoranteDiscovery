// ── Declarative Metadata Tests ──
// Validates that withDeclaredMetadata attaches methodology/requiredSignals/
// applicabilityRule/freshnessExpectation deterministically to every base factor.

import { describe, it, expect } from 'vitest';
import { BASE_FACTORS, MARKETING_FACTORS, factorByNumber, validateMarketingRegistry } from '../marketing-factor-registry';
import { withDeclaredMetadata, declareFactorMetadata } from './declarative-metadata';
import type { MarketingFactorMethodology } from '../types/marketing-factor';

const VALID_TYPES = new Set([
  'boolean', 'threshold', 'range', 'ratio', 'benchmark',
  'categorical', 'trend', 'composite', 'custom',
] as const);

describe('withDeclaredMetadata adds methodology with valid type and version', () => {
  it('attaches a methodology to every base factor', () => {
    for (const def of BASE_FACTORS) {
      const decorated = withDeclaredMetadata(def);
      expect(decorated.methodology).toBeDefined();
      expect(VALID_TYPES.has(decorated.methodology!.type)).toBe(true);
      expect(typeof decorated.methodology!.version).toBe('string');
    }
  });
});

describe('factor-specific metadata assertions', () => {
  it('factor 16 (rdiFactorId gbp_profile) -> methodology type threshold, requiredSignals [gbp_profile]', () => {
    const f = factorByNumber(16);
    expect(f?.methodology?.type).toBe('threshold');
    expect(f?.requiredSignals).toContain('gbp_profile');
  });

  it('factor 26 (rdiFactorId avg_rating, in COMPOSITE_FACTORS) -> methodology type composite', () => {
    const f = factorByNumber(26);
    expect(f?.methodology?.type).toBe('composite');
  });

  it('a CONNECTED factor without rdiFactorId (factor 11) -> methodology type ratio', () => {
    // Factor 11: Target Customer Definition — evidenceClass CONNECTED, rdiFactorId null
    const base = BASE_FACTORS.find(d => d.factorNumber === 11);
    expect(base?.evidenceClass).toBe('CONNECTED');
    expect(base?.rdiFactorId).toBe(null);
    const decorated = withDeclaredMetadata(base!);
    expect(decorated.methodology?.type).toBe('ratio');
  });

  it('a PUBLIC factor without rdiFactorId (factor 3) -> methodology type boolean', () => {
    // Factor 3: Location Economics Context — evidenceClass PUBLIC, rdiFactorId null
    const base = BASE_FACTORS.find(d => d.factorNumber === 3);
    expect(base?.evidenceClass).toBe('PUBLIC');
    expect(base?.rdiFactorId).toBe(null);
    const decorated = withDeclaredMetadata(base!);
    expect(decorated.methodology?.type).toBe('boolean');
  });

  it('factor 51 -> applicabilityRule === capability:hasOnlineOrdering', () => {
    expect(factorByNumber(51)?.applicabilityRule).toBe('capability:hasOnlineOrdering');
  });

  it('factor 53 -> applicabilityRule === capability:hasReservations', () => {
    expect(factorByNumber(53)?.applicabilityRule).toBe('capability:hasReservations');
  });
});

describe('decorated registry integrity', () => {
  it('every one of the 100 factors has a methodology and methodologyVersion === marketing-model-v1.0', () => {
    for (const f of MARKETING_FACTORS) {
      expect(f.methodology).toBeDefined();
      expect(VALID_TYPES.has(f.methodology!.type)).toBe(true);
      expect(f.methodologyVersion).toBe('marketing-model-v1.0');
    }
  });

  it('BASE_FACTORS has exactly 100 factors', () => {
    expect(BASE_FACTORS).toHaveLength(100);
  });

  it('MARKETING_FACTORS has exactly 100 decorated factors', () => {
    expect(MARKETING_FACTORS).toHaveLength(100);
  });

  it('validateMarketingRegistry returns [] (zero errors)', () => {
    const errors = validateMarketingRegistry();
    expect(errors).toEqual([]);
  });
});

describe('declareFactorMetadata deterministic behavior', () => {
  it('freshnessExpectation is always days:30', () => {
    for (const def of BASE_FACTORS) {
      const meta = declareFactorMetadata(def);
      expect(meta.freshnessExpectation).toBe('days:30');
    }
  });

  it('optionalSignals is always empty array', () => {
    for (const def of BASE_FACTORS) {
      const meta = declareFactorMetadata(def);
      expect(meta.optionalSignals).toEqual([]);
    }
  });
});
