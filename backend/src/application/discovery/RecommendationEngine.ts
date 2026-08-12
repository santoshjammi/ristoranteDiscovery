// Application service: Recommendation Engine
// Maps evidence to prioritized, actionable recommendations
// Pure domain logic — no framework dependencies

import { Recommendation, type RecommendationPriority } from '../../domain/discovery/Recommendation';
import { Evidence, type ConfidenceLevel } from '../../domain/discovery/Evidence';

export interface RecommendationTemplate {
  title: string;
  description: string;
  category: string;
  detect: (evidence: Evidence[]) => { matched: boolean; evidenceIds: string[]; count: number };
  businessImpact: string;
  businessImpactValue: number;
  implementationEffort: string;
  implementationEffortMinutes: number;
  basePriority: RecommendationPriority;
  baseConfidence: ConfidenceLevel;
}

const templates: RecommendationTemplate[] = [
  {
    title: 'Add dish descriptions',
    description: 'Add descriptions to menu items that are missing them. Descriptive menus perform better in semantic search.',
    category: 'menu',
    detect: (evidence) => {
      const desc = evidence.filter(e => e.source.field === 'description' && e.description.startsWith('Missing description'));
      return { matched: desc.length > 0, evidenceIds: desc.map(e => e.id), count: desc.length };
    },
    businessImpact: '+5-15% menu discoverability score',
    businessImpactValue: 1200,
    implementationEffort: '20 minutes',
    implementationEffortMinutes: 20,
    basePriority: 'high',
    baseConfidence: 'high',
  },
  {
    title: 'Add nearby landmarks',
    description: 'Add nearby corporate landmarks and neighborhoods to your profile. Landmark references improve local search ranking.',
    category: 'seo',
    detect: (evidence) => {
      const lmks = evidence.filter(e => e.source.field === 'nearbyLandmarks');
      return { matched: lmks.length < 3, evidenceIds: lmks.map(e => e.id), count: 3 - lmks.length };
    },
    businessImpact: '+5-15% local search visibility',
    businessImpactValue: 800,
    implementationEffort: '2 minutes',
    implementationEffortMinutes: 2,
    basePriority: 'high',
    baseConfidence: 'high',
  },
  {
    title: 'Generate FAQ page',
    description: 'Generate a FAQ page with voice-search-optimized answers. FAQs appear in rich snippets and voice search.',
    category: 'seo',
    detect: (evidence) => {
      const faqs = evidence.filter(e => e.source.entityType === 'FAQ');
      return { matched: faqs.length < 5, evidenceIds: faqs.map(e => e.id), count: Math.max(0, 5 - faqs.length) };
    },
    businessImpact: '+5-15% AI discoverability score',
    businessImpactValue: 1500,
    implementationEffort: '5 minutes',
    implementationEffortMinutes: 5,
    basePriority: 'high',
    baseConfidence: 'high',
  },
  {
    title: 'Respond to negative reviews',
    description: 'Respond to recent negative reviews with professional, empathetic responses. Response to negative reviews improves perception.',
    category: 'reviews',
    detect: (evidence) => {
      const reviews = evidence.filter(e => e.source.entityType === 'ReviewAnalysis');
      return { matched: reviews.length > 0, evidenceIds: reviews.map(e => e.id), count: reviews.length };
    },
    businessImpact: '+0.1-0.3 star rating improvement',
    businessImpactValue: 600,
    implementationEffort: '5 minutes per response',
    implementationEffortMinutes: 10,
    basePriority: 'medium',
    baseConfidence: 'medium',
  },
  {
    title: 'Complete Google Business Profile',
    description: 'Complete missing fields in your Google Business Profile. Complete profiles rank 2x higher in local search.',
    category: 'seo',
    detect: (evidence) => {
      const cuisine = evidence.filter(e => e.source.field === 'regionalCuisine');
      return { matched: cuisine.length === 0, evidenceIds: [], count: 1 };
    },
    businessImpact: '+10-25% local search visibility',
    businessImpactValue: 2000,
    implementationEffort: '15-30 minutes',
    implementationEffortMinutes: 30,
    basePriority: 'high',
    baseConfidence: 'high',
  },
];

export class RecommendationEngine {
  generate(evidence: Evidence[], restaurantId: string): Recommendation[] {
    const recommendations: Recommendation[] = [];

    for (const template of templates) {
      const result = template.detect(evidence);
      if (!result.matched) continue;

      recommendations.push(new Recommendation({
        id: crypto.randomUUID(),
        restaurantId,
        title: template.title,
        description: template.description,
        evidenceIds: result.evidenceIds,
        confidence: template.baseConfidence,
        businessImpact: template.businessImpact,
        businessImpactValue: template.businessImpactValue,
        implementationEffort: template.implementationEffort,
        implementationEffortMinutes: template.implementationEffortMinutes,
        priority: template.basePriority,
        status: 'identified',
        category: template.category,
        createdAt: new Date(),
        completedAt: null,
      }));
    }

    // Sort by priority score (descending)
    return recommendations.sort((a, b) => b.priorityScore - a.priorityScore);
  }
}
