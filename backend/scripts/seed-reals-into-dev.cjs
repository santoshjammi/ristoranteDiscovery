// Seed the 6 REAL RTP restaurants (+ minimal relational data) from the pristine
// showcase DB into dev.db, so E2E can run against a dev-DB backend that still
// exposes the real seed restaurants — WITHOUT polluting rtp-showcase.db.
// dev.db keeps all its test data; we ADD the 6 real restaurants.
const { PrismaClient } = require('@prisma/client');
const path = require('path');

const SHOWCASE = new PrismaClient({ datasources: { db: { url: 'file:' + path.resolve('prisma/rtp-showcase.db') } } });
const DEV = new PrismaClient({ datasources: { db: { url: 'file:' + path.resolve('prisma/dev.db') } } });

const REALS = [
  { id: '07c0627c-9b32-43ca-a404-439786616b24', name: 'The Mill Raleigh' },
  { id: 'debe8f59-cde6-4227-beef-d40b2af64572', name: 'Urban Turban Indian Grill and Bar' },
  { id: 'demo-biryani-maxx', name: 'Biryani Maxx' },
  { id: 'demo-dharani-cary', name: 'Dharani' },
  { id: 'demo-tandoori-flame', name: 'Tandoori Flame' },
  { id: 'demo-anand-bhavan', name: 'Anand Bhavan' },
];

(async () => {
  // 1. Copy the Restaurant rows (must not already exist in dev.db).
  let added = 0;
  for (const r of REALS) {
    const exists = await DEV.restaurant.findUnique({ where: { id: r.id }, select: { id: true } });
    if (exists) { console.log('dev already has', r.name); continue; }
    const row = await SHOWCASE.restaurant.findUnique({ where: { id: r.id } });
    if (!row) { console.log('showcase missing', r.name); continue; }
    await DEV.restaurant.create({ data: row });
    added++;
    console.log('added to dev:', r.name);
  }

  // 2. Copy MenuSection, MenuItem, ReviewAnalysis, FAQ, SEOMarkup for these.
  for (const r of REALS) {
    const ms = await SHOWCASE.menuSection.findMany({ where: { restaurantId: r.id } });
    for (const s of ms) {
      try { await DEV.menuSection.create({ data: s }); } catch {}
      const items = await SHOWCASE.menuItem.findMany({ where: { menuSectionId: s.id } });
      for (const it of items) { try { await DEV.menuItem.create({ data: it }); } catch {} }
    }
    const reviews = await SHOWCASE.reviewAnalysis.findMany({ where: { restaurantId: r.id } });
    for (const rv of reviews) { try { await DEV.reviewAnalysis.create({ data: rv }); } catch {} }
    const faqs = await SHOWCASE.fAQ.findMany({ where: { restaurantId: r.id } });
    for (const f of faqs) { try { await DEV.fAQ.create({ data: f }); } catch {} }
    const seo = await SHOWCASE.sEOMarkup.findMany({ where: { restaurantId: r.id } });
    for (const s of seo) { try { await DEV.sEOMarkup.create({ data: s }); } catch {} }
    // Evidence for provenance (Biryani Maxx needs evidence records for the signal spec).
    const ev = await SHOWCASE.evidenceRecord.findMany({ where: { entityId: r.id } });
    for (const e of ev) { try { await DEV.evidenceRecord.create({ data: e }); } catch {} }
  }

  console.log('DONE — added', added, 'real restaurants + relational data to dev.db');
  await SHOWCASE.$disconnect();
  await DEV.$disconnect();
})().catch((e) => { console.error('ERR', e.message?.split('\n')[0]); process.exit(1); });
