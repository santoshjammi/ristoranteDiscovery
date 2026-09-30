// ── Deterministic Signal Normalization ──
// RIST-RDI-007 signal-design-v1 §6.
// Versioned, deterministic normalization functions. Controllers/services must
// never invent thresholds — they live here (and on the registry) so the
// methodology is inspectable and testable.

import {
  type SignalDefinition,
  type ScoringMethod,
  type SignalEvidence,
  type DiscoverySignal,
} from './types';
import { findSignalDef } from './signal-registry';

export const NORMALIZATION_VERSION = '1.0';

export type NormalizationError =
  | 'malformed'
  | 'missing'
  | 'unknown_method'
  | 'below_minimum_confidence';

/** An observed value failed to normalize — callers treat this as pending. */
export class NormalizationRejected extends Error {
  reason: NormalizationError;
  constructor(reason: NormalizationError, message: string) {
    super(message);
    this.reason = reason;
  }
}

function isRealScalar(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

/**
 * Boolean: true → 100, false → 0, missing/unknown → pending.
 * A boolean observation is only "known" when it is a real true/false.
 */
function booleanNormalize(def: SignalDefinition, ev: SignalEvidence | undefined): number | null {
  if (!ev) return null;
  if (ev.rawValue === true) return 100;
  if (ev.rawValue === false) return 0;
  if (typeof ev.rawValue === 'string') {
    const t = ev.rawValue.trim().toLowerCase();
    if (t === 'true' || t === 'yes' || t === '1') return 100;
    if (t === 'false' || t === 'no' || t === '0') return 0;
  }
  throw new NormalizationRejected('malformed', `boolean signal ${def.key} got non-boolean`);
}

/**
 * Ratio: raw is a 0..1 (or 0..100) proportion → 0..100.
 * If raw is already 0..100 scale it is passed through.
 */
function ratioNormalize(def: SignalDefinition, ev: SignalEvidence | undefined): number | null {
  if (!ev) return null;
  if (isRealScalar(ev.rawValue)) {
    const v = ev.rawValue;
    if (v > 1 && v <= 100) return clamp01(v);
    if (v >= 0 && v <= 1) return clamp01(v * 100);
  }
  if (typeof ev.rawValue === 'string') {
    const n = parseFloat(ev.rawValue);
    if (Number.isFinite(n)) {
      if (n > 1 && n <= 100) return clamp01(n);
      if (n >= 0 && n <= 1) return clamp01(n * 100);
    }
  }
  throw new NormalizationRejected('malformed', `ratio signal ${def.key} got non-numeric`);
}

/**
 * Range: linear map raw in [range.min, range.max] → 0..100.
 * Values outside the range are clamped to 0/100.
 */
function rangeNormalize(def: SignalDefinition, ev: SignalEvidence | undefined): number | null {
  if (!ev) return null;
  if (!def.range) throw new NormalizationRejected('malformed', `range signal ${def.key} lacks range`);
  const { min, max } = def.range;
  if (!isRealScalar(ev.rawValue) && typeof ev.rawValue !== 'string') {
    throw new NormalizationRejected('malformed', `range signal ${def.key} got non-numeric`);
  }
  let n: number;
  if (isRealScalar(ev.rawValue)) n = ev.rawValue;
  else n = parseFloat(ev.rawValue as string);
  if (!Number.isFinite(n)) throw new NormalizationRejected('malformed', `range signal ${def.key} non-numeric`);
  if (max === min) return 50;
  return clamp01(((n - min) / (max - min)) * 100);
}

/**
 * Threshold: pick the highest tier whose upper bound the raw value does not
 * exceed. Tiers come from `def.thresholds` = array of upper bounds, with the
 * corresponding scores in `def.categoricalMap` (or evenly spaced 100→0 by index).
 */
function thresholdNormalize(def: SignalDefinition, ev: SignalEvidence | undefined): number | null {
  if (!ev) return null;
  if (!isRealScalar(ev.rawValue) && typeof ev.rawValue !== 'string') {
    throw new NormalizationRejected('malformed', `threshold signal ${def.key} got non-numeric`);
  }
  let n: number;
  if (isRealScalar(ev.rawValue)) n = ev.rawValue;
  else n = parseFloat(ev.rawValue as string);
  if (!Number.isFinite(n)) throw new NormalizationRejected('malformed', `threshold signal ${def.key} non-numeric`);
  const tiers = def.thresholds ?? [];
  if (tiers.length === 0) {
    throw new NormalizationRejected('malformed', `threshold signal ${def.key} lacks tiers`);
  }
  // thresholds sorted ascending; pick last tier >= raw
  let idx = 0;
  for (let i = 0; i < tiers.length; i++) {
    if (n <= tiers[i]) break;
    idx = i + 1;
  }
  idx = Math.min(idx, tiers.length);
  // score per tier: prefer categoricalMap[k], else linear 100..0 by index
  const key = `tier${idx}`;
  const mapped = def.categoricalMap && def.categoricalMap[key];
  if (mapped !== undefined && Number.isFinite(mapped)) return clamp01(mapped);
  const lastIdx = tiers.length;
  return clamp01(Math.round(100 - (idx / (lastIdx + 1)) * 100));
}

/**
 * Categorical: raw string matches a key in def.categoricalMap → its score.
 * Unknown category → pending.
 */
function categoricalNormalize(def: SignalDefinition, ev: SignalEvidence | undefined): number | null {
  if (!ev) return null;
  const raw = typeof ev.rawValue === 'string' ? ev.rawValue.trim().toLowerCase() : String(ev.rawValue).toLowerCase();
  if (!def.categoricalMap) throw new NormalizationRejected('malformed', `categorical signal ${def.key} lacks map`);
  const score = def.categoricalMap[raw];
  if (score === undefined || !Number.isFinite(score)) {
    throw new NormalizationRejected('malformed', `categorical signal ${def.key} unknown category '${raw}'`);
  }
  return clamp01(score);
}

/**
 * Benchmark: raw already represents a benchmark-relative percentile score
 * (0..100) or a fraction-of-cohort. If raw is a 0..1 fraction scale ×100.
 * Benchmark signals are only produced with a valid real peer cohort — the
 * caller (evidence provider) returns Pending when MIN_PEERS is unsatisfied.
 */
function benchmarkNormalize(def: SignalDefinition, ev: SignalEvidence | undefined): number | null {
  if (!ev) return null;
  if (isRealScalar(ev.rawValue)) {
    const v = ev.rawValue;
    if (v >= 0 && v <= 1) return clamp01(v * 100);
    if (v > 1 && v <= 100) return clamp01(v);
  }
  if (typeof ev.rawValue === 'string') {
    const n = parseFloat(ev.rawValue);
    if (Number.isFinite(n)) {
      if (n >= 0 && n <= 1) return clamp01(n * 100);
      if (n > 1 && n <= 100) return clamp01(n);
    }
  }
  throw new NormalizationRejected('malformed', `benchmark signal ${def.key} got non-numeric`);
}

/**
 * Custom: delegate to a registered deterministic custom normalizer. These are
 * versioned here so no controller invents arithmetic.
 */
const CUSTOM_NORMALIZERS: Record<
  string,
  (def: SignalDefinition, ev: SignalEvidence | undefined) => number | null
> = {
  // review-age freshness tiers (0-7d → 100 … 90+ → 20), matching spec §6
  review_recency: (def, ev) => {
    if (!ev) return null;
    if (!(ev.observedAt instanceof Date) && typeof ev.observedAt !== 'string') {
      throw new NormalizationRejected('malformed', 'review_recency needs observedAt');
    }
    const t = typeof ev.observedAt === 'string' ? new Date(ev.observedAt) : ev.observedAt;
    const ageDays = (Date.now() - t.getTime()) / 86400000;
    if (ageDays < 0) return 100;
    if (ageDays <= 7) return 100;
    if (ageDays <= 30) return 85;
    if (ageDays <= 60) return 65;
    if (ageDays <= 90) return 45;
    return 20;
  },
  // google star rating (1..5) → 0..100
  google_star_range: (def, ev) => {
    if (!ev) return null;
    const n = isRealScalar(ev.rawValue) ? ev.rawValue : parseFloat(String(ev.rawValue));
    if (!Number.isFinite(n)) throw new NormalizationRejected('malformed', 'star rating non-numeric');
    return clamp01(((n - 1) / 4) * 100);
  },
};

function customNormalize(def: SignalDefinition, ev: SignalEvidence | undefined): number | null {
  if (!ev) return null;
  const key = def.customNormalizer ?? def.key;
  const fn = CUSTOM_NORMALIZERS[key];
  if (!fn) throw new NormalizationRejected('unknown_method', `no custom normalizer '${key}'`);
  return fn(def, ev);
}

/** Main deterministic normalize dispatch (spec §6). */
export function normalizeSignal(
  def: SignalDefinition,
  ev: SignalEvidence | undefined,
): number | null {
  // Unknown or absent observation → pending (never zero).
  if (!ev) return null;
  // Confidence gate: below the signal's minimum → treat as untrusted → pending.
  if (ev.confidence < def.minimumConfidence) {
    throw new NormalizationRejected('below_minimum_confidence',
      `signal ${def.key} confidence ${ev.confidence} below min ${def.minimumConfidence}`);
  }
  switch (def.scoringMethod) {
    case 'boolean': return booleanNormalize(def, ev);
    case 'ratio': return ratioNormalize(def, ev);
    case 'range': return rangeNormalize(def, ev);
    case 'threshold': return thresholdNormalize(def, ev);
    case 'categorical': return categoricalNormalize(def, ev);
    case 'benchmark': return benchmarkNormalize(def, ev);
    case 'custom': return customNormalize(def, ev);
    default: throw new NormalizationRejected('unknown_method', `unknown scoringMethod for ${def.key}`);
  }
}

function clamp01(v: number): number {
  return Math.round(Math.min(100, Math.max(0, v)));
}

export function resolveByKey(
  registry: Record<string, { signals: SignalDefinition[] }>,
  key: string,
): SignalDefinition | undefined {
  for (const factor of Object.values(registry)) {
    const def = factor.signals.find((s) => s.key === key);
    if (def) return def;
  }
  return undefined;
}

/** Normalize by signal key (registry-aware convenience). */
export function normalizeByKey(
  key: string,
  ev: SignalEvidence | undefined,
): { def: SignalDefinition; normalized: number | null } | { def: undefined; error: string } {
  const def = findSignalDef(key);
  if (!def) return { def: undefined, error: `no definition for signal '${key}'` };
  try {
    return { def, normalized: normalizeSignal(def, ev) };
  } catch (e) {
    if (e instanceof NormalizationRejected) {
      return { def, normalized: null };
    }
    throw e;
  }
}
