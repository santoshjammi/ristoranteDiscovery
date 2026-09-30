# Ristorante Engineering & UI Implementation Principles

## Status

**MANDATORY IMPLEMENTATION CONSTRAINT**

Applies to:

* Restaurant Discovery Intelligence
* Marketing Intelligence
* Signal processing
* Recommendation intelligence
* Internal diagnostic capabilities
* Customer-facing product surfaces

These principles apply to all future implementation work unless explicitly superseded by an approved architecture decision.

---

# 1. Backend Engineering Principle

The backend must follow:

> **SOLID domain-oriented design with deterministic business logic and clear infrastructure boundaries.**

The marketing-intelligence implementation must not become one large service containing collection, normalization, scoring, recommendation generation, persistence, AI calls, and API formatting.

---

# 2. Single Responsibility Principle

Each component should have one primary reason to change.

Preferred decomposition:

```text
Evidence Collector
      ↓
Observation Normalizer
      ↓
Signal Evaluator
      ↓
Factor Evaluator
      ↓
Opportunity Detector
      ↓
Priority Engine
      ↓
Recommendation Builder
```

Do not build:

```typescript
MarketingIntelligenceService
```

containing thousands of lines that:

* fetch Google data
* parse websites
* call AI
* calculate scores
* query competitors
* persist records
* generate recommendations
* generate API DTOs

That violates the intended architecture.

---

# 3. Open / Closed Principle

The system must make it possible to add:

* a new signal
* a new evidence source
* a new normalization method
* a new recommendation rule

without rewriting unrelated factors.

Example:
Adding:

```text
instagram_profile_freshness
```

should not require modifications throughout:

```text
RestaurantService
ScorecardService
RecommendationService
PortfolioService
Controller
```

Instead it should be registered through the canonical signal/factor infrastructure.

---

# 4. Liskov Substitution Principle

Implementations behind shared contracts must remain interchangeable.

Example:

```typescript
interface ObservationSource {
  collect(context: ObservationContext): Promise<Observation[]>;
}
```

Possible implementations:

```text
WebsiteObservationSource
GoogleObservationSource
ReviewObservationSource
SearchObservationSource
ReservationObservationSource
```

A consumer should not require provider-specific knowledge.

Likewise:

```typescript
interface SignalEvaluator<TInput> {
  evaluate(input: TInput): SignalResult;
}
```

Implementations must obey the same behavioral contract.

---

# 5. Interface Segregation Principle

Avoid large interfaces such as:

```typescript
interface MarketingPlatform {
  fetchReviews()
  fetchAds()
  fetchAnalytics()
  fetchOrders()
  fetchReservations()
  sendEmail()
  calculateScore()
  ...
}
```

Prefer focused capabilities:

```typescript
interface ReviewObservationSource {}
interface SearchObservationSource {}
interface AnalyticsMetricSource {}
interface AdvertisingMetricSource {}
interface OrderMetricSource {}
```

Consumers depend only on what they actually need.

---

# 6. Dependency Inversion Principle

Business intelligence must depend on abstractions.

Correct:

```text
Factor Engine
    ↓
Signal Repository Interface
```

Infrastructure supplies:

```text
PrismaSignalRepository
```

Correct:

```text
Review Interpretation Use Case
    ↓
ReviewInterpretationCapability
```

Infrastructure supplies the provider implementation.

Incorrect:

```text
Factor Engine
    ↓
Prisma
```

or:

```text
Recommendation Engine
    ↓
OpenAI/Ollama/provider SDK
```

---

# 7. Backend Layer Boundaries

Prefer:

```text
DOMAIN
│
├── factor definitions
├── signal definitions
├── scoring policies
├── opportunity rules
├── recommendation policies
└── domain types

APPLICATION
│
├── use cases
├── orchestration
├── workflows
└── DTO mapping

INFRASTRUCTURE
│
├── Prisma
├── public-data connectors
├── AI capability implementations
├── analytics connectors
├── advertising connectors
└── persistence

INTERFACE
│
├── controllers
├── API DTOs
└── authentication / request handling
```

Dependencies point inward.

---

# 8. Domain Purity

Domain logic must not import:

* Prisma
* Express
* Next.js
* HTTP clients
* provider SDKs
* AI model SDKs

Domain code should be independently testable.

---

# 9. Registry-Driven Design

The 100-factor system must use canonical registries.

Conceptually:

```text
MarketingDomainRegistry
MarketingFactorRegistry
DiscoverySignalRegistry
MethodologyRegistry
```

Do not duplicate factor definitions in:

* frontend
* controller
* database seeds
* recommendation engine

One canonical source should describe each factor.

---

# 10. Strategy Pattern for Methodologies

Different signals require different scoring approaches.

Examples:

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

Prefer strategies:

```typescript
interface SignalScoringStrategy {
  evaluate(input: SignalInput): SignalScore;
}
```

Examples:

```text
BooleanScoringStrategy
ThresholdScoringStrategy
BenchmarkScoringStrategy
RatioScoringStrategy
```

Do not create giant `switch` statements spanning 100 factors.

---

# 11. Policy Objects

Business rules that change independently should become explicit policies.

Examples:

```text
FreshnessPolicy
ConfidencePolicy
BenchmarkEligibilityPolicy
FactorCoveragePolicy
OpportunityPriorityPolicy
```

This improves explainability and testing.

---

# 12. Deterministic Core

Where inputs are numeric/factual:

```text
Observation
→ Signal
→ Factor
→ Opportunity
→ Priority
```

must remain deterministic.

AI may assist with semantic interpretation.

AI must not replace deterministic policies.

---

# 13. AI Boundary

Preserve RIST-AI-001.

AI is a capability accessed through abstractions.

Correct:

```text
ReviewInterpretationCapability
MenuExtractionCapability
RecommendationExplanationCapability
```

Incorrect:

```text
factorService.callLLM()
```

---

# 14. Repository Pattern — Use Selectively

Repositories should abstract persistence where domain/application logic needs it.

Examples:

```text
ObservationRepository
SignalRepository
FactorSnapshotRepository
MarketingRecommendationRepository
```

Do not create repository wrappers around every trivial database query solely for pattern compliance.

SOLID should reduce coupling, not create ceremony.

---

# 15. Use-Case Orientation

Application logic should be expressed around business capabilities.

Examples:

```text
EvaluateRestaurantDiscovery
EvaluateMarketingSystem
DetectMarketingOpportunities
PrioritizeMarketingActions
MeasureRecommendationImpact
BuildCustomerMarketingSummary
```

Avoid generic:

```text
MarketingManager
HelperService
CommonService
UtilityService
```

---

# 16. Backend Testing Philosophy

Test primarily:

* business rules
* boundaries
* contracts
* failure behavior
* deterministic calculations
* evidence integrity

Do not optimize for test-count inflation.

Required layers:

```text
Domain unit tests
Application/use-case tests
Repository/connector contract tests
Integration tests
Critical E2E journeys
```

---

# 17. Frontend Design Principle

The frontend follows:

> **21st.dev-inspired product design: source-owned reusable components, strong design tokens, progressive disclosure, explicit states, accessibility, and high information density without visual clutter.**

21st.dev is a design/component reference.

It is not permission to install visually unrelated components into the application.

---

# 18. Existing Components First

Before creating a new component:

```text
1. Search existing Ristorante components.
2. Search current primitives.
3. Reuse or compose existing pieces.
4. Only then introduce a new component.
```

If referencing 21st.dev:

```text
Preview
    ↓
Evaluate compatibility
    ↓
Adapt to Ristorante tokens
    ↓
Own the resulting source
```

Do not create a second design system.

---

# 19. Source-Owned Components

Prefer components whose implementation lives in the repository.

The product should control:

* markup
* behavior
* accessibility
* responsive behavior
* styling
* dependencies

Do not build critical product surfaces around opaque third-party UI abstractions.

This aligns with current 21st.dev guidance emphasizing source-owned React components that agents can inspect and adapt.

---

# 20. Design Tokens

No arbitrary styling per component.

Use established tokens for:

```text
background
foreground
muted
border
primary
secondary
success
warning
critical
radius
spacing
typography
shadow
```

Avoid:

```typescript
className="bg-[#F7F4EF]"
```

when a semantic design token exists.

21st.dev similarly recommends components read existing CSS variables/tokens rather than hardcoding their own visual language.

---

# 21. Product Components vs Primitives

Maintain four conceptual layers:

```text
PRIMITIVES
Button
Input
Dialog
Tabs
Tooltip

        ↓

COMPOSED UI
FactorCard
SignalRow
EvidenceDrawer
OpportunityCard

        ↓

PRODUCT SECTIONS
DiscoveryScorecard
MarketingOpportunityPanel
EvidenceTimeline

        ↓

PRODUCT PAGES
Restaurant Details
Portfolio
Marketing Intelligence
```

Business logic belongs above primitives.

---

# 22. Progressive Disclosure

Never display the entire intelligence graph at once.

For example:

```text
Restaurant
   ↓
Top Opportunities
   ↓
Factor
   ↓
Signals
   ↓
Evidence
```

The customer should drill deeper only when wanted.

---

# 23. Information Hierarchy

Use size and space to communicate importance.

Recommended hierarchy:

```text
DECISION
    ↓
OUTCOME / SCORE
    ↓
PROBLEM / OPPORTUNITY
    ↓
EVIDENCE
    ↓
DETAIL
```

Avoid making every metric visually equal.

---

# 24. Real States

Every component must design for:

```text
Loading
Success
Empty
Partial
Pending
Error
Disabled
Stale
Not Connected
Insufficient Data
```

Do not design only the happy path.

Current 21st.dev guidance explicitly calls out loading, empty, error, disabled, focus-visible, and mobile behavior as important component states.

---

# 25. Accessibility

Every interactive element must support:

* keyboard navigation
* visible focus
* semantic HTML
* useful labels
* screen-reader context where needed
* adequate contrast
* non-color status representation

Tab navigation must reach all meaningful controls.

21st.dev's current review guidance specifically recommends checking that Tab reaches interactive elements and that visible focus exists.

---

# 26. Server-First Content Where Appropriate

Critical product content should not exist only after hydration when unnecessary.

Important headings, labels and initial information should render as semantic content.

This improves:

* accessibility
* resilience
* SEO where applicable
* perceived performance

21st.dev's current component review checklist explicitly recommends verifying that meaningful text exists in HTML before hydration where appropriate.

---

# 27. Mobile Is a Product State

Do not treat responsive behavior as shrinking desktop.

For intelligence screens:

```text
Desktop
Factor grid
Side panels
Evidence detail

Mobile
Stacked priorities
Compact factor cards
Expandable signals
Drawer/sheet evidence
```

No horizontal data-grid dependency for critical workflows.

---

# 28. Visual Restraint

Ristorante is an intelligence product.

Prefer:

* white/light backgrounds
* crisp borders
* generous spacing
* strong typography
* compact badges
* purposeful charts
* subtle motion

Avoid:

* excessive gradients
* glassmorphism everywhere
* decorative 3D
* oversized cards
* excessive animation
* dashboard decoration with no decision value

---

# 29. Data Visualization Rule

Use a visualization only when it helps answer a question.

Good:

```text
How has visibility changed?
→ trend chart
```

Good:

```text
Where are portfolio weaknesses?
→ heat map
```

Bad:

```text
We have five category scores.
→ radar chart because it looks impressive
```

---

# 30. Motion

Motion should explain:

* hierarchy
* state change
* expansion
* navigation
* feedback

Do not animate merely because a 21st.dev component supports animation.

---

# 31. Consistency Over Novelty

A visually simpler component matching the existing product is better than a spectacular external component that introduces:

* different spacing
* different radius
* different animation
* different colors
* different interaction conventions

21st.dev itself notes that taking components from multiple visual sources still requires alignment of spacing, radius and color.

---

# 32. Decision-Oriented Pages

Every major page should answer a specific question.

Examples:

```text
Portfolio
→ Where do I need attention?

Restaurant Detail
→ What is wrong with this restaurant's discovery?

Marketing Intelligence
→ What are the highest-value marketing opportunities?

Recommendation
→ What should we do next?

Evidence
→ Why does Ristorante believe this?
```

Do not create generic analytics pages.

---

# 33. Customer-Safe Complexity

Internally:

```text
100 factors
hundreds of signals
```

Externally:

```text
3–5 priorities
clear evidence
clear action
clear expected effect
```

The frontend must protect the customer from internal complexity.

---

# 34. Frontend Business-Logic Boundary

React components must not calculate authoritative business scores.

Correct:

```text
API returns:
score = 72
```

Frontend renders 72.

Incorrect:

```typescript
const score =
  googleRating * .4 +
  reviewCount * .6;
```

Authoritative intelligence belongs in the backend/domain.

---

# 35. Frontend State Boundary

Keep:

```text
domain state
```

separate from:

```text
UI state
```

Example domain:

```text
factor.status = pending_observation
```

UI state:

```text
factorCardExpanded = true
```

Do not blend them.

---

# 36. Reusable Intelligence Components

Build reusable product-level primitives such as:

```text
IntelligenceCard
FactorCard
SignalRow
EvidenceDrawer
ConfidenceIndicator
CoverageIndicator
OpportunityCard
RecommendationCard
TrendIndicator
PendingObservation
DataSourceBadge
```

Do not create bespoke versions on every page.

---

# 37. Component API Quality

Components should accept data and callbacks.

Example:

```typescript
<FactorCard
  factor={factor}
  onEvidenceOpen={...}
  onRecommendationOpen={...}
/>
```

Avoid components that internally fetch unrelated domain data.

This keeps visual boundaries reusable and testable.

---

# 38. Dependency Discipline

Before adding any frontend dependency:

Ask:

```text
Can existing primitives do this?

Does this dependency create another design language?

Does it add meaningful product value?

Will we own the resulting behavior?
```

New dependencies require normal project approval rules.

---

# 39. 21st.dev Usage Rule

When using 21st.dev:

```text
SEARCH
→ PREVIEW
→ SELECT
→ ADAPT
→ VERIFY
```

Never:

```text
SEARCH
→ COPY 8 COMPONENTS
→ SHIP
```

Component selection must consider:

* existing Ristorante tokens
* dependencies
* accessibility
* mobile behavior
* loading/error states
* component boundary
* visual consistency

---

# 40. UI Acceptance Checklist

Every significant new screen must pass:

```yaml
ui_review:

  purpose_clear: PASS
  existing_components_reused: PASS
  design_tokens_used: PASS
  hardcoded_visual_system: false

  responsive:
    desktop: PASS
    tablet: PASS
    mobile: PASS

  states:
    loading: PASS
    empty: PASS
    partial: PASS
    error: PASS
    pending: PASS

  accessibility:
    keyboard: PASS
    focus_visible: PASS
    semantic_markup: PASS
    non_color_status: PASS

  business_logic_in_frontend: false

  unnecessary_motion: false
  unnecessary_visualization: false
```

---

# 41. Backend Acceptance Checklist

```yaml
backend_review:

  solid:
    single_responsibility: PASS
    open_closed: PASS
    liskov_substitution: PASS
    interface_segregation: PASS
    dependency_inversion: PASS

  architecture:
    domain_independent_from_infrastructure: PASS
    use_case_boundaries: PASS
    provider_abstractions: PASS
    deterministic_core: PASS

  intelligence:
    canonical_registry: PASS
    provenance: PASS
    methodology_versioning: PASS
    no_missing_as_zero: PASS

  ai:
    rist_ai_001_preserved: PASS

  testing:
    domain: PASS
    application: PASS
    integration: PASS
```

---

# 42. Final Engineering Invariant

> **Backend complexity is managed through SOLID boundaries, explicit domain policies, registries and deterministic use cases. Frontend complexity is managed through reusable source-owned components, consistent tokens, progressive disclosure and decision-oriented UX.**

And:

> **Do not use SOLID to create unnecessary abstraction, and do not use 21st.dev to create unnecessary decoration. Both are tools for clarity, maintainability and product quality.**
