// Domain repository interface — Discovery bounded context
// Defined in domain layer, implemented in infrastructure layer

import { DigitalTwin } from '../../domain/discovery/DigitalTwin';
import { Scorecard } from '../../domain/discovery/Scorecard';
import { Evidence } from '../../domain/discovery/Evidence';
import { Recommendation } from '../../domain/discovery/Recommendation';

export interface DigitalTwinRepository {
  findById(id: string): Promise<DigitalTwin | null>;
  findByRestaurantId(restaurantId: string): Promise<DigitalTwin | null>;
  save(twin: DigitalTwin): Promise<void>;
}

export interface ScorecardRepository {
  findById(id: string): Promise<Scorecard | null>;
  findByRestaurantId(restaurantId: string): Promise<Scorecard | null>;
  save(scorecard: Scorecard): Promise<void>;
}

export interface EvidenceRepository {
  findByIds(ids: string[]): Promise<Evidence[]>;
  findByRestaurantId(restaurantId: string): Promise<Evidence[]>;
  save(evidence: Evidence[]): Promise<void>;
}

export interface RecommendationRepository {
  findByRestaurantId(restaurantId: string): Promise<Recommendation[]>;
  save(recommendations: Recommendation[]): Promise<void>;
}
