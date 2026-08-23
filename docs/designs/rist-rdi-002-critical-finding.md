# RIST-RDI-002 — CRITICAL FINDING: Fresh-restaurant scorecard fabricates scores from DB defaults

## Empirical proof (temp-probe-fresh.ts, real runtime, cleaned up after)

A freshly created restaurant (empty, as intake creates it before evidence is absorbed) returns:

- **overall: 21 | live: 17 | pending: 8 | total: 25**
- 17 factors show NON-NULL scores derived purely from DB column defaults:
  - `gbpHealthScore` defaults to **70** → gbp_profile, avg_rating, review_volume, overall_trust all show 70
  - `discoverabilityScore`/`localSearchScore`/`aiVisibilityScore`/`menuDiscoverabilityScore`/`conversationalSearchScore`/`restaurantClarityScore` default to **0** → ~12 factors show 0 (critical)

## Why this violates the mission

- §4 Real-Data Policy: "manually adjusted scores / handcrafted scorecards / fabricated evidence" are FORBIDDEN.
- §5 Unknown/Missing Data: "missing rating → 0" and "missing website → arbitrary 50" are FORBIDDEN; must be `Pending Observation`.
- §43 single-restaurant gate requires `unsupported_pending: PASS` and `no_mock_data: PASS`.
- The intake path (`DiscoveryController.absorbPublicEvidence`) DOES collect real evidence, but a scorecard computed on a fresh/unobserved restaurant fabricates 17 scores from column defaults.

## Root cause

`ScorecardService.resolveSignalScore` (domain/scorecard/ScorecardService.ts) has a DB fallback that maps many signal ids directly to `r.<score column>` (e.g. `case 'gbp_profile': return { score: r.gbpHealthScore ... }`, `case 'website_health': return { score: r.aiVisibilityScore ... }`). For a fresh row these columns are at their Prisma defaults (gbpHealthScore=70, others=0), so the scorecard reports fabricated scores.

## Required fix (pending-state / real-data honesty fix — within GO scope)

Make the DB fallback honest: a score-column-derived signal should return `null` (Pending Observation) unless the restaurant actually has real underlying evidence for that signal. A skeleton restaurant with zero real observations must show ALL factors Pending.

Design principle: only surface a score when it is backed by a real public observation (address/phone/website/cuisine entered, menu items, review analyses, faqs, evidence records, connector data, or a genuinely populated score column from real analysis). A bare row with no evidence → all 25 factors pending.

This does NOT change the 25-factor structure, the 5 categories, the weights, or the scoring formulas — it only stops fabricating scores from unpopulated DB columns. It is exactly the "missing data must not silently become score" rule the mission mandates.

## Next

- Implement the honesty fix (pending-state fix / real-data compatibility fix).
- Re-run fresh probe → expect pending: 25, live: 0.
- Then run The Mill Raleigh real intake end-to-end.
- Then check DDG connectivity for real discovery.
