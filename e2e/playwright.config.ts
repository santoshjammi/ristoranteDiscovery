import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';

const env = (globalThis as any).process?.env ?? {};

// ── E2E isolation contract ────────────────────────────────────────────────────
// The suite must exercise the WORKING TREE, never a running container/dev server.
//
// Why these ports: OrbStack owns 3040/5040 and the (now retired) launchd dev
// daemons owned 3003/8040. E2E gets its own pair so nothing can contend, and
// `reuseExistingServer: false` turns an occupied port into a hard ERROR instead of
// silently adopting whatever is already listening. That was the false-green bug:
// with `reuseExistingServer: !CI`, Playwright adopted the Docker container on
// :3040 and validated a stale image rather than the code under test.
const BACKEND_PORT = Number(env.E2E_BACKEND_PORT ?? 8400);
const FRONTEND_PORT = Number(env.E2E_FRONTEND_PORT ?? 3400);

const BACKEND_URL = `http://127.0.0.1:${BACKEND_PORT}`;
const FRONTEND_URL = `http://127.0.0.1:${FRONTEND_PORT}`;

// Prisma resolves a `file:` URL RELATIVE TO schema.prisma (backend/prisma/), not
// to the process cwd — so a relative value silently points at
// backend/prisma/prisma/e2e.db. Always hand it an absolute path.
// (This config loads as ESM: use import.meta.dirname, not require/__dirname.)
const E2E_DB_ABS = path.resolve(import.meta.dirname, '../backend/prisma/e2e.db');

// Which DB to copy for the run. Defaults to the showcase fixture. Overridable so a
// failure can be bisected: if a test passes on dev.db but fails on the fixture, the
// cause is the data, not the code.
const E2E_DB_SOURCE = env.E2E_DB_SOURCE ?? 'rtp-showcase.db';

// A dedicated DB copy. Specs MUTATE data (POST /api/restaurants in 8+ places) and
// prisma/seed.ts DELETES rows, so the suite must never touch the developer's
// dev.db or rtp-showcase.db. Copied fresh per run so each run starts from a known
// state and a failed run cannot poison the next one.

export default defineConfig({
  testDir: '.',
  testMatch: ['**/*.spec.ts'],
  fullyParallel: true,
  forbidOnly: !!env.CI,
  retries: env.CI ? 2 : 0,
  workers: env.CI ? 1 : undefined,
  reporter: [['html', { outputFolder: 'playwright-report' }], ['list']],
  use: {
    baseURL: FRONTEND_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      // `tsx` is NOT installed in this repo (backend ships nodemon/ts-node) and
      // `npx tsx` attempts a network install, so the previous command could not
      // run offline. Build then start — the production path, deterministic.
      //
      // DATABASE_URL appears twice on purpose: Prisma resolves it during the build
      // and the server reads it again at runtime. Both must hit the E2E copy.
      command:
        `cp prisma/${E2E_DB_SOURCE} ${E2E_DB_ABS} && ` +
        `DATABASE_URL="file:${E2E_DB_ABS}" npm run build && ` +
        `DATABASE_URL="file:${E2E_DB_ABS}" PORT=${BACKEND_PORT} npm run start`,
      cwd: '../backend',
      url: `${BACKEND_URL}/health`,
      reuseExistingServer: false,
      timeout: 180000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
    {
      // NEXT_PUBLIC_* is inlined at BUILD time, so the API base must be baked in
      // here to match this run's backend port — a runtime env var would be ignored.
      command:
        `NEXT_PUBLIC_API_URL=${BACKEND_URL}/api npm run build && ` +
        `NEXT_PUBLIC_API_URL=${BACKEND_URL}/api npm run start -- --port ${FRONTEND_PORT}`,
      cwd: '../frontend',
      url: `${FRONTEND_URL}/`,
      reuseExistingServer: false,
      timeout: 300000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
  ],
});
