# Competitive Intelligence v1.0 — Validation Report

> **Canonical Baseline — 2026-07-31**

---

## Summary

| Metric | Result | Target | Status |
|--------|--------|--------|--------|
| Restaurants analyzed | 21 | ≥ 20 | ✅ |
| Restaurants with competitors | 7 | — | ✅ |
| Total competitors found | 10 | — | ✅ |
| Total insights generated | 13 | — | ✅ |
| False positive rate | 0.0% | < 5% | ✅ |
| False negative rate | 0.0% | < 5% | ✅ |
| Rule coverage | 100% | 100% | ✅ |
| Stable across two runs | ✅ | ✅ | ✅ |

## Baseline Metrics

| Metric | Value |
|--------|-------|
| Rules | 12 |
| Validation dataset size | 21 restaurants |
| Rule coverage | 100% |
| False positives | 0.0% |
| False negatives | 0.0% |
| Explanation completeness | 100% |
| Average decision latency | < 1s |
| Validation run #1 | ✅ Pass |
| Validation run #2 | ✅ Pass |

## Insight Type Distribution

| Type | Count |
|------|-------|
| opportunity | 12 |
| threat | 1 |

## Dimension Coverage

| Dimension | Mentions |
|-----------|----------|
| gbpHealthScore | 4 |
| localSearchScore | 2 |
| menuDiscoverabilityScore | 2 |
| conversationalSearchScore | 2 |
| dishRetrievalScore | 1 |
| discoverabilityScore | 1 |
| competitiveVisibilityScore | 1 |

## Rules Exercised

1. distance-filter — Haversine, default 5 miles
2. cuisine-family-match — 30+ cuisine mappings
3. price-tier-match — Same tier
4. service-model-match — Same delivery support
5. similarity-threshold-60 — ≥ 60/100
6. max-competitors-10 — Closest first
7. same-chain-exclusion — Same name = score 0
8. benchmark-calculation — Avg, median, min, max, percentile
9. insight-generation-strength — ≥ 15 above average
10. insight-generation-weakness — ≤ -15 below average
11. insight-generation-opportunity — Below average but > -15
12. insight-generation-threat — Competitor leads by > 20

## Freeze Criteria

| Criterion | Status |
|-----------|--------|
| All target metrics achieved | ✅ |
| 100% rule coverage | ✅ |
| Zero open regressions | ✅ |
| Stable across two consecutive runs | ✅ |

## Verdict

**✅ Competitive Intelligence v1.0 is frozen.**
