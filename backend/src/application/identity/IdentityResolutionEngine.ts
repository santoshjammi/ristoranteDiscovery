// Application service: Identity Resolution Engine
// Matches external entities to internal entities
// Deterministic — same inputs → same matches
// No AI dependency

import { IdentityResolution, type MatchMethod } from '../../domain/identity/IdentityResolution';

export interface IdentityResolutionRepository {
  save(resolution: IdentityResolution): Promise<void>;
  findByExternalId(externalId: string, externalSource: string): Promise<IdentityResolution | null>;
  findByInternalEntity(internalEntityId: string): Promise<IdentityResolution[]>;
  findUnresolved(): Promise<IdentityResolution[]>;
}

export class IdentityResolutionEngine {
  constructor(private readonly repository: IdentityResolutionRepository) {}

  /**
   * Attempt to resolve an external entity to an internal entity.
   * Uses exact match first, then fuzzy match as fallback.
   */
  async resolve(input: {
    externalId: string;
    externalSource: string;
    externalName: string;
    externalAddress?: string;
    externalPhone?: string;
    externalWebsite?: string;
    knownEntities: Array<{
      id: string;
      type: string;
      name: string;
      address?: string | null;
      phone?: string | null;
      website?: string | null;
    }>;
  }): Promise<IdentityResolution | null> {
    const { externalId, externalSource, externalName, knownEntities } = input;

    // Step 1: Check if already resolved
    const existing = await this.repository.findByExternalId(externalId, externalSource);
    if (existing) return existing;

    // Step 2: Exact name match
    const exactMatch = knownEntities.find(
      e => e.name.toLowerCase().trim() === externalName.toLowerCase().trim()
    );
    if (exactMatch) {
      const resolution = new IdentityResolution({
        id: `idr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        externalId,
        externalSource,
        internalEntityId: exactMatch.id,
        internalEntityType: exactMatch.type,
        matchConfidence: 1.0,
        matchMethod: 'exact',
        matchedAt: new Date(),
        evidenceIds: [],
      });
      await this.repository.save(resolution);
      return resolution;
    }

    // Step 3: Fuzzy name match (contains)
    const fuzzyMatch = knownEntities.find(
      e => e.name.toLowerCase().includes(externalName.toLowerCase().slice(0, 10)) ||
           externalName.toLowerCase().includes(e.name.toLowerCase().slice(0, 10))
    );
    if (fuzzyMatch) {
      const resolution = new IdentityResolution({
        id: `idr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        externalId,
        externalSource,
        internalEntityId: fuzzyMatch.id,
        internalEntityType: fuzzyMatch.type,
        matchConfidence: 0.7,
        matchMethod: 'fuzzy',
        matchedAt: new Date(),
        evidenceIds: [],
      });
      await this.repository.save(resolution);
      return resolution;
    }

    return null;
  }

  /**
   * Manually resolve an external entity to an internal entity.
   */
  async manualResolve(input: {
    externalId: string;
    externalSource: string;
    internalEntityId: string;
    internalEntityType: string;
  }): Promise<IdentityResolution> {
    const resolution = new IdentityResolution({
      id: `idr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      externalId: input.externalId,
      externalSource: input.externalSource,
      internalEntityId: input.internalEntityId,
      internalEntityType: input.internalEntityType,
      matchConfidence: 1.0,
      matchMethod: 'manual',
      matchedAt: new Date(),
      evidenceIds: [],
    });
    await this.repository.save(resolution);
    return resolution;
  }
}
