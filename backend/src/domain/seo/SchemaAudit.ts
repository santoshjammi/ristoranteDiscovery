// Domain value object — the result of a schema audit
// Pure domain — zero framework dependencies

import { SEOSchema, type SchemaType } from './SEOSchema';
import { SchemaIssue } from './SchemaIssue';

export interface SchemaAuditProps {
  readonly restaurantId: string;
  readonly schemas: SEOSchema[];
  readonly coverage: number;
  readonly completeness: number;
  readonly issues: SchemaIssue[];
  readonly auditedAt: Date;
}

export class SchemaAudit {
  public readonly restaurantId: string;
  public readonly schemas: readonly SEOSchema[];
  public readonly coverage: number;
  public readonly completeness: number;
  public readonly issues: readonly SchemaIssue[];
  public readonly auditedAt: Date;

  constructor(props: SchemaAuditProps) {
    this.restaurantId = props.restaurantId;
    this.schemas = Object.freeze([...props.schemas]);
    this.coverage = props.coverage;
    this.completeness = props.completeness;
    this.issues = Object.freeze([...props.issues]);
    this.auditedAt = props.auditedAt;
  }

  get schemaTypesPresent(): SchemaType[] {
    return this.schemas.map(s => s.type);
  }

  get criticalIssues(): SchemaIssue[] {
    return this.issues.filter(i => i.severity === 'critical');
  }

  get highIssues(): SchemaIssue[] {
    return this.issues.filter(i => i.severity === 'high');
  }
}
