# Design: Intelligence Consumption Platform — 10-Priority Roadmap

> **Status:** Approved direction (Santosh, Aug 2026)
> **Principle:** Every new capability must make one of the existing 25 scorecard factors more accurate, more explainable, or more actionable. Do not add factors — deepen them.
> **Architecture:** Build platform capabilities (one implementation, many consumers), not pages.

---

## 1. The Core Shift

We have crossed from **"we have intelligence"** to **"customers can consume intelligence."**

The scoring engine is a **capability**, not a page. One implementation, many consumers:

```
Scoring (one implementation)
  ├── Restaurant Dashboard (details page)
  ├── Restaurant List (executive portfolio view)
  ├── Reports
  ├── Audit
  ├── Admin
  ├── PDF
  ├── Email
  └── API
```

Every consumer reads the same data contract. Building a new consumer never requires re-implementing scoring.

---

## 2. Data Foundation (prerequisite for #1, #2, #3)

Before any UI, three platform capabilities must exist. They are the substrate for the first three priorities.

### 2.1 Scorecard Snapshot History
- **Model:** `ScorecardSnapshot` — `{ id, restaurantId, overallScore, categoryScores (JSON), factorScores (JSON), capturedAt }`
- **Capture:** on every scorecard read (or a scheduled sweep), persist a snapshot.
- **Purpose:** enables 7/30/90-day/since-onboarding trends (#2), "last scan" (#1), and improvement tracking.
- **Consumer contract:** `GET /api/restaurants/:id/scorecard/history?range=7d|30d|90d|all`

### 2.2 Benchmark Service
- **Model:** `Benchmark` — per factor, per dimension: `{ factorId, dimension: city|cuisine|price|competitors, value, p50, p75, p90, count }`
- **Computation:** aggregate over all restaurants in the same city / cuisine / price band; competitor set from `CompetitiveSet`.
- **Purpose:** every factor answers "Compared to…" (#3).
- **Consumer contract:** `GET /api/restaurants/:id/benchmarks?dimension=city|cuisine|price|competitors`

### 2.3 Portfolio Aggregation Endpoint
- **Model:** none new — reads `Restaurant` + `ScorecardSnapshot` + `Benchmark`.
- **Purpose:** one API returns all restaurants' overall score, 5 category scores, top issue, trend, last scan, critical alerts, pending actions (#1).
- **Consumer contract:** `GET /api/portfolio` — used by the executive list view and the heat map (#9).

---

## 3. The 10 Priorities

### #1 — Restaurant List as Executive Portfolio View ⭐⭐⭐⭐⭐
- **What:** the list page becomes a portfolio dashboard. Each row/card shows: overall score, 5 category mini-scores, top issue, trend, last scan, critical alerts, pending actions.
- **Consumes:** Portfolio Aggregation (#2.3) + Snapshot History (#2.1).
- **Files:** `frontend/app/dashboard/restaurants/page.tsx` (rebuild), new `PortfolioCard` component.

### #2 — Historical Trends ⭐⭐⭐⭐⭐
- **What:** every score has 7/30/90-day/since-onboarding trend. Sparklines on the portfolio view; full trend chart on the details page.
- **Consumes:** Snapshot History (#2.1).
- **Files:** new `TrendChart` component; extend `ScorecardComponents`; details page trend section.

### #3 — Benchmarking ⭐⭐⭐⭐⭐
- **What:** every factor shows "Compared to city / cuisine / price / top competitors" with percentile.
- **Consumes:** Benchmark Service (#2.2).
- **Files:** extend `ExpandableFactorCard` with a benchmark line; new `BenchmarkBar` component.

### #4 — Evidence Timeline ⭐⭐⭐⭐☆
- **What:** static evidence becomes a chronological timeline ("Yesterday: GBP categories changed", "3 days ago: 12 new reviews").
- **Consumes:** `EvidenceRecord`/`EvidenceTimeline` models (already in schema) + Snapshot History.
- **Files:** new `EvidenceTimeline` component; details page section.

### #5 — Impact Simulation ⭐⭐⭐⭐☆
- **What:** "If you improve this factor: Current 72 → Estimated 84, Expected gain +12." Makes recommendations tangible.
- **Consumes:** factor `expectedImprovement` + benchmark deltas.
- **Files:** extend `ExpandableFactorCard` with a simulation panel; new `ImpactSimulator` component.

### #6 — Executive PDF ⭐⭐⭐⭐☆
- **What:** PDF mirrors the Restaurant Details page exactly — not a separate design.
- **Consumes:** the same scorecard data contract as the details page.
- **Files:** `backend/src/services/audit-pdf.service.ts` (reuse/extend), `GET /api/audit/:id/pdf`.

### #7 — Weekly Intelligence ⭐⭐⭐⭐☆
- **What:** email/report answers: What changed? Why? What should I do?
- **Consumes:** Snapshot History (deltas) + Evidence Timeline + recommendations.
- **Files:** `backend/src/application/notifications/NotificationService.ts` (extend), new weekly digest template.

### #8 — Cross-Factor Relationships ⭐⭐⭐⭐☆
- **What:** cause-and-effect chains ("Poor Menu → Poor Website → Poor Search Visibility → Lower Discovery").
- **Consumes:** factor definitions + a relationship map (static or learned).
- **Files:** new `FactorRelationship` model or static map; `RelationshipEngine` (exists) extended.

### #9 — Portfolio Heat Map ⭐⭐⭐⭐☆
- **What:** 30-restaurant owner sees a color-coded grid of scores (Restaurant A 86, B 74, C 63, D 91).
- **Consumes:** Portfolio Aggregation (#2.3).
- **Files:** new `PortfolioHeatMap` component; admin/portfolio page.

### #10 — Decision Completion Lifecycle ⭐⭐⭐⭐⭐
- **What:** every factor progresses Detected → Accepted → Working → Completed → Verified → Improved. Closes the loop between intelligence and outcomes.
- **Consumes:** `Decision`/`Outcome` models (exist) + factor status.
- **Files:** extend `DecisionService`/`OutcomeService`; new lifecycle UI on details page.

---

## 4. Build Order & Dependencies

```
Phase A (foundation):  #2.1 Snapshot History → #2.2 Benchmark → #2.3 Portfolio API
Phase B (executive):   #1 Portfolio View → #9 Heat Map
Phase C (explain):     #2 Trends → #3 Benchmarking → #4 Evidence Timeline
Phase D (action):      #5 Impact Simulation → #8 Cross-Factor → #10 Decision Lifecycle
Phase E (deliver):     #6 Executive PDF → #7 Weekly Intelligence
```

Each phase is independently shippable and each strengthens the 25-factor model.

---

## 5. Platform Capability Map

| Capability | Consumers |
|-----------|-----------|
| Scoring | Dashboard, List, Reports, Audit, Admin, PDF, Email, API |
| Snapshot History | List, Details, Reports, PDF, Email |
| Benchmarking | Details, List, Reports, PDF, Email |
| Portfolio Aggregation | List, Heat Map, Admin |
| Evidence Timeline | Details, Reports, PDF, Email |
| Impact Simulation | Details, PDF, Email |
| Decision Lifecycle | Details, Admin, Reports |

---

## 6. Guardrail

> **Every new capability must make one of the existing 25 factors more accurate, more explainable, or more actionable.**

If a feature doesn't strengthen the scorecard or the decision-making experience, it is not the highest priority for the MSP.

---

## 7. Files to Create/Modify (Phase A first)

### Backend
- `backend/prisma/schema.prisma` — add `ScorecardSnapshot`, `Benchmark` models
- `backend/src/domain/scorecard/ScorecardSnapshotService.ts` — capture + query history
- `backend/src/domain/scorecard/BenchmarkService.ts` — aggregate benchmarks
- `backend/src/application/portfolio/PortfolioService.ts` — portfolio aggregation
- `backend/src/interfaces/routes/scorecard.routes.ts` — add history + benchmarks endpoints
- `backend/src/interfaces/routes/portfolio.routes.ts` — new portfolio endpoint

### Frontend
- `frontend/components/scorecard/PortfolioCard.tsx` — executive list card
- `frontend/components/scorecard/TrendChart.tsx` — sparkline/trend
- `frontend/components/scorecard/BenchmarkBar.tsx` — "compared to" bar
- `frontend/app/dashboard/restaurants/page.tsx` — rebuild as portfolio view
- `frontend/app/dashboard/restaurants/[id]/page.tsx` — add trends + benchmarks + timeline

---

## 8. Verification

Each phase ends with:
- Backend `tsc --noEmit` clean
- Backend vitest suite green
- Frontend `next build` clean
- `hermes verify --json` ok
- Live API validated against a seeded restaurant
