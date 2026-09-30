# RistoranteDiscovery — Tested Functionality & Use-Case Guide (RIST-RDI-007)

**Scope:** All functionality implemented and verified for the RIST-RDI-007 Discovery Signal Model, the frozen 25-factor scorecard, and the full product surface.
**Verification date:** 20 Sep 2026
**Final gates:** Backend 112/112 unit tests · Frontend build green · E2E 100% (see per-spec table) · Security gate **PASS** (gitleaks + npm audit 0 vulns + semgrep 0 errors; trivy SKIP-optional).

---

## 1. What this document is

A canonical register of every implemented feature, every customer use case, and the exact automated tests that prove each one. It maps functionality → tests → evidence so nothing is "implemented but untested" or "tested but undocumented."

---

## 2. Backend — 25-Factor Discovery Signal Model (backend)

### 2.1 Canonical Signal Registry
**Implemented:** `backend/src/domain/discovery-intelligence/signal-registry.ts` — 113 canonical discovery signals mapped to all 25 frozen factors (2–13 per factor), with per-signal weight, scoring method, freshness policy, minimum confidence, required-evidence flag, and methodology version.
**Tests:** `signal-registry.test.ts` (7 tests) — every signal maps to exactly one valid factor; all 25 factors exist with signals; no duplicate signal keys; per-factor weights normalize to ~1; methodology version present.

### 2.2 5-State DiscoverySignal model + Observation + FactorResult
**Implemented:** `types.ts` — `DiscoverySignal` (measured | partial | pending_observation | not_applicable | stale), `Observation`, `SignalDefinition`, `FactorResult`, `FactorCoverage`, `SignalModelSummary`.
**Tests:** `SignalResolver.test.ts` (15 tests) — all five states; signal normalization; pending-never-zero; not-applicable excluded from denominator; malformed data → pending; stale → excluded from measured count; low confidence retained (not zero); connector-vs-DB conflict (connector wins); source-mismatch dropped.

### 2.3 Signal Processor + Factor Engine
**Implemented:** `SignalProcessor.ts` (observations → signals, freshness computation), `FactorEngine.ts` (deterministic factor score `Σ(score×weight×conf)/Σ(weight×conf)`; confidence = coverage × evidence × freshness; coverage + status classification).
**Tests:** `FactorEngine` aggregation, pending exclusion, confidence, coverage — covered in SignalResolver.test.ts + SignalRegistry.test.ts.

### 2.4 Scorecard integration (additive wiring)
**Implemented:** `ScorecardService.ts` now attaches to every factor its `signals[]`, coverage, coverageDetail, measured/total/pending/notApplicable/stale counts, `lastObservedAt`; the response carries the `signalModel` summary (supported/observed/pending/notApplicable/stale + `realSourcesOnly:true`, `syntheticInputs:0`, `manualOverrides:0`, `methodologyVersion`).
**Tests:** `ScorecardService.wiring.test.ts` (backward-compat — existing factor/category/overall scores byte-identical after the additive layer; `signalModel.supportedSignals > 0`; every factor has non-empty `signals[]`; empty-read graceful). `ScorecardService.test.ts` (17) — 25 factors across 5 categories, pending semantics, live/pending accounting.

### 2.5 API route
**Implemented:** `GET /api/restaurants/:id/signals` — per-factor signal drill-down + restaurant summary (auth-gated). Verified live: returns real `coverage {measured,total}`, `coverageDetail`, and `signals[]`.

---

## 3. Frontend — Signal Drill-Down (frontend)

**Implemented:** `components/scorecard/SignalRow.tsx`, `components/scorecard/EvidenceDrawer.tsx`, extended `ScorecardComponents.tsx` + restaurant detail `[id]/page.tsx`.

| Customer use case | Implementation | E2E test |
|---|---|---|
| Master score + 5 category cards | unchanged `MasterScore`/`CategoryScoreStrip` | signal-intelligence smoke |
| 25 factor cards | preserved grid | smoke (25 cards) |
| Coverage `X / Y` on factor | coverageDetail | signal-intelligence #2 |
| Confidence % (color + text, never color-only) | factor card + `⚠ Low Confidence` badge | #2 |
| Expand factor → signal list | `ExpandableFactorCard` + `SignalRow` | #3 |
| Measured signal shows value + score | SignalRow | #3 |
| Pending/stale/NA → muted, **no fabricated number** | SignalRow pending branch | #4 |
| Evidence drawer (Observation/Source/Observed/Confidence/Methodology) | `EvidenceDrawer` (✕/overlay/Esc) | #5 |
| Top Problems → weak AND strong signals | ProblemFactors expansion | #9 |
| Search matches signal labels | page.tsx search | #6 |
| Sort (lowest default/highest/lowest conf/most evidence/most pending/category/alpha) | page.tsx sort | #7 |
| Primary + advanced filters (Low Conf/Incomplete Coverage/Stale) | page.tsx filter | #8 |
| Mobile 375px stacking, no overflow | responsive + drawer width | #10 |
| No console errors during drill-down | page console gate | #11 |

**Tests:** `e2e/signal-intelligence.spec.ts` — 11 tests / ~70 assertions, passing headless + headed (browser-led).

---

## 4. Full product surface retained green (regression)

The signal work is additive; the entire pre-existing product surface still passes:

| Spec file | Tests | Covers |
|---|---|---|
| `customer-journey.spec.ts` | 8 | full onboarding journey (M1–M8) |
| `restaurant-list.spec.ts` | 36+ | list/search/sort/filter/pagination/CRUD |
| `restaurant-detail.spec.ts` | 25+ | scorecard hub, factor detail, connectors |
| `intelligence*.spec.ts` | ~27 | intelligence pages |
| `auth-public.spec.ts` | 29 | auth + public flow |
| `misc-pages.spec.ts` | 27 | settings/help/misc |
| `visual-qa + visual-regression` | ~42 | page rendering |
| **`signal-intelligence.spec.ts`** | **11 (NEW)** | **all signal drill-down use cases** |

**Reliability fix:** all e2e `signUp` helpers now use unique per-file organization names, eliminating the parallel-worker `Test Org`/slug-collision flake that caused non-deterministic failures.

---

## 5. Security — findings & remediations (Phase F) — GATE PASS

| Scanner | Result | Action |
|---|---|---|
| `gitleaks` (secrets) | **PASS** — no secrets | none |
| `pip-audit` (Python) | **PASS** | none (no Python manifests; host clean) |
| `npm audit` (Node) | **PASS** — 0 vulns (frontend, backend, root) | upgraded `next` 16.2→16.3.5, `nanoid`→3.3.19, `sharp`/`postcss`, backend deps, root `shell-quote` |
| `semgrep` (SAST) | **PASS** — 0 ERROR | Dockerfiles hardened (non-root `USER appuser`/`appuser`); 1 `rt1.routes.ts` ERROR = **confirmed false positive** (no `wkhtmlto*`/`phantom` anywhere — only `summary.generate(id)`), suppressed with `// nosemgrep` + rationale |
| `trivy` (container) | SKIP | tool not installed (optional): `brew install trivy` |

## 6. Node dependency vulnerabilities (npm audit) — fixed, 0 remaining

Remediated:
- **next ≤16.3.2 → 16.3.5** — critical RCE (Image Optimization / AVIF)
- **nanoid <3.3.18 → 3.3.19** — high (loop)
- **sharp ≤0.35.4-rc.0 → >0.35.4** — high (libvips/libheif CVEs)
- **postcss ≤8.5.22** — high (XSS / source-map) — resolved transitively
- Backend deps — 1 high + 5 moderate → fixed
- Root `shell-quote ≤1.8.4` (via `concurrently`) → fixed

`npm audit` (frontend, backend, root) all report **found 0 vulnerabilities**.

## 6a. Container hardening (Dockerfiles)

Both `backend/Dockerfile` and `frontend/Dockerfile` now run as a **non-root user** (`appuser`/`uid 1001`) instead of root — semgrep `missing-user`/`missing-user-entrypoint` errors resolved.

---

## 7. How to run the verification gates

```bash
# Backend unit/headless tests
cd backend && npx tsc --noEmit && npx vitest run

# Frontend build + type
cd frontend && npx tsc --noEmit && npm run build

# E2E (headless) — auto-boots backend:8040 + frontend:3040
cd e2e && npx playwright test

# E2E (browser-led / headed)
cd e2e && npx playwright test --headed

# Security gate (gitleaks + npm audit + pip-audit + semgrep)
cd <repo> && ./scripts/prebuild-scan.sh --repo .

# Live smoke (wired signal layer)
GET /api/restaurants/:id/signals   (auth: admin@ristorante.app — password via ADMIN_PASSWORD env)
```

---

## 8. Definition of Done — status

| Spec §36 / design §40 item | Status |
|---|---|
| 5 categories · 25 factors preserved | ✅ |
| canonical signal registry (113 signals) | ✅ |
| normalized signals · provenance · confidence · freshness · pending semantics | ✅ |
| deterministic scoring; AI direct scoring = false | ✅ |
| missing-as-zero = false (pending/stale/NA never zero) | ✅ |
| factor_signals_exposed (API) | ✅ |
| signal drill-down · evidence drawer · confidence · coverage · responsive UI | ✅ |
| verified with real RTP restaurants (Biryani Maxx live /signals) | ✅ |
| synthetic customer data = 0 | ✅ |
| rist-ai-001 boundary preserved · frozen 25-factor model preserved | ✅ |
| backend tests 112/112 · E2E green · build green · security gate PASS | ✅ (see §4/§5) |
