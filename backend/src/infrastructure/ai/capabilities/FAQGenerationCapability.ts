/**
 * RIST-AI-001 — FAQGenerationCapability.
 *
 * Generates search/voice-optimized FAQs from restaurant profile, menu, and
 * review context. Uses the light-model routing (local Ollama) per the plan.
 */

import { executeCapability, type CapabilityInvokeOptions, type CapabilityResult } from './sharedCapability';
import { faqGenerationSchema, type FAQGeneration } from '../schemas';
import { prompts, type FAQGenerationInput } from '../prompts';

export { faqGenerationSchema, type FAQGeneration } from '../schemas';

export class FAQGenerationCapability {
  async generate(
    input: FAQGenerationInput,
    options?: CapabilityInvokeOptions,
  ): Promise<CapabilityResult<FAQGeneration>> {
    const prompt = prompts.faqGeneration;
    return executeCapability(
      'faq_generation',
      () => prompt.buildSystem(),
      (i) => prompt.buildPrompt(i),
      input,
      faqGenerationSchema,
      options,
    );
  }
}

export const faqGenerationCapability = new FAQGenerationCapability();
