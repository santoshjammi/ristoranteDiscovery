# Database Migration Strategy

> **Safe upgrades and rollback for the RDI platform**

---

## Principles

1. **Forward-only migrations.** Once applied, migrations are never modified.
2. **Idempotent.** Running the same migration twice produces the same result.
3. **Versioned.** Every migration has a unique version number.
4. **Rollback-capable.** Every migration has a corresponding rollback.

## Migration Types

| Type | When | Example |
|------|------|---------|
| Schema | Adding/removing tables or columns | `CREATE TABLE` |
| Data | Populating or transforming data | `UPDATE` |
| Index | Adding/removing indexes | `CREATE INDEX` |
| Seed | Populating reference data | `INSERT` |

## Workflow

```bash
# Create a new migration
npx prisma migrate dev --name describe_change

# Apply to production
npx prisma migrate deploy

# Reset local database
npx prisma migrate reset

# Check status
npx prisma migrate status
```

## Rollback

Prisma Migrate does not support rollback natively. For rollback:

1. Create a new migration that reverses the change.
2. Apply it via `npx prisma migrate deploy`.
3. Document the reversal in the migration name.

## Current Schema

The database uses SQLite for development. The Prisma schema at `prisma/schema.prisma` is the single source of truth. All 14 models are defined there:

- EvidenceObservation, EvidenceRecord, EvidenceProvenance, EvidenceTimeline
- KnowledgeAssertion, KnowledgeFact, KnowledgeRelationship, KnowledgeRecommendation
- ObservationSource, ObservationConnector, ObservationCrawl, ObservationIdentity, ObservationNormalizationRule, ObservationFreshness
- Restaurant, MenuSection, MenuItem, ReviewAnalysis, FAQ, SEOMarkup, VectorCache, CompetitiveSet, Competitor

## Production Migration

For production deployment:

1. Switch to PostgreSQL datasource in `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name init` to create the initial migration
3. Run `npx prisma migrate deploy` on the production database
4. All subsequent changes follow the same workflow
