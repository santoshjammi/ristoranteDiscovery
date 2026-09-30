// Restore rtp-showcase.db to the 6 REAL_VERIFIED restaurants (spec RIST-RDI-003).
process.env.DATABASE_URL = 'file:' + require('path').resolve(__dirname, '..', 'prisma', 'rtp-showcase.db');
const { PrismaClient } = require('@prisma/client');
const reals = [
  '07c0627c-9b32-43ca-a404-439786616b24',
  'debe8f59-cde6-4227-beef-d40b2af64572',
  'demo-biryani-maxx',
  'demo-dharani-cary',
  'demo-tandoori-flame',
  'demo-anand-bhavan',
];
const p = new PrismaClient();
(async () => {
  const before = { rest: await p.restaurant.count(), bench: await p.benchmark.count() };
  await p.restaurant.deleteMany({ where: { id: { notIn: reals } } });
  await p.benchmark.deleteMany({});
  const after = { rest: await p.restaurant.count(), bench: await p.benchmark.count() };
  console.log('before', before, 'after', after);
  await p.$disconnect();
})().catch((e) => { console.error('ERR', e.message?.split('\n')[0]); process.exit(1); });
