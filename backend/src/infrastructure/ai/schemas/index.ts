/**
 * RIST-AI-001 — zod structured-output validation schemas.
 *
 * Every AI capability validates its structured output through zod BEFORE the
 * data is consumed. Malformed output is rejected (the capability then returns
 * its deterministic fallback envelope), never propagated into domain state.
 */

import { z } from 'zod';

/* ── Menu extraction ─────────────────────────────────────────── */

export const menuItemSchema = z.object({
  name: z.string(),
  description: z.string().optional().default(''),
  price: z.number(),
  ingredients: z.array(z.string()).optional().default([]),
  dietaryType: z.array(z.string()).optional().default([]),
  spiceLevel: z.string().optional().default('None'),
  allergens: z.array(z.string()).optional().default([]),
  mealType: z.array(z.string()).optional().default([]),
  popularityScore: z.number().optional().default(0),
});

export const menuSectionSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  items: z.array(menuItemSchema).default([]),
});

export const menuExtractionSchema = z.object({
  sections: z.array(menuSectionSchema).default([]),
});

export type MenuExtraction = z.infer<typeof menuExtractionSchema>;

/* ── Review interpretation ───────────────────────────────────── */

const dishSentimentSchema = z.enum(['Positive', 'Negative', 'Neutral']);

export const reviewAnalysisSchema = z.object({
  overallSentiment: z.number(),
  sentimentSummary: z.string(),
  popularDishes: z
    .array(
      z.object({
        dishName: z.string(),
        sentiment: dishSentimentSchema,
        mentions: z.number(),
      }),
    )
    .optional()
    .default([]),
  ambienceTags: z.array(z.string()).optional().default([]),
  serviceInsights: z.string().optional().default(''),
  topicClusters: z
    .array(z.object({ topic: z.string(), summary: z.string() }))
    .optional()
    .default([]),
  complaints: z.array(z.string()).optional().default([]),
  audienceProfile: z
    .object({
      families: z.string().optional(),
      couples: z.string().optional(),
      business: z.string().optional(),
      solo: z.string().optional(),
    })
    .optional(),
});

export type ReviewAnalysis = z.infer<typeof reviewAnalysisSchema>;

/* ── FAQ generation ────────────────────────────────────────────── */

const faqCategorySchema = z.enum([
  'dietary',
  'parking',
  'hours',
  'accessibility',
  'family-friendly',
  'general',
]);

export const faqGenerationSchema = z.object({
  faqs: z
    .array(
      z.object({
        question: z.string(),
        answer: z.string(),
        category: faqCategorySchema,
        voiceSnippet: z.string(),
      }),
    )
    .default([]),
});

export type FAQGeneration = z.infer<typeof faqGenerationSchema>;

/* ── SEO / GBP audit ───────────────────────────────────────────── */

const actionPrioritySchema = z.enum(['High', 'Medium', 'Low']);

export const seoAuditSchema = z.object({
  scorecard: z
    .object({
      photoCompleteness: z.number(),
      descriptionCompleteness: z.number(),
      hoursCompleteness: z.number(),
      overallScore: z.number(),
    })
    .optional(),
  neighborhoods: z.array(z.string()).optional().default([]),
  landmarks: z.array(z.string()).optional().default([]),
  keywordOpportunities: z.array(z.string()).optional().default([]),
  actionItems: z
    .array(
      z.object({
        task: z.string(),
        priority: actionPrioritySchema,
        impact: z.string(),
      }),
    )
    .optional()
    .default([]),
});

export type SEOAudit = z.infer<typeof seoAuditSchema>;

/* ── Conversation / RAG chat synthesis ─────────────────────────── */

export const conversationSchema = z.object({
  answer: z.string(),
  citations: z
    .array(
      z.object({
        restaurantId: z.string(),
        restaurantName: z.string(),
        entityType: z.string(),
        entityName: z.string(),
        details: z.string(),
      }),
    )
    .optional()
    .default([]),
});

export type Conversation = z.infer<typeof conversationSchema>;
