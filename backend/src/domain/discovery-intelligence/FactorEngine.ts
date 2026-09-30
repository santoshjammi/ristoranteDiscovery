// ── Factor Engine ──
// RIST-RDI-007 signal-design-v1 §8, §9, §10, §15.
// signals → FactorResult. Deterministic. Only measured/partial contribute.
// Pending/NA/stale are excluded from both numerator AND denominator (never
// zero). Confidence = coverage × evidence × freshness (spec §9).

import {
  type DiscoverySignal,
  type FactorResult,
  type FactorStatus,
} from './types';
import type { SignalProcessorResult } from './SignalProcessor';

export type ScoreChangeClass =
  | 'expected'
  | 'bug'
  | 'methodology_change'
  | 'insufficient_evidence';

export interface FactorCalculation {
  factorId: string;
  score: number | null;
  status: FactorStatus;
  confidence: number;
  coverage: { measured: number; total: number };
  coverageDetail: {
    totalSignals: number;
    measured: number;
    partial: number;
    pending: number;
    notApplicable: number;
    stale: number;
  };
  signals: DiscoverySignal[];
  evidenceCount: number;
  lastObservedAt?: Date;
}

const STATUS_THRESHOLDS: Array<[number, FactorStatus]> = [
  [80, 'excellent'],
  [60, 'good'],
  [40, 'fair'],
  [20, 'needs_attention'],
  [-Infinity, 'critical'],
];

export function statusFromScore(score: number | null): FactorStatus {
  if (score === null) return 'pending_observation';
  for (const [min, status] of STATUS_THRESHOLDS) {
    if (score >= min) return status;
  }
  return 'critical';
}

/** Confidence modifier from signal confidence (0..1), used in §8 formula. */
function confidenceModifier(confidence: number): number {
  return Math.min(1, Math.max(0.5, confidence));
}

/**
 * Factor Score = Σ(signalScore × weight × confidenceModifier)
 *             ÷ Σ(activeSignalWeight × confidenceModifier)
 * Only measured/partial contribute. Pending/NA/stale excluded entirely.
 */
export function computeFactorScore(
  signals: DiscoverySignal[],
): { rawScore: number | null; numerator: number; denominator: number; activeCount: number } {
  let numerator = 0;
  let denominator = 0;
  let activeCount = 0;
  for (const s of signals) {
    if (s.status !== 'measured' && s.status !== 'partial') continue;
    const signalScore = s.normalizedValue ?? 0;
    const cm = confidenceModifier(s.confidence);
    numerator += signalScore * s.weight * cm;
    denominator += s.weight * cm;
    activeCount++;
  }
  if (denominator === 0 || activeCount === 0) {
    return { rawScore: null, numerator, denominator: 0, activeCount: 0 };
  }
  // Normalize weights: weights within a factor should sum to ~1; if they sum to
  // something else the ratio is still scale-invariant because we divide by the
  // same weighting denominator. Score is 0..100.
  return { rawScore: Math.round(numerator / denominator), numerator, denominator, activeCount };
}

/**
 * Coverage confidence (spec §9): higher measured/total → higher coverage.
 * 0 measured → 0 coverage (factor pending).
 */
function coverageConfidence(measured: number, partial: number, total: number): number {
  if (total === 0) return 0;
  const contributing = measured + partial;
  return contributing === 0 ? 0 : Math.min(1, contributing / total);
}

/** Evidence confidence: average of contributing signal confidences. */
function evidenceConfidence(signals: DiscoverySignal[]): number {
  const contributing = signals.filter((s) => s.status === 'measured' || s.status === 'partial');
  if (contributing.length === 0) return 0;
  const sum = contributing.reduce((a, s) => a + s.confidence, 0);
  return sum / contributing.length;
}

/** Freshness confidence: fraction of contributing signals still fresh. */
function freshnessConfidence(signals: DiscoverySignal[]): number {
  const contributing = signals.filter((s) => s.status === 'measured' || s.status === 'partial');
  if (contributing.length === 0) return 0;
  return 1; // measured/partial are by definition fresh; stale is a separate status
}

/**
 * Factor confidence = coverage confidence × evidence confidence × freshness
 * confidence (spec §9), reported 0..100.
 */
export function computeFactorConfidence(
  signals: DiscoverySignal[],
  coverage: { measured: number; partial: number; total: number },
): number {
  const cov = coverageConfidence(coverage.measured, coverage.partial, coverage.total);
  const ev = evidenceConfidence(signals);
  const fresh = freshnessConfidence(signals);
  // Report 0..1 (or 0..100 depending on caller). We report 0..100 for UI parity.
  return Math.round(cov * ev * fresh * 100);
}

/**
 * Full factor calculation. `results` = SignalProcessorResult[] for the factor.
 * Preserves ordering and exposes per-signal scoreContribution on measured/partial.
 */
export function calculateFactor(
  factorId: string,
  results: SignalProcessorResult[],
): FactorResult {
  const signals = results.map((r) => r.signal);
  const totalSignals = signals.length;

  const measured = signals.filter((s) => s.status === 'measured');
  const partial = signals.filter((s) => s.status === 'partial');
  const pending = signals.filter((s) => s.status === 'pending_observation');
  const notApplicable = signals.filter((s) => s.status === 'not_applicable');
  const stale = signals.filter((s) => s.status === 'stale');

  const contributing = [...measured, ...partial];
  const withContribution: DiscoverySignal[] = signals.map((s) => {
    if (s.status !== 'measured' && s.status !== 'partial') {
      // never set scoreContribution for non-contributing signals
      const { scoreContribution: _drop, ...rest } = s as typeof s & { scoreContribution?: number };
      return rest;
    }
    // scoreContribution = signalScore × weight (contributes to numerator via cm)
    const signalScore = s.normalizedValue ?? 0;
    return {
      ...s,
      scoreContribution: Math.round(
        (signalScore * s.weight * confidenceModifier(s.confidence)) * 100) / 100,
    };
  });

  const { rawScore } = computeFactorScore(withContribution);

  const coverage = {
    measured: measured.length,
    partial: partial.length,
    total: totalSignals,
  };
  const confidence = rawScore === null
    ? 0
    : computeFactorConfidence(withContribution, coverage);

  const evidenceCount = contributing.reduce((acc: number, s) => acc + s.evidenceRefs.length, 0);
  const lastObservedAt = contributing.map((s) => s.observedAt).filter(Boolean)
    .sort((a, b) => b!.getTime() - a!.getTime())[0];

  return {
    factorId,
    score: rawScore,
    status: statusFromScore(rawScore),
    confidence,
    coverage: { measured: coverage.measured, total: coverage.total },
    coverageDetail: {
      totalSignals,
      measured: coverage.measured,
      partial: coverage.partial,
      pending: pending.length,
      notApplicable: notApplicable.length,
      stale: stale.length,
    },
    signals: withContribution,
    evidenceCount,
    lastObservedAt,
  };
}

/**
 * Classify a score change for migration safety (spec §38).
 * Pure function for tests: given prior frozen score and new signal-derived
 * score, return a change classification.
 */
export function classifyScoreChange(
  oldScore: number | null,
  newScore: number | null,
): { className: ScoreChangeClass; delta: number | null } {
  if (oldScore === null && newScore === null) return { className: 'insufficient_evidence', delta: null };
  if (newScore === null) return { className: 'insufficient_evidence', delta: null };
  if (oldScore === null) return { className: 'expected', delta: newScore };
  const delta = newScore - oldScore;
  if (Math.abs(delta) <= 25) return { className: 'expected', delta };
  return { className: 'methodology_change', delta };
}
