/**
 * RIST-AI-001 — invocation observability.
 *
 * Lightweight, dependency-free logging of every capability invocation:
 * capability name, routing, success/failure, and duration. Hooks into the
 * app's existing console logging conventions (matching the legacy ai.service).
 */

import type { CapabilityName, CapabilityRoute } from '../contracts/types';

export interface InvocationEvent {
  capability: CapabilityName;
  model: string;
  provider: string;
  ok: boolean;
  durationMs: number;
  kind?: string;
}

/**
 * Log an AI capability invocation.
 * Currently writes to console; swap for a real metrics sink here when needed.
 */
export function recordInvocation(event: InvocationEvent): void {
  const status = event.ok ? '✓' : '✗';
  if (event.ok) {
    console.log(
      `🤖 [AI] ${event.capability} ${status} model=${event.model} provider=${event.provider} ${event.durationMs}ms`,
    );
  } else {
    console.warn(
      `⚠️ [AI] ${event.capability} ${status} model=${event.model} provider=${event.provider} kind=${event.kind ?? 'error'} ${event.durationMs}ms`,
    );
  }
}

/** Convenience: start a timer and return a finish callback. */
export function traceInvocation(capability: CapabilityName, route: CapabilityRoute) {
  const startedAt = Date.now();
  return {
    success(): void {
      recordInvocation({
        capability,
        model: route.model,
        provider: route.provider,
        ok: true,
        durationMs: Date.now() - startedAt,
      });
    },
    failure(kind?: string): void {
      recordInvocation({
        capability,
        model: route.model,
        provider: route.provider,
        ok: false,
        durationMs: Date.now() - startedAt,
        kind,
      });
    },
  };
}
