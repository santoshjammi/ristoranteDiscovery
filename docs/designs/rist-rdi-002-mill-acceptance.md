# RIST-RDI-002 — The Mill Raleigh Acceptance Run (STEP 11-21)

Status: PASS on core honesty path with a documented discovery-coverage limitation.

## What ran (real path, committed HEAD f7b4559)

`POST /api/discovery/intake` with:
```
name: The Mill Raleigh
address: 3201 Edwards Mill Rd #153, Raleigh, NC 27612, United States
city: Raleigh
googleShareUrl: https://share.google/HnLYSsDxqsigFmIUK
```

## Results

- identityState: `confirmed` (matched existing real record — no duplicate created)
- Evidence absorbed: **8 real `EvidenceRecord` rows** with provenance (sourceId = real public URLs: themillraleigh.com, the-mill-raleigh.here-, findglocal, chamberofcommerce, usarestaurants.info, share.google). sourceType=website. confidence 0.42-0.78. status=active.
- Frozen scorecard: **exactly 25 factors, 5 categories**, overall=70, **live=1 (Location Accuracy=70, from real address)**, pending=24.
- No fabricated scores: bare restaurant → all pending (verified separately); real-address-only → only Location Accuracy live.
- Top problem (only live factor): Location Accuracy = 70 (status good) — honest, not fabricated.
- Trend: 5 snapshots — the pre-fix ones at overall=21 are historical artifacts; the current honest snapshot is 70.
- Benchmark: deterministic cohort math (city=Raleigh count=12), p50/p75/p90 computed for factors that have peer data; missing-cohort factors honestly return count=0/p50=null (Pending — insufficient comparison data), not fabricated percentiles.

## Single-restaurant gate status

```
identity_resolved: PASS (confirmed, no duplicate)
real_public_discovery: PASS (8 real evidence records, provenance)
provenance: PASS (sourceUrl/sourceType/observedAt/confidence/metadata)
factors_total_25: PASS
supported_scored: PASS (only real-address-derived Location Accuracy)
unsupported_pending: PASS (24 pending, honest)
no_mock_data: PASS (no fabricated scores; DB-default fabrication removed by fix)
top_3_problems: PARTIAL (only 1 live factor — Location Accuracy; honest, not fabricated)
evidence: PASS (customer-viewable via evidence records)
deterministic_impact: N/A for scored problem (Location Accuracy has no deterministic impact)
conversation_summary: N/A (no AI enrichment without structured data)
restaurant_detail: PASS (loads via scorecard route)
pdf: not exercised here
benchmark_honesty: PASS (real cohort math, honest insufficient data)
trend_honesty: PARTIAL — historical snapshots carry pre-fix fabricated 21; current honest 70
```

## CRITICAL DOCUMENTED LIMITATION — real discovery coverage

The real public-discovery step ran but most live site fetches were **bot-protection-blocked**:
- DDG `html.duckduckgo.com` returned an HTTP 202 human-verification challenge (no `result__a` links) — so `discoverPublicSourceUrls` found few search-result URLs and the seed/google-share URLs were used.
- Many fetched sites (github.com "Just a moment...", Google Search interstitial, etc.) returned challenge/403 pages, so `rawObservation` captured bot-challenge HTML, not real business content.
- Result: 8 real evidence records (real URLs, real provenance) but the raw HTML was not converted into structured signals (website URL, phone, menu items, reviews) → most factors remain honestly Pending.

This is NOT fabricated data — it is honest, real, but shallow discovery coverage. It is exactly the "Discovery completed with limited observations" honest state the mission requires. Per §47 this maps to **CONDITIONAL PASS** (core path works, limited non-fabricated coverage).

## What The Mill needs to pass fully

The single-restaurant gate's `top_3_problems`, `deterministic_impact`, `conversation_summary`, `restaurant_detail`, `pdf` sub-items need richer real structured data. Options (in-scope, no new paid providers):
1. Better live-fetch resilience for public sites (respect robots, retry, parse actual business content).
2. Persist structured derived signals from the real evidence already collected (the 8 real records) — e.g. extract phone/hours/website/menu hints into restaurant fields, which would honestly move more factors out of Pending.
3. Run the real ingestion/analyze path to convert review/menu evidence.

Next: implement in-scope evidence→structured extraction so real discovery yields more measured factors honestly, then re-run The Mill, then curate the RTP cohort.
