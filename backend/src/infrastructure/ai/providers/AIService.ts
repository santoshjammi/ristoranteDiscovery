/**
 * RIST-AI-001 — AI Service (multi-provider structured output helper).
 *
 * This is the SOLE owner of provider names and the provider cascade. It is the
 * refactor of the legacy services/ai.service.ts, relocated into the AI
 * capability layer. Provider names (`nvidia` / `ollama-cloud` / `local`) may
 * ONLY appear here (and in infrastructure/ai/providers/ + routing config).
 *
 * Default behavior (generateJSON):
 *   1. NVIDIA NIM         (primary, if NVIDIA_API_KEY is set)
 *   2. Ollama Cloud       (secondary, if OLLAMA_API_KEY is set)
 *   3. Local Ollama       (last resort, always available when running locally)
 *   4. Mock fallback      (if AI_ALLOW_MOCK_FALLBACK=true and all providers fail)
 *
 * FAQ generation (generateJSONLight):
 *   Always routes through local Ollama — the light model is small enough.
 *
 * Failure classification is OPERATIONAL: every provider request is wrapped in
 * an AbortController with a bounded timeout (guardrails.DEFAULT_TIMEOUT_MS).
 * On timeout the request is aborted and a CapabilityError with kind `timeout`
 * is raised, which then triggers the provider fallback cascade.
 */

import {
  ALLOW_MOCK_FALLBACK,
  COMPLEX_MODEL,
  LIGHT_MODEL,
  NVIDIA_API_KEY,
  NVIDIA_BASE_URL,
  NVIDIA_MODEL,
  OLLAMA_CLOUD_API_KEY,
  OLLAMA_CLOUD_BASE_URL,
  OLLAMA_CLOUD_MODEL,
  OLLAMA_HOST,
} from './ai.config';
import type { GenerateOptions, ProviderName } from '../contracts/types';
import {
  CapabilityError,
  CapabilityTimeoutError,
  classifyFailure,
  errorMessage,
  TIMEOUT_REASON,
  type CapabilityFailureKind,
} from '../contracts/CapabilityError';
import { DEFAULT_TIMEOUT_MS } from '../guardrails/guardrails';

export type { GenerateOptions } from '../contracts/types';

/* ── internal shapes ──────────────────────────────────────── */

interface OpenAICompatibleResponse {
  choices?: Array<{ message?: { content?: string } }>;
}

interface OllamaChatResponse {
  message?: { content?: string };
  response?: string;
}

type Provider = ProviderName;

/** A fetch that aborts after `timeoutMs`, surfacing a timeout-kind failure. */
async function fetchWithTimeout(
  url: string,
  init: RequestInit & { timeoutMs?: number },
): Promise<Response> {
  const timeoutMs = init.timeoutMs && init.timeoutMs > 0 ? init.timeoutMs : DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error(TIMEOUT_REASON)), timeoutMs);
  const { timeoutMs: _omit, signal: _signal, ...fetchInit } = init;
  try {
    return await fetch(url, { ...fetchInit, signal: controller.signal });
  } catch (error) {
    // Re-wrap the abort so the caller can classify it as a timeout deterministically.
    if (controller.signal.aborted) {
      throw new CapabilityTimeoutError(
        `Provider request to ${url} aborted after ${timeoutMs}ms`,
      );
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

/** Map an HTTP status into a typed CapabilityError kind. */
function httpStatusKind(status: number): CapabilityFailureKind {
  if (status === 429) return 'rate_limited';
  if (status === 401 || status === 403) return 'authentication_failed';
  return 'provider_unavailable';
}

/* ── OpenAI-compatible adapter ───────────────────────────── */

async function openAICompatibleChat(
  baseUrl: string,
  apiKey: string,
  model: string,
  messages: Array<{ role: 'system' | 'user'; content: string }>,
  temperature: number,
  maxTokens: number,
  timeoutMs?: number,
): Promise<OpenAICompatibleResponse> {
  const res = await fetchWithTimeout(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      response_format: { type: 'json_object' },
    }),
    timeoutMs,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new CapabilityError(
      httpStatusKind(res.status),
      `OpenAI-compatible request to ${baseUrl} returned ${res.status}: ${text}`,
    );
  }

  return res.json() as Promise<OpenAICompatibleResponse>;
}

/* ── service ──────────────────────────────────────────────── */

class AIService {
  private ollamaAvailable: boolean | null = null;

  async init(): Promise<void> {
    await this.pingOllama();
  }

  private async pingOllama(): Promise<boolean> {
    if (this.ollamaAvailable !== null) return this.ollamaAvailable;

    try {
      const res = await fetchWithTimeout(`${OLLAMA_HOST}/api/tags`, { timeoutMs: 3000 });
      this.ollamaAvailable = res.ok;
      if (this.ollamaAvailable) {
        console.log(`🤖 AI Service: connected to local Ollama at ${OLLAMA_HOST}.`);
      } else {
        console.warn(
          `⚠️ AI Service: Ollama responded with ${res.status}; local AI is currently unavailable.`,
        );
      }
    } catch (error) {
      this.ollamaAvailable = false;
      console.warn(`⚠️ AI Service: unable to reach Ollama at ${OLLAMA_HOST}.`, error);
    }

    return this.ollamaAvailable;
  }

  /* ── main entry point ─────────────────────────────────── */

  async generateJSON<T>(
    prompt: string,
    systemInstruction?: string,
    options?: GenerateOptions,
  ): Promise<T> {
    const model = options?.model || COMPLEX_MODEL;
    const fallbackAllowed = options?.allowMockFallback ?? ALLOW_MOCK_FALLBACK;
    const timeoutMs = options?.timeoutMs;

    const messages: Array<{ role: 'system' | 'user'; content: string }> = [];
    if (systemInstruction?.trim()) {
      messages.push({ role: 'system', content: systemInstruction.trim() });
    }
    messages.push({
      role: 'user',
      content: `${prompt.trim()}\n\nReturn valid JSON only. No markdown. No commentary.`,
    });

    const temperature = options?.temperature ?? 0.2;
    const maxTokens = options?.maxTokens ?? 2048;
    const requestedProvider: Provider | 'auto' = options?.provider || 'auto';

    // Resolve cascade order based on which provider is available/configured
    const providers: Provider[] = (() => {
      if (requestedProvider !== 'auto') return [requestedProvider];

      const chain: Provider[] = [];
      if (NVIDIA_API_KEY) chain.push('nvidia');
      if (OLLAMA_CLOUD_API_KEY) chain.push('ollama-cloud');
      chain.push('local'); // last resort — always included
      return chain;
    })();

    if (providers.length === 0) {
      if (fallbackAllowed) return this.mockResponse<T>();
      throw new CapabilityError(
        'no_providers_configured',
        'No AI providers configured. Set NVIDIA_API_KEY or OLLAMA_API_KEY, or run local Ollama.',
      );
    }

    let lastError: Error | null = null;
    let lastKind: CapabilityFailureKind = 'unknown';

    for (const provider of providers) {
      try {
        return await this.callProvider<T>(provider, model, messages, temperature, maxTokens, timeoutMs);
      } catch (error) {
        lastError = error as Error;
        lastKind = classifyFailure(error);
        console.warn(
          `⚠️ AI Service: ${provider} failed (${errorMessage(error)}), trying next provider…`,
        );
      }
    }

    // All providers exhausted
    if (fallbackAllowed) {
      console.warn('⚠️ AI Service: all providers failed, using mock fallback.');
      return this.mockResponse<T>();
    }

    throw new CapabilityError(
      'all_providers_failed',
      `Failed to generate structured AI output via any provider. Last error: ${errorMessage(lastError)}`,
    );
  }

  /* ── per-provider dispatch ──────────────────────────────── */

  private async callProvider<T>(
    provider: Provider,
    model: string,
    messages: Array<{ role: 'system' | 'user'; content: string }>,
    temperature: number,
    maxTokens: number,
    timeoutMs?: number,
  ): Promise<T> {
    switch (provider) {
      case 'nvidia': {
        if (!NVIDIA_API_KEY) throw new CapabilityError('authentication_failed', 'NVIDIA_API_KEY not set');
        const res = await openAICompatibleChat(
          NVIDIA_BASE_URL,
          NVIDIA_API_KEY,
          model,
          messages,
          temperature,
          maxTokens,
          timeoutMs,
        );
        const content = res.choices?.[0]?.message?.content;
        if (!content) throw new CapabilityError('malformed_output', 'NVIDIA NIM returned empty content');
        return this.parseJSON<T>(content);
      }

      case 'ollama-cloud': {
        if (!OLLAMA_CLOUD_API_KEY) throw new CapabilityError('authentication_failed', 'OLLAMA_API_KEY not set');
        const res = await openAICompatibleChat(
          OLLAMA_CLOUD_BASE_URL,
          OLLAMA_CLOUD_API_KEY,
          model,
          messages,
          temperature,
          maxTokens,
          timeoutMs,
        );
        const content = res.choices?.[0]?.message?.content;
        if (!content) throw new CapabilityError('malformed_output', 'Ollama Cloud returned empty content');
        return this.parseJSON<T>(content);
      }

      case 'local': {
        const available = await this.pingOllama();
        if (!available) throw new CapabilityError('provider_unavailable', 'Local Ollama is unavailable');

        const res = await fetchWithTimeout(`${OLLAMA_HOST}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            messages,
            stream: false,
            format: 'json',
            options: { temperature, num_predict: maxTokens },
          }),
          timeoutMs,
        });

        if (!res.ok) throw new CapabilityError(httpStatusKind(res.status), `Ollama returned ${res.status} ${res.statusText}`);

        const data = (await res.json()) as OllamaChatResponse;
        const content = data.message?.content ?? data.response ?? '';
        if (!content) throw new CapabilityError('malformed_output', 'Local Ollama returned empty content');
        return this.parseJSON<T>(content);
      }

      default:
        throw new CapabilityError('unknown', `Unknown provider: ${provider}`);
    }
  }

  /* ── light-model shortcut (FAQ only, local only) ───────── */

  async generateJSONLight<T>(
    prompt: string,
    systemInstruction?: string,
    options?: Omit<GenerateOptions, 'model'>,
  ): Promise<T> {
    return this.generateJSON<T>(prompt, systemInstruction, {
      ...options,
      model: LIGHT_MODEL,
      provider: 'local', // light models stay local
    });
  }

  /* ── JSON parsing helpers (unchanged) ───────────────────── */

  private parseJSON<T>(content: string): T {
    const trimmed = content.trim();
    if (!trimmed) throw new CapabilityError('malformed_output', 'Empty response from AI');

    const candidates = [
      trimmed,
      this.extractFence(trimmed),
      this.extractFirstJsonValue(trimmed),
    ].filter((v): v is string => Boolean(v));

    for (const candidate of candidates) {
      try {
        return JSON.parse(candidate) as T;
      } catch {
        // continue to next candidate
      }
    }

    throw new CapabilityError(
      'malformed_output',
      `Failed to parse AI response as JSON. Preview: ${trimmed.slice(0, 300)}`,
    );
  }

  private extractFence(text: string): string | null {
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    return match?.[1]?.trim() || null;
  }

  private extractFirstJsonValue(text: string): string | null {
    const objectStart = text.indexOf('{');
    const arrayStart = text.indexOf('[');

    let start = -1;
    if (objectStart >= 0 && arrayStart >= 0) {
      start = Math.min(objectStart, arrayStart);
    } else {
      start = objectStart >= 0 ? objectStart : arrayStart;
    }
    if (start < 0) return null;

    const slice = text.slice(start);
    const endCandidates = [slice.lastIndexOf('}'), slice.lastIndexOf(']')].filter((idx) => idx >= 0);
    if (endCandidates.length === 0) return slice.trim();

    const end = Math.max(...endCandidates);
    return slice.slice(0, end + 1).trim();
  }

  private mockResponse<T>(): T {
    return {} as T;
  }
}

export const aiService = new AIService();
