# RIST-RDI-002 — STEP 1-3 Current-State Discovery Map (audited against committed HEAD)

Repository: ristoranteDiscovery @ 86f26d7 (clean)
Frozen baselines: `rist-ai-001-frozen` (da81284), `msp-baseline` (98353c8)

## A. Existing real intake path (works)

- **UI:** `/dashboard/restaurants/new` — has both "Add Restaurant" (manual create) and "Intake & Audit" (real intake). Form collects name, address, city, state, postal, phone, website, googleShareUrl, menuUrl, cuisine, regionalCuisine, priceRange.
- **API:** `POST /api/discovery/intake` (DiscoveryController.intake) — resolves identity (normalize name/address/city/website, dedupe), creates restaurant if unresolved, absorbs public evidence via **real DDG search + live page fetches**, runs frozen 25-factor scorecard (`getScorecard`), audit, snapshot.
- **Mounted:** discovery.routes under `/api/discovery` (via api.routes.ts `router.use('/discovery', discoveryRoutes)`).

## B. Real public discovery (WORKS, real data)

`DiscoveryController.absorbPublicEvidence` / `discoverPublicSourceUrls`:
- Queries `https://html.duckduckgo.com/html/?q=...` (live, real), parses result links, filters noise, fetches each candidate page (live `fetch`), extracts title + menu hint, persists to `EvidenceObservation` + `EvidenceRecord` with `sourceUrl`, `sourceType`, `observedAt`, `confidence`, `provenance` (discoveredBy/query/rank).
- Seed URLs (googleShareUrl, website, menuUrl) also absorbed.
- If no sources → returns `pending_observation` status honestly.

## C. Synthetic connectors (DO NOT feed intake path — but must be flagged)

- `src/services/connectors/{gbp,zomato,swiggy,tripadvisor,justdial}.service.ts` generate **fabricated** data (fake reviews/ratings/counts/scorecard factors).
- Reached only via manual `POST /api/connectors/:type/sync` / `POST /api/connectors/connect`.
- **Verified:** intake (`discovery.controller.ts`), `application/discovery/*`, `domain/scorecard/*` do **NOT** import or call these legacy connectors. They do not auto-contaminate the real intake path.
- Risk: they CAN be triggered manually and write `connectorScorecardData` → scorecard. Must be excluded/flagged so they never contaminate the RTP showcase.

## D. Frozen 25-factor scorecard

- `ScorecardService.getScorecard` — 25 factors, 5 categories, `Pending Observation` semantics, DB-fallback per signal.
- **CONCERN (to verify empirically):** `resolveSignalScore` DB fallback returns `r.<column>` for many signals; a fresh restaurant row has defaults (gbpHealthScore=70, discoverabilityScore=0, aiVisibilityScore=0, localSearchScore=0, menuDiscoverabilityScore=0, conversationalSearchScore=0, restaurantClarityScore=0). So a fresh real restaurant may score **0/70 from DB defaults** instead of Pending — violating the mission rule. MUST TEST.

## D. Connector reality matrix (legacy)

| source | implemented | real_data_verified | auth | paid | provenance | factors | status |
|--------|-------------|--------------------|------|------|-----------|---------|--------|
| Google/GBP | synthetic only | NO | none | no | none | some | FABRICATED |
| Zomato | synthetic only | NO | none | no | none | some | FABRICATED |
| Swiggy | synthetic only | NO | none | no | none | some | FABRICATED |
| JustDial | synthetic only | NO | none | no | none | some | FABRICATED |
| TripAdvisor | synthetic only | NO | none | no | none | some | FABRICATED |
| DuckDuckGo live search | YES (real) | YES | none | no | YES | website/menu/reviews/listings | REAL |

## E. DB contamination (329 restaurants)

- 329 restaurant rows, mostly test fixtures ("Breadcrumb Test", "Page Test N", "Pending Test", etc.) in Mumbai — synthetic test data from E2E. evidenceObservation=2, connectorScorecardData=0.
- Must NOT appear in the RTP showcase (contamination gate).

## F. Portfolio/benchmark/heatmap

- `portfolio.routes.ts` → `getPortfolio` (real, reads scorecards + snapshots + trends), `getPrioritizedPortfolio`.
- Benchmark engine reads real cohort (deterministic). Heat map reads portfolio.

## Key open risk for this mission
A fresh real restaurant may show **default-0/default-70 DB-fallback scores** in the scorecard instead of Pending Observation, which would violate the real-data policy. Must test with an actual fresh restaurant before the Millbrook acceptance run.
