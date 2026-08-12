# Competitive Intelligence — Survey

> **Pre-implementation analysis for RVS-004**

---

## 1. Existing Assets

### Restaurant Schema (Prisma)

| Field | Type | Available | Used For |
|-------|------|-----------|----------|
| `id` | String | ✅ | Identity |
| `name` | String | ✅ | Display |
| `address` | String | ✅ | Geocoding |
| `city` | String | ✅ | Geographic boundary |
| `state` | String? | ✅ | Geographic boundary |
| `latitude` | Float? | ✅ | Distance calculation |
| `longitude` | Float? | ✅ | Distance calculation |
| `cuisineTypes` | String (JSON) | ✅ | Cuisine similarity |
| `regionalCuisine` | String? | ✅ | Cuisine similarity |
| `priceRange` | String? | ✅ | Price tier matching |
| `dietarySupport` | String (JSON) | ✅ | Service model |
| `amenities` | String (JSON) | ✅ | Service model |
| `deliverySupport` | Boolean | ✅ | Service model |
| `gbpHealthScore` | Int | ✅ | Benchmark metric |
| `discoverabilityScore` | Int | ✅ | Benchmark metric |
| `aiVisibilityScore` | Int | ✅ | Benchmark metric |
| `localSearchScore` | Int | ✅ | Benchmark metric |
| `menuDiscoverabilityScore` | Int | ✅ | Benchmark metric |
| `conversationalSearchScore` | Int | ✅ | Benchmark metric |
| `dishRetrievalScore` | Int | ✅ | Benchmark metric |
| `restaurantClarityScore` | Int | ✅ | Benchmark metric |
| `competitiveVisibilityScore` | Int | ✅ | Benchmark metric |

### Existing Capabilities

| Capability | Location | Status |
|-----------|----------|--------|
| Haversine distance calculation | `ScorerService.calculateDistance()` | ✅ Built |
| Cuisine taxonomy | `cuisineTypes` field | ✅ Available |
| Price tier classification | `priceRange` field ($, $$, $$$, $$$$) | ✅ Available |
| Scorecard dimensions | 11 score columns on Restaurant | ✅ Available |
| Menu intelligence | RVS-002 (frozen) | ✅ Available |
| Review intelligence | RVS-003 (frozen) | ✅ Available |

### Missing Assets

| Asset | Status | Impact |
|-------|--------|--------|
| Competitor table | ❌ Missing | Cannot persist competitor relationships |
| CompetitiveSet table | ❌ Missing | Cannot persist competitive groupings |
| Competitor identification rules | ❌ Missing | No deterministic selection |
| Benchmark metrics | ❌ Missing | No comparison baseline |
| Geographic boundary config | ❌ Missing | No configurable radius |

---

## 2. Gap Analysis

### Competitor Identification

**Current state:** No mechanism exists to identify competitors for a restaurant.

**Required capability:** Given a restaurant, deterministically identify other restaurants that compete with it.

**Selection criteria (deterministic, no AI):**

| Criterion | Weight | Rule |
|-----------|--------|------|
| Distance | Primary | Within configurable radius (default: 5 miles) |
| Cuisine similarity | Primary | Same cuisine family (e.g., Indian, Seafood, Italian) |
| Price tier | Secondary | Same or adjacent price tier ($, $$, $$$, $$$$) |
| Service model | Secondary | Same service model (dine-in, delivery-only, cloud kitchen) |

### Geographic Boundaries

**Current state:** City-level data exists. No configurable radius.

**Required:** Configurable radius (default 5 miles) with Haversine calculation. City-level fallback when lat/lng unavailable.

### Similarity Criteria

**Current state:** Cuisine types stored as JSON array. No cuisine taxonomy hierarchy.

**Required:** Cuisine family mapping (e.g., "South Indian" → "Indian", "Sushi" → "Japanese"). This enables matching at the cuisine family level rather than exact string match.

### Benchmark Metrics

**Current state:** 11 scorecard dimensions exist per restaurant. No cross-restaurant comparison.

**Required:** For each CompetitiveSet, compute:
- Average score per dimension
- Min/max per dimension
- Percentile rank for each restaurant
- Gap analysis (where is this restaurant behind the set average)

---

## 3. Domain Proposal

### Entities

```
CompetitiveSet (Aggregate)
├── id: string
├── restaurantId: string (the focal restaurant)
├── competitors: Competitor[]
├── benchmarks: Benchmark[]
├── insights: CompetitiveInsight[]
├── generatedAt: Date

Competitor (Value Object)
├── restaurantId: string
├── name: string
├── distance: number (miles)
├── cuisineSimilarity: number (0-1)
├── priceTierMatch: boolean
├── overallScore: number (0-100)
├── scoreGaps: ScoreGap[]

ScoreGap (Value Object)
├── dimension: string
├── focalScore: number
├── competitorScore: number
├── gap: number (positive = focal ahead, negative = focal behind)

Benchmark (Value Object)
├── dimension: string
├── average: number
├── median: number
├── min: number
├── max: number
├── focalPercentile: number (0-100)

CompetitiveInsight (Value Object)
├── type: 'strength' | 'weakness' | 'opportunity' | 'threat'
├── dimension: string
├── description: string
├── gapSize: number
├── severity: 'positive' | 'neutral' | 'warning' | 'critical'
```

### Domain Events

```
CompetitiveSetGenerated
├── eventName: 'competitive-set.generated'
├── eventVersion: 1
├── restaurantId: string
├── competitorCount: number
├── topStrength: string
├── topWeakness: string
```

### Deterministic Competitor Selection Rules

```typescript
// Priority 1: Distance (Haversine, default 5 miles)
// Priority 2: Cuisine family match (same cuisine family)
// Priority 3: Price tier match (same or adjacent)
// Priority 4: Service model match (dine-in, delivery, cloud kitchen)

// Scoring: each criterion contributes to a similarity score (0-100)
// Threshold: similarity score >= 60 to be considered a competitor
// Max competitors: 10 per CompetitiveSet (closest first)
```

---

## 4. Validation Plan

### Dataset

All 21 existing restaurants across 7 categories.

### Ground Truth

For each restaurant, manually identify 3-5 actual competitors based on:
- Same cuisine type
- Same geographic area (city or within 5 miles)
- Same price tier

### Success Metrics

| Metric | Target | Method |
|--------|--------|--------|
| Competitor identification precision | ≥ 80% | Manual review of top 5 suggested competitors |
| Competitor identification recall | ≥ 70% | Manual list vs. algorithm list |
| Benchmark accuracy | ± 10% | Cross-validate scorecard dimensions |
| Rule coverage | 100% | Every selection rule exercised at least once |
| False positive rate | < 10% | Non-competitors incorrectly identified |

### Validation Run

1. Run CompetitiveSet generation for all 21 restaurants
2. Review top 5 competitors for each
3. Measure precision/recall against ground truth
4. Adjust selection thresholds if needed
5. Re-run full dataset
6. Freeze v1.0

---

## 5. Implementation Estimate

| Phase | Effort | Dependencies |
|-------|--------|-------------|
| Domain layer | 2h | Survey approval |
| Application layer | 3h | Domain layer |
| Infrastructure | 1h | Application layer |
| Controller + routes | 1h | Application layer |
| RIXA components | 3h | Application layer |
| Validation | 2h | Full implementation |
| **Total** | **~12h** | |

---

## 6. Open Questions

| Question | Proposed Answer |
|----------|----------------|
| Default competitive radius? | 5 miles (configurable) |
| Max competitors per set? | 10 (closest first) |
| Cuisine family mapping? | Manual taxonomy (e.g., "South Indian" → "Indian") |
| Include same-chain restaurants? | No (same brand is not a competitor) |
| Include cloud kitchens? | Yes, but only against other cloud kitchens |
| Update frequency? | On-demand (triggered by analyze endpoint) |
