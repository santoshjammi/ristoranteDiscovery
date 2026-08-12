// Application service: Knowledge Graph
// Assembles facts, relationships, and assertions into a queryable graph
// Deterministic — same inputs → same graph
// No AI dependency

import { Fact } from '../../domain/fact/Fact';
import { Relationship } from '../../domain/relationship/Relationship';
import { Assertion } from '../../domain/assertion/Assertion';
import { type KnowledgeGraphQuery, type KnowledgeGraphResult, type KnowledgeGraphStats } from '../../domain/knowledge/KnowledgeGraph';

// --- Repository interface ---

export interface KnowledgeGraphRepository {
  saveFact(fact: Fact): Promise<void>;
  saveRelationship(relationship: Relationship): Promise<void>;
  saveAssertion(assertion: Assertion): Promise<void>;
  findFacts(query: KnowledgeGraphQuery): Promise<Fact[]>;
  findFactById(factId: string): Promise<Fact | null>;
  findRelationships(query: KnowledgeGraphQuery): Promise<Relationship[]>;
  findAssertions(query: KnowledgeGraphQuery): Promise<Assertion[]>;
  getStats(): Promise<KnowledgeGraphStats>;
}

// --- Main service ---

export class KnowledgeGraphService {
  constructor(private readonly repository: KnowledgeGraphRepository) {}

  async addFact(fact: Fact): Promise<void> {
    await this.repository.saveFact(fact);
  }

  async addRelationship(relationship: Relationship): Promise<void> {
    await this.repository.saveRelationship(relationship);
  }

  async addAssertion(assertion: Assertion): Promise<void> {
    await this.repository.saveAssertion(assertion);
  }

  async query(query: KnowledgeGraphQuery): Promise<KnowledgeGraphResult> {
    const [facts, relationships, assertions] = await Promise.all([
      this.repository.findFacts(query),
      this.repository.findRelationships(query),
      this.repository.findAssertions(query),
    ]);

    return { facts, relationships, assertions };
  }

  async getStats(): Promise<KnowledgeGraphStats> {
    return this.repository.getStats();
  }

  async getFactsForEntity(entityType: string, entityId: string): Promise<Fact[]> {
    return this.repository.findFacts({ entityType, entityId });
  }

  async getRelationshipsForEntity(entityType: string, entityId: string): Promise<Relationship[]> {
    return this.repository.findRelationships({ entityType, entityId });
  }

  async getProvenanceChain(factId: string): Promise<{
    fact: Fact | null;
    assertions: Assertion[];
  }> {
    const fact = await this.repository.findFactById(factId);
    if (!fact) return { fact: null, assertions: [] };

    const assertions = await this.repository.findAssertions({
      entityId: fact.assertionIds.join(','),
    });

    return { fact, assertions };
  }
}
