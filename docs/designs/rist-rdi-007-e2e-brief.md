# RIST-RDI-007 — E2E Playwright (brief for implementer)

Add a new Playwright spec validating the signal-intelligence drill-down, AND keep every existing E2E spec green. Run in both headless and headed (browser-led) modes.

## READ FIRST
1. `docs/designs/rist-rdi-007-signal-design-v1.md` §18–§36 (the UX the tests must cover).
2. Existing E2E conventions: `e2e/playwright.config.ts` (testDir '.', baseURL `http://localhost:3040` — the FRONTEND runs on 3040 per the webServer config, which builds frontend and `start --port 3040`; backend boots on 8040 with `reuseExistingServer:true`). Existing specs in `e2e/`: customer-journey, restaurant-detail, restaurant-list, intelligence*, auth-public, misc-pages, visual-qa, visual-regression.
3. `e2e/package.json` scripts: `e2e:test` = `playwright test` (headless), `e2e:test:headed` = `playwright test --headed`.

## IMPORTANT — the scorecard API shape changed (additively) now:
- `GET /api/restaurants/:id/scorecard` response `data` now includes `signalModel` (summary: supportedSignals, observedSignals, pendingSignals, notApplicableSignals, staleSignals, factors, realSourcesOnly, syntheticInputs, manualOverrides, methodologyVersion) and each factor carries `signals[]` (each with status measured|partial|pending_observation|not_applicable|stale, label, normalizedValue, confidence, scoreContribution?, observedAt?, evidenceRefs[]), plus `coverage {measured,total}`, `coverageDetail`, counts, `lastObservedAt`.
- `GET /api/restaurants/:id/signals` returns `{ data: { factors: FactorResult[], summary } }`.
- The UI (restaurant detail page `/dashboard/restaurants/[id]`) now shows on each measurable factor card: `Coverage X / Y`, `Confidence %`, evidence count, `Updated Nm ago`. Expanding a factor shows the signal list (measured/partial rows with observed value + signal score + confidence; pending/stale/na rows muted, no fabricated number). Clicking a signal's evidence opens a drawer. Search matches signal names. Sort options extended (lowest score default / highest / lowest confidence / most evidence / most pending / category / alphabetical). Filters: primary status + secondary Advanced (Low Confidence / Incomplete Coverage / Stale Evidence). Top Problems expand to show weak+strong signals. Mobile 375px stacks signals.

## Build
Create `e2e/signal-intelligence.spec.ts` mirroring `e2e/restaurant-detail.spec.ts` (reuse its helper pattern: auth sign-in, `navigateToRestaurants`, adding/selecting `demo-biryani-maxx` or another known seed restaurant, `expect` assertions). Cover:

1. **Smoke** — restaurant detail loads; MasterScore visible; 5 category cards visible; 25 factor cards present.
2. **Factor card coverage + confidence** — a live factor card shows `Coverage X / Y` and a `% confidence` indicator and evidence count.
3. **Factor expansion shows signals** — click a factor → signal rows render; a measured signal shows an observed value and a numeric signal score.
4. **Pending signal renders muted with no fabricated number** — a `pending_observation` signal shows "Pending"-style/neutral text and does NOT render a bogus numeric score.
5. **Evidence drawer** — click a measured signal's evidence → drawer shows Observation/Source/Observed/Confidence/Methodology; dismiss (✕ or overlay or Esc) works.
6. **Search matches signals** — type a signal label substring ("review" / "Google" / "menu") → matching factor card surfaces.
7. **Sort** — select "Lowest Score" (default) / "Highest Score" / "Lowest Confidence" — factor ordering changes appropriately (or at least no error and options present).
8. **Filter** — apply a primary status filter; factor grid filters. Open Advanced and toggle Low Confidence / Incomplete Coverage / Stale Evidence without error.
9. **Top Problems expanded reason** — expand a problem factor → weak AND strong signal rows visible.
10. **Mobile 375px** — set viewport 375×667; expanded signals stack; EvidenceDrawer usable; no horizontal overflow.
11. **No console errors** — assert `page.on('console')` has no `error`-level messages during the drill-down flow.

Make assertions ROBUST: the seed restaurant may have some signals measured and some pending. Assert the ROW renders and the status text is correct, not that a specific signal is necessarily measured. Where a field could be absent, assert the UI degrades gracefully (no crash).

## Keep existing suite green
- The frontend build (`npm run build && npm run start -- --port 3040`) takes ~2 min; playwright.config `reuseExistingServer:true` reuses port 3040 if already running. If a frontend dev/build server is already on 3040, reuse it; otherwise let Playwright boot it.
- Run the FULL existing suite: `cd e2e && npx playwright test` — EVERY existing spec must pass. If legit frontend changes broke a selector, FIX the spec (do not delete tests) and list which you changed.

## Browser-led + headless
- Run headless: `cd e2e && npx playwright test`
- Run browser-led (headed): `cd e2e && npx playwright test --headed` for your new spec at least.

## Report
File created; number of new tests + assertions; full Playwright result (passed/failed per spec); any existing specs you fixed + why; headed-mode result. Do not commit.
