"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parserService = exports.ParserService = void 0;
const pdf_parse_1 = __importDefault(require("pdf-parse"));
const ai_service_1 = require("./ai.service");
class ParserService {
    /**
     * Parse PDF buffer into raw text
     */
    async extractTextFromPDF(pdfBuffer) {
        try {
            const data = await (0, pdf_parse_1.default)(pdfBuffer);
            return data.text;
        }
        catch (error) {
            console.error('PDF parsing error:', error);
            throw new Error('Failed to extract text from PDF menu');
        }
    }
    /**
     * Send raw menu text to AIService to convert it into a fully structured menu model
     */
    async parseMenuText(rawText) {
        const systemInstruction = `
You are an expert culinary AI data architect. Your task is to analyze raw restaurant menu text, extract all sections and items, normalize prices, and enrich each item with dietary, allergen, spice, and meal tags.

Ensure strict adherence to the following structured output format:
{
  "sections": [
    {
      "name": "Section Name (e.g., Starters, Mains, Desserts, Cocktails)",
      "description": "Optional brief description of the section",
      "items": [
        {
          "name": "Name of the dish",
          "description": "Detailed description of the dish including how it is prepared",
          "price": 15.50, // Float, normalized to standard number (omit currency symbols)
          "ingredients": ["Ingredient 1", "Ingredient 2"], // Exhaustive list of ingredients mentioned or highly inferred
          "dietaryType": ["Vegetarian", "Vegan", "Gluten-Free", "Halal", "Kosher"], // Apply appropriate dietary tags
          "spiceLevel": "Medium", // "Mild", "Medium", "Hot", "Extra Hot", or "None"
          "allergens": ["Gluten", "Dairy", "Nuts", "Soy", "Shellfish", "Eggs"], // Identify potential allergens
          "mealType": ["Lunch", "Dinner"], // "Breakfast", "Lunch", "Dinner", "Late Night"
          "popularityScore": 0.0 // Keep at 0.0 default
        }
      ]
    }
  ]
}

Rules:
1. Do not hallucinate items. Only extract items present in the text.
2. Prices must be decimal numbers. If a price is missing, assign a reasonable average or 0.0.
3. Classify dietary types, spice levels, allergens, and meal types accurately based on ingredients and descriptions.
`;
        const prompt = `Please parse and structure this raw restaurant menu:\n\n${rawText}`;
        return await ai_service_1.aiService.generateJSON(prompt, systemInstruction);
    }
    /**
     * E2E process: Buffer -> Text -> Structured JSON
     */
    async parsePDFMenu(pdfBuffer) {
        const rawText = await this.extractTextFromPDF(pdfBuffer);
        return await this.parseMenuText(rawText);
    }
}
exports.ParserService = ParserService;
exports.parserService = new ParserService();
