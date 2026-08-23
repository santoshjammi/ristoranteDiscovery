/**
 * RIST-AI-001 — evaluation harness for the AI capability layer.
 *
 * These are deterministic unit tests that verify the capability layer's
 * structured-output contracts, routing policy, and graceful-degradation
 * behaviour WITHOUT calling a real LLM. They run against the zod schemas and
 * routing helpers so the layer is testable and regression-safe.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

import { routeCapability } from '../routing/capabilityRouter';
import {
  menuExtractionSchema,
  reviewAnalysisSchema,
  faqGenerationSchema,
  seoAuditSchema,
  conversationSchema,
} from '../schemas';
import { executeCapability } from '../capabilities/sharedCapability';
import { aiService } from '../providers/AIService';

describe('routing policy (capability → model class)', () => {
  it('routes complex capabilities to the complex model', () => {
    const route = routeCapability('seo_audit');
    expect(route.modelClass).toBe('complex');
    expect(route.provider).toBe('auto');
    expect(route.model.length).toBeGreaterThan(0);
  });

  it('routes FAQ generation to the light model class', () => {
    const route = routeCapability('faq_generation');
    expect(route.modelClass).toBe('light');
  });

  it('routes conversation to the complex model class', () => {
    const route = routeCapability('conversation');
    expect(route.modelClass).toBe('complex');
  });

  it('respects explicit provider/model overrides', () => {
    const route = routeCapability('menu_extraction', { provider: 'local', model: 'custom' });
    expect(route.provider).toBe('local');
    expect(route.model).toBe('custom');
  });

  it('every capability maps to a valid model class', () => {
    for (const capability of ['menu_extraction', 'review_interpretation', 'faq_generation', 'seo_audit', 'conversation'] as const) {
      const route = routeCapability(capability);
      expect(['complex', 'light']).toContain(route.modelClass);
      expect(route.temperature).toBeGreaterThan(0);
      expect(route.maxTokens).toBeGreaterThan(0);
    }
  });
});

describe('zod structured-output schemas', () => {
  it('menu extraction: accepts a well-formed structured menu', () => {
    const input = {
      sections: [
        {
          name: 'Starters',
          items: [{ name: 'Paneer Tikka', price: 12.5, spiceLevel: 'Medium' }],
        },
      ],
    };
    const parsed = menuExtractionSchema.parse(input);
    expect(parsed.sections).toHaveLength(1);
    expect(parsed.sections[0].items[0].name).toBe('Paneer Tikka');
    // defaults applied
    expect(parsed.sections[0].items[0].ingredients).toEqual([]);
    expect(parsed.sections[0].items[0].popularityScore).toBe(0);
  });

  it('menu extraction: rejects malformed output (missing item name)', () => {
    const input = { sections: [{ name: 'Starters', items: [{ price: 5 }] }] };
    expect(() => menuExtractionSchema.parse(input)).toThrow();
  });

  it('review analysis: accepts a valid interpretation envelope', () => {
    const input = {
      overallSentiment: 0.8,
      sentimentSummary: 'Great food',
      popularDishes: [{ dishName: 'Biryani', sentiment: 'Positive', mentions: 3 }],
      audienceProfile: { families: '30%', couples: '40%' },
    };
    const parsed = reviewAnalysisSchema.parse(input);
    expect(parsed.overallSentiment).toBe(0.8);
    expect(parsed.popularDishes![0].sentiment).toBe('Positive');
    expect(parsed.ambienceTags).toEqual([]); // default
  });

  it('review analysis: rejects unknown sentiment value', () => {
    const input = {
      overallSentiment: 0.5,
      sentimentSummary: 'x',
      popularDishes: [{ dishName: 'X', sentiment: 'Extreme', mentions: 1 }],
    };
    expect(() => reviewAnalysisSchema.parse(input)).toThrow();
  });

  it('FAQ generation: accepts valid faqs and defaults missing fields', () => {
    const input = { faqs: [{ question: 'Q?', answer: 'A.', category: 'dietary', voiceSnippet: 'Yes' }] };
    const parsed = faqGenerationSchema.parse(input);
    expect(parsed.faqs).toHaveLength(1);
  });

  it('FAQ generation: rejects invalid category', () => {
    const input = { faqs: [{ question: 'Q', answer: 'A', category: 'bogus', voiceSnippet: 'v' }] };
    expect(() => faqGenerationSchema.parse(input)).toThrow();
  });

  it('SEO audit: accepts valid output with defaults', () => {
    const input = {
      scorecard: { photoCompleteness: 80, descriptionCompleteness: 70, hoursCompleteness: 90, overallScore: 78 },
      landmarks: ['Colosseum'],
    };
    const parsed = seoAuditSchema.parse(input);
    expect(parsed.landmarks).toEqual(['Colosseum']);
    expect(parsed.neighborhoods).toEqual([]); // default
  });

  it('conversation: accepts answer + citations', () => {
    const input = {
      answer: 'Try the risotto.',
      citations: [{ restaurantId: 'r1', restaurantName: 'X', entityType: 'menuItem', entityName: 'Risotto', details: '$24' }],
    };
    const parsed = conversationSchema.parse(input);
    expect(parsed.citations).toHaveLength(1);
  });
});

describe('graceful degradation (all providers fail)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('executeCapability returns ok:false (never throws) when providers fail', async () => {
    vi.spyOn(aiService, 'generateJSON').mockRejectedValue(new Error('all providers down'));

    const result = await executeCapability(
      'seo_audit',
      () => 'system',
      () => 'prompt',
      { restaurant: { name: 'x' } },
      seoAuditSchema,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      // A provider/network failure must surface its real kind (provider_unavailable),
      // never be mislabelled as validation_failed (P1-02).
      expect(result.failure.kind).toBe('provider_unavailable');
      expect(result.failure.capability).toBe('seo_audit');
    }
  });

  it('executeCapability returns validated data on success', async () => {
    vi.spyOn(aiService, 'generateJSON').mockResolvedValue({
      scorecard: { photoCompleteness: 80, descriptionCompleteness: 70, hoursCompleteness: 90, overallScore: 78 },
    });

    const result = await executeCapability(
      'seo_audit',
      () => 'system',
      () => 'prompt',
      { restaurant: { name: 'x' } },
      seoAuditSchema,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.scorecard?.overallScore).toBe(78);
    }
  });

  it('executeCapability rejects malformed output (zod failure) without throwing', async () => {
    vi.spyOn(aiService, 'generateJSON').mockResolvedValue({ nope: true });

    const result = await executeCapability(
      'conversation',
      () => 'system',
      () => 'prompt',
      { query: 'q', contextString: 'c' },
      conversationSchema,
    );

    expect(result.ok).toBe(false);
  });
});
