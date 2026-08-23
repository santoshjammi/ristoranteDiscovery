/**
 * RIST-AI-001 — capability-aware routing policy.
 *
 * Maps a requested capability → model class → concrete model name + default
 * generation options. This is the single source of truth for which model each
 * capability uses. Provider names never appear here (they live in providers/).
 */

import {
  COMPLEX_MODEL,
  LIGHT_MODEL,
  NVIDIA_MODEL,
  OLLAMA_CLOUD_MODEL,
} from '../providers/ai.config';
import type { CapabilityName, CapabilityRoute, ModelClass } from '../contracts/types';

interface CapabilityPolicy {
  modelClass: ModelClass;
  temperature: number;
  maxTokens: number;
}

/** Default generation settings per capability. */
const CAPABILITY_POLICIES: Record<CapabilityName, CapabilityPolicy> = {
  menu_extraction: { modelClass: 'complex', temperature: 0.2, maxTokens: 2048 },
  review_interpretation: { modelClass: 'complex', temperature: 0.2, maxTokens: 2048 },
  faq_generation: { modelClass: 'light', temperature: 0.2, maxTokens: 1024 },
  seo_audit: { modelClass: 'complex', temperature: 0.2, maxTokens: 2048 },
  conversation: { modelClass: 'complex', temperature: 0.3, maxTokens: 1024 },
};

/** Map a model class to a concrete local provider model. */
function modelForClass(modelClass: ModelClass): string {
  return modelClass === 'light' ? LIGHT_MODEL : COMPLEX_MODEL;
}

/**
 * Resolve the routing decision for a capability.
 *
 * `provider` defaults to 'auto' (the NVIDIA → Ollama Cloud → local cascade).
 * `model` defaults to the routed model for the capability's model class.
 */
export function routeCapability(
  capability: CapabilityName,
  overrides?: { provider?: CapabilityRoute['provider']; model?: string },
): CapabilityRoute {
  const policy = CAPABILITY_POLICIES[capability];
  return {
    capability,
    modelClass: policy.modelClass,
    model: overrides?.model || modelForClass(policy.modelClass),
    provider: overrides?.provider ?? 'auto',
    temperature: policy.temperature,
    maxTokens: policy.maxTokens,
  };
}
