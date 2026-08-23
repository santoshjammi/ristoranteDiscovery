/**
 * RIST-AI-001 — shared capability execution helper.
 *
 * Routes a capability to the provider layer, validates the structured output
 * via zod, records observability, and degrades gracefully on failure
 * (all-providers-down / malformed output) so the app never returns a platform
 * 500 purely because an LLM call failed.
 *
 * Failure classification is OPERATIONAL: raw provider / network / timeout
 * errors are classified into the taxonomy (never `validation_failed`).
 * Capabilities may supply an optional `postValidate` grounding hook that runs
 * after zod validation to reject fabricated / ungrounded citations.
 */

import { z } from 'zod';
import { aiService } from '../providers/AIService';
import { routeCapability } from '../routing/capabilityRouter';
import { traceInvocation } from '../observability/observability';
import {
  CapabilityError,
  classifyFailure,
  errorMessage,
  type CapabilityFailure,
  type CapabilityFailureKind,
} from '../contracts/CapabilityError';
import type { CapabilityName, CapabilityRoute } from '../contracts/types';

export interface CapabilityInvokeOptions {
  /** Explicit provider override. Defaults to 'auto' (the cascade). */
  provider?: CapabilityRoute['provider'];
  /** Explicit model override. Defaults to the routed model. */
  model?: string;
  /** Allow mock fallback when all providers fail. */
  allowMockFallback?: boolean;
  /** Bounded per-request timeout (ms). Defaults to the provider default. */
  timeoutMs?: number;
}

export type CapabilityResult<T> =
  | { ok: true; data: T }
  | { ok: false; failure: CapabilityFailure };

export async function executeCapability<S extends z.ZodTypeAny, TInput>(
  capability: CapabilityName,
  buildSystem: () => string,
  buildPrompt: (input: TInput) => string,
  input: TInput,
  schema: S,
  options?: CapabilityInvokeOptions,
  postValidate?: (input: TInput, parsed: z.infer<S>) => Promise<z.infer<S>>,
): Promise<CapabilityResult<z.infer<S>>> {
  const route = routeCapability(capability, {
    provider: options?.provider,
    model: options?.model,
  });
  const trace = traceInvocation(capability, route);

  try {
    const raw = await aiService.generateJSON<unknown>(
      buildPrompt(input),
      buildSystem(),
      {
        model: route.model,
        provider: route.provider,
        temperature: route.temperature,
        maxTokens: route.maxTokens,
        allowMockFallback: options?.allowMockFallback,
        timeoutMs: options?.timeoutMs,
      },
    );

    const parsed = schema.parse(raw);

    // Grounding hook (citations / evidence allow-list) runs AFTER zod, so only
    // structurally-valid output reaches the consumer.
    const grounded = postValidate ? await postValidate(input, parsed) : parsed;

    trace.success();
    return { ok: true, data: grounded };
  } catch (error) {
    const kind: CapabilityFailureKind =
      error instanceof CapabilityError
        ? error.kind
        : // zod throws plain ZodError — well-formed but wrong-shape JSON.
        error instanceof z.ZodError
          ? 'validation_failed'
          : // Provider/network/timeout/parse errors — never `validation_failed`.
          classifyFailure(error);
    trace.failure(kind);
    return {
      ok: false,
      failure: {
        ok: false,
        kind,
        message: errorMessage(error) || 'Capability invocation failed',
        capability,
      },
    };
  }
}
