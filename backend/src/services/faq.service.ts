import { aiService } from './ai.service';

export interface FAQResult {
  faqs: Array<{
    question: string;
    answer: string;
    category: 'dietary' | 'parking' | 'hours' | 'accessibility' | 'family-friendly' | 'general';
    voiceSnippet: string; // concise answer under 100 characters for voice assistant responses
  }>;
}

export class FAQService {
  /**
   * Generates highly search-optimized FAQs based on restaurant context, menu tags, and customer review insights.
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
    
    const contextPayload = {
      restaurant: restaurantInfo,
      menuSummary: menuSummary || "No menu details provided",
      reviewSummary: reviewSummary || "No review intelligence available"
    };

    const systemInstruction = `
You are an SEO strategist and AI retrieval engineer specializing in local discovery intent. Your task is to generate highly search-optimized, structured FAQs that map directly to conversational query intents (nearby, dietary, accessibility, parking, timings, family-friendly).

Output a strictly valid JSON response matching this schema:
{
  "faqs": [
    {
      "question": "A typical question someone would ask Google, Siri, or Alexa. Make it voice-search friendly (e.g., 'Does [Restaurant Name] offer gluten-free options?')",
      "answer": "A clear, descriptive, and keyword-rich answer optimized for search snippet inclusion.",
      "category": "dietary", // Must be one of: 'dietary', 'parking', 'hours', 'accessibility', 'family-friendly', 'general'
      "voiceSnippet": "A ultra-short (1-2 sentences), direct response optimized to be read aloud by smart speakers."
    }
  ]
}

Guidelines:
1. Generate at least 5-8 highly relevant FAQs.
2. Incorporate real details from the restaurant profile (address, opening hours, parking, price range).
3. Align answers to voice search queries (direct, concise, conversational).
4. Do not include placeholders; write complete, ready-to-publish text.
`;

    const prompt = `Generate FAQs for the following restaurant context:\n\n${JSON.stringify(contextPayload, null, 2)}`;

    return await aiService.generateJSONLight<FAQResult>(prompt, systemInstruction);
  }
}

export const faqService = new FAQService();
