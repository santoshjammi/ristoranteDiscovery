// Application service: Digital Twin Service
// The Digital Twin is the current projection of the Knowledge Graph
// Not another datastore — just the canonical projection
// No AI dependency

import { Fact } from '../../domain/fact/Fact';
import { Relationship } from '../../domain/relationship/Relationship';
import { Assertion } from '../../domain/assertion/Assertion';
import { type KnowledgeGraphRepository } from './KnowledgeGraphService';

export interface DigitalTwinProjection {
  restaurantId: string;
  facts: Fact[];
  relationships: Relationship[];
  assertions: Assertion[];
  factCount: number;
  relationshipCount: number;
  assertionCount: number;
  lastUpdated: Date;
}

export class DigitalTwinService {
  constructor(private readonly graphRepository: KnowledgeGraphRepository) {}

  /**
   * Get the current projection of the Knowledge Graph for a restaurant.
   * The Digital Twin is merely the current state of the graph for this entity.
   */
  async getProjection(restaurantId: string): Promise<DigitalTwinProjection> {
    const [facts, relationships, assertions] = await Promise.all([
      this.graphRepository.findFacts({ entityType: 'restaurant', entityId: restaurantId }),
      this.graphRepository.findRelationships({ entityType: 'restaurant', entityId: restaurantId }),
      this.graphRepository.findAssertions({ entityType: 'restaurant', entityId: restaurantId }),
    ]);

    return {
      restaurantId,
      facts,
      relationships,
      assertions,
      factCount: facts.length,
      relationshipCount: relationships.length,
      assertionCount: assertions.length,
      lastUpdated: new Date(),
    };
  }

  /**
   * Get a specific fact from the Digital Twin.
   */
  async getFact(restaurantId: string, attribute: string): Promise<Fact | undefined> {
    const facts = await this.graphRepository.findFacts({
      entityType: 'restaurant',
      entityId: restaurantId,
      attribute,
    });
    return facts.find(f => f.status === 'current');
  }

  /**
   * Get all relationships of a specific type for a restaurant.
   */
  async getRelationships(restaurantId: string, type?: string): Promise<Relationship[]> {
    const relationships = await this.graphRepository.findRelationships({
      entityType: 'restaurant',
      entityId: restaurantId,
      relationshipType: type,
    });
    return relationships;
  }
}
