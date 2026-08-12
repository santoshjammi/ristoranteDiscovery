import { resolve } from 'path';

export interface AIServiceOptions {
  ollamaHost: string;
  modelName?: string; // defaults to qwen3.6 for first-run
}

/** Raw shape of an Ollama /api/generate response. */
export interface OllamaGenerateResponse {
  model?: string;
  created_at?: string;
  response?: string;
  /** The JSON-shaped data the parser expects once we extract from markdown fences + thinking prefix. */
  raw?: any; // typed as unknown would be wrong since Ollama responses can hold both real JSON text and other wrappers — keeping it safe for future parsing needs without breaking existing service signatures that already handle structured output.

  /** Keep this property available so the AI wrapper can return a plain result object shaped exactly like `generateJSON<T>` calls expect for each supported feature: menu, reviews, faq, seo */
}

declare const structuredClone: <T>(value: T) => T;