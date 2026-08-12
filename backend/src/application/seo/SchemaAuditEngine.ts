// Application service: Schema Audit Engine
// Deterministic — validates schemas, scores coverage/completeness, generates recommendations
// No AI dependency

import { SEOSchema, type SchemaType } from '../../domain/seo/SEOSchema';
import { SchemaIssue } from '../../domain/seo/SchemaIssue';
import { SchemaAudit } from '../../domain/seo/SchemaAudit';

// --- Required fields per schema type ---

const REQUIRED_FIELDS: Record<SchemaType, string[]> = {
  'Restaurant': ['@context', '@type', 'name', 'address'],
  'Menu': ['@context', '@type', 'name', 'hasMenuSection'],
  'FAQ': ['@context', '@type', 'mainEntity'],
  'Combined': ['@context', '@graph'],
};

const RECOMMENDED_FIELDS: Record<SchemaType, string[]> = {
  'Restaurant': ['telephone', 'servesCuisine', 'priceRange', 'geo', 'openingHoursSpecification', 'url'],
  'Menu': ['hasMenuSection'],
  'FAQ': ['mainEntity'],
  'Combined': ['@graph'],
};

const ALL_SCHEMA_TYPES: SchemaType[] = ['Restaurant', 'Menu', 'FAQ', 'Combined'];

// --- Validation ---

function validateSchema(schema: SEOSchema): SchemaIssue[] {
  const issues: SchemaIssue[] = [];
  const data = schema.jsonld as Record<string, any>;

  // Check required fields
  const required = REQUIRED_FIELDS[schema.type] || [];
  for (const field of required) {
    if (data[field] === undefined || data[field] === null) {
      issues.push(new SchemaIssue({
        schemaType: schema.type,
        field,
        description: `Missing required field: ${field}`,
        severity: 'critical',
      }));
    }
  }

  // Check recommended fields
  const recommended = RECOMMENDED_FIELDS[schema.type] || [];
  for (const field of recommended) {
    if (data[field] === undefined || data[field] === null) {
      issues.push(new SchemaIssue({
        schemaType: schema.type,
        field,
        description: `Missing recommended field: ${field}`,
        severity: 'medium',
      }));
    }
  }

  // Check @context is correct
  if (data['@context'] && data['@context'] !== 'https://schema.org') {
    issues.push(new SchemaIssue({
      schemaType: schema.type,
      field: '@context',
      description: `Invalid @context: expected https://schema.org, got ${data['@context']}`,
      severity: 'high',
    }));
  }

  // Check @type is present and non-empty (skip for Combined — uses @graph)
  if (schema.type !== 'Combined') {
    if (data['@type'] === undefined || data['@type'] === null || data['@type'] === '') {
      issues.push(new SchemaIssue({
        schemaType: schema.type,
        field: '@type',
        description: 'Missing or empty @type',
        severity: 'critical',
      }));
    }
  }

  // For Combined schema, check @graph has entries
  if (schema.type === 'Combined' && Array.isArray(data['@graph']) && data['@graph'].length === 0) {
    issues.push(new SchemaIssue({
      schemaType: schema.type,
      field: '@graph',
      description: '@graph is empty — no schemas embedded',
      severity: 'critical',
    }));
  }

  return issues;
}

function calculateCoverageScore(schema: SEOSchema): number {
  const data = schema.jsonld as Record<string, any>;
  const required = REQUIRED_FIELDS[schema.type] || [];
  const recommended = RECOMMENDED_FIELDS[schema.type] || [];
  const allFields = [...required, ...recommended];

  if (allFields.length === 0) return 100;

  const present = allFields.filter(f => data[f] !== undefined && data[f] !== null);
  return Math.round((present.length / allFields.length) * 100);
}

function calculateCompleteness(schemas: SEOSchema[]): number {
  if (schemas.length === 0) return 0;
  const total = schemas.reduce((sum, s) => sum + s.coverageScore, 0);
  return Math.round(total / schemas.length);
}

// --- Input type ---

export interface SchemaAuditInput {
  restaurantId: string;
  schemas: SEOSchema[];
}

// --- Main engine ---

export class SchemaAuditEngine {
  audit(input: SchemaAuditInput): SchemaAudit {
    const { restaurantId, schemas } = input;

    // Calculate coverage: what % of recommended schema types are present
    const typesPresent = new Set(schemas.map(s => s.type));
    const coverage = Math.round((typesPresent.size / ALL_SCHEMA_TYPES.length) * 100);

    // Validate each schema and calculate coverage scores
    const allIssues: SchemaIssue[] = [];
    const validatedSchemas: SEOSchema[] = schemas.map(s => {
      const issues = validateSchema(s);
      const coverageScore = calculateCoverageScore(s);
      allIssues.push(...issues);
      return new SEOSchema({
        ...s,
        isValid: issues.filter(i => i.severity === 'critical').length === 0,
        coverageScore,
      });
    });

    // Calculate completeness
    const completeness = calculateCompleteness(validatedSchemas);

    return new SchemaAudit({
      restaurantId,
      schemas: validatedSchemas,
      coverage,
      completeness,
      issues: allIssues,
      auditedAt: new Date(),
    });
  }
}
