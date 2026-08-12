# Design: Visual Regression Tests (P2)

## Purpose
Catch UI regressions automatically by comparing Playwright screenshots against baselines.

## Approach
- Add a new Playwright spec `e2e/visual-regression.spec.ts`
- Use Playwright's built-in `expect(page).toHaveScreenshot()` 
- Store baselines in `e2e/screenshot-baselines/`
- Run on CI and locally

## Pages to capture
1. Landing page (hero, pricing, learn, success-stories)
2. Auth page (sign in, sign up forms)
3. Dashboard (home, restaurants list, restaurant detail)
4. Intelligence pages (overview, analysis, visibility, competitors, reviews, website, search)
5. Actions (decision center, tasks, outcomes)
6. Reports (overview, weekly, audit)
7. Discover (hub, local market, trending, competitor activity, opportunities, seasonal)
8. Settings (organization, billing, notifications, integrations, preferences)
9. Admin dashboard
10. Connectors page
11. Team page
12. Help pages (docs, support, feedback)

## Implementation
- One test per page with `test.describe` grouping
- Use `page.setViewportSize` for desktop (1280x800) and mobile (375x812)
- Login once via `page.request` to set auth cookie, then navigate to each page
- Use `{ maxDiffPixels: 100 }` tolerance for acceptable minor rendering differences
- Run with `npx playwright test e2e/visual-regression.spec.ts`

## Files to create
- `e2e/visual-regression.spec.ts` — the test file
- `e2e/screenshot-baselines/` — baseline images (generated on first run with `--update-snapshots`)
