// Domain value object — a single issue found during schema audit
// Pure domain — zero framework dependencies

export type SchemaIssueSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface SchemaIssueProps {
  readonly schemaType: string;
  readonly field: string;
  readonly description: string;
  readonly severity: SchemaIssueSeverity;
}

export class SchemaIssue {
  public readonly schemaType: string;
  public readonly field: string;
  public readonly description: string;
  public readonly severity: SchemaIssueSeverity;

  constructor(props: SchemaIssueProps) {
    this.schemaType = props.schemaType;
    this.field = props.field;
    this.description = props.description;
    this.severity = props.severity;
  }
}
