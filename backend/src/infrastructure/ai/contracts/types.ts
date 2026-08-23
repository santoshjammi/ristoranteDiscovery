/**
 * RIST-AI-001 — shared AI contract types.
 *
 * These types form the application-facing contract of the AI capability layer.
 * Provider names are scoped here so that application/controller code never
 * references concrete providers directly.
 */

/** The three AI providers supported by the discovery backend. */
export type ProviderName = 'nvidia' | 'ollama-cloud' | 'local';

/** Named AI capabilities the application layer can request. */
export type CapabilityName =
  | 'menu_extraction'
  | 'review_interpretation'
  | 'faq_generation'
  | 'seo_audit'
  | 'conversation';

/** Model class routing key — complex (large model) vs light (small/local). */
export type ModelClass = 'complex' | 'light';

/**
 * Options passed to the underlying provider facade.
 *
 * Provider names may ONLY appear here and inside infrastructure/ai/providers/.
 */
export interface GenerateOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  allowMockFallback?: boolean;
  /** Which provider to use. Defaults to 'auto' (cascade). */
  provider?: ProviderName | 'auto';
  /**
   * Bounded timeout for each provider request (milliseconds). Defaults to
   * guardrails.DEFAULT_TIMEOUT_MS when unset. When exceeded, the request is
   * aborted and a CapabilityError with kind `timeout` is raised.
   */
  timeoutMs?: number;
}

/** The routing decision resolved for a given capability. */
export interface CapabilityRoute {
  capability: CapabilityName;
  modelClass: ModelClass;
  model: string;
  /** Explicit provider override, or 'auto' for the cascade. */
  provider: ProviderName | 'auto';
  temperature: number;
  maxTokens: number;
}
