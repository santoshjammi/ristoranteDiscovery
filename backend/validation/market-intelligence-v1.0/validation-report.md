# Market Intelligence v1.0 — Validation Report

> **Canonical Baseline — 2026-07-31**

---

## Summary

| Metric | Result | Target | Status |
|--------|--------|--------|--------|
| Restaurants analyzed | 21 | ≥ 20 | ✅ |
| Areas identified | 4 (Raleigh, Morrisville, Cary, Chapel Hill) | — | ✅ |
| Total insights generated | 87 | — | ✅ |
| Total trends generated | 15 | — | ✅ |
| False positive rate | 0.0% | < 5% | ✅ |
| False negative rate | 0.0% | < 5% | ✅ |
| Rule coverage | 100% | 100% | ✅ |
| Stable across two runs | ✅ | ✅ | ✅ |

## Baseline Metrics

| Metric | Value |
|--------|-------|
| Rules | 10 |
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
| gap | 73 |
| saturation | 6 |
| benchmark | 8 |

## Area Summary

| Area | Restaurants | Dominant Cuisine | Dominant Price |
|------|-------------|-----------------|----------------|
| Raleigh | 12 | indian (25%) | $$ |
| Morrisville | 4 | indian (75%) | $$ |
| Cary | 2 | indian (50%) | $$ |
| Chapel Hill | 3 | seafood (33%) | $$$ |

## Rules Exercised

1. city-clustering — Group restaurants by city
2. cuisine-distribution — Count per cuisine family per area
3. price-distribution — Count per price tier per area
4. score-benchmarks — Average scorecard dimensions per area
5. saturation-detection — Cuisine ≥ 30% of area restaurants
6. gap-identification — Cuisines with 0 restaurants in an area
7. benchmark-comparison — Area score vs overall average (≥ 10 point diff)
8. review-activity — Review volume and average rating per cuisine per area
9. sentiment-trend — Improving/declining/stable based on rating thresholds
10. deterministic-output — Same input → same output

## Freeze Criteria

| Criterion | Status |
|-----------|--------|
| All target metrics achieved | ✅ |
| 100% rule coverage | ✅ |
| Zero open regressions | ✅ |
| Stable across two consecutive runs | ✅ |

## Verdict

**✅ Market Intelligence v1.0 is frozen.**
