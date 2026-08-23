import { faqGenerationCapability } from '../infrastructure/ai/capabilities/FAQGenerationCapability';

export interface FAQResult {
  faqs: Array<{
    question: string;
    answer: string;
    category: 'dietary' | 'parking' | 'hours' | 'accessibility' | 'family-friendly' | 'general';
    voiceSnippet: string; // concise answer under 100 characters for voice assistant responses
  }>;
}

/** Deterministic fallback when every AI provider fails. */
function emptyFAQs(): FAQResult {
  return { faqs: [] };
}

export class FAQService {
  /**
   * Generates highly search-optimized FAQs based on restaurant context, menu tags,
   * and customer review insights. Uses the FAQGenerationCapability (light-model
   * routing). Degrades gracefully to an empty envelope if all providers fail.
   */
  async generateFAQs(restaurantInfo: {
    name: string;
    address: string;
    cuisineTypes: string[];
    priceRange: string;
    timings?: any;
    dietarySupport?: string[];
    amenities?: string[];
    parkingInfo?: string;
  }, menuSummary?: string, reviewSummary?: string): Promise<FAQResult> {
    const result = await faqGenerationCapability.generate({
      restaurant: restaurantInfo as unknown as Record<string, unknown>,
      menuSummary,
      reviewSummary,
    });

    if (!result.ok) {
      console.warn(
        `⚠️ [FAQ] capability failed (${result.failure.kind}: ${result.failure.message}); returning deterministic fallback.`,
      );
      return emptyFAQs();
    }

    return result.data;
  }
}

export const faqService = new FAQService();
