/**
 * RIST-AI-001 — SEOAuditCapability.
 *
 * Landmark / neighborhood classification and GBP action-item synthesis for
 * restaurant local SEO audits. AI responsibility: synthesis only. No
 * deterministic scoring arithmetic lives here — the legacy scorer and the
 * 25-factor scorecard remain fully deterministic.
 */

import { executeCapability, type CapabilityInvokeOptions, type CapabilityResult } from './sharedCapability';
import { seoAuditSchema, type SEOAudit } from '../schemas';
import { prompts, type SEOAuditInput } from '../prompts';

export { seoAuditSchema, type SEOAudit } from '../schemas';

export class SEOAuditCapability {
  /**
   * Run a local SEO audit on a restaurant profile, returning landmark lists and
   * GBP checklists. Degrades gracefully: on failure returns `ok: false`.
   */
  async audit(input: SEOAuditInput, options?: CapabilityInvokeOptions): Promise<CapabilityResult<SEOAudit>> {
    const prompt = prompts.seoAudit;
    return executeCapability<typeof seoAuditSchema, SEOAuditInput>(
      'seo_audit',
      () => prompt.buildSystem(),
      (i) => prompt.buildPrompt(i),
      input,
      seoAuditSchema,
      options,
    );
  }
}

export const seoAuditCapability = new SEOAuditCapability();
