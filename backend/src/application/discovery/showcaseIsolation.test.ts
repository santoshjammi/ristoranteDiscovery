// ── RIST-RDI-003 — Production deployment DB contamination audit ──
// Proves the rtp-showcase.db (the customer-visible production DB) contains
// EXACTLY the 6 REAL_VERIFIED RTP restaurants and ZERO synthetic/test data.
//
// This is a deterministic gate: it runs against a SEPARATE deployment DB
// (backend/prisma/rtp-showcase.db) built by scripts/build-showcase-db.mjs.
// It does NOT touch dev.db. If anyone ever leaks a synthetic/placeholder row
// into the showcase DB, this test fails.

import { describe, it, expect, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import path from 'node:path';

// Path to the deployment DB, resolved relative to the backend package root.
// Vitest runs with cwd = backend/, but resolve defensively from this file
// (backend/src/application/discovery/ → backend/prisma/rtp-showcase.db).
const SHOWCASE_DB = path.resolve(__dirname, '..', '..', '..', 'prisma', 'rtp-showcase.db');

const prisma = new PrismaClient({
  datasources: { db: { url: `file:${SHOWCASE_DB}` } },
});

// The 6 REAL_VERIFIED restaurants — the ONLY rows allowed in the showcase.
const REAL_RESTAURANTS = [
  { id: '07c0627c-9b32-43ca-a404-439786616b24', name: 'The Mill Raleigh' },
  { id: 'debe8f59-cde6-4227-beef-d40b2af64572', name: 'Urban Turban Indian Grill and Bar' },
  { id: 'demo-biryani-maxx', name: 'Biryani Maxx' },
  { id: 'demo-dharani-cary', name: 'Dharani' },
  { id: 'demo-tandoori-flame', name: 'Tandoori Flame' },
  { id: 'demo-anand-bhavan', name: 'Anand Bhavan' },
];

// Deterministic test markers for SYNTHETIC fixtures (must NEVER appear).
const SYNTHETIC_MARKERS = [
  'test', 'page', 'breadcrumb', 'probe', 'fixture', 'example.com',
  'tirde-restaurant.example.com', 'sample', 'dummy',
];

afterAll(async () => {
  await prisma.$disconnect();
});

describe('RTP Showcase production DB — real-data isolation', () => {
  it('contains EXACTLY the 6 REAL_VERIFIED restaurants and no others', async () => {
    const restaurants = await prisma.restaurant.findMany();
    const ids = restaurants.map((r) => r.id).sort();

    expect(restaurants.length).toBe(6);
    expect(ids.sort()).toEqual(
      REAL_RESTAURANTS.map((r) => r.id).sort(),
    );
  });

  it('all 6 expected restaurants are present with real (non-placeholder) websites', async () => {
    const restaurants = await prisma.restaurant.findMany();
    for (const r of restaurants) {
      // Every showcase restaurant must have a real website.
      expect(r.website, `${r.name} must have a website`).toBeTruthy();
      // No placeholder / test-marked URL may appear.
      for (const marker of SYNTHETIC_MARKERS) {
        expect(r.website?.toLowerCase() ?? '', `${r.name} website must not contain "${marker}"`).not.toContain(marker);
      }
      expect(r.website?.startsWith('https://') || r.website?.startsWith('http://'),
        `${r.name} website must be an absolute URL`).toBe(true);
    }
  });

  it('asserts each expected real restaurant exists by name', async () => {
    const names = (await prisma.restaurant.findMany()).map((r) => r.name);
    for (const r of REAL_RESTAURANTS) {
      expect(names).toContain(r.name);
    }
  });

  it('contains real relational data for the real restaurants', async () => {
    // The Mill Raleigh has real evidence records.
    const millEvidence = await prisma.evidenceRecord.count({
      where: { entityId: '07c0627c-9b32-43ca-a404-439786616b24' },
    });
    expect(millEvidence).toBeGreaterThan(0);
    // The relational graph (menu + snapshots) must have been carried over.
    const menuSectionCount = await prisma.menuSection.count();
    const snapshotCount = await prisma.scorecardSnapshot.count();
    expect(menuSectionCount).toBeGreaterThan(0);
    expect(snapshotCount).toBeGreaterThan(0);
  });

  it('has no scorecard snapshot history for any non-real restaurant (all snapshots belong to the 6)', async () => {
    const realIds = REAL_RESTAURANTS.map((r) => r.id);
    const snapshots = await prisma.scorecardSnapshot.findMany();
    for (const s of snapshots) {
      expect(realIds, `snapshot ${s.id} belongs to a non-real restaurant`).toContain(s.restaurantId);
    }
  });

  it('contains ZERO pre-computed Benchmark rows (RIST-RDI-003 §13/§14 — recompute honestly at runtime)', async () => {
    // Pre-computed benchmark rows were computed against a POLLUTED cohort
    // (~340 restaurants incl. synthetic). Shipping them would display dishonest
    // percentiles (e.g. a "Raleigh cohort of 12" when only 3 real Raleigh
    // restaurants exist). Production recomputes benchmarks from the real-only
    // 6-restaurant cohort, so the showcase DB must carry no Benchmark rows.
    const benchmarkCount = await prisma.benchmark.count();
    expect(benchmarkCount).toBe(0);
  });
});
