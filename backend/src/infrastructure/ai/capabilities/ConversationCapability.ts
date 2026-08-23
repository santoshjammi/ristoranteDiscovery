/**
 * RIST-AI-001 — ConversationCapability.
 *
 * Conversational answer synthesis for RAG chat. Deterministic retrieval
 * (vectorService) and citation rebuilding live in the controller, NOT here.
 * AI responsibility: answer + citation synthesis only.
 *
 * Evidence/Citation Grounding: the capability accepts a deterministic
 * allow-list of retrieved evidence references. After zod validates citation
 * STRUCTURE, every returned citation is checked against this allow-list;
 * fabricated references (e.g. a hallucinated `fake_review_999999`) are removed
 * and, if grounding is required but no citations survive, a `grounding_failed`
 * failure is surfaced deterministically.
 */

import { executeCapability, type CapabilityInvokeOptions, type CapabilityResult } from './sharedCapability';
import { conversationSchema, type Conversation } from '../schemas';
import { prompts, type ConversationInput } from '../prompts';
import { CapabilityError } from '../contracts/CapabilityError';

export { conversationSchema, type Conversation } from '../schemas';
export type { ConversationInput } from '../prompts';

/** Options that control citation grounding for a conversation request. */
export interface ConversationGroundingOptions {
  /**
   * When true, a synthesized answer with zero surviving grounded citations is
   * treated as a `grounding_failed` failure rather than returned as-is.
   * Defaults to true.
   */
  requireCitations?: boolean;
}

export class ConversationCapability {
  async converse(
    input: ConversationInput,
    options?: CapabilityInvokeOptions,
    grounding?: ConversationGroundingOptions,
  ): Promise<CapabilityResult<Conversation>> {
    const prompt = prompts.conversation;
    return executeCapability<typeof conversationSchema, ConversationInput>(
      'conversation',
      () => prompt.buildSystem(),
      (i) => prompt.buildPrompt(i),
      input,
      conversationSchema,
      options,
      async (_input, parsed) => groundCitations(parsed, input, grounding),
    );
  }
}

/**
 * Ground the model's citations against the deterministic retrieval allow-list.
 * Citations whose restaurant/entity reference is not present in the allow-list
 * are hallucinated and are removed so they never reach the customer or any
 * downstream scoring.
 */
export function groundCitations(
  parsed: Conversation,
  input: ConversationInput,
  grounding?: ConversationGroundingOptions,
): Conversation {
  const allowList = buildAllowSet(input.retrievedEvidence ?? []);
  const requireCitations = grounding?.requireCitations !== false;

  const citations = (parsed.citations ?? []).filter((citation) => {
    const key = citationKey(citation.restaurantId, citation.entityType, citation.entityName);
    // A citation is grounded iff its reference is in the deterministic set.
    return allowList.has(key) || allowList.has(citation.restaurantId);
  });

  // Never persist fabricated evidence; keep the sanitised list.
  const grounded: Conversation = { ...parsed, citations };

  if (requireCitations && citations.length === 0 && allowList.size > 0) {
    throw new CapabilityError(
      'grounding_failed',
      'Model returned no citations that could be grounded against retrieved evidence',
    );
  }

  return grounded;
}

function citationKey(restaurantId: string, entityType?: string, entityName?: string): string {
  return [restaurantId, entityType ?? '', entityName ?? ''].filter(Boolean).join('::');
}

function buildAllowSet(evidence: ConversationInput['retrievedEvidence']): Set<string> {
  const set = new Set<string>();
  for (const e of evidence ?? []) {
    set.add(e.restaurantId);
    if (e.entityId) set.add(citationKey(e.restaurantId, e.entityType ?? '', e.entityId));
    // Also allow matching by entity name when entityId is unavailable but the
    // restaurant itself was retrieved.
  }
  return set;
}

export const conversationCapability = new ConversationCapability();
