# Market Intelligence — Survey

> **Pre-implementation analysis for RVS-006 (batch)**

---

## 1. Existing Assets

| Asset | Status | Used For |
|-------|--------|----------|
| Restaurant city/state | ✅ 21 restaurants | Geographic grouping |
| Lat/lng coordinates | ✅ All 21 | Distance-based area clustering |
| Cuisine types | ✅ All 21 | Cuisine density per area |
| Price ranges | ✅ All 21 | Price tier distribution |
| Scorecard dimensions | ✅ 11 per restaurant | Area benchmarks |
| Competitive sets | ✅ Frozen | Competitor density |
| Menu items + prices | ✅ Frozen | Average price per area/cuisine |
| Review sentiment | ✅ Frozen | Cuisine popularity proxy |
| SEO schemas | ✅ Frozen | Schema completeness per area |

## 2. Missing Assets

| Asset | Impact | Can Derive? |
|-------|--------|-------------|
| Area/neighborhood taxonomy | Cannot group restaurants into meaningful areas | ✅ Derive from city + lat/lng clusters |
| Cuisine demand data | Cannot measure true demand | ⚠️ Proxy via review volume + ratings |
| Market saturation metrics | Cannot measure competition density | ✅ Derive from restaurant count per area/cuisine |
| Demographic data | Cannot profile customer base | ❌ Not available |
| Foot traffic data | Cannot measure real popularity | ❌ Not available |
| Search volume data | Cannot measure discovery demand | ❌ Not available |
| Time-series trends | Cannot measure market evolution | ⚠️ Proxy via review timestamps |

## 3. Minimum Domain Model

```
MarketArea (Entity)
├── id: string
├── name: string (city + area label)
├── centerLat: number
├── centerLng: number
├── restaurantCount: number
├── cuisineDistribution: Record<string, number>
├── priceDistribution: Record<string, number>
├── averageScores: Record<string, number>

MarketInsight (Value Object)
├── type: 'saturation' | 'gap' | 'trend' | 'benchmark'
├── area: string
├── cuisine: string | null
├── description: string
├── metric: number
├── severity: 'positive' | 'neutral' | 'warning' | 'critical'

MarketTrend (Value Object)
├── cuisine: string
├── area: string
├── reviewVolume: number
├── averageRating: number
├── sentimentTrend: 'improving' | 'declining' | 'stable'
├── period: string
```

## 4. Deterministic Rules (No AI)

| Rule | Logic | Data Source |
|------|-------|-------------|
| Area clustering | Group restaurants by city, then by lat/lng clusters | Restaurant table |
| Cuisine density | Count restaurants per cuisine per area | Restaurant.cuisineTypes |
| Saturation score | Restaurants per cuisine / total restaurants in area | Derived |
| Gap identification | Cuisines with 0 restaurants in an area | Derived |
| Price distribution | % of restaurants per price tier per area | Restaurant.priceRange |
| Score benchmarks | Average scorecard dimensions per area | Scorecard columns |
| Review volume proxy | Total reviews per cuisine per area | ReviewAnalysis |
| Sentiment trend | Average sentiment per cuisine over time | ReviewAnalysis |

## 5. Validation Strategy

| Metric | Target | Method |
|--------|--------|--------|
| Area coverage | 100% of restaurants assigned to an area | Verify no null area |
| Cuisine density accuracy | ±10% | Manual count vs. algorithm |
| Gap identification precision | ≥ 80% | Manual review of identified gaps |
| Rule coverage | 100% | Every rule exercised |
| Deterministic | 100% (no AI) | Engine uses only rules |

## 6. Go / No-Go Recommendation

**✅ Go.** Market Intelligence can be implemented deterministically with existing data.

**What it can do:**
- Area-level cuisine density and saturation
- Cuisine gap identification (underserved cuisines per area)
- Price tier distribution per area
- Score benchmarks per area
- Review volume as demand proxy
- Sentiment trends per cuisine

**What it cannot do (out of scope):**
- True demand forecasting (no foot traffic, search volume)
- Demographic profiling (no census data)
- External market data (no Yelp/Google Trends integration)

**Estimated effort:** ~6 hours (same RVS pattern)
