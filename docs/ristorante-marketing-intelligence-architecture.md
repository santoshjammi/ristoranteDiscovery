# Ristorante Marketing Intelligence

## Detailed Implementation Architecture v1.0

## Status

**MANDATORY IMPLEMENTATION BLUEPRINT**

Scope:

* RistoranteDiscovery
* Marketing Intelligence
* Discovery signals
* Internal diagnostics
* Opportunities
* Recommendations
* Customer-safe intelligence surfaces

This document complements:

`docs/ristorante-implementation-principles.md`

That document defines the engineering principles.

This document defines the **actual implementation shape**.

---

# 1. Primary Architectural Rule

Do not implement:

```text
100 factors
→ 100 services
```

and do not implement:

```text
100 factors
→ one 4,000-line evaluator
```

Use:

```text
Declarative Factor Definitions
           +
Reusable Evaluation Strategies
           +
Explicit Policies
           +
Small Domain Engines
```

---

# 2. Target Architecture

```text
PUBLIC / CONNECTED SOURCES
          │
          ▼
┌────────────────────────────┐
│      OBSERVATION LAYER     │
│ factual source evidence    │
└─────────────┬──────────────┘
              │
              ▼
┌────────────────────────────┐
│        SIGNAL LAYER        │
│ normalized observations    │
└─────────────┬──────────────┘
              │
              ▼
┌────────────────────────────┐
│      FACTOR EVALUATION     │
│ generic deterministic      │
└─────────────┬──────────────┘
              │
              ▼
┌────────────────────────────┐
│    FACTOR OBSERVATIONS     │
│ 100 internal factors       │
└─────────────┬──────────────┘
              │
              ▼
┌────────────────────────────┐
│   OPPORTUNITY DETECTION    │
└─────────────┬──────────────┘
              │
              ▼
┌────────────────────────────┐
│      PRIORITY ENGINE       │
└─────────────┬──────────────┘
              │
              ▼
┌────────────────────────────┐
│   RECOMMENDATION BUILDER   │
└─────────────┬──────────────┘
              │
              ▼
┌────────────────────────────┐
│  CUSTOMER-SAFE PROJECTION  │
└────────────────────────────┘
```

---

# 3. Layer Structure

Recommended conceptual structure:

```text
backend/src/

  domain/
    marketing-intelligence/

      types/
        marketing-factor.ts
        marketing-signal.ts
        marketing-opportunity.ts
        marketing-recommendation.ts
        evidence.ts

      registry/
        marketing-domain-registry.ts
        marketing-factor-registry.ts
        methodology-registry.ts

      strategies/
        signal-scoring-strategy.ts
        boolean-scoring-strategy.ts
        threshold-scoring-strategy.ts
        ratio-scoring-strategy.ts
        benchmark-scoring-strategy.ts
        categorical-scoring-strategy.ts
        trend-scoring-strategy.ts
        composite-scoring-strategy.ts

      policies/
        factor-status-policy.ts
        factor-coverage-policy.ts
        confidence-policy.ts
        freshness-policy.ts
        opportunity-policy.ts
        priority-policy.ts

      evaluation/
        factor-evaluator.ts
        opportunity-detector.ts
        priority-engine.ts
        recommendation-builder.ts

  application/
    marketing-intelligence/

      use-cases/
        evaluate-marketing-intelligence.ts
        get-marketing-opportunities.ts
        build-marketing-recommendations.ts
        get-customer-marketing-summary.ts

      ports/
        observation-repository.ts
        signal-repository.ts
        factor-snapshot-repository.ts
        marketing-data-source.ts

      dto/
        internal-marketing-intelligence.dto.ts
        customer-marketing-summary.dto.ts

  infrastructure/
    marketing-intelligence/

      repositories/
        prisma-observation-repository.ts
        prisma-signal-repository.ts
        prisma-factor-snapshot-repository.ts

      connectors/
        public/
        analytics/
        advertising/
        crm/
        ordering/
        reservations/

      ai/
        use existing RIST-AI-001 capability layer

  interface/
    http/
      internal-marketing-intelligence.controller.ts
      customer-marketing-summary.controller.ts
```

Exact paths may adapt to the existing repository.

The **layer boundaries may not**.

---

# 4. Domain Must Remain Pure

Files under:

```text
domain/marketing-intelligence/
```

must not import:

* Prisma
* Express
* filesystem
* HTTP clients
* Google SDK
* Meta SDK
* provider SDK
* Ollama
* database clients

Domain input is already-normalized domain data.

---

# 5. Canonical Factor Registry

The 100 factors must be defined declaratively.

Example:

```typescript
const REVIEW_MANAGEMENT: MarketingFactorDefinition = {
  id: "review_management",

  domainId: "reputation_trust",

  label: "Review Management",

  evidenceClass: "PUBLIC",

  funnelStages: [
    "TRUST",
    "CONSIDERATION",
  ],

  signals: [
    "review_response_rate",
    "negative_review_response_rate",
    "response_latency",
    "unresolved_negative_reviews",
  ],

  methodology: {
    type: "composite",
    version: "1.0",
  },
};
```

Do not put calculation implementation inside this object.

---

# 6. Factor Registry Responsibilities

Registry defines:

```text
WHAT the factor is
```

including:

* ID
* domain
* label
* description
* required signals
* optional signals
* evidence class
* funnel stages
* methodology ID
* methodology version
* applicability rules
* expected freshness class

It does NOT:

* query database
* call connectors
* calculate scores directly
* call AI
* create recommendations

---

# 7. Generic FactorEvaluator

`FactorEvaluator` must remain small.

Its responsibility:

> Apply the factor definition's declared methodology to available signals and return a MarketingFactorObservation.

Conceptually:

```typescript
class FactorEvaluator {
  evaluate(
    definition: MarketingFactorDefinition,
    signals: MarketingSignalObservation[]
  ): MarketingFactorObservation;
}
```

It should:

1. locate relevant signals
2. check applicability
3. calculate coverage
4. resolve methodology
5. execute strategy
6. apply status policy
7. calculate confidence
8. return factor observation

---

# 8. FactorEvaluator Must NOT Know 100 Factors

Prohibited:

```typescript
switch (factorId) {
  case "brand_positioning":
  case "review_management":
  case "paid_search":
  case "retention":
  ...
}
```

Also prohibited:

```text
if factor 1...
if factor 2...
...
if factor 100...
```

Adding factor 101 should usually require:

```text
Registry entry
+
existing strategy
```

not an edit to `FactorEvaluator`.

---

# 9. Strategy Registry

Methodologies should resolve through a registry:

```typescript
methodologyRegistry.resolve(
  factor.methodology.type
);
```

Possible strategies:

```text
Boolean
Threshold
Range
Ratio
Benchmark
Categorical
Trend
Composite
```

Approximately 6–10 reusable strategies should support most of the 100 factors.

---

# 10. Custom Methodologies

A truly unique factor may have:

```text
Custom methodology
```

But custom factor evaluators should be exceptional.

Example:

```text
customer_identity_resolution_v1
```

may legitimately need specialized logic.

Do not create custom classes simply because factor names differ.

---

# 11. Policy Objects

Keep cross-cutting business rules independent.

## FactorStatusPolicy

Determines:

```text
HEALTHY
OPPORTUNITY
WEAK
CRITICAL
PENDING_DATA
NOT_CONNECTED
NOT_APPLICABLE
INSUFFICIENT_HISTORY
```

---

## CoveragePolicy

Determines whether enough evidence exists.

---

## ConfidencePolicy

Uses:

* signal coverage
* evidence quality
* freshness
* sample size
* source reliability

---

## FreshnessPolicy

Defines source-specific freshness expectations.

---

## BenchmarkEligibilityPolicy

Determines whether a real peer cohort is sufficient.

---

# 12. Critical Status Rule

This invariant is mandatory:

```text
NOT_CONNECTED ≠ WEAK
```

Example:

Restaurant has not connected Google Ads.

Result:

```text
Paid Search Strategy
status = NOT_CONNECTED
score = null
```

Not:

```text
status = CRITICAL
score = 0
```

---

# 13. OpportunityDetector

Responsibility:

> Convert material factor weaknesses into internal marketing opportunities.

Input:

```text
MarketingFactorObservation[]
```

Output:

```text
MarketingOpportunity[]
```

It does not rank.

It does not create customer copy.

---

# 14. Opportunity Model

```typescript
interface MarketingOpportunity {
  id: string;

  restaurantId: string;

  factorId: string;

  rootCauseSignalIds: string[];

  severity:
    | "low"
    | "medium"
    | "high"
    | "critical";

  expectedImpact:
    | "low"
    | "medium"
    | "high";

  effort:
    | "low"
    | "medium"
    | "high";

  confidence: number;

  strategicRelevance: number;

  controllability: number;

  evidenceRefs: string[];
}
```

---

# 15. PriorityEngine

Responsibility:

> Rank already-detected opportunities.

It does NOT discover opportunities.

Conceptually:

```text
Priority =
Severity
× Expected Impact
× Confidence
× Strategic Relevance
× Controllability
÷ Effort
```

Exact methodology must be versioned.

Example:

```text
marketing_priority_v1
```

---

# 16. PriorityEngine Input

```typescript
PriorityEngine.rank(
  opportunities,
  marketingObjectiveContext
);
```

This allows:

```text
Increase weekday lunch
```

to change priorities without changing factor scores.

This distinction is critical.

---

# 17. Factor Score ≠ Priority

Example:

```text
Review Management        32
Lunch Search Visibility  51
```

But business objective:

```text
Grow weekday lunch
```

Ristorante may legitimately prioritize:

```text
Lunch Search Visibility
```

above:

```text
Review Management
```

Factor health and action priority are different concepts.

---

# 18. RecommendationBuilder

Responsibility:

> Convert ranked opportunities into actionable recommendation objects.

It consumes:

* opportunity
* root causes
* evidence
* action templates
* success metrics

It does not calculate factor scores.

---

# 19. Recommendation Structure

```typescript
interface MarketingRecommendation {
  id: string;

  restaurantId: string;

  opportunityId: string;

  title: string;

  internalReason: string;

  evidenceRefs: string[];

  recommendedAction: string;

  successMetric: string;

  expectedTimeToImpact:
    | "immediate"
    | "7_days"
    | "30_days"
    | "90_days"
    | "long_term";

  confidence: number;
}
```

---

# 20. Customer Explanation

Customer wording may use the AI capability layer.

Flow:

```text
Deterministic Recommendation
            ↓
RecommendationExplanationCapability
            ↓
Grounded customer-friendly explanation
```

AI may change wording.

AI must not change:

* problem
* priority
* evidence
* factor score
* expected metric
* underlying action

---

# 21. Application Use Case

Avoid:

```text
MarketingIntelligenceService
```

Prefer use cases.

Primary:

```text
EvaluateMarketingIntelligence
```

Conceptually:

```text
Load observations
      ↓
Build signals
      ↓
Evaluate factors
      ↓
Detect opportunities
      ↓
Rank opportunities
      ↓
Build recommendations
      ↓
Persist snapshot
```

The use case orchestrates.

It does not contain domain calculations.

---

# 22. Internal vs Customer Projection

Never return the complete internal object directly to customers.

Internal:

```text
100 factors
300+ signals
coverage
methodology
priority inputs
internal recommendations
```

Customer projection:

```text
Top Opportunities
Why
Evidence
Next Action
Expected Effect
How Success Will Be Measured
```

---

# 23. API Boundary

Potential internal route:

```text
/internal/marketing-intelligence/:restaurantId
```

must be:

* authenticated
* authorized
* internal-only

Customer-facing route should return curated content.

Example:

```text
/api/restaurants/:id/marketing-summary
```

Response:

```json
{
  "topOpportunities": [],
  "strengths": [],
  "recommendedNextActions": [],
  "dataCoverage": {}
}
```

No raw 100-factor dump.

---

# 24. Observation Sources

Infrastructure connectors collect facts.

Examples:

```text
GoogleObservationSource
WebsiteObservationSource
ReviewObservationSource
SearchConsoleSource
AnalyticsSource
GoogleAdsSource
MetaAdsSource
CRMSource
OrderSource
ReservationSource
```

Interfaces should remain focused.

---

# 25. Connector Rule

Connector responsibility:

```text
External system
→ canonical observations
```

Not:

```text
External system
→ factor score
```

No connector may own business scoring.

---

# 26. Signal Layer

Signals normalize observations.

Example:

```text
Observation:
Google rating = 4.7

Signal:
average_rating = 4.7
```

Example:

```text
Observation:
37 owner responses
50 eligible reviews

Signal:
review_response_rate = 74%
```

Signal derivation must be deterministic unless semantic interpretation genuinely requires AI.

---

# 27. Signal Registry

Signals also require a canonical registry.

Each definition:

```typescript
interface MarketingSignalDefinition {
  id: string;

  label: string;

  sourceClasses: string[];

  valueType: string;

  freshnessPolicy: string;

  minimumConfidence: number;

  methodologyVersion: string;
}
```

---

# 28. AI-Derived Signals

Example:

```text
Real Reviews
   ↓
ReviewInterpretationCapability
   ↓
Validated structured interpretation
   ↓
service_sentiment signal
```

The signal must retain evidence references to the actual reviews.

AI output without valid grounding cannot produce a measured signal.

---

# 29. Persistence Model

Avoid persisting definitions repeatedly.

Static definitions:

```text
Domain registry
Factor registry
Signal registry
Methodology registry
```

belong in code/config.

Persist:

```text
Observations
Signal observations
Factor snapshots
Opportunities
Recommendations
Action state
Outcome measurements
```

---

# 30. Suggested Persistent Entities

Conceptually:

```text
Observation

MarketingSignalObservation

MarketingFactorSnapshot

MarketingIntelligenceSnapshot

MarketingOpportunity

MarketingRecommendation

MarketingAction

MarketingOutcome
```

Do not modify DB schema until repository mapping proves which entities already exist.

---

# 31. Historical Model

Never overwrite all useful historical intelligence.

Required future chain:

```text
Observation T1
      ↓
Factor Snapshot T1

Observation T2
      ↓
Factor Snapshot T2

        ↓

Actual Trend
```

---

# 32. Action Loop

Recommendations should eventually support:

```text
IDENTIFIED
RECOMMENDED
ACCEPTED
IN_PROGRESS
COMPLETED
MEASURING
IMPROVED
NO_EFFECT
REGRESSED
```

This should integrate with existing decision lifecycle where possible.

Do not create a duplicate workflow if one already exists.

---

# 33. Backend File Size Warning

As a review heuristic:

If any domain intelligence file begins growing beyond roughly:

```text
300–500 meaningful lines
```

review whether responsibilities or factor-specific rules are being accumulated incorrectly.

This is not a hard coding standard.

It is an architectural warning.

---

# 34. Frontend Architecture

The frontend must not mirror the backend's 100-factor complexity.

Preferred conceptual structure:

```text
components/
  intelligence/

    primitives/
      ConfidenceIndicator
      CoverageIndicator
      EvidenceBadge
      StatusBadge

    composed/
      FactorCard
      SignalRow
      EvidenceDrawer
      OpportunityCard
      RecommendationCard

    sections/
      DiscoveryIntelligenceSection
      MarketingOpportunitiesSection
      MarketingStrengthsSection
      RecommendedActionsSection

    views/
      RestaurantIntelligenceView
```

Reuse existing components before introducing these.

---

# 35. 21st.dev Role

21st.dev is:

```text
DESIGN / COMPONENT REFERENCE
```

not:

```text
SECOND DESIGN SYSTEM
```

Workflow:

```text
Need component
    ↓
Search existing Ristorante component
    ↓
Can compose existing primitives?
    ↓
YES → reuse

NO
    ↓
Review 21st.dev reference
    ↓
Adapt to Ristorante tokens
    ↓
Own source locally
```

---

# 36. Frontend Design Tokens

All new UI must use existing semantic tokens for:

* background
* text
* muted
* border
* success
* warning
* critical
* spacing
* radius
* typography
* shadow

No isolated visual system for Marketing Intelligence.

---

# 37. Customer Page Hierarchy

Recommended restaurant intelligence experience:

```text
Restaurant Header

       ↓

Overall Discovery Summary

       ↓

Top Marketing Opportunities

       ↓

Why These Matter

       ↓

Recommended Next Actions

       ↓

Existing 25 Discovery Factors

       ↓

Evidence / Signal Drilldown
```

Do not lead with:

```text
100 Marketing Factors
```

---

# 38. Internal Diagnostics View

An internal/admin/developer surface may inspect:

```text
20 domains
100 factors
signal coverage
confidence
methodology
evidence
```

But it must not become the normal customer UX.

---

# 39. OpportunityCard

Suggested:

```text
┌──────────────────────────────────┐
│ Improve Weekday Lunch Visibility │
│                                  │
│ HIGH PRIORITY                    │
│                                  │
│ Why                              │
│ Search coverage for lunch-based  │
│ queries is substantially weaker. │
│                                  │
│ Evidence                         │
│ 8 observations                   │
│                                  │
│ Recommended action               │
│ Improve lunch landing/menu       │
│ relevance for Raleigh searches.  │
│                                  │
│ Confidence  High                 │
│ Effort      Medium               │
└──────────────────────────────────┘
```

---

# 40. Progressive Disclosure

Levels:

```text
LEVEL 1
Opportunity

LEVEL 2
Factor explanation

LEVEL 3
Supporting signals

LEVEL 4
Raw evidence / provenance
```

Customers should stop at whatever level gives them confidence.

---

# 41. Loading / Empty / Partial States

Mandatory.

Examples:

```text
Marketing intelligence is being evaluated…
```

```text
Connect Google Analytics to understand conversion behavior.
```

```text
Insufficient history to determine trend.
```

```text
No critical marketing opportunities detected from currently available evidence.
```

Do not show blank cards.

---

# 42. NOT_CONNECTED UX

Good:

```text
Google Ads
Not connected

Connect Google Ads to evaluate paid acquisition performance.
```

Bad:

```text
Paid Acquisition
0 / 100
CRITICAL
```

---

# 43. PENDING_DATA UX

Good:

```text
Customer Retention

Pending data

Ristorante does not yet have sufficient repeat-visit history.
```

---

# 44. Frontend Business Logic Rule

Frontend may:

* format
* sort presented recommendations
* filter UI
* expand/collapse
* display states

Frontend must not:

* calculate authoritative factor scores
* create priorities
* infer opportunity severity
* calculate confidence
* fabricate missing states

---

# 45. Frontend Data Contract

Customer UI should consume ready-to-render semantic data.

Example:

```typescript
interface MarketingOpportunityViewModel {
  id: string;

  title: string;

  priority: "high" | "medium" | "low";

  why: string;

  action: string;

  confidence: string;

  evidenceCount: number;

  expectedTimeToImpact?: string;
}
```

---

# 46. Initial Implementation Increment

Do NOT implement all 100 factors.

The first executable increment should contain:

## A. Registry foundation

* 20 domains
* 100 factor definitions
* evidence-class metadata
* funnel mappings

No external connector expansion.

---

## B. Generic FactorEvaluator

Must demonstrate multiple methodologies using existing data.

---

## C. Policies

At minimum:

* status
* coverage
* confidence

---

## D. OpportunityDetector

Generic and deterministic.

---

## E. PriorityEngine

Versioned deterministic methodology.

---

## F. One application use case

`EvaluateMarketingIntelligence`

---

## G. Real-data validation

Use current real RTP restaurants.

No synthetic customer data.

---

# 47. First Vertical Slice

Choose approximately 8–12 already-supported factors spanning several domains.

Example candidate set:

```text
Brand Positioning Clarity
Google Business Presence
Local Search Visibility
Website Technical Health
Review Strength
Review Freshness
Review Management
Menu Availability
Online Ordering Availability
Reservation Availability
Social Presence
Competitive Discovery Position
```

Exact selection must come from repository coverage analysis.

Do not implement a factor simply because it sounds useful.

---

# 48. Why Vertical Slice First

Prove:

```text
Evidence
→ Signal
→ Factor
→ Opportunity
→ Priority
→ Recommendation
→ Customer-safe projection
```

end-to-end before expanding factor coverage.

---

# 49. Acceptance Test Example

Given:

```text
Restaurant:
The Mill Raleigh
```

System should produce something structurally like:

```yaml
marketing_intelligence:

  evaluated_factors: 12

  statuses:
    healthy: 4
    opportunity: 3
    weak: 2
    pending_data: 2
    not_connected: 1

  top_opportunities:
    - factor:
      evidence:
      root_cause:
      priority:
      recommended_action:
      confidence:
```

Exact findings must come from real data.

---

# 50. SOLID Acceptance Gate

Before completing an increment verify:

```yaml
solid:

  srp:
    factor_evaluator_only_evaluates: PASS
    opportunity_detector_only_detects: PASS
    priority_engine_only_ranks: PASS
    recommendation_builder_only_builds: PASS

  ocp:
    new_factor_via_registry_without_engine_edit: PASS

  lsp:
    strategy_contract_substitution: PASS

  isp:
    connector_interfaces_focused: PASS

  dip:
    domain_has_no_infrastructure_imports: PASS
```

---

# 51. Critical OCP Test

Add a test-only factor definition using an existing methodology.

Verify:

```text
FactorEvaluator source code unchanged
```

and factor evaluates correctly.

This is a powerful proof that the design is actually extensible.

---

# 52. Domain Purity Gate

Automated/static verification should fail if domain imports:

```text
@prisma/*
express
axios
fetch wrappers
provider SDKs
AI SDKs
```

Adapt checks to repository conventions.

---

# 53. Registry Integrity Tests

Verify:

* exactly 20 domains
* exactly 100 internal factors
* unique IDs
* valid domain IDs
* valid methodology IDs
* valid evidence classes
* required signal references valid
* no orphan signals
* methodology version present

---

# 54. Methodology Tests

Test representative strategy families.

Do not create shallow tests only to increase count.

Required:

* boolean
* threshold
* ratio
* composite
* benchmark
* trend

where implemented.

---

# 55. Status Tests

Mandatory:

```text
missing connected account
→ NOT_CONNECTED

insufficient historical evidence
→ INSUFFICIENT_HISTORY

factor not relevant
→ NOT_APPLICABLE

missing public observation
→ PENDING_DATA
```

No accidental zero scores.

---

# 56. Frontend Acceptance Gate

Every new surface:

```yaml
frontend:

  existing_components_checked: PASS

  ristorante_tokens: PASS

  progressive_disclosure: PASS

  loading_state: PASS
  empty_state: PASS
  partial_state: PASS
  error_state: PASS
  not_connected_state: PASS

  keyboard_accessible: PASS
  focus_visible: PASS

  desktop: PASS
  mobile: PASS

  backend_business_logic_in_ui: false
```

---

# 57. No Parallel Architecture

Before adding:

```text
MarketingFactorSnapshot
MarketingRecommendation
MarketingAction
```

inspect existing:

* score snapshots
* evidence
* decisions
* recommendation entities
* action lifecycle

Reuse wherever semantics match.

New structures require justification.

---

# 58. Skill vs Repository Canonicality

The repository document is authoritative.

The Hermes skill should say:

> Load and obey `docs/ristorante-implementation-principles.md` and this implementation architecture.

Do not maintain an independent copied architecture inside the skill.

Otherwise the skill and repository will eventually drift.

---

# 59. Required Implementation Report

Every marketing-intelligence increment must return:

```text
Objective

Scope

Existing components reused

Registry changes

Strategies added

Policies added

Use cases changed

Infrastructure changed

Frontend changed

DB changes

SOLID verification

21st.dev/UI verification

Build

Unit tests

Integration tests

E2E

Security

Changed-file justification

Known limitations

Rollback
```

---

# 60. Stop Gates

STOP before:

* new database architecture
* new authentication architecture
* new paid connector
* major dependency
* exposing 100 factors to customers
* changing frozen RDI score mathematics
* changing RIST-AI-001
* destructive migration
* major frontend redesign
* creating a second design system

---

# 61. First Immediate Correction to Current Work

Current proposed:

```text
FactorEvaluator.ts
— evaluates all 100 factors
```

is acceptable only if:

```text
FactorEvaluator
→ generic orchestration
→ registry definition
→ methodology strategy
→ policies
```

It is NOT acceptable if:

```text
FactorEvaluator.ts
→ contains individual logic for 100 factors
```

Before continuing the current implementation, inspect this explicitly.

---

# 62. Immediate Hermes Instruction

Continue the current work only after verifying:

```yaml
current_factor_evaluator:

  generic: true

  contains_100_factor_switch: false

  factor_specific_business_rules_embedded: false

  registry_driven: true

  strategy_driven: true

  status_policy_externalized: true

  confidence_policy_externalized: true
```

If any value fails:

Stop that implementation and correct the design before expanding it.

---

# 63. Final Architecture Invariant

> **Factors are data definitions. Methodologies are reusable strategies. Business-wide rules are policies. Engines apply those definitions and policies. Use cases orchestrate them. Infrastructure supplies external data. UI presents customer-safe decisions.**

---

# 64. Final Product Invariant

> **Ristorante may understand 100 factors internally, but it should tell the customer only the few things that matter most right now.**
