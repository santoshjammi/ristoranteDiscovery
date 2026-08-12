// Infrastructure: Prisma implementation of the Evidence Ledger
// Maps between domain entities and Prisma persistence model

import { PrismaClient } from '@prisma/client';
import { Observation } from '../../../domain/evidence/Observation';
import { Evidence } from '../../../domain/evidence/Evidence';
import { Provenance } from '../../../domain/evidence/Provenance';
import { TimelineEvent } from '../../../domain/evidence/TimelineEvent';
import { type EvidenceLedgerRepository } from '../../../application/evidence/EvidenceLedger';

export class PrismaEvidenceLedger implements EvidenceLedgerRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async saveObservation(observation: Observation): Promise<void> {
    await this.prisma.evidenceObservation.create({
      data: {
        id: observation.id,
        sourceId: observation.sourceId,
        sourceType: observation.sourceType,
        entityType: observation.entityType,
        entityExternalId: observation.entityExternalId,
        payload: JSON.stringify(observation.payload),
        observedAt: observation.observedAt,
        metadata: JSON.stringify(observation.metadata),
      },
    });
  }

  async saveEvidence(evidence: Evidence): Promise<void> {
    await this.prisma.evidenceRecord.create({
      data: {
        id: evidence.id,
        observationIds: JSON.stringify(evidence.observationIds),
        sourceId: evidence.sourceId,
        sourceType: evidence.sourceType,
        entityType: evidence.entityType,
        entityId: evidence.entityId,
        payload: JSON.stringify(evidence.payload),
        observedAt: evidence.observedAt,
        ingestedAt: evidence.ingestedAt,
        confidence: evidence.confidence,
        checksum: evidence.checksum,
        status: evidence.status,
      },
    });
  }

  async saveProvenance(provenance: Provenance): Promise<void> {
    await this.prisma.evidenceProvenance.create({
      data: {
        observationId: provenance.observationId,
        sourceId: provenance.sourceId,
        connectorVersion: provenance.connectorVersion,
        parserVersion: provenance.parserVersion,
        normalizationVersion: provenance.normalizationVersion,
        crawlId: provenance.crawlId,
        importJobId: provenance.importJobId,
      },
    });
  }

  async saveTimelineEvent(event: TimelineEvent): Promise<void> {
    await this.prisma.evidenceTimeline.create({
      data: {
        id: event.id,
        entityType: event.entityType,
        entityId: event.entityId,
        eventType: event.eventType,
        evidenceId: event.evidenceId,
        observationId: event.observationId,
        sourceId: event.sourceId,
        timestamp: event.timestamp,
        previousEventId: event.previousEventId,
      },
    });
  }

  async findEvidenceByEntity(entityType: string, entityId: string): Promise<Evidence[]> {
    const records = await this.prisma.evidenceRecord.findMany({
      where: { entityType, entityId },
      orderBy: { ingestedAt: 'desc' },
    });

    return records.map(r => new Evidence({
      id: r.id,
      observationIds: JSON.parse(r.observationIds),
      sourceId: r.sourceId,
      sourceType: r.sourceType,
      entityType: r.entityType,
      entityId: r.entityId,
      payload: JSON.parse(r.payload),
      observedAt: r.observedAt,
      ingestedAt: r.ingestedAt,
      confidence: r.confidence,
      checksum: r.checksum,
      status: r.status as any,
    }));
  }

  async findEvidenceByChecksum(checksum: string): Promise<Evidence | null> {
    const record = await this.prisma.evidenceRecord.findUnique({
      where: { checksum },
    });

    if (!record) return null;

    return new Evidence({
      id: record.id,
      observationIds: JSON.parse(record.observationIds),
      sourceId: record.sourceId,
      sourceType: record.sourceType,
      entityType: record.entityType,
      entityId: record.entityId,
      payload: JSON.parse(record.payload),
      observedAt: record.observedAt,
      ingestedAt: record.ingestedAt,
      confidence: record.confidence,
      checksum: record.checksum,
      status: record.status as any,
    });
  }

  async findEvidenceById(evidenceId: string): Promise<Evidence | null> {
    const record = await this.prisma.evidenceRecord.findUnique({
      where: { id: evidenceId },
    });

    if (!record) return null;

    return new Evidence({
      id: record.id,
      observationIds: JSON.parse(record.observationIds),
      sourceId: record.sourceId,
      sourceType: record.sourceType,
      entityType: record.entityType,
      entityId: record.entityId,
      payload: JSON.parse(record.payload),
      observedAt: record.observedAt,
      ingestedAt: record.ingestedAt,
      confidence: record.confidence,
      checksum: record.checksum,
      status: record.status as any,
    });
  }

  async findObservationsBySource(sourceId: string, since?: Date): Promise<Observation[]> {
    const records = await this.prisma.evidenceObservation.findMany({
      where: {
        sourceId,
        ...(since ? { observedAt: { gte: since } } : {}),
      },
      orderBy: { observedAt: 'desc' },
    });

    return records.map(r => new Observation({
      id: r.id,
      sourceId: r.sourceId,
      sourceType: r.sourceType,
      entityType: r.entityType,
      entityExternalId: r.entityExternalId,
      payload: JSON.parse(r.payload),
      observedAt: r.observedAt,
      metadata: JSON.parse(r.metadata),
    }));
  }

  async findTimelineByEntity(entityType: string, entityId: string): Promise<TimelineEvent[]> {
    const records = await this.prisma.evidenceTimeline.findMany({
      where: { entityType, entityId },
      orderBy: { timestamp: 'asc' },
    });

    return records.map(r => new TimelineEvent({
      id: r.id,
      entityType: r.entityType,
      entityId: r.entityId,
      eventType: r.eventType as any,
      evidenceId: r.evidenceId,
      observationId: r.observationId,
      sourceId: r.sourceId,
      timestamp: r.timestamp,
      previousEventId: r.previousEventId,
    }));
  }

  async findLatestEvidenceByEntity(entityType: string, entityId: string): Promise<Evidence | null> {
    const record = await this.prisma.evidenceRecord.findFirst({
      where: { entityType, entityId, status: 'active' },
      orderBy: { ingestedAt: 'desc' },
    });

    if (!record) return null;

    return new Evidence({
      id: record.id,
      observationIds: JSON.parse(record.observationIds),
      sourceId: record.sourceId,
      sourceType: record.sourceType,
      entityType: record.entityType,
      entityId: record.entityId,
      payload: JSON.parse(record.payload),
      observedAt: record.observedAt,
      ingestedAt: record.ingestedAt,
      confidence: record.confidence,
      checksum: record.checksum,
      status: record.status as any,
    });
  }
}
