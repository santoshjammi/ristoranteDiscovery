#!/usr/bin/env node
/**
 * ── RIST-RDI-003 — Build the clean production deployment DB ──
 *
 * Creates backend/prisma/rtp-showcase.db containing ONLY the 6 REAL_VERIFIED
 * RTP restaurants and their FULL relational data (evidence, snapshots, menu,
 * reviews, faqs, seo, competitive sets, decisions, etc.).
 *
 * The Benchmark table is deliberately NOT copied: pre-computed benchmark rows
 * in the source dev.db were computed against a POLLUTED cohort (~340 restaurants
 * incl. synthetic). Copying them would ship dishonest percentiles (e.g. a
 * "Raleigh cohort of 12" when the showcase holds only 3 real Raleigh
 * restaurants). Production recomputes benchmarks honestly at runtime from the
 * real-only 6-restaurant cohort (see BenchmarkService.computeBenchmarks), so
 * the showcase DB ships with ZERO Benchmark rows (RIST-RDI-003 §13/§14).
 *
 * The source dev.db (backend/prisma/dev.db) is left COMPLETELY UNTOUCHED —
 * this script only READS from it and WRITES a brand-new file.
 *
 * Approach:
 *   - Recreate the exact Prisma schema (copied verbatim from the source DB's
 *     sqlite_master CREATE TABLE statements) in the new file.
 *   - INSERT only the 6 real restaurants + every related row that references
 *     one of those restaurant ids (by restaurantId, entityId,
 *     entityExternalId, competitiveSetId, decisionId, ...).
 *   - Nothing synthetic is ever selected, so it cannot leak.
 *
 * Zero dependencies: uses Node's built-in `node:sqlite` (Node 22.5+).
 *
 * Usage:  node backend/scripts/build-showcase-db.mjs
 *   or (from backend/):  node scripts/build-showcase-db.mjs
 */
import { DatabaseSync } from 'node:sqlite';
import { existsSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const prismaDir = path.resolve(__dirname, '..', 'prisma');

const SOURCE_DB = path.join(prismaDir, 'dev.db');
const SHOWCASE_DB = path.join(prismaDir, 'rtp-showcase.db');

// The 6 REAL_VERIFIED restaurants (id -> display name). These are the ONLY
// restaurants that may enter the production showcase. Anything else
// (synthetic "Test"/"Page"/"Breadcrumb" fixtures, placeholder *.example.com
// sites, UNKNOWN real-looking rows without evidence) is physically absent.
const REAL_RESTAURANT_IDS = [
  '07c0627c-9b32-43ca-a404-439786616b24', // The Mill Raleigh (Raleigh)
  'debe8f59-cde6-4227-beef-d40b2af64572', // Urban Turban Indian Grill and Bar (Raleigh)
  'demo-biryani-maxx',                     // Biryani Maxx (Morrisville)
  'demo-dharani-cary',                     // Dharani (Cary)
  'demo-tandoori-flame',                   // Tandoori Flame (Raleigh)
  'demo-anand-bhavan',                     // Anand Bhavan (Morrisville)
];

function assertSourceDb() {
  if (!existsSync(SOURCE_DB)) {
    throw new Error(`Source DB not found at ${SOURCE_DB}. Run this from backend/ or repo root.`);
  }
}

function openSource() {
  return new DatabaseSync(SOURCE_DB, { readOnly: true });
}

function prepareShowcase(source) {
  // Brand new file — drop if it already exists so builds are deterministic.
  if (existsSync(SHOWCASE_DB)) {
    // DatabaseSync holds the handle; remove before opening the new one.
    const tmp = new DatabaseSync(SHOWCASE_DB, { readOnly: true });
    tmp.close();
    rmSync(SHOWCASE_DB);
  }
  const dest = new DatabaseSync(SHOWCASE_DB);
  dest.exec('PRAGMA foreign_keys = OFF;'); // rebuild in a controlled order

  // Recreate the exact Prisma schema by copying every CREATE TABLE + index
  // from the source DB verbatim. This guarantees the new DB matches the app's
  // schema with zero drift (same as `prisma db push` but without any tooling).
  const tables = source.prepare(
    `SELECT sql FROM sqlite_master WHERE type='table' AND name != '_prisma_migrations' ORDER BY name`
  ).all();
  for (const row of tables) {
    if (row.sql) dest.exec(row.sql);
  }
  const indexes = source.prepare(
    `SELECT sql FROM sqlite_master WHERE type='index' AND sql IS NOT NULL ORDER BY name`
  ).all();
  for (const row of indexes) {
    if (row.sql) dest.exec(row.sql);
  }

  // Record the provenance so the deployment DB is self-documenting.
  dest.exec(`CREATE TABLE IF NOT EXISTS _deployment_meta (
      key TEXT PRIMARY KEY,
      value TEXT
    )`);
  const meta = dest.prepare('INSERT INTO _deployment_meta (key, value) VALUES (?, ?)');
  meta.run('showcase', 'RTP production deployment DB — REAL_VERIFIED restaurants only');
  meta.run('built_from', 'backend/prisma/dev.db (source, untouched)');
  meta.run('restaurant_count', String(REAL_RESTAURANT_IDS.length));
  meta.run('built_at', new Date().toISOString());
  meta.run('rist', 'RIST-RDI-003');
  return dest;
}

function idList(ids) {
  return ids.map((i) => `'${i}'`).join(', ');
}

/**
 * Copy rows from a source table into the destination.
 * `whereClause` selects the rows in the SOURCE for the 6 real restaurants.
 */
function copyRows(source, dest, table, whereClause) {
  const cols = source
    .prepare(`PRAGMA table_info(${table})`)
    .all()
    .map((c) => c.name);
  const colList = cols.map((c) => `"${c}"`).join(', ');
  const sel = source.prepare(
    `SELECT ${colList} FROM "${table}" WHERE ${whereClause}`
  );
  const insert = dest.prepare(
    `INSERT INTO "${table}" (${colList}) VALUES (${cols.map(() => '?').join(', ')})`
  );
  let n = 0;
  for (const row of sel.all()) {
    const values = cols.map((c) => row[c]);
    insert.run(...values);
    n++;
  }
  return n;
}

// ---------------------------------------------------------------------------
function build() {
  assertSourceDb();
  const src = openSource();
  const reals = idList(REAL_RESTAURANT_IDS);
  const dest = prepareShowcase(src);

  const report = {};

  // 1. Restaurants (the 6 real ones only)
  report.Restaurant = copyRows(src, dest, 'Restaurant', `"id" IN (${reals})`);

  // 2. Restaurant-scoped tables (rows carry restaurantId directly).
  const restaurantScoped = [
    'ScorecardSnapshot',
    'MenuSection',
    'MenuItem',
    'ReviewAnalysis',
    'FAQ',
    'SEOMarkup',
    'VectorCache',
    // NOTE: Benchmark is intentionally absent. Pre-computed rows were computed
    // against a POLLUTED cohort (full dev.db incl. synthetic). Copying them
    // would ship dishonest percentiles into production. Benchmarks recompute
    // at runtime from the real-only cohort (RIST-RDI-003 §13/§14).
    'Analysis',
    'ProductEvent',
  ];
  for (const t of restaurantScoped) {
    report[t] = copyRows(src, dest, t, `"restaurantId" IN (${reals})`);
  }

  // 3. Decisions + their Outcomes/Feedback (keyed off restaurantId).
  report.Decision = copyRows(src, dest, 'Decision', `"restaurantId" IN (${reals})`);
  report.Outcome = copyRows(
    src, dest, 'Outcome',
    `"decisionId" IN (SELECT id FROM Decision WHERE "restaurantId" IN (${reals}))`
  );
  report.Feedback = copyRows(src, dest, 'Feedback', `"restaurantId" IN (${reals})`);

  // 4. Competitive sets + competitors.
  report.CompetitiveSet = copyRows(src, dest, 'CompetitiveSet', `"restaurantId" IN (${reals})`);
  report.Competitor = copyRows(
    src, dest, 'Competitor',
    `"competitiveSetId" IN (SELECT id FROM CompetitiveSet WHERE "restaurantId" IN (${reals}))`
  );

  // 5. Evidence platform (keyed by entityId == restaurant id).
  report.EvidenceRecord = copyRows(src, dest, 'EvidenceRecord', `"entityId" IN (${reals})`);
  report.EvidenceObservation = copyRows(
    src, dest, 'EvidenceObservation',
    `"entityExternalId" IN (${reals})`
  );
  report.EvidenceProvenance = copyRows(
    src, dest, 'EvidenceProvenance',
    `"observationId" IN (SELECT id FROM EvidenceObservation WHERE "entityExternalId" IN (${reals}))`
  );
  report.EvidenceTimeline = copyRows(
    src, dest, 'EvidenceTimeline',
    `("entityId" IN (${reals})
      OR "evidenceId" IN (SELECT id FROM EvidenceRecord WHERE "entityId" IN (${reals}))
      OR "observationId" IN (SELECT id FROM EvidenceObservation WHERE "entityExternalId" IN (${reals})))`
  );

  // Knowledge + connector tables keyed to real restaurants (additive; usually 0).
  report.KnowledgeRecommendation = copyRows(src, dest, 'KnowledgeRecommendation', `"restaurantId" IN (${reals})`);
  report.ConnectorScorecardData = copyRows(src, dest, 'ConnectorScorecardData', `"restaurantId" IN (${reals})`);
  report.ObservationIdentity = copyRows(src, dest, 'ObservationIdentity', `"internalEntityId" IN (${reals})`);
  report.ObservationFreshness = copyRows(src, dest, 'ObservationFreshness', `"entityId" IN (${reals})`);
  report.KnowledgeFact = copyRows(src, dest, 'KnowledgeFact', `"entityId" IN (${reals})`);
  report.KnowledgeRelationship = copyRows(src, dest, 'KnowledgeRelationship', `"sourceEntityId" IN (${reals})`);

  src.close();
  dest.close();

  console.log(`Built ${SHOWCASE_DB}`);
  for (const [t, n] of Object.entries(report)) {
    console.log(`  ${t.padEnd(24)} ${n}`);
  }
  return report;
}

build();
