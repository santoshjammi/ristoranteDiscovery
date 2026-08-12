// Application service: Relationship Engine
// Derives relationships between entities from facts
// Deterministic — same facts → same relationships
// No AI dependency

import { Relationship, type RelationshipType } from '../../domain/relationship/Relationship';
import { Fact } from '../../domain/fact/Fact';

// --- Repository interface ---

export interface RelationshipRepository {
  saveRelationship(relationship: Relationship): Promise<void>;
  findRelationshipsByEntity(entityType: string, entityId: string): Promise<Relationship[]>;
  findRelationshipsByType(type: RelationshipType): Promise<Relationship[]>;
}

// --- Relationship rules ---

type RelationshipRule = {
  name: string;
  type: RelationshipType;
  apply: (facts: Fact[]) => Array<{
    sourceEntityType: string;
    sourceEntityId: string;
    targetEntityType: string;
    targetEntityId: string;
    strength: number;
    factIds: string[];
  }>;
};

const RELATIONSHIP_RULES: RelationshipRule[] = [
  {
    name: 'restaurant-located-in-area',
    type: 'located-in',
    apply: (facts) => {
      const restaurantFacts = facts.filter(f => f.entityType === 'restaurant');
      const areaFacts = facts.filter(f => f.entityType === 'area');
      const results: Array<{ sourceEntityType: string; sourceEntityId: string; targetEntityType: string; targetEntityId: string; strength: number; factIds: string[] }> = [];

      for (const rf of restaurantFacts) {
        const cityFact = facts.find(f =>
          f.entityType === 'restaurant' &&
          f.entityId === rf.entityId &&
          f.attribute === 'city'
        );
        if (cityFact) {
          const areaFact = areaFacts.find(af =>
            af.attribute === 'name' &&
            String(af.value) === String(cityFact.value)
          );
          if (areaFact) {
            results.push({
              sourceEntityType: 'restaurant',
              sourceEntityId: rf.entityId,
              targetEntityType: 'area',
              targetEntityId: areaFact.entityId,
              strength: 1.0,
              factIds: [cityFact.id, areaFact.id],
            });
          }
        }
      }
      return results;
    },
  },
  {
    name: 'restaurant-competes-with',
    type: 'competes-with',
    apply: (facts) => {
      // Simplified: restaurants with same cuisine in same city compete
      const restaurantIds = [...new Set(facts.filter(f => f.entityType === 'restaurant').map(f => f.entityId))];
      const results: Array<{ sourceEntityType: string; sourceEntityId: string; targetEntityType: string; targetEntityId: string; strength: number; factIds: string[] }> = [];

      for (let i = 0; i < restaurantIds.length; i++) {
        for (let j = i + 1; j < restaurantIds.length; j++) {
          const r1 = restaurantIds[i];
          const r2 = restaurantIds[j];

          const c1 = facts.find(f => f.entityId === r1 && f.attribute === 'cuisines');
          const c2 = facts.find(f => f.entityId === r2 && f.attribute === 'cuisines');

          if (c1 && c2 && Array.isArray(c1.value) && Array.isArray(c2.value)) {
            const shared = (c1.value as string[]).filter((v: string) => (c2.value as string[]).includes(v));
            if (shared.length > 0) {
              results.push({
                sourceEntityType: 'restaurant',
                sourceEntityId: r1,
                targetEntityType: 'restaurant',
                targetEntityId: r2,
                strength: Math.min(shared.length / Math.max(c1.value.length, c2.value.length), 1.0),
                factIds: [c1.id, c2.id],
              });
            }
          }
        }
      }
      return results;
    },
  },
  {
    name: 'restaurant-offers-cuisine',
    type: 'offers',
    apply: (facts) => {
      const results: Array<{ sourceEntityType: string; sourceEntityId: string; targetEntityType: string; targetEntityId: string; strength: number; factIds: string[] }> = [];
      const cuisineFacts = facts.filter(f => f.attribute === 'cuisines');

      for (const cf of cuisineFacts) {
        if (Array.isArray(cf.value)) {
          for (const cuisine of cf.value) {
            results.push({
              sourceEntityType: 'restaurant',
              sourceEntityId: cf.entityId,
              targetEntityType: 'cuisine',
              targetEntityId: `cuisine:${cuisine}`,
              strength: cf.confidence,
              factIds: [cf.id],
            });
          }
        }
      }
      return results;
    },
  },
];

// --- Main engine ---

export class RelationshipEngine {
  private readonly rules: RelationshipRule[];

  constructor(rules?: RelationshipRule[]) {
    this.rules = rules ?? RELATIONSHIP_RULES;
  }

  /**
   * Derive relationships from facts.
   * Deterministic: same facts → same relationships.
   */
  derive(facts: Fact[]): Relationship[] {
    const relationships: Relationship[] = [];
    const now = new Date();

    for (const rule of this.rules) {
      const results = rule.apply(facts);
      for (const result of results) {
        relationships.push(new Relationship({
          id: `rel-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          sourceEntityType: result.sourceEntityType,
          sourceEntityId: result.sourceEntityId,
          targetEntityType: result.targetEntityType,
          targetEntityId: result.targetEntityId,
          type: rule.type,
          strength: result.strength,
          factIds: result.factIds,
          recordedAt: now,
        }));
      }
    }

    return relationships;
  }

  /**
   * Register a custom relationship rule.
   */
  addRule(rule: RelationshipRule): void {
    this.rules.push(rule);
  }
}
