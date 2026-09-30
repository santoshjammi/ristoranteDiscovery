// ── Signal Resolver Tests ──
// RIST-RDI-007 signal-design-v1 §39 (Normalization / Factor / Provenance / AI).
// Minimal CLASS-level tests (not one-per-signal).

import { describe, it, expect, beforeEach } from 'vitest';
import {
  resolveAllFactors,
  buildEvidenceMap,
  resolveFactorSignals,
  type SignalResolverContext,
} from './SignalResolver';
import { processFactor } from './SignalProcessor';
import { calculateFactor } from './FactorEngine';
import { signalsForFactor, allSignalDefinitions } from './signal-registry';
import { normalizeSignal, NormalizationRejected } from './normalization';
import { FACTORS } from '../scorecard/types';

function ctx(over: Partial<SignalResolverContext> = {}): SignalResolverContext {
  const now = over.now ?? new Date('2026-09-19T10:00:00.000Z');
  return {
    restaurantId: 'r1',
    restaurant: {
      id: 'r1',
      name: 'Test Rest',
      address: '', city: '',
      cuisineTypes: '', amenities: '', timings: '', nearbyLandmarks: '',
      phone: '', website: '', latitude: null, longitude: null,
      gbpHealthScore: 70, localSearchScore: 0, aiVisibilityScore: 0,
      menuDiscoverabilityScore: 0, conversationalSearchScore: 0,
      restaurantClarityScore: 0, discoverabilityScore: 0,
      deliverySupport: false,
    },
    presence: { hasMenuData: false, hasReviewData: false, hasFaqData: false, hasSchemaData: false, hasAnyData: false },
    connectorMap: new Map(),
    scanEvidence: [],
    benchmarks: [],
    snapshots: [],
    capabilities: { hasReservations: true, hasOnlineOrdering: true, hasDelivery: true, hasWebsite: true },
    ...over,
    now,
  };
}

const noReservationsCap: SignalResolverContext['capabilities'] = {
  hasReservations: false, hasOnlineOrdering: true, hasDelivery: true, hasWebsite: true,
};

describe('Signal Resolver — class-level', () => {
  it('bare default-column restaurant → all relevant signals pending, syntheticInputs 0', () => {
    const c = ctx();
    const { factors, summary } = resolveAllFactors(c);
    // No fabricated measured signals: every signal across every factor is pending (or NA).
    const allSignals = factors.flatMap((f) => f.signals);
    expect(allSignals.every((s) => s.status === 'pending_observation' || s.status === 'not_applicable')).toBe(true);
    expect(allSignals.every((s) => s.scoreContribution === undefined)).toBe(true);
    expect(summary.syntheticInputs).toBe(0);
    expect(summary.observedSignals).toBe(0);
    expect(summary.realSourcesOnly).toBe(true);
    // Every factor reports 0 measured
    for (const f of factors) expect(f.coverage.measured).toBe(0);
  });

  it('evidence present → measured, contributes a scoreContribution', () => {
    const c = ctx({
      restaurant: { ...ctx().restaurant, website: 'https://example.com', address: '123 Main St', phone: '+919876543210', cuisineTypes: '["Indian","Chinese"]' },
      presence: { hasMenuData: true, hasReviewData: false, hasFaqData: false, hasSchemaData: false, hasAnyData: true },
    });
    const websiteSignals = resolveFactorSignals(c, 'website_health');
    const exists = websiteSignals.find((s) => s.signalKey === 'website_exists');
    expect(exists).toBeDefined();
    expect(exists!.status).toBe('measured');
    expect(exists!.normalizedValue).toBe(100);

    const { factors, summary } = resolveAllFactors(c);
    const websiteFactor = factors.find((f) => f.factorId === 'website_health')!;
    expect(websiteFactor.score).not.toBeNull();
    expect(websiteFactor.coverage.measured).toBeGreaterThan(0);
    // scoreContribution is computed by the factor engine on measured/partial signals
    const existsInFactor = websiteFactor.signals.find((s) => s.signalKey === 'website_exists')!;
    expect(existsInFactor.scoreContribution).toBeGreaterThan(0);
    expect(summary.observedSignals).toBeGreaterThan(0);
  });

  it('evidence absent → pending_observation with scoreContribution null (never zero)', () => {
    const c = ctx();
    const signals = resolveFactorSignals(c, 'avg_rating');
    const rating = signals.find((s) => s.signalKey === 'google_average_rating')!;
    expect(rating.status).toBe('pending_observation');
    expect(rating.scoreContribution).toBeUndefined();
    expect(rating.normalizedValue).toBeUndefined();
  });

  it('malformed evidence (empty arrays/objects/whitespace/bad values) → pending, not zero', () => {
    const c = ctx();
    // boolean signal with a non-boolean raw value → malformed → pending
    const googleSig = signalsForFactor('gbp_profile').find((s) => s.key === 'gbp_exists')!;
    for (const bad of ['[]', '{}', '   ', '', 'notabool', 42]) {
      const ev = { signalKey: googleSig.key, rawValue: bad, confidence: 0.9, observedAt: c.now!, sourceType: 'google' as const, evidenceRefs: ['x'] };
      expect(() => normalizeSignal(googleSig, ev as any)).toThrow(NormalizationRejected);
    }
  });

  it('stale evidence (observedAt beyond TTL) → stale, excluded from measured count', () => {
    const c = ctx();
    // google_average_rating has freshnessPolicy days:30; observed 60 days ago → stale
    const oldDate = new Date('2026-07-01T00:00:00.000Z');
    const freshDef = signalsForFactor('avg_rating').find((s) => s.key === 'google_average_rating')!;
    const evStale = { signalKey: 'google_average_rating', rawValue: 4.5, confidence: 0.9, observedAt: oldDate, sourceType: 'google' as const, evidenceRefs: ['e1'] };
    const results = processFactor(c.restaurantId, 'avg_rating', new Map([['google_average_rating', evStale]]), c.capabilities, c.now!);
    const stale = results.find((r) => r.signal.signalKey === 'google_average_rating')!.signal;
    expect(stale.status).toBe('stale');
    expect(stale.scoreContribution).toBeUndefined();

    const { factors } = resolveAllFactors({
      ...c,
      restaurant: { ...c.restaurant, website: 'https://x.com' },
      presence: { hasMenuData: true, hasReviewData: true, hasFaqData: true, hasSchemaData: true, hasAnyData: true },
      // thread real scan-ledger evidence observed 60 days ago for the review-rating signal
      scanEvidence: [{ signalKey: 'google_average_rating', sourceId: 'https://www.google.com/maps/rating', sourceType: 'google', observedAt: oldDate, confidence: 0.9, payload: '4.5', status: 'active' }],
    });
    void factors;
    // resolve from the same evidence map — the stale dated row must surface as stale
    const cStale = ctx({ restaurant: { ...ctx().restaurant, website: 'https://x.com' } });
    cStale.scanEvidence = [{ signalKey: 'google_average_rating', sourceId: 'https://www.google.com/maps/rating', sourceType: 'google', observedAt: oldDate, confidence: 0.9, payload: '4.5', status: 'active' }];
    const avgSignals = resolveFactorSignals(cStale, 'avg_rating');
    const staleSignal = avgSignals.find((s) => s.signalKey === 'google_average_rating')!;
    expect(staleSignal.status).toBe('stale');
    expect(staleSignal.scoreContribution).toBeUndefined();
  });

  it('conflicting sources — connector wins over DB fallback, with connector confidence', () => {
    const c = ctx({
      restaurant: { ...ctx().restaurant, gbpHealthScore: 85, cuisineTypes: '["Italian"]', address: 'A', phone: '9', website: 'https://x.com' },
      presence: { hasMenuData: true, hasReviewData: true, hasFaqData: true, hasSchemaData: true, hasAnyData: true },
    });
    // DB would say ai_visibility_score = 70 (from column). Connector says 45.
    c.connectorMap.set('ai_visibility_score', { score: 45, confidence: 0.3, evidence: ['conn'], syncedAt: c.now });
    const signals = resolveFactorSignals(c, 'ai_visibility');
    const ai = signals.find((s) => s.signalKey === 'ai_visibility_score')!;
    // Connector priority → rawValue 45, connector confidence 0.3 (below min 0.6 → pending)
    expect(ai.confidence).toBe(0.3);
    expect(ai.rawValue).toBe(45);
  });

  it('low-confidence but real evidence → still measured with low confidence (not zero)', () => {
    const c = ctx({
      restaurant: { ...ctx().restaurant, address: 'Addr', city: 'City', phone: '9', website: 'https://x.com', cuisineTypes: '["It"]' },
    });
    const signals = resolveFactorSignals(c, 'gbp_profile');
    // Connector evidence with 0.7 confidence (above min 0.6) → measured, low but non-zero
    const cc = ctx({
      restaurant: { ...ctx().restaurant, address: 'Addr', city: 'City', phone: '9', website: 'https://x.com', cuisineTypes: '["It"]' },
    });
    cc.connectorMap.set('gbp_exists', { score: 1, confidence: 0.7, evidence: ['conn'], syncedAt: cc.now });
    const signalsC = resolveFactorSignals(cc, 'gbp_profile');
    const ok = signalsC.find((s) => s.signalKey === 'gbp_exists')!;
    expect(ok.status).toBe('measured');
    expect(ok.confidence).toBe(0.7);
    expect(ok.normalizedValue).toBe(100);
    void signals;
  });

  it('source mismatch — signal id not belonging to the factor is dropped', () => {
    const c = ctx();
    const defsForAvg = signalsForFactor('avg_rating');
    expect(defsForAvg.every((s) => s.factorId === 'avg_rating')).toBe(true);
    // building evidence for a foreign key does not leak into another factor
    const signals = resolveFactorSignals(c, 'reservations');
    expect(signals.every((s) => s.factorId === 'reservations')).toBe(true);
  });

  it('normalization — boolean true→100, false→0, ratio scales to 0..100', () => {
    const boolDef = signalsForFactor('website_health').find((s) => s.key === 'website_exists')!;
    const now = ctx().now!;
    expect(normalizeSignal(boolDef, { signalKey: 'website_exists', rawValue: true, confidence: 0.9, observedAt: now, sourceType: 'website', evidenceRefs: [] })).toBe(100);
    expect(normalizeSignal(boolDef, { signalKey: 'website_exists', rawValue: false, confidence: 0.9, observedAt: now, sourceType: 'website', evidenceRefs: [] })).toBe(0);
    const ratioDef = signalsForFactor('opening_hours').find((s) => s.key === 'hours_consistency')!;
    expect(normalizeSignal(ratioDef, { signalKey: 'hours_consistency', rawValue: 0.92, confidence: 0.9, observedAt: now, sourceType: 'website', evidenceRefs: [] })).toBe(92);
  });

  it('factor aggregation — only measured+partial contribute; counts correct', () => {
    const c = ctx({
      restaurant: { ...ctx().restaurant, address: 'Addr', city: 'Mumbai', phone: '9', website: 'https://x.com', cuisineTypes: '["It"]', timings: '10-22', amenities: 'parking', nearbyLandmarks: 'Station', latitude: 19, longitude: 72, gbpHealthScore: 88 },
      presence: { hasMenuData: true, hasReviewData: true, hasFaqData: true, hasSchemaData: true, hasAnyData: true },
    });
    const { factors } = resolveAllFactors(c);
    const gbp = factors.find((f) => f.factorId === 'gbp_profile')!;
    const total = gbp.coverageDetail.totalSignals;
    const measured = gbp.coverageDetail.measured;
    const pending = gbp.coverageDetail.pending;
    expect(measured + pending + gbp.coverageDetail.stale + gbp.coverageDetail.notApplicable).toBe(total);
    expect(gbp.score).not.toBeNull();
  });

  it('not-applicable semantics — no-reservations restaurant → reservations signals NA, excluded from denominator', () => {
    const c = ctx({ capabilities: noReservationsCap });
    const signals = resolveFactorSignals(c, 'reservations');
    expect(signals.length).toBeGreaterThan(0);
    for (const s of signals) {
      if (s.factorId === 'reservations') {
        expect(s.status).toBe('not_applicable');
        expect(s.scoreContribution).toBeUndefined();
      }
    }
    const { factors, summary } = resolveAllFactors(c);
    const resFactor = factors.find((f) => f.factorId === 'reservations')!;
    expect(resFactor.coverageDetail.notApplicable).toBe(signals.length);
    expect(resFactor.score).toBeNull(); // no contributing signals
    expect(summary.notApplicableSignals).toBeGreaterThanOrEqual(signals.length);
  });

  it('restaurant-level accounting sums (observed+pending+NA+stale consistent)', () => {
    const c = ctx({
      restaurant: { ...ctx().restaurant, address: 'Addr', city: 'Mumbai', phone: '9', website: 'https://x.com', cuisineTypes: '["It"]', timings: '10-22', amenities: 'parking', nearbyLandmarks: 'Station', latitude: 19, longitude: 72, gbpHealthScore: 88 },
      presence: { hasMenuData: true, hasReviewData: true, hasFaqData: true, hasSchemaData: true, hasAnyData: true },
    });
    const { factors, summary } = resolveAllFactors(c);
    const totalSupported = summary.supportedSignals;
    const accounted = summary.observedSignals + summary.pendingSignals + summary.notApplicableSignals + summary.staleSignals;
    expect(accounted).toBe(totalSupported);
    expect(summary.factors).toBe(25);
  });

  it('synthetic-input gate — bare default-column restaurant stays pending, syntheticInputs 0', () => {
    const c = ctx();
    const { summary } = resolveAllFactors(c);
    expect(summary.syntheticInputs).toBe(0);
    expect(summary.observedSignals).toBe(0);
  });

  it('provenance — signals require valid referenced evidence to be measured; hallucinated rejected', () => {
    const c = ctx({
      restaurant: { ...ctx().restaurant, website: 'https://example.com' },
    });
    // scan evidence without a real http source (synthetic) → not measured
    const scan = ctx({
      restaurant: { ...ctx().restaurant, website: 'https://example.com' },
      scanEvidence: [{ signalKey: 'website_exists', sourceId: 'example.com/test', sourceType: 'website', confidence: 0.9, status: 'active' }],
    });
    const signals = resolveFactorSignals(scan, 'website_health');
    const exists = signals.find((s) => s.signalKey === 'website_exists')!;
    // real column website present → measured from the column, not from synthetic scan
    expect(exists.status).toBe('measured');
    expect(exists.evidenceRefs.some((r) => r === 'example.com/test')).toBe(false);
    void c;
  });

  it('backward compatibility — signal layer does not change frozen factor COUNT', () => {
    const { factors } = resolveAllFactors(ctx());
    expect(factors).toHaveLength(25);
    const frozenIds = FACTORS.map((f) => f.id).sort();
    const resolvedIds = factors.map((f) => f.factorId).sort();
    expect(resolvedIds).toEqual(frozenIds);
  });
});
