// Domain value object — the knowledge graph query interface
// Pure domain — zero framework dependencies

import { Fact } from '../../domain/fact/Fact';
import { Relationship } from '../../domain/relationship/Relationship';
import { Assertion } from '../../domain/assertion/Assertion';

export interface KnowledgeGraphQuery {
  entityType?: string;
  entityId?: string;
  attribute?: string;
  relationshipType?: string;
  validAt?: Date;
}

export interface KnowledgeGraphResult {
  facts: Fact[];
  relationships: Relationship[];
  assertions: Assertion[];
}

export interface KnowledgeGraphStats {
  entityCount: number;
  factCount: number;
  relationshipCount: number;
  assertionCount: number;
  lastUpdated: Date | null;
}
