# Ristorante — Project Ledger
> **LIVING DOCUMENT** — Updated every session without fail.
> Maintained by Hermes. Source of truth for what's done, what's broken, what's next.
> 
> **Discipline:** Before every session end, this ledger is updated. No exceptions.

---

## ✅ Accomplished (Frozen)

| Area | Status | Notes |
|------|--------|-------|
| Three Constitutions (Engineering, Quality, Product Experience) | ✅ Frozen | `docs/product-ui-spec-v1.md`, `docs/qa-constitution.md`, `docs/product-experience-constitution.md` |
| Design System (`lib/design-tokens.ts`) | ✅ Frozen | colors, spacing, radius, typography, scoreColor, scoreLabel |
| Navigation IA (sidebar, routes, breadcrumbs) | ✅ Frozen | 9 nav links, Cmd+K search, notification bell |
| `useList` hook (search, sort, filter, pagination) | ✅ Frozen | Reusable across all list pages |
| Scorecard Model (30 factors, 5 categories) | ✅ Frozen | `backend/src/domain/scorecard/types.ts` — 30 FactorDefinitions |
| Scorecard Model v2.0 (25 factors, 5 categories) | ✅ Frozen | `types.ts` — 25 customer-facing factors, merged v1.0 factors preserved as sub-signals/evidence |
| Scorecard Service (Prisma direct, no offsets) | ✅ Frozen | `backend/src/domain/scorecard/ScorecardService.ts` |
| API: `GET /api/restaurants/:id/scorecard` | ✅ Live | Returns full scorecard with categories, factors, status |
| API: `DELETE /api/restaurants/:id` | ✅ Live | Hard delete |
| API: `PATCH /api/restaurants/:id/disable` | ✅ Live | Toggle disabled status |
| Admin seed (`admin@ristorante.app` / `admin123`) | ✅ Live | Auto-seeded on server start |
| Score consistency (outside = inside) | ✅ Fixed | Both use same 8-score composite average |
| Restaurant list: composite score, disabled badge | ✅ Built | Shows overallScore, "Disabled" tag, ✕ delete button |
| Team API: members, invitations, remove | ✅ Built | `GET /:id/members`, `POST /:id/invitations`, `DELETE /:id/members/:memberId` |
| Batch decisions endpoint | ✅ Built | `GET /api/decisions/batch?restaurantIds=a,b,c` — single SQL query |
| Batch outcomes endpoint | ✅ Built | `GET /api/outcomes/batch?restaurantIds=a,b,c` — single SQL query |
| Frontend: batch decisions | ✅ Built | Decision Center, Tasks, Outcomes all use batch endpoints (no N+1) |
| Unit tests: ScorecardService | ✅ Built | 10 tests, 100 assertions, Vitest |
| Integration tests: API endpoints | ✅ Built | 1 sequential test, 29 assertions across 20+ endpoints |
|| AI Service (Ollama-first structured output) | ✅ Built | `ai.service.ts` — local Ollama chat, strict JSON parsing, light/complex model routing |
|| React stale closure fix | ✅ Fixed | Decision Center/Tasks/Outcomes use `useEffect` + cancellation flag + `retryCount` pattern |
|| **Connector Platform** (5 connectors) | ✅ Built | Prisma model, service, API routes, auto-seed, GBP/Zomato/Swiggy/JustDial/TripAdvisor with scorecard factor mapping |
|| **Connector Route Fix** | ✅ Fixed | Removed duplicate old routes in `batch02.routes.ts` that were shadowing the new connector routes |
|| **Billing Page** (Razorpay frontend) | ✅ Built | Full billing page with current plan, plan selection, Razorpay checkout, payment history, cancel flow |
|| **RIST-AI-001: AI Capability Layer Separation** | ✅ **FROZEN** | Tag `rist-ai-001-frozen` (commit `da81284`). Deterministic core is AI-independent; AI is capability-oriented under `backend/src/infrastructure/ai/`. Timeout, failure taxonomy, citation grounding, retrieval isolation, search auth, menu provenance hardened. 48/48 tests, AI ON==OFF scorecard, all-AI-off core functional. Re-eval `PASS / P0:0 / P1:0`. |

### Pages Built (27 total)

| Area | Pages | Status |
|------|-------|--------|
| **Public** | Landing, Auth, Pricing, Success Stories, Learn | ✅ |
| **Dashboard** | Home, Restaurants (list), Restaurant (scorecard hub) | ✅ |
| **Intelligence** | Overview, Analysis, Visibility, Competitors, Reviews, Website, Search, Recommendation Detail | ✅ |
| **Actions** | Decision Center, Tasks, Outcomes | ✅ |
| **Reports** | Overview, Weekly, Audit | ✅ |
| **Discover** | Hub, Local Market, Trending Searches, Competitor Activity, Opportunities, Seasonal Trends | ✅ |
| **Team** | Members, invite form, role selector | ✅ |
| **Settings** | Organization, Billing, Notifications, Integrations, Preferences | ✅ |
| **Admin** | Dashboard with stats | ✅ |
| **Help** | Documentation, Support, Feedback | ✅ |

| `project-ledger-discipline` skill | ✅ Created | Constitutional rule for all future projects |
| `docs/project-ledger.md` | ✅ Created | Living document — updated every session |

### Tests (145 E2E + 10 unit + 1 integration = 156 total, 156 passing ✅)

| File | Tests | Assertions | Status |
|------|-------|------------|--------|
| `customer-journey.spec.ts` | 8 | ~80 | ✅ All pass |
| `intelligence.spec.ts` | 6 | ~60 | ✅ All pass |
| `restaurant-list.spec.ts` | 30 | ~300 | ✅ All pass |
| `restaurant-detail.spec.ts` | 22 | ~220 | ✅ All pass |
| `intelligence-comprehensive.spec.ts` | 20 | ~200 | ✅ All pass |
| `misc-pages.spec.ts` | 25 | ~250 | ✅ All pass |
| `auth-public.spec.ts` | 29 | ~290 | ✅ All pass |
| `ScorecardService.test.ts` (unit) | 13 | ~130 | ✅ All pass |
| `api.integration.test.ts` (integration) | 1 | ~29 | ✅ All pass |
| **Total** | **159** | **~1,630** | **✅ 159/159 pass** |

---

## ⚠️ Known Issues (Needs Fixing)

| Priority | Issue | Root Cause | Fix |
|----------|-------|------------|-----|
| P2 | Subscription features mocked | `RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET` not set | Add env vars or implement mock mode properly |
| P2 | Next.js 15.5.22 (outdated) | Not upgraded | ✅ Fixed — package.json updated to `^16.0.0`, run `pnpm install` locally |
| P3 | `Failed to fetch` in auth-context.tsx:53 | Backend down when frontend loads | ✅ Fixed — health check gate + retry loop with exponential backoff + `connectionError`/`retryCount` state |
| P2 | AI Service only uses local Ollama | No cloud fallback | ✅ Fixed — now cascades NVIDIA NIM → Ollama Cloud → local Ollama |

---

## 📋 Pending (New Functionality)

|| Priority | Feature | Why | Effort |
||----------|---------|-----|--------|
|| P2 | **Visual regression tests** (Playwright screenshot) | Catch UI regressions automatically | 2 days |
|| P2 | **Audit report** — full PDF generation | Customer deliverable | 3 days |
|| P3 | **Notification system** — email/Slack/Discord alerts | Engagement | 1 week |
|| P3 | **Mobile app** — PWA or React Native | Accessibility | 2-3 weeks |

---

## 🎯 Next Actions (Immediate)

1. **Real-data path (primary):** Add Restaurant → discover real public evidence → generate the 25-factor discovery scorecard → deploy the RTP showcase. (RIST-AI-001 AI architecture is frozen and closed.)
2. **Visual regression tests** — Playwright screenshot-based
3. **Audit report** — Full PDF generation
4. **Notification system** — email/Slack/Discord alerts

---

## 🛑 MSP FREEZE POINT (Aug 2026)

**Tag: `msp-baseline` (commit `98353c8`)** — Feature development is FROZEN.

This tag is the line between *"we think customers need this"* and *"customers told us they need this."*
Do NOT hand Hermes another product-development backlog.

**Product complete at freeze:**
25-factor scorecard · 5 business categories · evidence/confidence/freshness ·
trends · benchmarking · portfolio + heat map · problem prioritization ·
impact simulation · decision lifecycle · competitor comparison · evidence
timeline · weekly intelligence · executive PDF · cross-factor relationships ·
search/sort/filter · responsive/visual regression · builds/tests/E2E green.

**Operating mode going forward — pilot loop:**
`Restaurant → Audit → Conversation → Decision → Action → Outcome → Feedback`
Goal: **10 pilot restaurants**, personally observed. Per restaurant capture:
Acquisition → TTFV → Score viewed → Problem understood → Decision accepted →
Action completed → Outcome observed → Would they pay?

**Uncomfortable metric (not "do they like the dashboard"):**
> "I didn't know this was a problem, and now I know what to do about it."
Plus: **"Would you pay to keep monitoring this?"**

**GTM wedge:** *Free Restaurant Intelligence Audit*
`Audit → Score → Problems → Actions → Monitoring → Subscription`

**Engineering exception (only these):**
- P0: Pilot-blocking defect
- P1: Customer cannot reach first value
- P1: Score/evidence demonstrably wrong
- P1: Customer cannot understand or act on the result
- P1: Repeated request across pilot customers
Everything else → backlog.

---

## 📊 Platform Health

| Metric | Value |
|--------|-------|
| Pages | 27 |
| API Routes | ~30 |
| E2E Tests | 145 (all passing) |
| Unit Tests | 13 (all passing) |
| Integration Tests | 1 (all passing) |
| Total Assertions | ~1,630 |
| Target | 2,500+ |
| Backend Status | ✅ Healthy (port 8040) |
| Frontend Status | ✅ Healthy (port 3000) |
| Admin Login | `admin@ristorante.app` / `admin123` |
| Real Restaurants | 21 |
