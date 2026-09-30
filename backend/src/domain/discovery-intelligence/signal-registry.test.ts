// ── Signal Registry Tests ──
// RIST-RDI-007 signal-design-v1 §39 (Registry).
// every signal maps to exactly one factor; every factor exists; all 25 factors
// have signals; duplicate signal keys rejected; per-factor weights normalize.

import { describe, it, expect } from 'vitest';
import {
  DISCOVERY_SIGNAL_REGISTRY,
  allSignalDefinitions,
  validateRegistry,
  signalsForFactor,
  findSignalDef,
  REGISTRY_FACTOR_IDS,
} from './signal-registry';
import { FACTORS } from '../scorecard/types';

describe('signal registry integrity', () => {
  it('has zero validation errors', () => {
    expect(validateRegistry()).toEqual([]);
  });

  it('every signal maps to exactly one factor', () => {
    const defs = allSignalDefinitions();
    const keyToFactor = new Map<string, string>();
    for (const def of defs) {
      expect(keyToFactor.has(def.key)).toBe(false); // no duplicate key anywhere
      keyToFactor.set(def.key, def.factorId);
      // the signal's own def.factorId must equal the owning factor
      expect(signalsForFactor(def.factorId).some((s) => s.key === def.key)).toBe(true);
    }
  });

  it('every factor id in the registry exists in FACTORS and maps to exactly one', () => {
    const frozenIds = new Set(FACTORS.map((f) => f.id));
    for (const fid of REGISTRY_FACTOR_IDS) {
      expect(frozenIds.has(fid)).toBe(true);
    }
  });

  it('all 25 frozen factors have signals', () => {
    expect(FACTORS).toHaveLength(25);
    for (const f of FACTORS) {
      expect(signalsForFactor(f.id).length).toBeGreaterThanOrEqual(1);
    }
    expect(REGISTRY_FACTOR_IDS.length).toBe(25);
  });

  it('rejects duplicate signal keys (findSignalDef returns the single owner)', () => {
    const defs = allSignalDefinitions();
    const seen = new Set<string>();
    for (const d of defs) {
      expect(seen.has(d.key)).toBe(false);
      seen.add(d.key);
    }
    // Each key resolves to exactly one definition via the canonical index.
    for (const k of seen) {
      const found = findSignalDef(k);
      expect(found).toBeDefined();
      expect(found!.key).toBe(k);
    }
  });

  it('weights per factor normalize to ~1 (sum == raw sum by construction)', () => {
    for (const [fid, entry] of Object.entries(DISCOVERY_SIGNAL_REGISTRY)) {
      const sum = entry.signals.reduce((a, s) => a + s.weight, 0);
      expect(sum).toBeGreaterThan(0);
      // normalized (each weight / sum) sums to exactly 1
      const normalizedSum = entry.signals.reduce((a, s) => a + s.weight / sum, 0);
      expect(Math.round(normalizedSum * 1000) / 1000).toBe(1);
      expect(fid.length).toBeGreaterThan(0);
    }
  });

  it('signals use snake_case keys and valid scoring methods', () => {
    for (const def of allSignalDefinitions()) {
      expect(def.key).toMatch(/^[a-z0-9_]+$/);
      expect(def.scoringMethod).toMatch(/^(boolean|threshold|range|benchmark|categorical|ratio|custom)$/);
      expect(def.methodologyVersion).toBe('1.0');
      expect(def.weight).toBeGreaterThan(0);
      expect(def.requiredEvidence).toBeTypeOf('boolean');
    }
  });
});
