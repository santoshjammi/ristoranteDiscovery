// Domain layer — SEO Intelligence bounded context
// Pure domain. Zero framework dependencies.

export { SEOSchema, type SEOSchemaProps, type SchemaType } from './SEOSchema';
export { SchemaIssue, type SchemaIssueProps, type SchemaIssueSeverity } from './SchemaIssue';
export { SchemaAudit, type SchemaAuditProps } from './SchemaAudit';
export { SchemaGenerated, SchemaAuditCompleted } from './events';
