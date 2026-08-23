/**
 * RIST-AI-001 — AI configuration for the discovery backend.
 *
 * Priority: NVIDIA NIM → Ollama Cloud → local Ollama (last resort).
 * Moved verbatim from services/ai.config.ts into infrastructure/ai/providers/.
 */

// ── NVIDIA NIM (primary) ────────────────────────────────────────
export const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
export const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';
export const NVIDIA_MODEL = 'deepseek-ai/deepseek-v4-flash';

// ── Ollama Cloud (secondary) ────────────────────────────────────
export const OLLAMA_CLOUD_API_KEY = process.env.OLLAMA_API_KEY;
export const OLLAMA_CLOUD_BASE_URL = 'https://ollama.com/v1';
export const OLLAMA_CLOUD_MODEL = 'deepseek-ai/deepseek-v4-flash';

// ── Local Ollama (last resort) ─────────────────────────────────
export const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
export const LIGHT_MODEL = process.env.OLLAMA_LIGHT_MODEL || 'ornith:lite';
export const COMPLEX_MODEL = process.env.OLLAMA_COMPLEX_MODEL || 'qwen3.6:latest';
export const ALLOW_MOCK_FALLBACK = process.env.AI_ALLOW_MOCK_FALLBACK === 'true';
