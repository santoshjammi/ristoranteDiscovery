import { aiService } from './ai.service';

export interface GBPOptimizationResult {
  scorecard: {
    photoCompleteness: number; // 0-100
    descriptionCompleteness: number;
    hoursCompleteness: number;
    overallScore: number;
  };
  neighborhoods: string[]; // List of nearby local areas/districts
  landmarks: string[];     // Nearby landmarks to mention in description
  keywordOpportunities: string[]; // Target SEO keywords
  actionItems: Array<{
    task: string;
    priority: "High" | "Medium" | "Low";
    impact: string;
  }>;
}

export class SEOOptimizerService {
  /**
   * Run local SEO audits on restaurant profiles, returning landmark lists and GBP checklists.
   */
  async auditRestaurant(restaurant: {
    name: string;
    address: string;
    city: string;
    cuisineTypes: string[];
    amenities: string[];
  }, reviewSummary?: string): Promise<GBPOptimizationResult> {
    
    const context = {
      restaurant,
      reviewSummary: reviewSummary || "No review analysis profile found."
    };

    const systemInstruction = `
You are a local SEO expert specializing in Google Maps visibility, Google Business Profile (GBP) ranking algorithms, and location schema clustering. 

Given a restaurant profile and customer sentiment reviews, perform an SEO audit and output a strictly valid JSON response matching this schema:
{
  "scorecard": {
    "photoCompleteness": 80, // Number 0-100
    "descriptionCompleteness": 65,
    "hoursCompleteness": 90,
    "overallScore": 78
  },
  "neighborhoods": ["Local district A", "Neighborhood B"], // Identify 2-4 actual or plausible neighborhood districts in the city
  "landmarks": ["Famous Park", "Historic Monument"], // Identify 2-4 real or plausible geo landmarks nearby
  "keywordOpportunities": [
    "best [cuisine] in [neighborhood/city]",
    "gluten-free [dish] near me"
  ],
  "actionItems": [
    {
      "task": "Update your GBP business description to mention proximity to [Landmark] and target keyword [Keyword].",
      "priority": "High", // "High", "Medium", or "Low"
      "impact": "Improves proximity relevance in local 3-pack searches."
    }
  ]
}

Guidelines:
1. Generate realistic neighborhood and landmark suggestions based on the restaurant's city and address (e.g. Rome should suggest landmarks like Trevi Fountain, Colosseum, Piazza Navona, etc.).
2. The actionItems must be concrete, specific, and actionable for restaurant owners.
3. Calculate scorecard scores realistically based on metadata presence (e.g. if amenities or address is short, score description lower).
`;

    const prompt = `Perform a local SEO audit for this restaurant context:\n\n${JSON.stringify(context, null, 2)}`;

    return await aiService.generateJSON<GBPOptimizationResult>(prompt, systemInstruction);
  }
}

export const seoOptimizerService = new SEOOptimizerService();
