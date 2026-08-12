// Application service: Assertion Engine
// Converts evidence into structured assertions
// Deterministic — same evidence → same assertions
// No AI dependency

import { Assertion } from '../../domain/assertion/Assertion';
import { Evidence } from '../../domain/evidence/Evidence';

// --- Repository interface ---

export interface AssertionRepository {
  saveAssertion(assertion: Assertion): Promise<void>;
  findAssertionsByEvidence(evidenceId: string): Promise<Assertion[]>;
  findAssertionsBySubject(subject: string): Promise<Assertion[]>;
  findActiveAssertionsBySubject(subject: string): Promise<Assertion[]>;
}

// --- Assertion rules ---

type AssertionRule = {
  name: string;
  version: string;
  predicate: string;
  apply: (evidence: Evidence) => Array<{
    subject: string;
    object: string;
    confidence: number;
    explanation: string;
  }>;
};

const ASSERTION_RULES: AssertionRule[] = [
  {
    name: 'restaurant-name',
    version: '1.0.0',
    predicate: 'has-name',
    apply: (evidence) => {
      const name = (evidence.payload as any)?.name;
      if (name && evidence.entityType === 'restaurant') {
        return [{
          subject: `${evidence.entityType}:${evidence.entityId}`,
          object: String(name),
          confidence: evidence.confidence,
          explanation: `Evidence from ${evidence.sourceType} source ${evidence.sourceId} contains name "${name}"`,
        }];
      }
      return [];
    },
  },
  {
    name: 'restaurant-cuisine',
    version: '1.0.0',
    predicate: 'serves-cuisine',
    apply: (evidence) => {
      const cuisines = (evidence.payload as any)?.cuisineTypes;
      if (Array.isArray(cuisines) && evidence.entityType === 'restaurant') {
        return cuisines.map((c: string) => ({
          subject: `${evidence.entityType}:${evidence.entityId}`,
          object: String(c).toLowerCase(),
          confidence: evidence.confidence,
          explanation: `Evidence from ${evidence.sourceType} source ${evidence.sourceId} lists cuisine "${c}"`,
        }));
      }
      return [];
    },
  },
  {
    name: 'restaurant-price-range',
    version: '1.0.0',
    predicate: 'has-price-range',
    apply: (evidence) => {
      const price = (evidence.payload as any)?.priceRange;
      if (price && evidence.entityType === 'restaurant') {
        return [{
          subject: `${evidence.entityType}:${evidence.entityId}`,
          object: String(price),
          confidence: evidence.confidence,
          explanation: `Evidence from ${evidence.sourceType} source ${evidence.sourceId} lists price range "${price}"`,
        }];
      }
      return [];
    },
  },
  {
    name: 'restaurant-rating',
    version: '1.0.0',
    predicate: 'has-rating',
    apply: (evidence) => {
      const rating = (evidence.payload as any)?.rating ?? (evidence.payload as any)?.averageRating;
      if (rating !== undefined && rating !== null && evidence.entityType === 'restaurant') {
        return [{
          subject: `${evidence.entityType}:${evidence.entityId}`,
          object: String(rating),
          confidence: evidence.confidence,
          explanation: `Evidence from ${evidence.sourceType} source ${evidence.sourceId} contains rating ${rating}`,
        }];
      }
      return [];
    },
  },
  {
    name: 'menu-item-name',
    version: '1.0.0',
    predicate: 'has-menu-item',
    apply: (evidence) => {
      const items = (evidence.payload as any)?.menuItems;
      if (Array.isArray(items) && evidence.entityType === 'menu') {
        return items.map((item: any) => ({
          subject: `${evidence.entityType}:${evidence.entityId}`,
          object: String(item.name || 'unknown'),
          confidence: evidence.confidence,
          explanation: `Evidence from ${evidence.sourceType} source ${evidence.sourceId} lists menu item "${item.name}"`,
        }));
      }
      return [];
    },
  },
  {
    name: 'review-sentiment',
    version: '1.0.0',
    predicate: 'has-sentiment',
    apply: (evidence) => {
      const sentiment = (evidence.payload as any)?.sentiment;
      if (sentiment && evidence.entityType === 'review') {
        return [{
          subject: `${evidence.entityType}:${evidence.entityId}`,
          object: String(sentiment),
          confidence: evidence.confidence,
          explanation: `Evidence from ${evidence.sourceType} source ${evidence.sourceId} has sentiment "${sentiment}"`,
        }];
      }
      return [];
    },
  },
];

// --- Main engine ---

export class AssertionEngine {
  private readonly rules: AssertionRule[];

  constructor(rules?: AssertionRule[]) {
    this.rules = rules ?? ASSERTION_RULES;
  }

  /**
   * Convert evidence into assertions using all applicable rules.
   * Deterministic: same evidence → same assertions.
   */
  assert(evidence: Evidence): Assertion[] {
    const assertions: Assertion[] = [];

    for (const rule of this.rules) {
      const results = rule.apply(evidence);
      for (const result of results) {
        assertions.push(new Assertion({
          id: `asr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          evidenceId: evidence.id,
          ruleName: rule.name,
          ruleVersion: rule.version,
          subject: result.subject,
          predicate: rule.predicate,
          object: result.object,
          confidence: result.confidence,
          explanation: result.explanation,
          assertedAt: new Date(),
          status: 'active',
        }));
      }
    }

    return assertions;
  }

  /**
   * Register a custom assertion rule.
   */
  addRule(rule: AssertionRule): void {
    this.rules.push(rule);
  }
}
