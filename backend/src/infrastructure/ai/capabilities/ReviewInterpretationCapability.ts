/**
 * RIST-AI-001 — ReviewInterpretationCapability.
 *
 * Interprets review batches into sentiment, themes, and clusters. AI
 * responsibility: interpretation only. Rating, count, date, response rate, and
 * velocity are all deterministic upstream and never touched here.
 */

import { executeCapability, type CapabilityInvokeOptions, type CapabilityResult } from './sharedCapability';
import { reviewAnalysisSchema, type ReviewAnalysis } from '../schemas';
import { prompts, type ReviewInterpretationInput } from '../prompts';

export { reviewAnalysisSchema, type ReviewAnalysis } from '../schemas';

export class ReviewInterpretationCapability {
  async analyze(
    input: ReviewInterpretationInput,
    options?: CapabilityInvokeOptions,
  ): Promise<CapabilityResult<ReviewAnalysis>> {
    const prompt = prompts.reviewInterpretation;
    return executeCapability<typeof reviewAnalysisSchema, ReviewInterpretationInput>(
      'review_interpretation',
      () => prompt.buildSystem(),
      (i) => prompt.buildPrompt(i),
      input,
      reviewAnalysisSchema,
      options,
    );
  }
}

export const reviewInterpretationCapability = new ReviewInterpretationCapability();
