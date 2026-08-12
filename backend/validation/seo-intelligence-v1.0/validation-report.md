# SEO Intelligence v1.0 — Validation Report

> **Canonical Baseline — 2026-07-31**

---

## Summary

| Metric | Result | Target | Status |
|--------|--------|--------|--------|
| Restaurants audited | 21 | ≥ 20 | ✅ |
| Average schema coverage | 100% | 100% | ✅ |
| Average schema completeness | 97% | ≥ 80% | ✅ |
| Total issues | 28 (all medium) | — | ✅ |
| Critical issues | 0 | 0 | ✅ |
| High issues | 0 | 0 | ✅ |
| Rule coverage | 100% | 100% | ✅ |
| Stable across two runs | ✅ | ✅ | ✅ |

## Baseline Metrics

| Metric | Value |
|--------|-------|
| Rules | 12 |
| Validation dataset size | 21 restaurants |
| Schema coverage | 100% (4/4 types per restaurant) |
| Schema completeness | 97% (medium issues only: missing telephone/url) |
| Critical issues | 0 |
| High issues | 0 |
| False positives | 0 |
| False negatives | 0 |
| Average decision latency | < 1s |
| Validation run #1 | ✅ Pass |
| Validation run #2 | ✅ Pass |

## Rules Exercised

1. required-field-check — @context, @type, name, address
2. recommended-field-check — telephone, servesCuisine, priceRange, geo, url
3. @context-validation — Must be https://schema.org
4. @type-validation — Must be present (skipped for Combined/@graph)
5. @graph-validation — Combined schema must have non-empty @graph
6. coverage-score-calculation — Required + recommended fields present
7. completeness-calculation — Average of all schema coverage scores
8. schema-type-coverage — 4 types: Restaurant, Menu, FAQ, Combined
9. issue-severity-classification — critical, high, medium, low
10. deterministic-output — Same input → same output
11. no-ai-dependency — Engine uses rules, not LLM
12. event-versioning — SchemaGenerated, SchemaAuditCompleted

## Freeze Criteria

| Criterion | Status |
|-----------|--------|
| All target metrics achieved | ✅ |
| 100% rule coverage | ✅ |
| Zero open regressions | ✅ |
| Stable across two consecutive runs | ✅ |

## Verdict

**✅ SEO Intelligence v1.0 is frozen.**
