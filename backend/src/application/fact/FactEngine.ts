// Application service: Fact Engine
// Converts assertions into canonical facts
// Deterministic — same assertions → same facts
// No AI dependency

import { Fact } from '../../domain/fact/Fact';
import { Assertion } from '../../domain/assertion/Assertion';

// --- Repository interface ---

export interface FactRepository {
  saveFact(fact: Fact): Promise<void>;
  findFactsByEntity(entityType: string, entityId: string): Promise<Fact[]>;
  findCurrentFactsByEntity(entityType: string, entityId: string): Promise<Fact[]>;
  findFactByEntityAndAttribute(entityType: string, entityId: string, attribute: string): Promise<Fact | null>;
  supersedeFact(factId: string): Promise<void>;
}

// --- Fact resolution rules ---

type FactResolver = {
  attribute: string;
  resolve: (assertions: Assertion[]) => {
    value: unknown;
    confidence: number;
    assertionIds: string[];
  };
};

const FACT_RESOLVERS: FactResolver[] = [
  {
    attribute: 'name',
    resolve: (assertions) => {
      const nameAssertions = assertions.filter(a => a.predicate === 'has-name');
      if (nameAssertions.length === 0) return { value: null, confidence: 0, assertionIds: [] };
      // Highest confidence wins
      const best = nameAssertions.sort((a, b) => b.confidence - a.confidence)[0];
      return { value: best.object, confidence: best.confidence, assertionIds: [best.id] };
    },
  },
  {
    attribute: 'cuisines',
    resolve: (assertions) => {
      const cuisineAssertions = assertions.filter(a => a.predicate === 'serves-cuisine');
      if (cuisineAssertions.length === 0) return { value: [], confidence: 0, assertionIds: [] };
      const cuisines = [...new Set(cuisineAssertions.map(a => a.object))];
      const avgConfidence = cuisineAssertions.reduce((s, a) => s + a.confidence, 0) / cuisineAssertions.length;
      return { value: cuisines, confidence: avgConfidence, assertionIds: cuisineAssertions.map(a => a.id) };
    },
  },
  {
    attribute: 'priceRange',
    resolve: (assertions) => {
      const priceAssertions = assertions.filter(a => a.predicate === 'has-price-range');
      if (priceAssertions.length === 0) return { value: null, confidence: 0, assertionIds: [] };
      const best = priceAssertions.sort((a, b) => b.confidence - a.confidence)[0];
      return { value: best.object, confidence: best.confidence, assertionIds: [best.id] };
    },
  },
  {
    attribute: 'rating',
    resolve: (assertions) => {
      const ratingAssertions = assertions.filter(a => a.predicate === 'has-rating');
      if (ratingAssertions.length === 0) return { value: null, confidence: 0, assertionIds: [] };
      const avg = ratingAssertions.reduce((s, a) => s + parseFloat(a.object), 0) / ratingAssertions.length;
      const avgConfidence = ratingAssertions.reduce((s, a) => s + a.confidence, 0) / ratingAssertions.length;
      return { value: Math.round(avg * 100) / 100, confidence: avgConfidence, assertionIds: ratingAssertions.map(a => a.id) };
    },
  },
  {
    attribute: 'menuItems',
    resolve: (assertions) => {
      const menuAssertions = assertions.filter(a => a.predicate === 'has-menu-item');
      if (menuAssertions.length === 0) return { value: [], confidence: 0, assertionIds: [] };
      const items = [...new Set(menuAssertions.map(a => a.object))];
      const avgConfidence = menuAssertions.reduce((s, a) => s + a.confidence, 0) / menuAssertions.length;
      return { value: items, confidence: avgConfidence, assertionIds: menuAssertions.map(a => a.id) };
    },
  },
  {
    attribute: 'sentiment',
    resolve: (assertions) => {
      const sentimentAssertions = assertions.filter(a => a.predicate === 'has-sentiment');
      if (sentimentAssertions.length === 0) return { value: null, confidence: 0, assertionIds: [] };
      const best = sentimentAssertions.sort((a, b) => b.confidence - a.confidence)[0];
      return { value: best.object, confidence: best.confidence, assertionIds: [best.id] };
    },
  },
];

// --- Main engine ---

export class FactEngine {
  private readonly resolvers: FactResolver[];

  constructor(resolvers?: FactResolver[]) {
    this.resolvers = resolvers ?? FACT_RESOLVERS;
  }

  /**
   * Convert assertions into canonical facts.
   * Deterministic: same assertions → same facts.
   */
  resolve(assertions: Assertion[], entityType: string, entityId: string): Fact[] {
    const facts: Fact[] = [];
    const now = new Date();

    for (const resolver of this.resolvers) {
      const result = resolver.resolve(assertions);
      if (result.value === null || (Array.isArray(result.value) && result.value.length === 0)) {
        continue;
      }

      facts.push(new Fact({
        id: `fact-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        assertionIds: result.assertionIds,
        entityType,
        entityId,
        attribute: resolver.attribute,
        value: result.value,
        confidence: result.confidence,
        validFrom: now,
        validTo: null,
        status: 'current',
        version: 1,
      }));
    }

    return facts;
  }

  /**
   * Register a custom fact resolver.
   */
  addResolver(resolver: FactResolver): void {
    this.resolvers.push(resolver);
  }
}
