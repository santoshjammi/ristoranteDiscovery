// Domain events for the SEO Intelligence bounded context
// Past-tense, typed, carry defined payloads

import { BaseDomainEvent } from '../discovery/events';

export class SchemaGenerated extends BaseDomainEvent {
  public readonly eventName = 'seo.schema.generated';

  constructor(
    aggregateId: string,
    public readonly restaurantId: string,
    public readonly schemaType: string,
    public readonly isValid: boolean,
  ) {
    super(aggregateId);
  }
}

export class SchemaAuditCompleted extends BaseDomainEvent {
  public readonly eventName = 'seo.schema.audit-completed';

  constructor(
    aggregateId: string,
    public readonly restaurantId: string,
    public readonly coverage: number,
    public readonly completeness: number,
    public readonly issueCount: number,
  ) {
    super(aggregateId);
  }
}
