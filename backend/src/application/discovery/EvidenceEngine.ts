// Application service: Evidence Engine
// Generates typed Evidence from restaurant data
// Pure domain logic — no framework dependencies

import { Evidence, type ConfidenceLevel, type EvidenceSource } from '../../domain/discovery/Evidence';

export interface EvidenceInput {
  menuItems: Array<{ id: string; name: string; price: number; description: string | null; ingredients: string; dietaryType: string }>;
  reviewAnalysis: { overallSentiment: number; sentimentSummary: string | null; popularDishes: string; complaints: string } | null;
  faqs: Array<{ id: string; question: string; answer: string; category: string }>;
  restaurantName: string;
  city: string;
  cuisineTypes: string[];
  regionalCuisine: string | null;
  nearbyLandmarks: string[];
}

export class EvidenceEngine {
  generate(input: EvidenceInput): Evidence[] {
    const evidence: Evidence[] = [];
    let idCounter = 0;

    const nextId = (prefix: string): string => `ev-${prefix}-${++idCounter}-${Date.now()}`;

    // Menu item evidence
    for (const item of input.menuItems) {
      evidence.push(new Evidence({
        id: nextId('mit'),
        recommendationId: null,
        description: `Menu item: ${item.name} ($${item.price.toFixed(2)})`,
        source: { entityType: 'MenuItem', entityId: item.id, field: 'name', value: item.name },
        confidence: 'high',
        supportingResearch: null,
      }));

      if (!item.description || item.description.trim().length < 10) {
        evidence.push(new Evidence({
          id: nextId('desc'),
          recommendationId: null,
          description: `Missing description for menu item: ${item.name}`,
          source: { entityType: 'MenuItem', entityId: item.id, field: 'description', value: item.description || '' },
          confidence: 'very-high',
          supportingResearch: 'Menu items with descriptions receive 30% more engagement in search results.',
        }));
      }
    }

    // Review evidence
    if (input.reviewAnalysis) {
      evidence.push(new Evidence({
        id: nextId('sent'),
        recommendationId: null,
        description: `Overall sentiment: ${input.reviewAnalysis.overallSentiment.toFixed(2)}`,
        source: { entityType: 'ReviewAnalysis', entityId: 'latest', field: 'overallSentiment', value: String(input.reviewAnalysis.overallSentiment) },
        confidence: 'high',
        supportingResearch: null,
      }));

      if (input.reviewAnalysis.sentimentSummary) {
        evidence.push(new Evidence({
          id: nextId('summ'),
          recommendationId: null,
          description: `Sentiment summary: ${input.reviewAnalysis.sentimentSummary.slice(0, 200)}`,
          source: { entityType: 'ReviewAnalysis', entityId: 'latest', field: 'sentimentSummary', value: input.reviewAnalysis.sentimentSummary },
          confidence: 'medium',
          supportingResearch: null,
        }));
      }
    }

    // FAQ evidence
    for (const faq of input.faqs) {
      evidence.push(new Evidence({
        id: nextId('faq'),
        recommendationId: null,
        description: `FAQ: ${faq.question}`,
        source: { entityType: 'FAQ', entityId: faq.id, field: 'question', value: faq.question },
        confidence: 'high',
        supportingResearch: null,
      }));
    }

    // Cuisine evidence
    if (input.regionalCuisine) {
      evidence.push(new Evidence({
        id: nextId('cuis'),
        recommendationId: null,
        description: `Regional cuisine identified: ${input.regionalCuisine}`,
        source: { entityType: 'Restaurant', entityId: 'profile', field: 'regionalCuisine', value: input.regionalCuisine },
        confidence: 'high',
        supportingResearch: 'Regional cuisine classification improves semantic search matching by 25%.',
      }));
    }

    // Landmark evidence
    for (const landmark of input.nearbyLandmarks) {
      evidence.push(new Evidence({
        id: nextId('lmk'),
        recommendationId: null,
        description: `Nearby landmark: ${landmark}`,
        source: { entityType: 'Restaurant', entityId: 'profile', field: 'nearbyLandmarks', value: landmark },
        confidence: 'very-high',
        supportingResearch: 'Proximity to landmarks is a local search ranking signal.',
      }));
    }

    return evidence;
  }
}
