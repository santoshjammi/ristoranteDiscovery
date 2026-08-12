// Infrastructure: Prisma implementation of the Knowledge Graph repository
// Maps between domain entities and Prisma persistence model

import { PrismaClient } from '@prisma/client';
import { Fact } from '../../../domain/fact/Fact';
import { Relationship } from '../../../domain/relationship/Relationship';
import { Assertion } from '../../../domain/assertion/Assertion';
import { type KnowledgeGraphQuery, type KnowledgeGraphResult, type KnowledgeGraphStats } from '../../../domain/knowledge/KnowledgeGraph';
import { type KnowledgeGraphRepository } from '../../../application/knowledge/KnowledgeGraphService';

export class PrismaKnowledgeGraphRepository implements KnowledgeGraphRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async saveFact(fact: Fact): Promise<void> {
    await this.prisma.knowledgeFact.upsert({
      where: { id: fact.id },
      update: {
        status: fact.status,
        validTo: fact.validTo,
        version: fact.version,
      },
      create: {
        id: fact.id,
        assertionIds: JSON.stringify(fact.assertionIds),
        entityType: fact.entityType,
        entityId: fact.entityId,
        attribute: fact.attribute,
        value: JSON.stringify(fact.value),
        confidence: fact.confidence,
        validFrom: fact.validFrom,
        validTo: fact.validTo,
        status: fact.status,
        version: fact.version,
      },
    });
  }

  async saveRelationship(relationship: Relationship): Promise<void> {
    await this.prisma.knowledgeRelationship.create({
      data: {
        id: relationship.id,
        sourceEntityType: relationship.sourceEntityType,
        sourceEntityId: relationship.sourceEntityId,
        targetEntityType: relationship.targetEntityType,
        targetEntityId: relationship.targetEntityId,
        type: relationship.type,
        strength: relationship.strength,
        factIds: JSON.stringify(relationship.factIds),
        recordedAt: relationship.recordedAt,
      },
    });
  }

  async saveAssertion(assertion: Assertion): Promise<void> {
    await this.prisma.knowledgeAssertion.create({
      data: {
        id: assertion.id,
        evidenceId: assertion.evidenceId,
        ruleName: assertion.ruleName,
        ruleVersion: assertion.ruleVersion,
        subject: assertion.subject,
        predicate: assertion.predicate,
        object: assertion.object,
        confidence: assertion.confidence,
        explanation: assertion.explanation,
        assertedAt: assertion.assertedAt,
        status: assertion.status,
      },
    });
  }

  async findFacts(query: KnowledgeGraphQuery): Promise<Fact[]> {
    const where: any = {};
    if (query.entityType) where.entityType = query.entityType;
    if (query.entityId) where.entityId = query.entityId;
    if (query.attribute) where.attribute = query.attribute;

    const records = await this.prisma.knowledgeFact.findMany({
      where,
      orderBy: { validFrom: 'desc' },
    });

    return records.map(r => new Fact({
      id: r.id,
      assertionIds: JSON.parse(r.assertionIds),
      entityType: r.entityType,
      entityId: r.entityId,
      attribute: r.attribute,
      value: JSON.parse(r.value),
      confidence: r.confidence,
      validFrom: r.validFrom,
      validTo: r.validTo,
      status: r.status as any,
      version: r.version,
    }));
  }

  async findFactById(factId: string): Promise<Fact | null> {
    const record = await this.prisma.knowledgeFact.findUnique({
      where: { id: factId },
    });

    if (!record) return null;

    return new Fact({
      id: record.id,
      assertionIds: JSON.parse(record.assertionIds),
      entityType: record.entityType,
      entityId: record.entityId,
      attribute: record.attribute,
      value: JSON.parse(record.value),
      confidence: record.confidence,
      validFrom: record.validFrom,
      validTo: record.validTo,
      status: record.status as any,
      version: record.version,
    });
  }

  async findRelationships(query: KnowledgeGraphQuery): Promise<Relationship[]> {
    const where: any = {};
    if (query.entityType) where.sourceEntityType = query.entityType;
    if (query.entityId) where.sourceEntityId = query.entityId;
    if (query.relationshipType) where.type = query.relationshipType;

    const records = await this.prisma.knowledgeRelationship.findMany({
      where,
      orderBy: { recordedAt: 'desc' },
    });

    return records.map(r => new Relationship({
      id: r.id,
      sourceEntityType: r.sourceEntityType,
      sourceEntityId: r.sourceEntityId,
      targetEntityType: r.targetEntityType,
      targetEntityId: r.targetEntityId,
      type: r.type as any,
      strength: r.strength,
      factIds: JSON.parse(r.factIds),
      recordedAt: r.recordedAt,
    }));
  }

  async findAssertions(query: KnowledgeGraphQuery): Promise<Assertion[]> {
    const where: any = {};
    if (query.entityType) where.subject = { contains: query.entityType };
    if (query.entityId) where.subject = { contains: query.entityId };

    const records = await this.prisma.knowledgeAssertion.findMany({
      where,
      orderBy: { assertedAt: 'desc' },
    });

    return records.map(r => new Assertion({
      id: r.id,
      evidenceId: r.evidenceId,
      ruleName: r.ruleName,
      ruleVersion: r.ruleVersion,
      subject: r.subject,
      predicate: r.predicate,
      object: r.object,
      confidence: r.confidence,
      explanation: r.explanation,
      assertedAt: r.assertedAt,
      status: r.status as any,
    }));
  }

  async getStats(): Promise<KnowledgeGraphStats> {
    const [factCount, relationshipCount, assertionCount] = await Promise.all([
      this.prisma.knowledgeFact.count(),
      this.prisma.knowledgeRelationship.count(),
      this.prisma.knowledgeAssertion.count(),
    ]);

    const entityTypes = await this.prisma.knowledgeFact.findMany({
      select: { entityType: true },
      distinct: ['entityType'],
    });

    return {
      entityCount: entityTypes.length,
      factCount,
      relationshipCount,
      assertionCount,
      lastUpdated: new Date(),
    };
  }
}
