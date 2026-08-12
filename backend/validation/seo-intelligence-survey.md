# SEO Intelligence — Survey

> **Pre-implementation analysis for RVS-005**

---

## 1. Existing Assets

| Asset | Status | Details |
|-------|--------|---------|
| `SEOMarkup` table | ✅ | 4 types per restaurant: Restaurant, Menu, FAQ, Combined |
| `SchemaService` | ✅ | Generates JSON-LD for all 4 types (208 lines) |
| `SEOController` | ✅ | `POST /generate`, `GET /schemas`, `GET /public` |
| `SearchController.audit` | ✅ | AI-driven GBP audit (LLM-dependent) |
| `SEOOptimizerService` | ✅ | AI-driven audit + recommendations (75 lines) |
| Schema generation | ✅ | All 21 restaurants have cached schemas |
| Scorecard integration | ✅ | Schema generation triggers `scorerService.computeScores` |

## 2. Missing Assets

| Asset | Impact |
|-------|--------|
| Domain layer | Schema generation is procedural, not domain-modeled |
| Deterministic audit | Current audit is 100% AI-dependent (`seoOptimizerService.auditRestaurant`) |
| Schema quality scoring | No "how good is my schema" metric |
| Coverage tracking | No tracking of which schema types are present/valid per restaurant |
| Search snippet simulation | No way to preview how schema renders in search results |
| Schema validation | No validation against Schema.org spec |

## 3. Minimum Domain Model

```
SEOSchema (Entity)
├── type: 'Restaurant' | 'Menu' | 'FAQ' | 'Combined'
├── jsonld: object
├── generatedAt: Date
├── isValid: boolean (Schema.org spec validation)
├── coverageScore: number (0-100, how complete the schema is)

SchemaAudit (Value Object)
├── schemaTypes: SEOSchema[] (all 4 types)
├── coverage: number (what % of recommended types exist)
├── completeness: number (how complete each schema is)
├── issues: SchemaIssue[] (missing fields, invalid values)

SEORecommendation (Value Object)
├── type: 'missing-schema' | 'incomplete-field' | 'validation-error'
├── schemaType: string
├── field: string
├── description: string
├── priority: 'critical' | 'high' | 'medium' | 'low'
```

## 4. Validation Strategy

| Metric | Target | Method |
|--------|--------|--------|
| Schema coverage | 100% (all 4 types per restaurant) | Count existing schemas |
| Schema validity | 100% (valid JSON-LD) | Parse + validate against Schema.org |
| Field completeness | ≥ 80% per schema type | Check required fields exist |
| Deterministic audit | 100% (no AI dependency) | Engine uses rules, not LLM |
| Rule coverage | 100% | Every validation rule exercised |

## 5. Go / No-Go Recommendation

**✅ Go.** The existing assets are sufficient:

- Schema generation is already built and working
- The RVS pattern (domain → application → infrastructure → controller → RIXA) applies cleanly
- The main work is extracting the procedural schema logic into a domain layer and replacing the AI-dependent audit with deterministic rules
- No new infrastructure, no new data sources, no new algorithms needed

**Estimated effort:** ~8 hours (same RVS pattern as RVS-001/002/003/004)
