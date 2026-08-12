// Domain value object — an entry in the evidence timeline
// Pure domain — zero framework dependencies
// The ordered history of Evidence and Assertions

export type TimelineEventType = 'evidence-created' | 'evidence-superseded' | 'evidence-expired' | 'assertion-created';

export interface TimelineEventProps {
  readonly id: string;
  readonly entityType: string;
  readonly entityId: string;
  readonly eventType: TimelineEventType;
  readonly evidenceId: string;
  readonly observationId: string;
  readonly sourceId: string;
  readonly timestamp: Date;
  readonly previousEventId: string | null;
}

export class TimelineEvent {
  public readonly id: string;
  public readonly entityType: string;
  public readonly entityId: string;
  public readonly eventType: TimelineEventType;
  public readonly evidenceId: string;
  public readonly observationId: string;
  public readonly sourceId: string;
  public readonly timestamp: Date;
  public readonly previousEventId: string | null;

  constructor(props: TimelineEventProps) {
    this.id = props.id;
    this.entityType = props.entityType;
    this.entityId = props.entityId;
    this.eventType = props.eventType;
    this.evidenceId = props.evidenceId;
    this.observationId = props.observationId;
    this.sourceId = props.sourceId;
    this.timestamp = props.timestamp;
    this.previousEventId = props.previousEventId;
  }
}
