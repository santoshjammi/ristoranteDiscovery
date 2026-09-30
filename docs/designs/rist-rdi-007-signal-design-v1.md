# RistoranteDiscovery — Discovery Signal Implementation Design v1.0

## Status

**IMPLEMENTATION DESIGN**

Scope: **RistoranteDiscovery only**

This document defines how the frozen 25-factor Restaurant Discovery Intelligence model should be implemented using observable sub-signals.

The existing 25 factors remain unchanged.

The purpose of this design is to deepen the intelligence underneath those factors without expanding customer-facing complexity.

---

# 1. Target Architecture

```text
PUBLIC SOURCES
   │
   ├── Google / Maps
   ├── Website
   ├── Menu
   ├── Reviews
   ├── Delivery
   ├── Reservations
   ├── Citations
   ├── Local Search
   └── Other approved public sources
            │
            ▼
┌──────────────────────────────┐
│       RAW OBSERVATIONS       │
│ source + value + timestamp   │
│ provenance + confidence      │
└───────────────┬──────────────┘
                │
                ▼
┌──────────────────────────────┐
│       SIGNAL NORMALIZER      │
│                              │
│ evidence → discovery signal  │
└───────────────┬──────────────┘
                │
                ▼
┌──────────────────────────────┐
│       SIGNAL REGISTRY        │
│                              │
│ ~140 canonical sub-signals   │
│ mapped to 25 factors         │
└───────────────┬──────────────┘
                │
                ▼
┌──────────────────────────────┐
│       FACTOR SCORING         │
│                              │
│ deterministic                │
│ measured signals only        │
└───────────────┬──────────────┘
                │
                ▼
┌──────────────────────────────┐
│      25 FACTOR SCORES        │
└───────────────┬──────────────┘
                │
                ▼
┌──────────────────────────────┐
│       5 CATEGORY SCORES      │
└───────────────┬──────────────┘
                │
                ▼
┌──────────────────────────────┐
│ RESTAURANT DISCOVERY SCORE   │
└──────────────────────────────┘
```

AI sits beside this pipeline.

AI may:

* extract
* interpret
* classify
* summarize
* explain

AI must not directly own factor arithmetic.

---

# 2. Core Domain Objects

## Observation

Represents something actually observed from a public source.

```typescript
interface Observation {
  id: string;

  restaurantId: string;

  sourceType:
    | "google"
    | "website"
    | "menu"
    | "review"
    | "delivery"
    | "reservation"
    | "citation"
    | "local_search"
    | "ai_visibility"
    | "other";

  sourceUrl?: string;

  observedAt: Date;

  rawValue: unknown;

  normalizedValue?: unknown;

  confidence: number;

  freshnessStatus:
    | "fresh"
    | "aging"
    | "stale";

  provenance: {
    sourceName: string;
    retrievalMethod: string;
    evidenceRef?: string;
  };
}
```

Observation is evidence.

It is not a score.

---

# 3. Discovery Signal

A Discovery Signal is a normalized interpretation of one or more observations.

Example:

```text
Observation:

Google listing shows:
Rating = 4.7
Reviews = 428

↓

Signals:

google_average_rating = 4.7
google_review_volume = 428
```

Recommended model:

```typescript
interface DiscoverySignal {
  id: string;

  restaurantId: string;

  factorId: DiscoveryFactorId;

  signalKey: string;

  label: string;

  description: string;

  status:
    | "measured"
    | "partial"
    | "pending_observation"
    | "not_applicable"
    | "stale";

  rawValue?: unknown;

  normalizedValue?: number;

  normalizedScale?: {
    min: number;
    max: number;
  };

  scoreContribution?: number;

  weight: number;

  confidence: number;

  observedAt?: Date;

  evidenceRefs: string[];

  methodologyVersion: string;
}
```

---

# 4. Signal Registry

Create one canonical registry.

Do not scatter signal definitions throughout services.

Recommended location:

```text
backend/src/domain/discovery-intelligence/
    signal-registry.ts
```

Conceptually:

```typescript
export const DISCOVERY_SIGNAL_REGISTRY = {
  google_business_profile: {
    category: "discoverability",

    signals: [
      {
        key: "gbp_exists",
        label: "Google Business Profile Exists",
        weight: 1,
      },

      {
        key: "gbp_primary_category",
        label: "Primary Category Accuracy",
        weight: 1,
      },

      {
        key: "gbp_secondary_categories",
        label: "Secondary Category Coverage",
        weight: 0.5,
      },

      {
        key: "gbp_hours_complete",
        label: "Opening Hours Complete",
        weight: 1,
      },

      // ...
    ],
  },

  review_volume_freshness: {
    category: "reputation",

    signals: [
      {
        key: "review_total",
        label: "Review Volume",
        weight: 1,
      },

      {
        key: "reviews_last_30_days",
        label: "Reviews in Last 30 Days",
        weight: 1,
      },

      {
        key: "review_velocity",
        label: "Review Velocity",
        weight: 1,
      },

      // ...
    ],
  },
};
```

The registry is the authoritative mapping:

```text
Signal → Factor → Category
```

---

# 5. Signal Definition Contract

Each signal definition should include:

```typescript
interface SignalDefinition {
  key: string;

  factorId: DiscoveryFactorId;

  label: string;

  description: string;

  sourceTypes: string[];

  weight: number;

  scoringMethod:
    | "boolean"
    | "threshold"
    | "range"
    | "benchmark"
    | "categorical"
    | "ratio"
    | "custom";

  freshnessPolicy: string;

  minimumConfidence: number;

  requiredEvidence: boolean;

  methodologyVersion: string;
}
```

This makes the methodology inspectable and testable.

---

# 6. Signal Normalization

Do not let every service invent scoring rules.

Create deterministic normalization functions.

Examples:

## Boolean

```text
Website exists

true  → 100
false → 0
unknown → Pending
```

## Percentage

```text
Review response rate

92% → signal score 92
```

## Threshold

Example:

```text
Latest review age

0–7 days      → 100
8–30 days     → 85
31–60 days    → 65
61–90 days    → 45
90+ days      → 20
No evidence   → Pending
```

Exact thresholds must be separately defined and versioned.

Do not invent them inside controllers.

---

# 7. Benchmark-Based Signals

Some signals should be relative.

Example:

```text
Review Volume
```

Absolute review count is less meaningful across markets.

Use:

```text
Restaurant review count
        vs
Valid real peer cohort
```

Example:

```text
Restaurant: 428

Peer Median: 310

P75: 520

P90: 900
```

Possible normalized score:

```text
restaurant / cohort distribution
```

Benchmark calculations remain deterministic.

If valid peers are insufficient:

```text
Pending — insufficient real comparison cohort
```

---

# 8. Factor Calculation

Every factor receives:

```text
N possible signals
```

but only measured signals contribute.

Conceptually:

```text
Factor Score =
Σ(signalScore × signalWeight × confidenceModifier)
--------------------------------------------------
Σ(activeSignalWeight × confidenceModifier)
```

Important:

Pending signals do not contribute zero.

They are excluded from the denominator.

Example:

```text
Factor contains 10 signals

Measured: 6
Pending: 4

Calculate score using the six observed signals.

Report:

Score             74
Confidence         71%
Coverage           6 / 10
Pending            4
```

---

# 9. Factor Confidence

Score and confidence are separate.

Confidence may consider:

```text
Signal coverage
+
Source reliability
+
Observation freshness
+
Identity certainty
+
Interpretation certainty
```

Conceptually:

```text
Factor Confidence

= coverage confidence
× evidence confidence
× freshness confidence
```

Do not make a low-evidence 82 look equivalent to a high-evidence 82.

---

# 10. Coverage Metric

Each factor should expose:

```yaml
coverage:
  totalSignals: 15
  measured: 11
  partial: 1
  pending: 3
```

Customer UI may simplify this to:

```text
Evidence Coverage
12 / 15
```

---

# 11. Category Calculation

Do not change the frozen category-scoring contract unless separately approved.

Conceptually:

```text
Category
  ↓
5 Factor Scores
  ↓
Existing deterministic aggregation
```

The signal model deepens factor quality.

It does not redefine category architecture.

---

# 12. Overall Score

Likewise:

```text
5 Category Scores
        ↓
Existing Restaurant Discovery Intelligence calculation
```

No AI involvement.

---

# 13. Recommended Persistence Model

Avoid storing hundreds of duplicated derived rows unnecessarily.

Recommended conceptual model:

```text
Restaurant
    │
    ├── Observations
    │
    ├── DiscoverySignalObservation
    │
    ├── FactorSnapshot
    │
    └── ScorecardSnapshot
```

Possible structure:

```typescript
DiscoverySignalObservation {
  id

  restaurantId
  signalKey

  status

  rawValue
  normalizedValue

  confidence

  observedAt

  methodologyVersion

  evidenceRefs
}
```

Do not persist static signal definitions per restaurant.

Definitions live in the registry.

Only observations/results belong in persistence.

---

# 14. Observation → Signal Processor

Introduce one pipeline:

```text
observations
    ↓
SignalProcessor
    ↓
signals
```

Conceptually:

```typescript
signalProcessor.process({
  restaurant,
  observations,
  signalDefinitions,
});
```

Output:

```typescript
DiscoverySignalResult[]
```

---

# 15. Factor Engine

Then:

```text
signals
   ↓
FactorEngine
   ↓
25 FactorResults
```

Conceptually:

```typescript
factorEngine.calculate({
  factorId,
  signals,
});
```

Output:

```typescript
interface FactorResult {
  factorId: string;

  score: number | null;

  status:
    | "excellent"
    | "good"
    | "fair"
    | "needs_attention"
    | "critical"
    | "pending_observation";

  confidence: number;

  coverage: {
    measured: number;
    total: number;
  };

  signals: DiscoverySignalResult[];

  evidenceCount: number;

  lastObservedAt?: Date;
}
```

---

# 16. Complete Backend Flow

```text
Restaurant
    ↓
Connectors / Public Discovery
    ↓
Observations
    ↓
Evidence Store
    ↓
Signal Processor
    ↓
~140 Discovery Signals
    ↓
Factor Engine
    ↓
25 Factor Results
    ↓
Category Engine
    ↓
5 Categories
    ↓
Overall Score
    ↓
Restaurant Details API
```

---

# 17. AI Integration

AI must enter only where semantic interpretation is valuable.

Example:

```text
Real review
   ↓
AI Review Interpretation
   ↓
validated structured result
   ↓
review_service_sentiment signal
```

Another example:

```text
Menu HTML / PDF
   ↓
AI Menu Extraction
   ↓
validated menu structure
   ↓
menu_description_quality signal
```

But:

```text
AI
 ↓
Factor score
```

is prohibited.

---

# 18. UI Information Architecture

Restaurant Details page should retain its current high-level structure.

## Hero

```text
Restaurant Discovery Intelligence

74 / 100

18 of 25 factors measured
7 Pending Observation

Confidence 82%
Last observed 2h ago
```

---

# 19. Five Category Strip

Example:

```text
Discoverability    68
Reputation         91
Digital            62
Information        82
Market Position    67
```

Each remains clickable/filterable.

---

# 20. Factor Grid

Each factor card:

```text
┌───────────────────────────────┐
│ Local Search Visibility       │
│                               │
│ 61 / 100                      │
│ Needs Attention               │
│                               │
│ Evidence       9              │
│ Coverage       7 / 11         │
│ Confidence     88%            │
│ Updated        35m ago        │
│                               │
│ View signals ↓                │
└───────────────────────────────┘
```

---

# 21. Expanded Factor Design

Clicking the factor expands it.

Example:

```text
LOCAL SEARCH VISIBILITY                      61

How we calculated this
─────────────────────────────────────────────

✓ Brand search visibility                   100

✓ Google Maps presence                       90

⚠ Cuisine + Raleigh visibility               52

⚠ Local pack coverage                        47

⚠ Search-query coverage                      43

✓ Organic brand result                       100

○ Near-me visibility
  Pending Observation


WHY THIS SCORE

Your restaurant is easy to find when customers
already know the business name, but visibility
drops substantially for broader cuisine and
location-based discovery searches.


EVIDENCE

9 observations
Last observed 35 minutes ago


WHAT TO IMPROVE

Strengthen local relevance for cuisine and
location-based searches.
```

This should be the main customer-facing use of sub-signals.

---

# 22. Signal Row Component

Create a reusable component:

```text
SignalRow
```

Display:

```text
status icon

Signal Label

Observed Value

Signal Score

Confidence

Evidence
```

Example:

```text
✓ Average Rating       4.7       94       High

⚠ Review Velocity      11/mo     61       High

○ Yelp Rating          —         Pending
```

Do not display technical weights to normal customers.

Weights belong in methodology/developer surfaces.

---

# 23. Evidence Drawer

Clicking evidence should allow:

```text
Signal
   ↓
Evidence Drawer
```

Example:

```text
REVIEW VELOCITY

Observation

11 new Google reviews during the previous
30-day observation window.

Source

Google Business Profile

Observed

September 19, 2026

Confidence

98%

Methodology

Review velocity v1.0
```

This creates defensibility.

---

# 24. Customer Explanation Layer

The application should explain:

```text
WHAT

Local Search Visibility = 61

WHY

Broad discovery-query coverage is weak.

EVIDENCE

Real observed queries.

NEXT

Improve cuisine/location relevance.
```

AI may help word this explanation.

The numbers remain deterministic.

---

# 25. Partner / Advanced Methodology View

For partner demos or internal usage, optionally support a methodology drawer:

```text
Factor: Local Search Visibility

Signals considered     11
Signals measured         7
Evidence records         9

Methodology version     1.0
```

Do not expose internal provider implementation.

---

# 26. Visual Design Principles

Follow the existing Product Experience Constitution and modern 21st.dev-style principles.

Use:

* clean white/light surfaces
* clear hierarchy
* strong numerical typography
* subtle status indicators
* progressive disclosure
* restrained badges
* compact evidence indicators
* high information density without clutter

Avoid:

* giant dashboards full of charts
* radar charts for everything
* excessive gauges
* hundreds of visible scores
* excessive gradients
* decorative visual noise

---

# 27. Score Color

Use existing frozen score colors.

Conceptually:

```text
90–100       Excellent
80–89        Good
70–79        Fair
50–69        Needs Attention
<50          Critical
Pending      Neutral/Gray
```

Do not use color as the only status indicator.

---

# 28. Mobile Design

Mobile:

```text
Restaurant Score

↓

Category Strip / Horizontal Scroll

↓

Factor Cards

↓

Expandable Signals

↓

Evidence Drawer
```

Do not put 140 signals into a huge table on mobile.

Progressive disclosure is mandatory.

---

# 29. API Response Design

Restaurant scorecard API should eventually expose:

```json
{
  "overall": {
    "score": 74,
    "confidence": 0.82
  },

  "categories": [],

  "factors": [
    {
      "id": "review_volume_freshness",
      "score": 71,
      "confidence": 0.94,

      "coverage": {
        "measured": 7,
        "total": 10
      },

      "signals": [
        {
          "key": "review_total",
          "label": "Review Volume",
          "status": "measured",
          "value": 428,
          "score": 72,
          "confidence": 0.98,
          "evidenceCount": 2
        }
      ]
    }
  ]
}
```

Do not expose unnecessary raw source payloads directly to frontend.

---

# 30. Search

Support searching:

```text
review
menu
Google
reservation
mobile
delivery
```

Search should match:

* factor names
* signal names

Then surface relevant factor cards.

---

# 31. Sort

Factor sorting:

* lowest score
* highest score
* lowest confidence
* most evidence
* most pending signals
* category
* alphabetical

Default:

**lowest score / greatest attention first**

where UX permits.

---

# 32. Filter

Filter:

```text
Excellent
Good
Fair
Needs Attention
Critical
Pending Observation
```

Optional advanced filters:

```text
Low Confidence
Incomplete Coverage
Stale Evidence
```

Keep advanced filters secondary.

---

# 33. Top Problems

Top Problems remains factor-level.

Example:

```text
1. Local Search Visibility      52
2. Website Health              58
3. Review Response Rate        63
```

Expanded reason comes from signals.

---

# 34. Problem Explanation

Example:

```text
Local Search Visibility

WHY IT IS LOW

Cuisine + city visibility      42
Local pack presence            46
Query coverage                 49

STRONG SIGNALS

Brand visibility              100
Map identity                   95
```

This is highly persuasive because the customer can see both strengths and weaknesses.

---

# 35. Impact Simulation

Impact simulator remains factor-level.

Sub-signals identify what action might improve the factor.

Example:

```text
Current Local Search Visibility      52

If identified high-impact signals improve:

Estimated                           67

Potential Gain                     +15
```

Do not pretend changing one signal guarantees the entire projected gain.

Keep existing deterministic model.

---

# 36. History

History should support:

```text
Factor score history
```

and eventually:

```text
Signal history
```

but do not require signal-history UI for initial implementation.

Store repeated real observations appropriately for future use.

---

# 37. Implementation Phases

## Phase A — Registry

Create canonical signal registry.

Map approximately 140 signals → 25 factors.

No UI change required yet.

---

## Phase B — Existing Coverage Mapping

Map currently collected evidence into signals.

Do not implement new external connectors yet.

Measure what Ristorante already knows.

---

## Phase C — Signal Processor

Create normalized signal-generation pipeline.

---

## Phase D — Factor Integration

Move factor scoring to consume normalized signals while preserving existing score behavior where equivalent.

Any score change must be explained by removal of unsupported/fallback data or a separately approved methodology change.

---

## Phase E — API

Expose signal details under factor responses.

---

## Phase F — UI Drill-Down

Build:

* SignalRow
* EvidenceDrawer
* Coverage indicator
* Confidence indicator

Integrate with existing `ExpandableFactorCard`.

---

## Phase G — Real Restaurant Verification

Test against current verified-real RTP restaurants.

Ensure:

* no synthetic observations
* unsupported stays Pending
* real signal values visible
* score traceability works

---

# 38. Migration Safety

Do not suddenly change production scores across all restaurants without explanation.

Before activation compare:

```text
Old factor score
vs
New signal-derived factor score
```

For every factor.

Classify differences:

```text
EXPECTED
BUG
METHODOLOGY_CHANGE
INSUFFICIENT_EVIDENCE
```

If significant unexplained differences exist, stop activation and report.

---

# 39. Testing

Required tests:

## Registry

* every signal maps to exactly one factor
* every factor exists
* all 25 factors have signals
* duplicate signal keys rejected

## Normalization

* observed values normalize correctly
* missing remains pending
* malformed evidence rejected
* stale handling

## Factor

* measured signal aggregation
* pending exclusion
* confidence aggregation
* coverage calculation

## Provenance

* evidence reference exists
* signal without valid evidence cannot masquerade as measured

## AI

* validated interpretation may become signal
* hallucinated evidence rejected
* AI failure leaves signal pending rather than fabricated

## UI

* factor expands
* signal rows render
* pending signals render
* evidence opens
* confidence visible
* mobile works

---

# 40. Definition of Done

```yaml
discovery_signal_design:

  model:
    categories: 5
    factors: 25
    canonical_signal_registry: PASS

  signal_layer:
    normalized_signals: PASS
    provenance: PASS
    confidence: PASS
    freshness: PASS
    pending_semantics: PASS

  scoring:
    deterministic: PASS
    ai_direct_scoring: false
    missing_as_zero: false

  api:
    factor_signals_exposed: PASS

  ui:
    factor_cards: PASS
    signal_drilldown: PASS
    evidence_drawer: PASS
    confidence: PASS
    coverage: PASS
    responsive: PASS

  real_data:
    verified_restaurant_tests: PASS
    synthetic_customer_data: 0

  architecture:
    rist_ai_001_preserved: PASS
    frozen_25_factor_model_preserved: PASS
```

---

# 41. Final Architectural Rule

> **Observation tells us what exists. Signal tells us what that observation means. Factor tells us how the restaurant performs in that area. Category summarizes related factors. The overall score summarizes Restaurant Discovery Intelligence.**

And:

> **The customer should never have to trust a mysterious number. Every score must ultimately be traceable back to a real observation.**