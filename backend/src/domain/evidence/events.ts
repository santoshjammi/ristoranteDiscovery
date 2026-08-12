// Domain events for the Evidence Platform
// Past-tense, typed, carry defined payloads

import { BaseDomainEvent } from '../discovery/events';

export class ObservationRecorded extends BaseDomainEvent {
  public readonly eventName = 'evidence.observation.recorded';

  constructor(
    aggregateId: string,
    public readonly sourceId: string,
    public readonly entityType: string,
    public readonly entityExternalId: string,
  ) {
    super(aggregateId);
  }
}

export class EvidenceCreated extends BaseDomainEvent {
  public readonly eventName = 'evidence.evidence.created';

  constructor(
    aggregateId: string,
    public readonly sourceId: string,
    public readonly entityType: string,
    public readonly entityId: string,
    public readonly checksum: string,
  ) {
    super(aggregateId);
  }
}

export class EvidenceSuperseded extends BaseDomainEvent {
  public readonly eventName = 'evidence.evidence.superseded';

  constructor(
    aggregateId: string,
    public readonly supersededEvidenceId: string,
    public readonly newEvidenceId: string,
    public readonly entityId: string,
  ) {
    super(aggregateId);
  }
}
