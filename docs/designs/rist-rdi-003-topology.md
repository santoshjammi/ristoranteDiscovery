# RIST-RDI-003 — STEP 7 Data Topology Map (audited against committed HEAD 9ddd371)

## Database
- **Single SQLite DB:** `backend/prisma/dev.db`
- **Config:** `backend/.env` → `DATABASE_URL="file:./dev.db"`
- **Prisma datasource:** `url = env("DATABASE_URL")` (schema.prisma)
- **Prisma client:** `backend/src/config/db.ts` → `new PrismaClient()` (reads DATABASE_URL at runtime)
- **No per-env DB switching exists.** One DB serves dev/test/production currently.
- **NODE_ENV** available via `backend/src/lib/config.ts` (default 'development') but not used to switch DB.

## Seed / fixture generation
- `backend/prisma/seed.ts` — synthetic seed
- `backend/src/seed-validation.ts`, `backend/src/seed-review-validation.ts` — clearly synthetic (hardcoded fabricated review/sentiment/audience data)
- 239 of 337 restaurant rows are synthetic E2E/test fixtures (names "Test"/"Page"/"Breadcrumb", city Mumbai, placeholder `*.example.com` sites).

## Isolation strategy (PRESERVE + ISOLATE, per mission §11 preferred)
- **Preserve** `dev.db` intact (source, dev/test/regression).
- **Create** a separate deployment DB (`rtp-showcase.db`) containing only `REAL_VERIFIED` restaurants + their schema, evidence, snapshots, decisions.
- Production deployment points `DATABASE_URL` at `rtp-showcase.db` → synthetic physically absent → zero customer exposure.

## Classification signals (deterministic, evidence-based)
- **REAL_VERIFIED:** real public evidence record (EvidenceRecord.sourceId is a real non-placeholder URL) OR real non-placeholder website + plausible real RTP address/identity. NOT from test markers.
- **SYNTHETIC_VERIFIED:** name matches test markers (Test/Page/Breadcrumb/Probe/Fixture/etc.) OR placeholder website (`*.example.com`, `tirde-restaurant.example.com`, `.test`).
- **UNKNOWN:** real-looking name but no real evidence and no real website, or ambiguous → must NOT enter showcase.
