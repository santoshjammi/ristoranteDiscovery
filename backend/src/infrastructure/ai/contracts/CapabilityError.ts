/**
 * RIST-AI-001 — CapabilityError.
 *
 * A typed, safe error raised by the AI capability layer. It deliberately does
 * NOT leak provider names or raw network internals to callers. The application
 * layer may treat this as a signal to degrade gracefully (never a platform 500
 * purely because an LLM call failed).
 *
 * Failure classification is OPERATIONAL: every provider / network / parse /
 * grounding failure is classified into a concrete kind (see
 * `classifyFailure`) so callers can distinguish real causes instead of the
 * previous "everything is validation_failed" behaviour.
 */

export type CapabilityFailureKind =
  | 'provider_unavailable' // network unreachable, provider down, non-retryable HTTP 5xx, empty body
  | 'timeout' // provider request exceeded the bounded timeout
  | 'rate_limited' // provider returned HTTP 429 / explicit rate-limit
  | 'authentication_failed' // provider returned HTTP 401 / 403 (bad or missing credentials)
  | 'malformed_output' // model returned content that cannot be parsed as JSON at all
  | 'validation_failed' // well-formed JSON that fails zod schema validation (wrong shape / missing fields)
  | 'grounding_failed' // citations/evidence could not be grounded against the retrieved allow-list
  | 'all_providers_failed' // every provider in the cascade failed
  | 'no_providers_configured' // no provider was configured at all
  | 'unknown'; // any other error we could not classify

export class CapabilityError extends Error {
  readonly kind: CapabilityFailureKind;
  /** Capability name, if known. */
  readonly capability?: string;

  constructor(
    kind: CapabilityFailureKind,
    message: string,
    capability?: string,
  ) {
    super(message);
    this.name = 'CapabilityError';
    this.kind = kind;
    this.capability = capability;
  }
}

/** Shape used to describe a failed capability invocation to callers. */
export interface CapabilityFailure {
  ok: false;
  kind: CapabilityFailureKind;
  message: string;
  capability?: string;
}

/** Sentinel error name used by AbortController when a fetch is aborted. */
export const TIMEOUT_ERROR_NAME = 'AbortError';
/** Sentinel reason message used by the provider timeout abort. */
export const TIMEOUT_REASON = 'CapabilityTimeout';

/** Extract a stable string (message or code) from any thrown value. */
export function errorMessage(error: unknown): string {
  if (!error) return '';
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  return String(error);
}

function errorCode(error: unknown): string | undefined {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as { code?: unknown }).code;
    if (typeof code === 'string') return code;
  }
  if (error instanceof Error && (error as { code?: unknown }).code) {
    return String((error as { code?: unknown }).code);
  }
  return undefined;
}

/** An error thrown when a provider call exceeds its bounded timeout. */
export class CapabilityTimeoutError extends CapabilityError {
  constructor(message: string, capability?: string) {
    super('timeout', message, capability);
    this.name = 'CapabilityError';
    this.cause = new Error('Provider call aborted due to timeout');
  }
}

function isTimeoutError(error: unknown): boolean {
  if (error instanceof CapabilityTimeoutError) return true;
  if (error instanceof Error) {
    return (
      error.name === TIMEOUT_ERROR_NAME ||
      (error as { code?: string }).code === 'ABORT_ERR' ||
      error.message.toLowerCase().includes('timeout') ||
      error.message.toLowerCase().includes('aborted')
    );
  }
  return false;
}

/** Categorise a raw (non-Capability) error into the failure taxonomy. */
export function classifyFailure(error: unknown): CapabilityFailureKind {
  if (error instanceof CapabilityError) return error.kind;
  if (isTimeoutError(error)) return 'timeout';

  const code = errorCode(error);
  if (code === 'ETIMEDOUT' || code === 'ECONNRESET' || code === 'UND_ERR_HEADERS_TIMEOUT' || code === 'UND_ERR_SOCKET') {
    return 'timeout';
  }
  if (code === 'ENOTFOUND' || code === 'EAI_AGAIN' || code === 'ECONNREFUSED' || code === 'ENETUNREACH') {
    return 'provider_unavailable';
  }

  // Plain "provider returned HTTP x" errors are thrown by the provider adapter
  // and already encoded as CapabilityError; anything else below is a fallback.
  if (error instanceof SyntaxError) return 'malformed_output';

  return 'provider_unavailable';
}
