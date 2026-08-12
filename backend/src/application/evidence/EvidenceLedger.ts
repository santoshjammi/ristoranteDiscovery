// Application service: Evidence Ledger
// The append-only, immutable record of observations and evidence
// Deterministic — same input → same output
// No AI dependency

import { createHash } from 'crypto';
import { Observation } from '../../domain/evidence/Observation';
import { Evidence, type EvidenceStatus } from '../../domain/evidence/Evidence';
import { EvidenceReference } from '../../domain/evidence/EvidenceReference';
import { Provenance } from '../../domain/evidence/Provenance';
import { TimelineEvent, type TimelineEventType } from '../../domain/evidence/TimelineEvent';

// --- Repository interface (inversion of control) ---

export interface EvidenceLedgerRepository {
  saveObservation(observation: Observation): Promise<void>;
  saveEvidence(evidence: Evidence): Promise<void>;
  saveProvenance(provenance: Provenance): Promise<void>;
  saveTimelineEvent(event: TimelineEvent): Promise<void>;

  findEvidenceByEntity(entityType: string, entityId: string): Promise<Evidence[]>;
  findEvidenceByChecksum(checksum: string): Promise<Evidence | null>;
  findObservationsBySource(sourceId: string, since?: Date): Promise<Observation[]>;
  findTimelineByEntity(entityType: string, entityId: string): Promise<TimelineEvent[]>;
  findLatestEvidenceByEntity(entityType: string, entityId: string): Promise<Evidence | null>;
  findEvidenceById(evidenceId: string): Promise<Evidence | null>;
}

// --- Input types ---

export interface RecordObservationInput {
  sourceId: string;
  sourceType: string;
  entityType: string;
  entityExternalId: string;
  payload: Record<string, unknown>;
  observedAt: Date;
  metadata?: Record<string, unknown>;
}

export interface NormalizeEvidenceInput {
  observationId: string;
  sourceId: string;
  sourceType: string;
  entityType: string;
  entityId: string;
  payload: Record<string, unknown>;
  observedAt: Date;
  confidence: number;
}

export interface RecordProvenanceInput {
  observationId: string;
  sourceId: string;
  connectorVersion: string;
  parserVersion: string;
  normalizationVersion: string;
  crawlId?: string;
  importJobId?: string;
}

// --- Checksum computation ---

function computeChecksum(payload: Record<string, unknown>): string {
  const sorted = JSON.stringify(payload, Object.keys(payload).sort());
  return createHash('sha256').update(sorted).digest('hex');
}

// --- Main service ---

export class EvidenceLedger {
  constructor(private readonly repository: EvidenceLedgerRepository) {}

  /**
   * Record an observation. Observations are immutable — once recorded, never modified.
   */
  async recordObservation(input: RecordObservationInput): Promise<Observation> {
    const observation = new Observation({
      id: `obs-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      sourceId: input.sourceId,
      sourceType: input.sourceType,
      entityType: input.entityType,
      entityExternalId: input.entityExternalId,
      payload: input.payload,
      observedAt: input.observedAt,
      metadata: input.metadata ?? {},
    });

    await this.repository.saveObservation(observation);
    return observation;
  }

  /**
   * Normalize an observation into evidence. Evidence is immutable — once created, never modified.
   * Idempotent: same payload → same checksum → existing evidence returned.
   */
  async normalizeToEvidence(input: NormalizeEvidenceInput): Promise<Evidence> {
    const checksum = computeChecksum(input.payload);

    // Idempotency check: if evidence with this checksum already exists, return it
    const existing = await this.repository.findEvidenceByChecksum(checksum);
    if (existing) {
      return existing;
    }

    const now = new Date();
    const evidence = new Evidence({
      id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      observationIds: [input.observationId],
      sourceId: input.sourceId,
      sourceType: input.sourceType,
      entityType: input.entityType,
      entityId: input.entityId,
      payload: input.payload,
      observedAt: input.observedAt,
      ingestedAt: now,
      confidence: input.confidence,
      checksum,
      status: 'active',
    });

    await this.repository.saveEvidence(evidence);

    // Record timeline event
    await this.repository.saveTimelineEvent(new TimelineEvent({
      id: `tl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      entityType: input.entityType,
      entityId: input.entityId,
      eventType: 'evidence-created',
      evidenceId: evidence.id,
      observationId: input.observationId,
      sourceId: input.sourceId,
      timestamp: now,
      previousEventId: null,
    }));

    return evidence;
  }

  /**
   * Record provenance for an observation.
   */
  async recordProvenance(input: RecordProvenanceInput): Promise<Provenance> {
    const provenance = new Provenance({
      observationId: input.observationId,
      sourceId: input.sourceId,
      connectorVersion: input.connectorVersion,
      parserVersion: input.parserVersion,
      normalizationVersion: input.normalizationVersion,
      crawlId: input.crawlId ?? null,
      importJobId: input.importJobId ?? null,
      recordedAt: new Date(),
    });

    await this.repository.saveProvenance(provenance);
    return provenance;
  }

  /**
   * Supersede existing evidence with newer evidence.
   * The old evidence is marked as 'superseded' but never deleted.
   */
  async supersedeEvidence(
    oldEvidenceId: string,
    newEvidence: Evidence,
  ): Promise<void> {
    // Find the old evidence by ID
    const oldEvidence = await this.repository.findEvidenceById(oldEvidenceId);
    if (!oldEvidence) {
      throw new Error(`Evidence not found: ${oldEvidenceId}`);
    }

    // Record timeline event for supersession
    await this.repository.saveTimelineEvent(new TimelineEvent({
      id: `tl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      entityType: newEvidence.entityType,
      entityId: newEvidence.entityId,
      eventType: 'evidence-superseded',
      evidenceId: newEvidence.id,
      observationId: newEvidence.observationIds[0],
      sourceId: newEvidence.sourceId,
      timestamp: new Date(),
      previousEventId: oldEvidenceId,
    }));
  }

  /**
   * Get the timeline for an entity.
   */
  async getTimeline(entityType: string, entityId: string): Promise<TimelineEvent[]> {
    return this.repository.findTimelineByEntity(entityType, entityId);
  }

  /**
   * Get all evidence for an entity.
   */
  async getEvidence(entityType: string, entityId: string): Promise<Evidence[]> {
    return this.repository.findEvidenceByEntity(entityType, entityId);
  }

  /**
   * Get the latest active evidence for an entity.
   */
  async getLatestEvidence(entityType: string, entityId: string): Promise<Evidence | null> {
    return this.repository.findLatestEvidenceByEntity(entityType, entityId);
  }
}
