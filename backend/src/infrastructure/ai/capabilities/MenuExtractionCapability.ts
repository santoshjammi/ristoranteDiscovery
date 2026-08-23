/**
 * RIST-AI-001 — MenuExtractionCapability.
 *
 * Structures raw menu text into sections/items. AI responsibility: dish
 * extraction + enrichment only. URL/provenance and price normalization remain
 * deterministic in the scorer.
 */

import { executeCapability, type CapabilityInvokeOptions, type CapabilityResult } from './sharedCapability';
import { menuExtractionSchema, type MenuExtraction } from '../schemas';
import { prompts, type MenuExtractionInput } from '../prompts';

export { menuExtractionSchema, type MenuExtraction } from '../schemas';

export class MenuExtractionCapability {
  async extract(
    input: MenuExtractionInput,
    options?: CapabilityInvokeOptions,
  ): Promise<CapabilityResult<MenuExtraction>> {
    const prompt = prompts.menuExtraction;
    return executeCapability<typeof menuExtractionSchema, MenuExtractionInput>(
      'menu_extraction',
      () => prompt.buildSystem(),
      (i) => prompt.buildPrompt(i),
      input,
      menuExtractionSchema,
      options,
    );
  }
}

export const menuExtractionCapability = new MenuExtractionCapability();
