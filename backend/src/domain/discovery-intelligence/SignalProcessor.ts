// ── Signal Processor ──
// RIST-RDI-007 signal-design-v1 §14, §17.
// observations + signalDefinitions → DiscoverySignalResult[]
// Normalized, deterministic, pending-aware. AI only feeds *validated*
// structured results as observations; hallucinated/unreferenced evidence is
// rejected here so it can never masquerade as a measured signal.

import {
  type DiscoverySignal,
  type SignalDefinition,
  type SignalEvidence,
  type FactorCapabilities,
  type SignalStatus,
} from './types';
import { signalsForFactor, capabilityPresent, allSignalDefinitions, METHODOLOGY_VERSION } from './signal-registry';
import { normalizeSignal, NormalizationRejected } from './normalization';

export interface SignalProcessorResult {
  signal: DiscoverySignal;
  definition: SignalDefinition;
}

export interface SignalProcessorOptions {
  restaurantId: string;
  /** Map of signalKey → evidence. Absent keys resolve to pending. */
  evidence: Map<string, SignalEvidence>;
  /** Restaurant capability gates for not_applicable semantics. */
  capabilities: FactorCapabilities;
  /** Optional filter: only resolve this factor's signals. */
  factorId?: string;
  /** Inject now() for deterministic freshness tests. */
  now?: Date;
}

/** Parse freshnessPolicy 'hours:N' | 'days:N' | 'months:N' | 'continuous'. */
export function parseFreshnessPolicy(policy: string): { kind: 'hours'|'days'|'months'|'continuous'; value: number } {
  if (policy === 'continuous') return { kind: 'continuous', value: 0 };
  const [kind, val] = policy.split(':');
  const value = Number(val);
  if (kind === 'hours' || kind === 'days' || kind === 'months') return { kind, value: Number.isFinite(value) ? value : 0 };
  return { kind: 'continuous', value: 0 };
}

function policyToMs(p: { kind: 'hours'|'days'|'months'|'continuous'; value: number }): number {
  const hrs = 3600 * 1000;
  if (p.kind === 'hours') return p.value * hrs;
  if (p.kind === 'days') return p.value * 24 * hrs;
  if (p.kind === 'months') return p.value * 30 * 24 * hrs;
  return 0; // continuous never goes stale
}

/**
 * Compute whether an observation is stale based on its own freshnessStatus or
 * the signal's freshnessPolicy + observedAt (spec §6 "stale handling").
 */
export function isObservationStale(
  def: SignalDefinition,
  ev: SignalEvidence,
  now: Date,
): boolean {
  if (ev.observedAt && policyToMs(parseFreshnessPolicy(def.freshnessPolicy)) > 0) {
    const freshUntil = ev.observedAt.getTime() + policyToMs(parseFreshnessPolicy(def.freshnessPolicy));
    if (freshUntil < now.getTime()) return true;
  }
  if (!ev.observedAt) return true; // no timestamp → cannot confirm freshness
  return false;
}

/** Deterministic signal status from evidence + freshness. */
export function resolveStatus(
  def: SignalDefinition,
  ev: SignalEvidence | undefined,
  capabilities: FactorCapabilities,
  now: Date,
): SignalStatus {
  // Not-applicable: capability genuinely absent → excluded from factor math.
  if (!capabilityPresent(def, capabilities)) return 'not_applicable';
  if (!ev) return 'pending_observation';
  // A signal requiring real referenced evidence but carrying none cannot be measured.
  if (def.requiredEvidence && (ev.evidenceRefs.length === 0) && ev.sourceUrl === undefined) {
    return 'pending_observation';
  }
  if (isObservationStale(def, ev, now)) return 'stale';
  return 'measured';
}

/**
 * Resolve a single signal to a DiscoverySignal result.
 * Returns null when the signal must remain pending (no evidence) but still
 * needs a stable pending placeholder — callers expect per-factor full arrays,
 * so we return a pending DiscoverySignal for missing/non-measurable signals.
 */
export function resolveSignal(
  restaurantId: string,
  def: SignalDefinition,
  ev: SignalEvidence | undefined,
  capabilities: FactorCapabilities,
  now: Date,
): DiscoverySignal {
  const status = resolveStatus(def, ev, capabilities, now);

  if (status === 'not_applicable' || status === 'pending_observation' || status === 'stale') {
    return {
      id: `${def.key}`,
      restaurantId,
      factorId: def.factorId,
      signalKey: def.key,
      label: def.label,
      description: def.description,
      status,
      rawValue: ev?.rawValue,
      weight: def.weight,
      confidence: ev?.confidence ?? 0,
      observedAt: ev?.observedAt,
      evidenceRefs: ev?.evidenceRefs ?? [],
      methodologyVersion: def.methodologyVersion || METHODOLOGY_VERSION,
    };
  }

  // measured / partial: normalize (reject malformed → pending semantics).
  let normalized: number | null;
  try {
    normalized = normalizeSignal(def, ev!);
  } catch (e) {
    if (e instanceof NormalizationRejected) {
      // Malformed or below-minimum-confidence evidence → fail toward pending.
      return {
        id: `${def.key}`,
        restaurantId,
        factorId: def.factorId,
        signalKey: def.key,
        label: def.label,
        description: def.description,
        status: 'pending_observation',
        rawValue: ev!.rawValue,
        weight: def.weight,
        confidence: ev!.confidence,
        observedAt: ev!.observedAt,
        evidenceRefs: ev!.evidenceRefs ?? [],
        methodologyVersion: def.methodologyVersion || METHODOLOGY_VERSION,
      };
    }
    throw e;
  }

  const scale = { min: 0, max: 100 };
  const isPartial = normalized !== null && normalized < 100 && !isFullyMeasured(def, normalized);
  return {
    id: `${def.key}`,
    restaurantId,
    factorId: def.factorId,
    signalKey: def.key,
    label: def.label,
    description: def.description,
    status: isPartial ? 'partial' : 'measured',
    rawValue: ev!.rawValue,
    normalizedValue: normalized ?? undefined,
    normalizedScale: scale,
    weight: def.weight,
    confidence: ev!.confidence,
    observedAt: ev!.observedAt,
    evidenceRefs: ev!.evidenceRefs ?? [],
    methodologyVersion: def.methodologyVersion || METHODOLOGY_VERSION,
  };
}

function isFullyMeasured(def: SignalDefinition, normalized: number): boolean {
  // boolean false (0) is still a measured *known* value → keep as partial/false.
  if (def.scoringMethod === 'boolean') return normalized === 100;
  return false;
}

/** Process all signals for a factor (or all factors). Deterministic ordering. */
export function processFactor(
  restaurantId: string,
  factorId: string,
  evidence: Map<string, SignalEvidence>,
  capabilities: FactorCapabilities,
  now: Date = new Date(),
): SignalProcessorResult[] {
  const defs = signalsForFactor(factorId);
  return defs.map((def) => {
    const ev = evidence.get(def.key);
    return { signal: resolveSignal(restaurantId, def, ev, capabilities, now), definition: def };
  });
}

/** Process every signal in the registry (restaurant-level). */
export function processAllSignals(
  restaurantId: string,
  evidence: Map<string, SignalEvidence>,
  capabilities: FactorCapabilities,
  now: Date = new Date(),
): SignalProcessorResult[] {
  return allSignalDefinitions().map((def) => {
    const ev = evidence.get(def.key);
    return { signal: resolveSignal(restaurantId, def, ev, capabilities, now), definition: def };
  });
}
