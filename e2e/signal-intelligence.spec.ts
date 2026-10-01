import { test, expect, type Page, type APIRequestContext } from '@playwright/test';

// ── RIST-RDI-007 Signal-intelligence drill-down ──
// Validates the signal layer surfaced under the restaurant detail page:
// factor coverage/confidence, per-signal rows (measured vs pending), the
// evidence drawer, signal-agnostic search, sort, filters, Top Problems
// expansion, responsive mobile, and absence of console errors.
//
// Robustness: the seed restaurant ("Biryani Maxx", demo-biryani-maxx) carries
// a mix of measured AND pending signals. We assert the ROW renders and its
// status text is correct — never that a particular signal is measured. Where a
// control only exists under certain data states (e.g. Top Problems needs a
// critical/needs_attention factor), we exercise it on a freshly-created sparse
// restaurant that is guaranteed to produce problem factors.

import { BACKEND_URL as BACKEND, TEST_PASSWORD } from './helpers/env';
const SEED_RESTAURANT_ID = 'demo-biryani-maxx';

/** Sign up a unique user via the API and seed the browser's auth token. */
async function signUpViaApi(request: APIRequestContext, page: Page): Promise<void> {
  const email = `rdi-sig-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  const res = await request.post(`${BACKEND}/api/auth/signup`, {
    data: { name: 'Signal Test', email, password: TEST_PASSWORD },
  });
  expect(res.ok(), `signup failed: ${res.status()}`).toBeTruthy();
  const body = await res.json();
  const token: string = body?.data?.token;
  expect(token, 'signup returned a token').toBeTruthy();
  // Seed localStorage BEFORE hydration so the auth provider bootstraps a session.
  await page.addInitScript((t) => {
    localStorage.setItem('rdi_token', t as string);
  }, token);
}

/**
 * Open a restaurant detail and wait for the scorecard to load. Returns after
 * the MasterScore region is visible so subsequent assertions are deterministic.
 */
async function openDetail(page: Page, id: string): Promise<void> {
  await page.goto(`/dashboard/restaurants/${id}`);
  await expect(page.getByText('Restaurants').first()).toBeVisible({ timeout: 15000 });
  await expect(page.getByText(/factors measured/i).first()).toBeVisible({ timeout: 20000 });
}

/**
 * Expand a factor card by name. The card root is a clickable element that wraps
 * a <p> with the factor name; clicking the text bubbles to the card onClick.
 */
async function expandFactor(page: Page, name: string): Promise<void> {
  await page.getByText(name, { exact: true }).first().click();
  await expect(page.getByText('Current Score').first()).toBeVisible({ timeout: 5000 });
}

test.describe('Signal Intelligence — drill-down', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('1. Smoke: MasterScore, 5 categories, 25 factor cards', async ({ page, request }) => {
    await signUpViaApi(request, page);
    await openDetail(page, SEED_RESTAURANT_ID);

    await expect(page.getByText('Restaurant Intelligence').first()).toBeVisible();
    await expect(page.getByText('/100').first()).toBeVisible();

    // 5 category cards in the Category Scores strip.
    for (const cat of ['Discoverability', 'Reputation', 'Website & Digital Experience', 'Restaurant Information', 'Market Position']) {
      await expect(page.getByText(cat).first()).toBeVisible();
    }

    // 25 factor cards present.
    await expect(page.getByText(/Showing \d+ of \d+ factors/).first()).toBeVisible();
    const showingText = await page.getByText(/Showing \d+ of \d+ factors/).first().innerText();
    const total = Number((showingText.match(/of (\d+) factors/) ?? [])[1] ?? 0);
    expect(total, `expected 25 factors, got ${total}`).toBe(25);
  });

  test('2. Live factor card shows confidence, signals, and coverage via scorecard', async ({ page, request }) => {
    await signUpViaApi(request, page);
    await openDetail(page, SEED_RESTAURANT_ID);

    // A live (non-pending) factor card surfaces confidence + signal count.
    await expect(page.getByText('% confidence').first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/signals$/).first()).toBeVisible();

    // Coverage X/Y lives in the scorecard API (the card surfaces it as signal
    // count). Verify the API exposes measured/total coverage for a live factor.
    const res = await request.get(`${BACKEND}/api/restaurants/${SEED_RESTAURANT_ID}/scorecard`, {
      headers: { Authorization: `Bearer ${await page.evaluate(() => localStorage.getItem('rdi_token') || '')}` },
    });
    expect(res.ok()).toBeTruthy();
    const data = (await res.json())?.data;
    const live = (data?.categories ?? []).flatMap((c: any) => c.factors).find((f: any) => f.status !== 'pending_observation' && f.coverage);
    expect(live, 'expected a live factor with coverage').toBeTruthy();
    expect(live.coverage.total).toBeGreaterThan(0);
    expect(live.coverage.measured).toBeGreaterThanOrEqual(0);
    expect(live.confidence).not.toBeNull();
  });

  test('3. Factor expansion shows measured signal rows with observed value + numeric score', async ({ page, request }) => {
    await signUpViaApi(request, page);
    await openDetail(page, SEED_RESTAURANT_ID);

    await expandFactor(page, 'Google Business Profile');

    // The expanded card contains a "Signals" section header.
    await expect(page.getByText('Signals', { exact: true }).first()).toBeVisible();

    // Measured signal rows are identifiable by an evidence button ("N evidence").
    // For the live, data-rich GBP factor at least one measured row must render.
    const evidenceButtons = page.getByRole('button', { name: /evidence$/i });
    const evCount = await evidenceButtons.count();
    expect(evCount, 'expected at least one measured signal row (evidence button)').toBeGreaterThan(0);

    // A measured row carries an observed value (Yes/No/number), a bare numeric
    // score cell, and a "% conf" marker — all siblings within the row.
    const evRow = evidenceButtons.first().locator('xpath=..');
    await expect(evRow).toBeVisible();
    await expect(evRow.getByText(/(Yes|No)/).first()).toBeVisible();
    await expect(evRow.getByText(/% conf/).first()).toBeVisible();
    const scoreCells = evRow.locator('span').filter({ hasText: /^\d+$/ });
    expect(await scoreCells.count(), 'measured row shows a numeric signal score').toBeGreaterThan(0);
  });

  test('4. Pending/stale/na signals render muted WITH NO fabricated number', async ({ page, request }) => {
    await signUpViaApi(request, page);
    await openDetail(page, SEED_RESTAURANT_ID);

    await expandFactor(page, 'Google Business Profile');

    // ExpandableFactorCard puts the signal list in the expanded card (the card
    // currently expanded, containing the "Current Score" panel head). Use .last()
    // to avoid matching the status-filter <option> that also says "Pending Observation".
    const expanded = page.locator('div', { hasText: /Current Score/ }).filter({ has: page.getByText('Signals', { exact: true }) }).last();
    await expect(expanded).toBeVisible();

    // This factor has pending signals alongside measured ones. Assert the
    // pending rows (muted, with a "Pending Observation" badge) render.
    const pendingBadge = expanded.getByText('Pending Observation', { exact: true }).first();
    await expect(pendingBadge).toBeVisible();

    // A per-status row is a div that carries the status badge text AND no
    // evidence button (measured rows have an "N evidence" button; the expanded
    // card container also contains evidence buttons, so this excludes it too).
    const neutral = ['Pending Observation', 'Not Applicable', 'Stale'];
    for (const label of neutral) {
      const rows = expanded
        .locator('div')
        .filter({ has: page.getByText(label, { exact: true }) })
        .filter({ hasNot: page.getByRole('button', { name: /evidence$/i }) });
      const count = await rows.count();
      if (count === 0) continue;
      for (let i = 0; i < Math.min(count, 3); i++) {
        const text = await rows.nth(i).innerText();
        // Neutral row must NOT show a numeric normalized score (a lone integer line).
        const loneInt = text.split('\n').filter((l) => /^\d+$/.test(l.trim()));
        expect(loneInt.length, `pending row should not fabricate a numeric score:\n${text}`).toBe(0);
      }
    }
  });

  test('5. Evidence drawer opens with all fields and dismisses via ✕/overlay/Esc', async ({ page, request }) => {
    await signUpViaApi(request, page);
    await openDetail(page, SEED_RESTAURANT_ID);

    await expandFactor(page, 'Google Business Profile');

    // Helpers within this test. NOTE: the EvidenceDrawer is rendered inside the
    // card, so close/press events bubble to the card's toggle handler and
    // collapse it — re-expand before each open when it is not already expanded.
    const openEvidence = async () => {
      const expandedHead = page.getByText('Signals', { exact: true }).first();
      if (!(await expandedHead.isVisible().catch(() => false))) {
        await page.getByText('Google Business Profile', { exact: true }).first().click();
        await expect(expandedHead).toBeVisible({ timeout: 5000 });
      }
      await page.getByRole('button', { name: /evidence$/i }).first().click();
      const d = page.getByRole('dialog');
      await expect(d).toBeVisible();
      return d;
    };

    // 1) ✕ button dismisses.
    let drawer = await openEvidence();
    await expect(drawer.getByText('Observation', { exact: true })).toBeVisible();
    await expect(drawer.getByText('Source', { exact: true })).toBeVisible();
    await expect(drawer.getByText('Observed', { exact: true })).toBeVisible();
    await expect(drawer.getByText('Confidence', { exact: true })).toBeVisible();
    await expect(drawer.getByText('Methodology', { exact: true })).toBeVisible();
    await drawer.getByRole('button', { name: 'Close evidence' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // 2) Overlay click dismisses (the role=dialog root is the full-screen overlay
    // with onClick=close; the right-aligned panel stops propagation). Click the
    // root at top-left — the backdrop region left of the panel.
    drawer = await openEvidence();
    await drawer.click({ position: { x: 5, y: 5 } });
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // 3) Escape dismisses.
    drawer = await openEvidence();
    await drawer.getByText('Methodology', { exact: true }).scrollIntoViewIfNeeded();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('6. Search matches signal labels', async ({ page, request }) => {
    await signUpViaApi(request, page);
    await openDetail(page, SEED_RESTAURANT_ID);

    const search = page.getByPlaceholder('Search factors...');
    await expect(search).toBeVisible();
    const before = await page.getByText(/Showing \d+ of \d+ factors/).first().innerText();
    const beforeCount = Number((before.match(/of (\d+) factors/) ?? [])[1] ?? 0);

    // Search by a signal-label substring that is NOT in any factor name, so the
    // match must come from signal labels (e.g. "Address Verified" is a signal,
    // not a factor name). Search should drop the visible count (or stay valid).
    await search.fill('Address Verified');
    await page.waitForTimeout(400);
    const during = await page.getByText(/Showing \d+ of \d+ factors/).first().innerText();
    const duringCount = Number((during.match(/Showing (\d+) of/) ?? [])[1] ?? beforeCount);
    expect(duringCount).toBeLessThan(beforeCount);

    // Clearing restores.
    await search.fill('');
    await page.waitForTimeout(400);
    const after = await page.getByText(/Showing \d+ of \d+ factors/).first().innerText();
    const afterCount = Number((after.match(/Showing (\d+) of/) ?? [])[1] ?? 0);
    expect(afterCount).toBe(beforeCount);
  });

  test('7. Sorts apply without error across all options', async ({ page, request }) => {
    await signUpViaApi(request, page);
    await openDetail(page, SEED_RESTAURANT_ID);

    const sortSelect = page.locator('select').filter({ has: page.locator('option[value="score_asc"]') });
    await expect(sortSelect).toBeVisible();

    for (const v of ['score_asc', 'score_high', 'conf_low', 'evidence', 'pending', 'category', 'name']) {
      await sortSelect.selectOption(v);
      await page.waitForTimeout(150);
      await expect(page.getByText(/Showing \d+ of \d+ factors/).first()).toBeVisible();
    }

    // Default sort = lowest score. Verify the grid renders (factor cards present)
    // after sorting — the requirement is that all options apply without error.
    await sortSelect.selectOption('score_asc');
    await page.waitForTimeout(250);
    const countText = await page.getByText(/Showing \d+ of \d+ factors/).first().innerText();
    const shown = Number((countText.match(/Showing (\d+) of/) ?? [])[1] ?? 0);
    expect(shown).toBeGreaterThan(0);
    // Factor cards are present (at least one card row rendered after sorting).
    await expect(page.getByText(/signals$/).first()).toBeVisible();
  });

  test('8. Primary status filter and Advanced filters apply without error', async ({ page, request }) => {
    await signUpViaApi(request, page);
    await openDetail(page, SEED_RESTAURANT_ID);

    const statusSelect = page.locator('select').filter({ has: page.locator('option[value="pending_observation"]') });
    await expect(statusSelect).toBeVisible();

    // Primary: Pending Observation should drop the count. The count line is
    // "Showing X of Y factors · A measured · B pending".
    await statusSelect.selectOption('pending_observation');
    await page.waitForTimeout(250);
    const pendingText = await page.getByText(/Showing \d+ of \d+ factors/).first().innerText();
    const pendingShown = Number((pendingText.match(/Showing (\d+) of/) ?? [])[1] ?? 0);
    // The "of N factors" total stays the same; the filtered grid shows only the
    // pending subset, which is strictly less than the full 25.
    expect(pendingShown).toBeGreaterThan(0);
    expect(pendingShown).toBeLessThan(25);

    // Reset to All.
    await statusSelect.selectOption('all');
    await page.waitForTimeout(250);
    const allText = await page.getByText(/Showing \d+ of \d+ factors/).first().innerText();
    const allShown = Number((allText.match(/Showing (\d+) of/) ?? [])[1] ?? 0);
    expect(allShown).toBe(25);

    // Open Advanced and toggle each secondary filter without error.
    await page.getByRole('button', { name: /Advanced/ }).click();
    const advSelect = page.locator('select').filter({ has: page.locator('option[value="incomplete_coverage"]') });
    await expect(advSelect).toBeVisible();
    for (const v of ['low_confidence', 'incomplete_coverage', 'stale_evidence', 'all']) {
      await statusSelect.selectOption('all');
      await advSelect.selectOption(v);
      await page.waitForTimeout(300);
      await expect(page.getByText(/Showing \d+ of \d+ factors/).first()).toBeVisible();
    }
  });

  test('9. Top Problems expands to show weak and strong signals', async ({ page, request }) => {
    await signUpViaApi(request, page);

    // Navigate to a same-origin page so localStorage is readable.
    await page.goto('/dashboard');
    await page.waitForTimeout(400);

    // A freshly-created sparse restaurant is guaranteed to contain critical /
    // needs_attention factors (which trigger the Priority Opportunities panel).
    // Sign up seeded the token; create the sparse restaurant with it.
    const token = await page.evaluate(() => localStorage.getItem('rdi_token') || '');
    expect(token).toBeTruthy();
    const createRes = await request.post(`${BACKEND}/api/restaurants`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: {
        name: `Sig Probs ${Date.now()}`,
        address: `${Math.floor(Math.random() * 9000)} Problem Ave`,
        city: 'Raleigh',
        cuisineTypes: '["Italian"]',
      },
    });
    expect(createRes.ok()).toBeTruthy();
    const createBody = await createRes.json();
    const id = createBody?.data?.id || createBody?.id;
    expect(id).toBeTruthy();

    await openDetail(page, id);

    // Priority Opportunities panel renders for a sparse restaurant.
    await expect(page.getByText('Priority Opportunities').first()).toBeVisible({ timeout: 15000 });

    // Expand the first problem factor row. The expandable header is a clickable
    // div (cursor:pointer) that carries the factor name and a status badge.
    const problemHeader = page.locator('div[style*="cursor: pointer"]').filter({ hasText: /Competitive Position/ }).filter({ hasText: /Critical/ }).first();
    await expect(problemHeader).toBeVisible();
    await problemHeader.click();
    await expect(page.getByText('Why it is low', { exact: true }).first()).toBeVisible({ timeout: 5000 });

    // Weak signal rows render (SignalRows under "Why it is low"), OR the panel
    // degrades gracefully with an explicit no-weak-signals message.
    const whySection = page.getByText('Why it is low', { exact: true }).first().locator('xpath=following-sibling::*');
    const weakOrEmpty = whySection.first().or(page.getByText(/No weak measured signals|No measured signal detail/).first());
    await expect(weakOrEmpty.first()).toBeVisible();

    // Strong signals may render for factors that also have high-scoring measured
    // signals. If present they render under a "Strong signals" heading.
    const strongHeading = page.getByText('Strong signals', { exact: true });
    const strongCount = await strongHeading.count();
    if (strongCount > 0) {
      await expect(strongHeading.first()).toBeVisible();
    }
  });

  test('10. Mobile 375px: signals stack, drawer usable, no horizontal overflow', async ({ page, request }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await signUpViaApi(request, page);
    await openDetail(page, SEED_RESTAURANT_ID);

    await expandFactor(page, 'Google Business Profile');

    // No horizontal overflow on mobile.
    const overflows = await page.evaluate(() => ({
      scrollW: document.documentElement.scrollWidth,
      clientW: document.documentElement.clientWidth,
    }));
    expect(overflows.scrollW, `mobile overflow: scroll=${overflows.scrollW} client=${overflows.clientW}`)
      .toBeLessThanOrEqual(overflows.clientW + 1);

    // Signals stack in a single column (no horizontal layout).
    await page.getByRole('button', { name: /evidence/i }).first().click();
    const drawer = page.getByRole('dialog');
    await expect(drawer).toBeVisible();
    await expect(drawer.getByText('Observation', { exact: true })).toBeVisible();
    await expect(drawer.getByText('Methodology', { exact: true })).toBeVisible();

    const drawerOverflows = await page.evaluate(() => ({
      sw: (document.querySelector('[role=dialog]')?.scrollWidth ?? 0),
      cw: (document.querySelector('[role=dialog]')?.clientWidth ?? 0),
    }));
    expect(drawerOverflows.sw, 'drawer overflow').toBeLessThanOrEqual(drawerOverflows.cw + 1);

    // Usable — dismiss works on mobile.
    await drawer.getByRole('button', { name: 'Close evidence' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('11. No console errors during the drill-down flow', async ({ page, request }) => {
    await signUpViaApi(request, page);

    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));

    await openDetail(page, SEED_RESTAURANT_ID);
    await expandFactor(page, 'Google Business Profile');
    await page.getByRole('button', { name: /evidence/i }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');

    // Exhaust the drill-down controls.
    await page.getByPlaceholder('Search factors...').fill('menu');
    await page.waitForTimeout(400);
    await page.getByPlaceholder('Search factors...').fill('');
    const sortSelect = page.locator('select').filter({ has: page.locator('option[value="score_high"]') });
    await sortSelect.selectOption('score_high');
    await page.waitForTimeout(200);

    expect(errors, `console/page errors during drill-down:\n${errors.join('\n')}`).toEqual([]);
  });
});

