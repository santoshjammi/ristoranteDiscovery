/**
 * RIST-AI-001 — guardrails: timeout, token cap, malformed-output rejection.
 *
 * Provides the deterministic fallback envelope used when a capability's
 * structured output is malformed, fails zod validation, or all providers fail.
 * This is what guarantees graceful degradation (never a platform 500 purely
 * because an LLM call failed).
 */

import {
  CapabilityError,
  classifyFailure,
  type CapabilityFailure,
  type CapabilityFailureKind,
} from '../contracts/CapabilityError';

/** Abort a provider call after this many milliseconds. */
export const DEFAULT_TIMEOUT_MS = 60_000;

/** Maximum tokens the provider layer will ever request. */
export const DEFAULT_MAX_TOKENS = 4096;

/**
 * Build a typed, safe failure descriptor for logging / instrumentation.
 * Provider names and raw network internals are NOT included.
 */
export function buildFailure(
  kind: CapabilityFailure['kind'],
  message: string,
  capability?: string,
): CapabilityError {
  return new CapabilityError(kind, message, capability);
}

/**
 * Classify a thrown value into a failure kind, falling back to
 * `fallback` (default `provider_unavailable`) when it is not a timeout/parse/
 * taxonomy error. Provider/network failures must never be reported as
 * `validation_failed`.
 */
export function classifyFailureKind(
  error: unknown,
  fallback: CapabilityFailureKind = 'provider_unavailable',
): CapabilityFailureKind {
  if (error instanceof CapabilityError) return error.kind;
  return classifyFailure(error) === 'provider_unavailable' ? fallback : classifyFailure(error);
}

export { CapabilityError, classifyFailure };
export type { CapabilityFailure, CapabilityFailureKind };
