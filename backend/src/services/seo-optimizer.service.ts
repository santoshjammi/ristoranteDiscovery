import { seoAuditCapability } from '../infrastructure/ai/capabilities/SEOAuditCapability';

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

/** Deterministic fallback when every AI provider fails. */
function emptyAudit(): GBPOptimizationResult {
  return {
    scorecard: { photoCompleteness: 0, descriptionCompleteness: 0, hoursCompleteness: 0, overallScore: 0 },
    neighborhoods: [],
    landmarks: [],
    keywordOpportunities: [],
    actionItems: [],
  };
}

export class SEOOptimizerService {
  /**
   * Run local SEO audits on restaurant profiles, returning landmark lists and
   * GBP checklists. Uses the SEOAuditCapability. Degrades gracefully to an
   * empty envelope if all providers fail — never throws.
   */
  async auditRestaurant(restaurant: {
    name: string;
    address: string;
    city: string;
    cuisineTypes: string[];
    amenities: string[];
  }, reviewSummary?: string): Promise<GBPOptimizationResult> {
    const result = await seoAuditCapability.audit({
      restaurant: restaurant as unknown as Record<string, unknown>,
      reviewSummary,
    });

    if (!result.ok) {
      console.warn(
        `⚠️ [SEO audit] capability failed (${result.failure.kind}: ${result.failure.message}); returning deterministic fallback.`,
      );
      return emptyAudit();
    }

    return {
      scorecard: result.data.scorecard ?? emptyAudit().scorecard,
      neighborhoods: result.data.neighborhoods ?? [],
      landmarks: result.data.landmarks ?? [],
      keywordOpportunities: result.data.keywordOpportunities ?? [],
      actionItems: result.data.actionItems ?? [],
    };
  }
}

export const seoOptimizerService = new SEOOptimizerService();
