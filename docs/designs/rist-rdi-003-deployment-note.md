# RIST-RDI-003 — Production Deployment: Real-Data Isolation

This note documents how the **production deployment DB** (`rtp-showcase.db`) is
built, isolated, and verified. It implements the **PRESERVE + ISOLATE**
strategy: the source `dev.db` stays untouched; the customer-visible showcase DB
contains **only the 6 REAL_VERIFIED RTP restaurants**.

## Why a separate DB

- Source `backend/prisma/dev.db` holds 300+ rows, of which only 6 are
  `REAL_VERIFIED` restaurants. The rest are synthetic E2E fixtures
  ("Test"/"Page"/"Breadcrumb", city = Mumbai, placeholder `*.example.com` sites)
  and `UNKNOWN` real-looking rows with no evidence.
- Serving the full dev DB to customers would expose synthetic/test data.
- Instead of filtering at read time (fragile, easy to regress), we **physically
  remove** everything non-real from the production DB. Zero synthetic rows =
  zero synthetic exposure.

## The 6 REAL_VERIFIED restaurants

| id | Name | City |
|----|------|------|
| `07c0627c-9b32-43ca-a404-439786616b24` | The Mill Raleigh | Raleigh |
| `debe8f59-cde6-4227-beef-d40b2af64572` | Urban Turban Indian Grill and Bar | Raleigh |
| `demo-biryani-maxx` | Biryani Maxx | Morrisville |
| `demo-dharani-cary` | Dharani | Cary |
| `demo-tandoori-flame` | Tandoori Flame | Raleigh |
| `demo-anand-bhavan` | Anand Bhavan | Morrisville |

## Building the deployment DB

Run from the **repo root** or `backend/`:

```
node backend/scripts/build-showcase-db.mjs
```

The script (`backend/scripts/build-showcase-db.mjs`):
- **Reads only** from `backend/prisma/dev.db` (opened read-only; the source is
  never modified).
- Recreates the exact Prisma schema (copied verbatim from `sqlite_master`) in a
  new file `backend/prisma/rtp-showcase.db`.
- Copies the 6 real restaurants **and every related row** that references them:
  scorecard snapshots, menu sections/items, review analyses, FAQs, SEO markup,
  vector caches, benchmarks, decisions, competitive sets/competitors, evidence
  records/observations/provenance/timeline, analyses, product events.
- Writes `_deployment_meta` (self-documenting provenance) into the DB.

It uses Node's built-in `node:sqlite` — **zero new dependencies**.

## Runtime isolation (DATABASE_URL)

The Prisma datasource reads `DATABASE_URL` at runtime
(`backend/src/config/db.ts` → `new PrismaClient()`). The schema and client are
**unchanged**; the deployment simply points `DATABASE_URL` at the clean DB:

- **Dev / test** (`backend/.env`): `DATABASE_URL="file:./dev.db"`  ← canonical, untouched
- **Production**: `DATABASE_URL="file:./rtp-showcase.db"` (or `file:/app/data/rtp-showcase.db` in Docker)

`.env` is gitignored — do **not** commit a `.env` that points at the showcase DB.
Set the production value via your deploy platform's environment config.

> Note: in a SQLite datasource the URL path is relative to the schema/prisma
> dir where `prisma` resolves it, so prefer an absolute path (or the resolved
> `file:/app/data/...`) in the deployed environment.

## Deterministic contamination gate

`backend/src/application/discovery/showcaseIsolation.test.ts` is a vitest suite
that **fails the build** if synthetic data ever leaks into the showcase DB. It
asserts, against `rtp-showcase.db` (not dev.db):

1. Exactly 6 restaurants, matching the 6 real IDs.
2. Every restaurant has a real, non-placeholder, absolute website (no
   `example.com`, `tirde-restaurant.example.com`, `test`, `page`, ... markers).
3. The 6 expected names are all present.
4. Real relational data (evidence + menu + snapshots) was carried over.
5. Every `ScorecardSnapshot` belongs to one of the 6 real restaurants (no
   synthetic snapshot history leaks).

Run it with the rest of the suite:

```
cd backend && npx vitest run
```

## Verification checklist

```
# Source untouched
sqlite3 backend/prisma/dev.db "SELECT COUNT(*) FROM Restaurant;"   # still the source count

# Showcase clean
sqlite3 backend/prisma/rtp-showcase.db "SELECT name, city FROM Restaurant;"
# → exactly the 6 real restaurants

sqlite3 backend/prisma/rtp-showcase.db "SELECT COUNT(*) FROM Restaurant;"        # 6
sqlite3 backend/prisma/rtp-showcase.db "SELECT COUNT(*) FROM ScorecardSnapshot;" # 19 (real only)
sqlite3 backend/prisma/rtp-showcase.db "SELECT COUNT(*) FROM EvidenceRecord;"    # 17 (The Mill)

cd backend && npm run build   # tsc passes
cd backend && npx vitest run  # all tests pass (67 existing + showcase isolation)
```
