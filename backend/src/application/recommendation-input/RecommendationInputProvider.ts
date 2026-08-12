// Application service: Recommendation Input Provider
// Assembles the RecommendationInput contract from the Knowledge Graph
// This is the stable interface every intelligence engine consumes

import { RecommendationInput } from '../../domain/recommendation/RecommendationInput';
import { type KnowledgeGraphRepository } from '../knowledge/KnowledgeGraphService';

export class RecommendationInputProvider {
  constructor(private readonly graphRepository: KnowledgeGraphRepository) {}

  /**
   * Build the RecommendationInput for a restaurant.
   * This is the contract every intelligence engine consumes.
   */
  async getInput(restaurantId: string): Promise<RecommendationInput> {
    const [facts, relationships, assertions] = await Promise.all([
      this.graphRepository.findFacts({ entityType: 'restaurant', entityId: restaurantId }),
      this.graphRepository.findRelationships({ entityType: 'restaurant', entityId: restaurantId }),
      this.graphRepository.findAssertions({ entityType: 'restaurant', entityId: restaurantId }),
    ]);

    return new RecommendationInput({
      restaurantId,
      facts,
      relationships,
      assertions,
      evidenceCount: assertions.length,
      lastUpdated: new Date(),
    });
  }
}
