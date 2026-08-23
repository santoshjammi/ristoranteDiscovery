/**
 * RIST-AI-001 — AI capability layer barrel.
 *
 * Application-facing exports. Provider names are intentionally NOT re-exported
 * here; providers are reached only through capabilities.
 */

export { menuExtractionCapability } from './capabilities/MenuExtractionCapability';
export { reviewInterpretationCapability } from './capabilities/ReviewInterpretationCapability';
export { faqGenerationCapability } from './capabilities/FAQGenerationCapability';
export { seoAuditCapability } from './capabilities/SEOAuditCapability';
export { conversationCapability } from './capabilities/ConversationCapability';

export type {
  MenuExtraction,
  ReviewAnalysis,
  FAQGeneration,
  SEOAudit,
  Conversation,
} from './schemas';

export { CapabilityError } from './contracts/CapabilityError';
export type { CapabilityFailure } from './contracts/CapabilityError';
export type { CapabilityName, ProviderName, ModelClass } from './contracts/types';
