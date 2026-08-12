// Domain layer — Evidence Platform
// Pure domain. Zero framework dependencies.

export { Source, type SourceProps, type SourceType } from './Source';
export { Observation, type ObservationProps } from './Observation';
export { Evidence, type EvidenceProps, type EvidenceStatus } from './Evidence';
export { EvidenceReference, type EvidenceReferenceProps } from './EvidenceReference';
export { Provenance, type ProvenanceProps } from './Provenance';
export { TimelineEvent, type TimelineEventProps, type TimelineEventType } from './TimelineEvent';
export { ObservationRecorded, EvidenceCreated, EvidenceSuperseded } from './events';
