// Rebuild rtp-showcase.db from the clean backup, then strip the 2 known
// contaminants + all benchmark rows so the result is EXACTLY the 6 real
// restaurants with 0 benchmarks (RIST-RDI-003 contract), then relaunch.
process.env.DATABASE_URL = 'file:' + require('path').resolve('prisma/rtp-showcase.db');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const SHOWCASE = path.resolve('prisma/rtp-showcase.db');
const BACKUP = process.argv[2];
const CONTAMINANTS = ['6a751d61-b241-4053-8f1b-dff1459a9a1b', '7115d241-3b07-4373-9855-df01002fd030'];

(async () => {
  // 1. Restore from backup (contains all 6 real restaurants + 2 contaminants).
  if (!BACKUP || !fs.existsSync(BACKUP)) { console.error('no backup'); process.exit(1); }
  process.env.DATABASE_URL = 'file:' + BACKUP;
  const src = new PrismaClient();
  const rows = await src.restaurant.findMany({ where: { id: { in: CONTAMINANTS } }, select: { id: true } });
  console.log('backup has contaminants:', rows.map((r) => r.id));
  await src.$disconnect();

  // 2. Swap the file in.
  fs.copyFileSync(BACKUP, SHOWCASE);

  // 3. Open the restored showcase and delete contaminants + benchmarks.
  process.env.DATABASE_URL = 'file:' + SHOWCASE;
  const p = new PrismaClient();
  await p.restaurant.deleteMany({ where: { id: { in: CONTAMINANTS } } });
  await p.benchmark.deleteMany({});
  const rest = await p.restaurant.findMany({ select: { id: true, name: true } });
  console.log('RESTORED showcase restaurants:', rest.length);
  for (const r of rest) console.log(' -', r.id, '|', r.name);
  console.log('benchmarks:', await p.benchmark.count());
  await p.$disconnect();
})().catch((e) => { console.error('ERR', e.message?.split('\n')[0]); process.exit(1); });
