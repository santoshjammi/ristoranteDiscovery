import pdf from 'pdf-parse';
import { menuExtractionCapability } from '../infrastructure/ai/capabilities/MenuExtractionCapability';

export interface StructuredMenuItem {
  name: string;
  description: string;
  price: number;
  ingredients: string[];
  dietaryType: string[];
  spiceLevel: string; // "Mild", "Medium", "Hot", "Extra Hot", or "None"
  allergens: string[];
  mealType: string[]; // "Breakfast", "Lunch", "Dinner", "Late Night", etc.
  popularityScore: number;
  /** Provenance pointer back to the source menu evidence (file name / URL / hash). */
  sourceRef?: string;
}

export interface StructuredMenuSection {
  name: string;
  description?: string;
  items: StructuredMenuItem[];
  /** Provenance pointer back to the source menu evidence (file name / URL / hash). */
  sourceRef?: string;
}

export interface ParsedMenuResult {
  sections: StructuredMenuSection[];
  /** Provenance pointer for the whole parsed menu source. */
  sourceRef?: string;
}

/** Build a short, stable provenance hash of the raw menu source text. */
export function hashSource(rawText: string): string {
  let h = 5381;
  for (let i = 0; i < rawText.length; i++) {
    h = ((h << 5) + h + rawText.charCodeAt(i)) | 0;
  }
  // djb2 with a stable, positive hex representation
  return `raw:${(h >>> 0).toString(16)}`;
}

export class ParserService {
  /**
   * Parse PDF buffer into raw text
   */
  async extractTextFromPDF(pdfBuffer: Buffer): Promise<string> {
    try {
      const data = await pdf(pdfBuffer);
      return data.text;
    } catch (error) {
      console.error('PDF parsing error:', error);
      throw new Error('Failed to extract text from PDF menu');
    }
  }

  /**
   * Send raw menu text to the AI MenuExtractionCapability to convert it into a
   * fully structured menu model. Degrades gracefully to an empty menu envelope
   * if all providers fail — never throws.
   */
  async parseMenuText(rawText: string, sourceName?: string): Promise<ParsedMenuResult> {
    const result = await menuExtractionCapability.extract({ rawText });

    if (!result.ok) {
      console.warn(
        `⚠️ [Menu] capability failed (${result.failure.kind}: ${result.failure.message}); returning deterministic fallback.`,
      );
      return { sections: [], sourceRef: sourceName || hashSource(rawText) };
    }

    const sourceRef = sourceName || hashSource(rawText);
    return {
      sourceRef,
      sections: result.data.sections.map((s) => ({
        ...s,
        sourceRef,
        items: s.items.map((i) => ({ ...i, sourceRef })),
      })),
    };
  }

  /**
   * E2E process: Buffer -> Text -> Structured JSON
   */
  async parsePDFMenu(pdfBuffer: Buffer, sourceName?: string): Promise<ParsedMenuResult> {
    const rawText = await this.extractTextFromPDF(pdfBuffer);
    return await this.parseMenuText(rawText, sourceName);
  }
}

export const parserService = new ParserService();
