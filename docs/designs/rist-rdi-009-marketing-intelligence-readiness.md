# Ristorante Internal Marketing Intelligence — Implementation-Readiness Report

> **Status:** PLANNING / IMPLEMENTATION-READINESS (no code authored)
> **Scope:** RistoranteDiscovery / Ristorante Marketing Intelligence only
> **Visibility:** INTERNAL ONLY
> **Canonical spec:** `docs/designs/rist-rdi-008-marketing-factor-model-v1.md`
> (Ristorante Internal Restaurant Marketing Intelligence System — Complete Marketing System Factor Model v1.0, 20 domains / 100 factors / 52 sections)

---
---

# ⚠️ Section 0 — Handoff / Source-of-Truth Discrepancy (READ FIRST)

The delegation handoff instructed the spec to be read from:

```
docs/marketing-intelligence/restaurant-marketing-intelligence-system-v1.md
```

**That path does not exist in the repository.**

The complete, identical 100-factor internal marketing specification **already exists** at:

```
docs/designs/rist-rdi-008-marketing-factor-model-v1.md
```

(The document title is *"Ristorante Internal Restaurant Marketing Intelligence System — Complete Marketing System Factor Model v1.0"*; it contains all 20 domains, all 100 factors, all 52 sections — the same internal-only model the handoff describes.)

**Why this matters:** the handoff implied a *new canonical specification was just added*. In reality the internal model is already spec'd and versioned under the `rist-rdi-008` design series. There is no second/canonical copy, no `docs/marketing-intelligence/` directory. Any future work must reference `rist-rdi-008` as the single source of truth — creating a parallel spec file would fork the model.

**Recommendation:** do not create `docs/marketing-intelligence/`. Keep `rist-rdi-008-marketing-factor-model-v1.md` as the canonical internal spec. If a dedicated directory is later desired as a mirror, it should point to / consolidate, never duplicate.

---

# 1. Current Architecture Map

The repository already implements the **frozen 25-factor Restaurant Discovery Intelligence (RDI)** subsystem end-to-end. It is deterministic, evidence-grounded, pending-aware, and preserves the RIST-AI-001 invariant (AI never owns canonical measurements / scoring arithmetic).

## Production stack
- **Frontend:** Next.js 16 (port 3000) — 27 pages, `frontend/app/` (dashboard, restaurants, intelligence, discover, actions, reports, connectors, settings)
- **Backend:** Node/Express + Prisma + SQLite (port 8040) — `backend/src/`
- **DB:** `backend/prisma/schema.prisma` — SQLite on-ramp; Postgres (RLS) is the agreed multi-tenant destination (RIST-MT-001, frozen, not yet implemented)
- **Deployment:** Docker multi-app VPS (rist-rdi-004), real-data isolation with `rtp-showcase.db` (6 REAL_VERIFIED restaurants), contamination gate

## Existing intelligence domain layers (all present)
| Layer | Location | Purpose |
|-------|----------|---------|
| Discovery Signal Registry (~140 signals) | `backend/src/domain/discovery-intelligence/signal-registry.ts` | Canonical Signal→Factor→Category mapping, `validateRegistry()` |
| Signal Processor | `backend/src/domain/discovery-intelligence/SignalProcessor.ts` | observations → normalized signals; pending/stale/NA semantics; rejects hallucinated evidence |
| Factor Engine | `backend/src/domain/discovery-intelligence/FactorEngine.ts` | signals → FactorResult; deterministic; pending never zero; confidence = coverage×evidence×freshness |
| Signal Resolver | `backend/src/domain/discovery-intelligence/SignalResolver.ts` | Adapts all real DB/connector/benchmark/snapshot data into the evidence map (Phase B "measure what we know") |
| Scorecard Service | `backend/src/domain/scorecard/ScorecardService.ts` | 25-factor / 5-category scorecard, evidence-derived confidence, connectors override DB |
| Evidence Platform | `backend/src/domain/evidence/` + `persistence/evidence/PrismaEvidenceLedger.ts` | Observations, EvidenceRecord, Provenance, Timeline |
| Observation Platform | `backend/src/prisma` models: ObservationSource/Connector/Crawl/Identity/Freshness | Gate-C observation ingestion |
| Knowledge Platform | KnowledgeAssertion/Fact/Relationship/Recommendation | KB-002…007 semantic graph |
| Connector Framework | `backend/src/application/connector/ConnectorFramework.ts`, `connector-platform/` | Connector registration/lifecycle; public scrapers present: gbp, zomato, swiggy, justdial, tripadvisor |
| Recommendation Platform | `backend/src/application/recommendation-platform/RecommendationPlatform.ts` | Merge → dedupe → priority-normalize → persist (deterministic) |
| Decision/Outcome/Feedback loop | `backend/src/domain/decision/`, `application/decision/`, `Outcome`, `Feedback` | IDENTIFIED→…→IMPROVED action loop (closed partially) |
| Competitive | `application/competitive/CompetitiveIntelligenceEngine.ts` | CompetitorSet/Competitor/Benchmark, MIN_PEERS guard |
| SEO | `application/seo/SchemaAuditEngine.ts` | SEOMarkup / SchemaAudit |
| Market | `application/market/MarketIntelligenceEngine.ts` | MarketArea/Trend/Insight |
| Reviews | `domain/reviews/` (Review, ReviewAggregate) | review + sentiment aggregates |
| Menu | `domain/menu/` (Menu, MenuCategory, MenuItem) | menu extraction/quality |
| Insights | `application/insights/InsightsService.ts` | InsightTemplate engine |
| Market scan | `application/discovery/scan/ScanEngine.ts` | discovery scan |

## Key data flows (already working)
```
Connectors/Scan ─► Observations ─► Evidence ─► SignalProcessor ─► ~140 Signals
                                                                     │
                                  ScorecardService / SignalResolver ──┤
                                                                     ▼
                                                              25 Factors ─► 5 Categories ─► Overall RDI
                                                                     │
                                                          RecommendationPlatform ─► Decision ─► Outcome ─► Feedback
```

> **The "intelligence consumption" plumbing (evidence → signals → factors → recommendations → decisions → outcomes) is already built for the 25-factor RDI.** The 100-factor marketing model does not need a new pipeline — it needs a **second, parallel registry + domain layer** that reuses this exact machinery.

---

# 2. Existing Factor Coverage

The frozen 25 factors already cover a substantial slice of the public-intelligence half of the 100-factor model. Mapping:

| RDI Category | RDI Factor (frozen 25) | Nearest 100-Factor Model Factors (marketing domains) | Coverage |
|--------------|------------------------|------------------------------------------------------|----------|
| Discoverability | gbp_profile | F16 Google Business Presence, F19 partial | **Supported** (public) |
| Discoverability | local_search | F17 Local Search Visibility | **Partially** (simulated queries; real SERP observation needed) |
| Discoverability | location_accuracy | F18 Location/NAP Accuracy | **Supported** (address/pin) |
| Discoverability | delivery_platforms | F51 Online Ordering Availability, F19 partial | **Partially** (presence only) |
| Discoverability | ai_visibility | F20 AI/Conversational Discovery | **Partially** (needs controlled real-AI observation) |
| Reputation | avg_rating | F26 Rating Strength | **Supported** |
| Reputation | review_volume_freshness | F27 Review Volume, F28 Freshness/Velocity | **Supported** (via review aggregates) |
| Reputation | review_response | F30 Review Management | **Supported** (response rate/speed/handling) |
| Reputation | sentiment | F29 Review Sentiment & Themes | **Supported** (ReviewAnalysis + topic clusters) |
| Reputation | overall_trust | F6 Brand Positioning partial, F50 partial | **Partially** |
| Digital | website_health | F22 Technical SEO, F21 Search Visibility partial | **Partially** (site exists/SSL; perf/SERP gaps) |
| Digital | mobile_experience | F48 Mobile Conversion Experience partial | **Partially** |
| Digital | menu_availability_quality | F24 Search Content Coverage partial, F58 Menu Merchandising partial | **Supported** (menu extraction/quality) |
| Digital | online_ordering | F51 Online Ordering Availability | **Partially** (capability gate only) |
| Digital | reservations | F53 Reservation Availability | **Partially** (capability gate only) |
| Information | business_completeness | F6 Brand Positioning Clarity, F8 Brand Consistency partial | **Supported** |
| Information | opening_hours | F99 Marketing Execution Discipline (hours) | **Supported** |
| Information | contact_info | F6/F8/F98 ownership partial | **Supported** |
| Information | photos_media | F33 Food Photography partial | **Supported** (presence) |
| Information | local_citations | F19 Platform Discovery Coverage partial | **Supported** |
| Market | competitive_position | F86 Competitor Set Accuracy, F87 Share vs Competitors, F89 Reputation Competitive | **Partially** (CompetitorSet + Benchmark exist; depth needed) |
| Market | local_authority | F40 Community/Creator Authority partial | **Partially** |
| Market | visibility_trend | F17 trend partial | **Partially** (needs real snapshots over time) |
| Market | growth_opportunity | F58/F59/F60 partial | **Partially** (derived, low-confidence) |
| Market | customer_engagement | F72/74/75 partial | **Partially** (presence-only signals) |

**Net:** ~10 of 25 frozen factors map to **supported** marketing factors; the rest are **partially supported** at the marketing-model depth. None of the RDI work is wasted — reuse is high.

---

# 3. 100-Factor Coverage Matrix

Classification buckets (per handoff Phase 1 output):
- `supported` — measurable today from real data already collected
- `partially_supported` — some signals present, depth/real observation needed
- `public_data_possible` — only public-data collection work (crawl/scan/parse), no integration
- `connected_data_required` — needs a permissioned restaurant account (GA4/Search Console/Ads/Meta/email/SMS/CRM/loyalty/POS)
- `historical_data_required` — needs repeated observations over time
- `transaction_data_required` — needs order/transaction/customer-level data
- `future_only` — defer

## Domain 1 — Market & Business Context (F1–5)
| # | Factor | Bucket | Notes |
|---|--------|--------|-------|
| 1 | Business Objective Clarity | `connected_data_required` | HYBRID; needs objective input (manual/onboarding) |
| 2 | Revenue-Channel Priorities | `connected_data_required` | Channel economics from connected accounts |
| 3 | Location Economics Context | `public_data_possible` | Neighborhood density, walkability, district types — geodata/public |
| 4 | Service/Daypart Strategy | `public_data_possible` | Public hours/menu/offer signals |
| 5 | Growth Objective Alignment | `derived` → `connected_data_required` | Needs F1 + campaign signal; defer |

## Domain 2 — Brand Positioning (F6–10)
| # | Factor | Bucket | Notes |
|---|--------|--------|-------|
| 6 | Brand Positioning Clarity | `partially_supported` | cuisine/ambience/audience from live columns; needs positioning statement extraction |
| 7 | Unique Value Proposition | `public_data_possible` | Extract via AI from website/reviews/menu (validated, RIST-AI-001-safe) |
| 8 | Brand Consistency | `public_data_possible` | Compare name/logo/desc across site, Google, social, delivery menus |
| 9 | Audience-Brand Fit | `public_data_possible` | From review audience profile + public positioning |
| 10 | Occasion Positioning | `public_data_possible` | From menu/FAQs/web occasion mentions |

## Domain 3 — Audience & Demand Intelligence (F11–15)
| # | Factor | Bucket | Notes |
|---|--------|--------|-------|
| 11 | Target Customer Definition | `connected_data_required` | Real audience data from analytics/CRM |
| 12 | Geographic Demand | `connected_data_required` | ZIP/drive-time/visitor origin — GA4/Search Console |
| 13 | Search Demand | `connected_data_required` | Search Console impressions/clicks/CTR/position for owned web |
| 14 | Demand Seasonality | `connected_data_required` + `historical_data_required` | Trend over time; needs history |
| 15 | Customer Intent Mix | `connected_data_required` | DISCOVER/COMPARE/ORDER/etc from analytics/ads |

## Domain 4 — Local Discovery (F16–20)
| # | Factor | Bucket | Notes |
|---|--------|--------|-------|
| 16 | Google Business Presence | `supported` | gbp_profile factor directly maps |
| 17 | Local Search Visibility | `partially_supported` | local_search exists; needs real local-pack/SERP observation |
| 18 | Location/NAP Accuracy | `supported` | location_accuracy factor |
| 19 | Platform Discovery Coverage | `public_data_possible` | Presence across Yelp/TripAdvisor/Apple Maps/Bing/directories — scraper-able |
| 20 | AI/Conversational Discovery | `public_data_possible` | Controlled real-AI observation; internal RAG excluded |

## Domain 5 — Organic Search & Website Discovery (F21–25)
| # | Factor | Bucket | Notes |
|---|--------|--------|-------|
| 21 | Search Visibility | `connected_data_required` | Search Console |
| 22 | Technical SEO | `public_data_possible` | crawl/scan site: robots, sitemap, canonical, schema, HTTPS, perf |
| 23 | Local SEO Relevance | `public_data_possible` | location/page content + schema extraction |
| 24 | Search Content Coverage | `public_data_possible` | page coverage for cuisine/menu/dishes/events/etc. |
| 25 | Search Snippet Effectiveness | `public_data_possible` | title/description audit + structured-data rich-result eligibility |

## Domain 6 — Reputation & Trust (F26–30)
| # | Factor | Bucket | Notes |
|---|--------|--------|-------|
| 26 | Rating Strength | `supported` | avg_rating factor |
| 27 | Review Volume | `supported` | review_volume_freshness |
| 28 | Review Freshness & Velocity | `supported` | review_volume_freshness |
| 29 | Review Sentiment & Themes | `supported` | sentiment factor + ReviewAnalysis |
| 30 | Review Management | `supported` | review_response factor |

## Domain 7 — Content & Creative (F31–35)
| # | Factor | Bucket | Notes |
|---|--------|--------|-------|
| 31 | Content Strategy | `public_data_possible` | Assess content surfaces against discovery/trust/conversion goals |
| 32 | Content Freshness | `public_data_possible` | Website/social/menu/promo freshness timestamps |
| 33 | Food Photography | `partially_supported` | photos_media presence; needs quality/consistency scoring |
| 34 | Video Content | `public_data_possible` | Social/web video detection (YouTube/shorts/reels) |
| 35 | Creative Message Quality | `public_data_possible` | AI evaluation of hooks/CTA/differentiation (validated) |

## Domain 8 — Social & Community (F36–40)
| # | Factor | Bucket | Notes |
|---|--------|--------|-------|
| 36 | Social Channel Coverage | `public_data_possible` | Presence detection (IG/FB/TikTok/YouTube); don't penalize irrelevant |
| 37 | Social Publishing Consistency | `public_data_possible` | Posting cadence/freshness/channel mix |
| 38 | Social Engagement | `public_data_possible` | Reactions/comments/shares from public pages |
| 39 | User-Generated Content | `public_data_possible` | Tagged content/photos/reviews UGC |
| 40 | Community/Creator Authority | `public_data_possible` | Local media/creators/partnership mentions |

## Domain 9 — Paid Customer Acquisition (F41–45)
| # | Factor | Bucket | Notes |
|---|--------|--------|-------|
| 41 | Paid Search Strategy | `connected_data_required` | Google Ads |
| 42 | Paid Social Strategy | `connected_data_required` | Meta Ads |
| 43 | Geographic Targeting | `connected_data_required` | Ads geo-targeting |
| 44 | Paid Creative Quality | `public_data_possible` + `connected_data_required` | asset audit partially public, metrics connected |
| 45 | Paid Audience Strategy | `connected_data_required` | Ads audience/remarketing |

## Domain 10 — Digital Conversion Experience (F46–50)
| # | Factor | Bucket | Notes |
|---|--------|--------|-------|
| 46 | Primary CTA Clarity | `public_data_possible` | Web crawl: menu/order/reserve/call/directions CTA visibility |
| 47 | Conversion Path Length | `public_data_possible` | Click-path analysis on owned site |
| 48 | Mobile Conversion Experience | `partially_supported` | mobile_experience factor; needs conversion-flow depth |
| 49 | Conversion Friction | `public_data_possible` | broken CTAs/redirects/forms detection |
| 50 | Conversion Trust | `public_data_possible` | reviews/photos/price/contact/SSL near conversion points |

## Domain 11 — Ordering, Reservations & Local Actions (F51–55)
| # | Factor | Bucket | Notes |
|---|--------|--------|-------|
| 51 | Online Ordering Availability | `partially_supported` | online_ordering capability gate; needs link/menu verification |
| 52 | Ordering Conversion Quality | `connected_data_required` | connected ordering analytics |
| 53 | Reservation Availability | `partially_supported` | reservations capability gate; needs provider verification |
| 54 | Reservation Conversion Quality | `connected_data_required` | reservation platform data |
| 55 | Calls/Directions/Visits | `public_data_possible` + `connected_data_required` | maps clicks partially public; store visits connected |

## Domain 12 — Offers & Menu Merchandising (F56–60)
| # | Factor | Bucket | Notes |
|---|--------|--------|-------|
| 56 | Offer Strategy | `public_data_possible` | detect offers/promos on web/social/menu |
| 57 | Promotional Economics | `transaction_data_required` | discount/margin/cannibalization needs POS/order data |
| 58 | Menu Merchandising | `partially_supported` | menu_availability_quality; needs signature/best-seller prominence |
| 59 | Daypart Promotions | `public_data_possible` | lunch/happy-hour/brunch offer detection |
| 60 | Seasonal/Event Marketing | `public_data_possible` | holiday/event/festival content detection |

## Domain 13 — First-Party Data & CRM (F61–65)
| # | Factor | Bucket | Notes |
|---|--------|--------|-------|
| 61 | Customer Data Capture | `connected_data_required` | ordering/reservation/loyalty/CRM data capture |
| 62 | Customer Profile Completeness | `connected_data_required` | CRM profile fields |
| 63 | Customer Identity Resolution | `connected_data_required` | cross-channel identity |
| 64 | Customer Segmentation | `connected_data_required` | segments from CRM/transaction data |
| 65 | Preference Intelligence | `connected_data_required` | favorites/diet/daypart perms |

## Domain 14 — Lifecycle Marketing (F66–70)
| # | Factor | Bucket | Notes |
|---|--------|--------|-------|
| 66 | Email Marketing Health | `connected_data_required` | email platform |
| 67 | SMS Marketing Health | `connected_data_required` | SMS platform |
| 68 | Welcome Journey | `connected_data_required` + `historical_data_required` | lifecycle flow data |
| 69 | Post-Visit Journey | `connected_data_required` | thank-you/feedback/review flow |
| 70 | Win-Back Journey | `connected_data_required` + `historical_data_required` | inactive-segment flows |

## Domain 15 — Loyalty, Retention & Advocacy (F71–75)
| # | Factor | Bucket | Notes |
|---|--------|--------|-------|
| 71 | Loyalty Program Availability | `partially_supported` | presence detectable; program data connected |
| 72 | Reward Quality | `connected_data_required` | rewards config/data |
| 73 | Repeat Visit Health | `transaction_data_required` | POS/transaction cohorts |
| 74 | Personalization | `connected_data_required` | tailored recognition/rewards |
| 75 | Referral/Advocacy | `connected_data_required` + `public_data_possible` | referral programs + public UGC/mentions |

## Domain 16 — Analytics, Measurement & Attribution (F76–80)
| # | Factor | Bucket | Notes |
|---|--------|--------|-------|
| 76 | Analytics Foundation | `connected_data_required` | GA4/Search Console/GTM/ads/pixels/consent |
| 77 | Event Taxonomy | `connected_data_required` | event config in GA4 |
| 78 | Key Event Integrity | `connected_data_required` | verify important events firing |
| 79 | Attribution Quality | `connected_data_required` | source/medium/campaign/UTM/attribution settings |
| 80 | Marketing-to-Business Outcome Linkage | `connected_data_required` + `transaction_data_required` | revenue/visit linkage; never fabricate |

## Domain 17 — Experimentation & Optimization (F81–85)
| # | Factor | Bucket | Notes |
|---|--------|--------|-------|
| 81 | Experimentation Capability | `connected_data_required` | controlled tests capability |
| 82 | Creative Testing | `connected_data_required` | testing platforms |
| 83 | Audience Testing | `connected_data_required` | geo/demo/intent tests |
| 84 | Offer Testing | `connected_data_required` + `transaction_data_required` | offer A/B + results |
| 85 | Learning Velocity | `connected_data_required` + `historical_data_required` | observe→learn loop over time |

## Domain 18 — Competitive & Market Intelligence (F86–90)
| # | Factor | Bucket | Notes |
|---|--------|--------|-------|
| 86 | Competitor Set Accuracy | `partially_supported` | CompetitiveSet/Competitor exists; needs multi-dimension (geo/cuisine/price/occasion/intent) |
| 87 | Discovery Share vs Competitors | `public_data_possible` | search/maps/reviews/AI/directories comparison |
| 88 | Offer/Menu Competitive Position | `public_data_possible` | competitor menu/price/bundle comparison |
| 89 | Reputation Competitive Position | `public_data_possible` | rating/volume/freshness/sentiment/response vs peers |
| 90 | Digital Experience Competitive Position | `public_data_possible` | website/ordering/reservation/mobile/social vs peers; valid real competitor data only |

## Domain 19 — Marketing Economics & Resource Allocation (F91–95)
| # | Factor | Bucket | Notes |
|---|--------|--------|-------|
| 91 | Marketing Spend Visibility | `connected_data_required` | spend across channels; never estimate |
| 92 | Customer Acquisition Cost | `connected_data_required` + `transaction_data_required` | CAC formula; needs valid data |
| 93 | Cost per Marketing Outcome | `connected_data_required` | cost/order, cost/reservation, cost/call |
| 94 | Return on Ad Spend | `connected_data_required` + `transaction_data_required` | attributed revenue/spend |
| 95 | Budget Allocation Quality | `derived` → `connected_data_required` | spend alignment to objectives |

## Domain 20 — Governance, Data Quality & Marketing Execution (F96–100)
| # | Factor | Bucket | Notes |
|---|--------|--------|-------|
| 96 | Marketing Data Quality | `connected_data_required` | dupes/tagging/campaign-name/events/email hygiene |
| 97 | Consent & Communication Governance | `connected_data_required` | consent/unsubscribe/opt-out/privacy; jurisdiction-aware |
| 98 | Channel Ownership & Access | `public_data_possible` + `manual` | domain/GBP/social/analytics/Ads/CRM ownership; self-report |
| 99 | Marketing Execution Discipline | `partially_supported` | hours/menu/review-response already deterministic; campaigns/issues need execution data |
| 100 | Marketing System Resilience | `connected_data_required` + `manual` | ownership/backups/access/monitoring/repeatable procedures |

---

# 4. Existing RDI Reuse Map

The 100-factor model must NOT build a parallel pipeline. Reuse the existing discovery-intelligence machinery wholesale:

| RDI asset | How it serves the marketing model |
|-----------|-----------------------------------|
| `signal-registry.ts` | Pattern template for a new `marketing-signal-registry.ts` (Signal→MarketingFactor→Domain). Reuse `validateRegistry()`, key-index, weight normalization |
| `SignalProcessor.ts` + `normalization.ts` | **Reused as-is** for public/connected signals — pending/stale/NA semantics, hallucination rejection, freshness |
| `FactorEngine.ts` | **Reused as-is** (or the new `MarketingFactorEngine` extends it) — confidence = coverage×evidence×freshness |
| `SignalResolver.ts` `buildEvidenceMap()` | Pattern for the marketing resolver; add conn/transaction/historical evidence adapters |
| `ScorecardService.ts` `deriveConfidence()` | Reuse evidence-source-confidence model (connector>live_column>presence) |
| Evidence Platform (`Evidence`, `Observation`, `Provenance`, `Timeline`, `PrismaEvidenceLedger`) | **Reused as-is** — canonical storage for all marketing observations |
| Observation Platform schema (Source/Connector/Crawl/Identity/Freshness) | **Reused as-is** — public + connected sources register here |
| Connector Framework | **Extended** — today only public scrapers (gbp/zomato/swiggy/justdial/tripadvisor); add OAuth-connected connector type for marketing accounts |
| `RecommendationPlatform.ts` | **Reused as-is** for marketing recommendations (merge/dedupe/prioritize) |
| Decision/Outcome/Feedback (RT-1) | **Reused as-is** — closes the marketing action loop (F85) |
| `CompetitiveIntelligenceEngine`, `SchemaAuditEngine`, `MarketIntelligenceEngine`, `InsightsService`, ScanEngine | **Reused** — feed Domain 18, 5, 3, 7 signals |

**No RDI score mathematics, factor naming, or public APIs are changed** (handoff Phase 3 hard rule). The marketing model is a parallel, internal-only layer that shares the plumbing but not the scoring contract.

---

# 5. Proposed Canonical Registry

Extend the existing RDI registry pattern — do **not** create a parallel architecture. Recommended internal location mirroring the RDI structure:

```
backend/src/domain/marketing-intelligence/
    types.ts                     # MarketingFactorId, MarketingSignal, MarketingDomain, status enums
    marketing-factor-registry.ts # 20 domains → 100 factors → ~100s of signals; validateRegistry()
    MarketingFactorEngine.ts     # signals → MarketingFactorResult (extends FactorEngine pattern)
    MarketingSignalProcessor.ts  # reuses SignalProcessor (public+connected+transaction adapters)
    MarketingResolver.ts         # adapts RDI results + public + connected + historical + transaction evidence
    methodology/                  # versioned: review_velocity_v1, local_visibility_v2, marketing_priority_v1
    recommendations/              # factor → opportunity → action → success-metric wiring
```

## Factor definition contract (per handoff Phase 2 + spec §36)
```yaml
marketing_factor:
  id:                 # e.g. mf_087_discovery_share_vs_competitors
  domainId:           # mkt_d18_competitive_market_intelligence
  label:
  description:
  evidenceClass:      # PUBLIC | CONNECTED | HYBRID | DERIVED
  funnelStages:       # [] AWARENESS..ADVOCACY
  requiredSignals:    # []
  optionalSignals:    # []
  status:             # HEALTHY | OPPORTUNITY | WEAK | CRITICAL | PENDING_DATA
                      #   | NOT_CONNECTED | NOT_APPLICABLE | INSUFFICIENT_HISTORY
  confidence:
  coverage:
  methodologyVersion:
  controllability:    # HIGH | MEDIUM | LOW
  expectedTimeToImpact: # SHORT | MEDIUM | LONG
  effort:             # LOW | MEDIUM | HIGH
```

## Signal definition contract (reuse RDI `SignalDefinition` shape)
Same `sig()` helper, `scoringMethod` (boolean/threshold/range/benchmark/categorical/ratio/custom), `freshnessPolicy`, `minimumConfidence`, `requiredEvidence`, `capabilityKey`. Add two fields for marketing:
```yaml
  evidenceClass:      # PUBLIC | CONNECTED | HYBRID | DERIVED
  connectionLevel:    # LEVEL0..LEVEL5  (internal capability state — never customer-facing)
```

## Status semantics are the spec's 8-state model (handoff Phase 8)
`HEALTHY | OPPORTUNITY | WEAK | CRITICAL | PENDING_DATA | NOT_CONNECTED | NOT_APPLICABLE | INSUFFICIENT_HISTORY`
**Hard invariant:** `NOT_CONNECTED != WEAK`. A restaurant is never penalized because Ristorante lacks account access. This must be enforced in both status resolution and UI copy.

---

# 6. Public-Intelligence Priority Batch

Highest-value factors Ristorante can deliver **without asking restaurants to connect accounts** (Level A / Phase 1 — spec §41). These are the recommended first executable increment.

## Tier 1 — Build now (high value, public, mostly reuse)
| Domain | Factors | Reuse | New public-work |
|--------|---------|-------|-----------------|
| Local Discovery | F16, F18 (supported), F17 partial, F19, F20 | gbp_profile, location_accuracy, local_search, ai_visibility | Real local-pack/SERP observation; Yelp/TripAdvisor/Apple Maps/Bing presence; controlled AI-visibility observation |
| Organic/Website | F22, F23, F24, F25 | website_health, SEOMarkup | crawler: robots/sitemap/canonical/schema/HTTPS/SERP snippet audit + content-coverage page scan |
| Reputation & Trust | F26–30 (supported) | avg_rating, review_volume_freshness, review_response, sentiment | minor theme depth for F29 |
| Menu Merchandising | F58 partial | menu_availability_quality | signature/best-seller/dietary prominence extraction |
| Social & Community | F36–40 | overall_trust (partial) | Social presence/cadence/engagement/UGC/creator-mention crawls |

## Tier 2 — Next (high value, public, moderate new build)
| Domain | Factors | Notes |
|--------|---------|-------|
| Brand Positioning | F6–10 | AI-validated extraction from website/reviews/menu; audience-profile reuse |
| Content & Creative | F31–35 | Website/social content freshness + photography/video + message quality |
| Conversion Experience | F46–50 | Site crawl: CTA clarity, friction, mobile conversion flow, trust elements |
| Ordering/Reservations | F51, F53 | Verify live ordering/reservation links + menu + pickup/delivery presence |
| Competitive & Market | F86–90 | Public competitor comparison (menu/price/review/visibility) |

**Tier 2 is the highest-fidelity "prove it" surface** — it moves from *presence* to *quality* with concrete, source-linked evidence.

## Explicitly defer to connected phases
F1–5, F11–15, F21, F41–45, F52, F54, F61–70, F72–85, F91–100 and all `transaction_data_required` / `historical_data_required` factors.

---

# 7. Connected-Intelligence Roadmap

Classified integrations required later (handoff Phase 5). **None are connected in this planning phase.**

| Integration | Factors enabled | Signals enabled | Data required | Permission scope | Customer value | Impl. complexity |
|-------------|-----------------|-----------------|---------------|------------------|----------------|------------------|
| Google Search Console | F13, F21, F25, F79 | impressions, clicks, CTR, position, queries | owned web property data | Webmaster/account OAuth | High (real search demand) | Medium |
| Google Analytics 4 (GA4) | F11, F12, F15, F46–50, F76–80 | traffic, events, conversions, attribution | analytics property | GA4 account OAuth | High | Medium |
| Google Ads | F41, F43, F45, F91–95 | spend, campaign, geo, audience, ROAS | ad account | AdWords OAuth | High | High |
| Meta Ads | F42, F44, F45, F91–95 | spend, audience, creative, ROAS | ad account | Meta OAuth | High | High |
| Email platform (Klaviyo/Mailchimp) | F66, F68, F69, F70 | list, opens, clicks, conversions, journeys | email account | OAuth/API | High | Low–Medium |
| SMS platform | F67 | opt-in/out, delivery, clicks | SMS account | OAuth/API | Medium | Low–Medium |
| CRM (e.g. HubSpot) | F61–65 | customer profile, segments, identity | CRM account | OAuth | High | Medium |
| Ordering platform (direct + 3rd-party) | F52, F57 | order funnel, cart, completion, abandonment | ordering account | OAuth/API | High | Medium |
| Reservation platform (OpenTable/Resy) | F54 | reservation funnel, lead-time, party size | reservation account | OAuth/API | High | Medium |
| Loyalty platform | F71, F72, F74 | program, rewards, personalization | loyalty account | OAuth/API | Medium | Medium |
| POS | F57, F73, F80 | transactions, repeat cohorts, revenue | POS account | Secure API | **High** | **High** |
| Call/directions (Google Business Profile/Maps) | F55, F80 | call clicks, direction requests, visits | GBP/Maps | OAuth | Medium | Medium |

**Connection-maturity states (spec §14, internal only):** LEVEL 0 public observation → LEVEL 1 website/search → LEVEL 2 advertising → LEVEL 3 CRM/lifecycle → LEVEL 4 ordering/POS → LEVEL 5 full marketing intelligence. Never shown as customer grades.

---

# 8. Recommendation Architecture

Internal intelligence → customer-safe recommendations. Preserve exactly the handoff's required relationship chain:

```
Factor weakness
    ↓
Supporting signals
    ↓
Evidence
    ↓
Root cause
    ↓
Opportunity
    ↓
Recommended action
    ↓
Success metric
```

**Reuse** the existing `RecommendationPlatform` merge/dedupe/prioritize machinery and the RT-1 Decision→Outcome→Feedback loop to close the loop (action→result→learning, F85 + spec §27–28).

Proposed internal recommendation shape (extends existing `Recommendation`):
```yaml
marketing_recommendation:
  restaurantId
  factorId / domainId
  rootCause:
  title:
  explanation:
  priority:            # from the priority model (§9)
  impact:              # LOW|MEDIUM|HIGH — expected marketing-system effect, never fabricated revenue
  effort:              # LOW|MEDIUM|HIGH
  confidence:          # HIGH|MEDIUM|LOW
  urgency:
  dependencies:        # []
  recommendedAction:
  successMetric:       # how we will know it worked
  status:              # IDENTIFIED|RECOMMENDED|ACCEPTED|IN_PROGRESS|COMPLETED|MEASURING|IMPROVED|NO_EFFECT|REGRESSED
  evidenceRefs:        # []
  actionHorizon:       # IMMEDIATE|7 DAYS|30 DAYS|90 DAYS|LONG TERM
```

**Customer-facing output stays concise.** The customer should see ONLY:
```
TOP OPPORTUNITIES (3–5) → WHY THIS MATTERS → WHAT WE OBSERVED → WHAT TO DO → EXPECTED EFFECT → HOW WE WILL MEASURE IT
```
Never the 100-factor internals.

---

# 9. Priority Model — Proposed Methodology

Deterministic, versioned, not finalized (returned separately as requested). Conceptual formula (handoff Phase 7 + spec §11):

```
Priority =
Problem Severity
× Expected Impact
× Confidence (evidence-derived, not confidence-of-model)
× Strategic Relevance   — requires connected objective; default neutral until F1 is set
× Controllability
÷ Effort
```

**Placeholder weighting (to be calibrated, not shipped):**
```yaml
# marketing-priority-v1 (PROPOSED — constants not final)
components:
  problem_severity:      # 1..5 from factor status (CRITICAL=5, WEAK=4, OPPORTUNITY=3, HEALTHY=1)
  expected_impact:       # 1..3  (LOW|MEDIUM|HIGH) — marketing-system effect, not revenue
  confidence:            # 0..1  (evidence-derived)
  strategic_relevance:   # 0..1  (default 0.5 until F1 objective is connected; never assume alignment)
  controllability:       # HIGH=1.0 | MEDIUM=0.7 | LOW=0.4
  effort:                # LOW=1 | MEDIUM=2 | HIGH=3  (denominator)

priority_score =
  (severity × impact × confidence × strategic_relevance × controllability)
  / effort
```
**Guardrails:**
- A `NOT_CONNECTED` / `PENDING_DATA` factor is **excluded** from the priority queue at any position — it is a *coverage gap*, not a problem. Do not let "missing data" masquerade as "do this next".
- Never return "Review Response Rate = 34, so fix that first" purely by score. Factor in the restaurant's objective (F1). The spec §11 example (weekday-lunch objective over a lower-score general factor) is the canonical discipline.
- `priority_score=0` factors are dropped, never surfaced near the top by accident.

This methodology must live in `methodology/marketing_priority_v1.ts` with a version string so history is not silently reinterpreted (spec §47).

---

# 10. Data Semantics

Preserve the exact 8-state factor status with strict distinctions (handoff Phase 8):

| Status | Meaning | Distinct from |
|--------|---------|---------------|
| HEALTHY | Measured, performing well | — |
| OPPORTUNITY | Measured, improvement available | — |
| WEAK | Measured, underperforming | — |
| CRITICAL | Measured, urgently weak | — |
| PENDING_DATA | No evidence yet; not scored | — |
| NOT_CONNECTED | Ristorante lacks account access | **≠ WEAK** |
| NOT_APPLICABLE | Capability genuinely absent (e.g. no reservations) | neutral, excluded |
| INSUFFICIENT_HISTORY | Not enough repeated observations for trend | **≠ WEAK** |

**Two hard, non-negotiable rules (restate from spec §4 + existing PROJECT_MEMORY honesty):**
1. `NOT_CONNECTED != WEAK` — the restaurant is never penalized for Ristorante lacking access.
2. `INSUFFICIENT_HISTORY` / `PENDING_DATA` never become a fabricated score or a 0. Reuse the existing `pending exclusion from denominator` semantics from `FactorEngine.ts` — pending contributes nothing, never zero.

These mirror the already-baked-in RDI rules (`hasRealContent()`, `pending_observation`, `MIN_PEERS` benchmark guard). Carry them forward.

---

# 11. Internal-Only Boundary

Confirm how to prevent accidental customer exposure:

- **No customer-facing route exposes all 100 factors.** Do not create `/api/customer/marketing-factors/100` or a dashboard page listing 100 scores (spec §42). No route named with a count of factors.
- **Internal services only** consume: `MarketingIntelligenceSnapshot`, `MarketingOpportunity[]`, `MarketingRecommendation[]`, `MarketingEvidenceGraph` (spec §43).
- **Customer APIs return curated outputs:** `topOpportunities[]` with `{title, why, nextAction, confidence}` — never raw factor ids/scores (spec §44).
- **Registry + engine live under `backend/src/domain/marketing-intelligence/` — an internal domain module, not a route module.**
- **Connection-maturity levels are internal capability states**, never customer grades (spec §14, §15).
- Suggested guard: a `marketing-intelligence` route/controller must be explicitly flagged internal and excluded from the public route manifest; an internal-only test asserts no customer route returns a `MarketingFactor[]` payload.

---

# 12. Required DB / Schema Changes (if any)

**No destructive migration. No broad product redesign. No change to frozen RDI tables.**

Recommended additive, conservative approach — mirror the existing RDI pattern (definitions in code registry, not persisted per row; only observations/results persisted):

- **Reuse** `EvidenceObservation` / `EvidenceRecord` / `EvidenceProvenance` / `EvidenceTimeline` — they are already generic (`entityType`/`entityId`/`payload`); marketing factors are just new `entityType` values (e.g. `marketing_factor`, `marketing_signal`). **No new table required for evidence.**
- **Reuse** `ObservationSource` / `ObservationConnector` / `ObservationCrawl` / `ObservationFreshness` — public + connected sources already supported via `type` (api/crawl/manual/internal).
- **Reuse** `KnowledgeAssertion` / `KnowledgeFact` / `KnowledgeRecommendation` for the factor/signal semantic graph and marketing recommendations.
- **Reuse** `Decision` / `Outcome` / `Feedback` for action tracking.
- **Reuse** `ScorecardSnapshot` for point-in-time marketing snapshots (add `entityType` optional, or a new `MarketingSnapshot` additive model if factor scores differ materially from RDI snapshots).
- **Optional additive models** (only if needed, marked additive, no column changes to existing tables):
  - `MarketingFactorObservation` (spec §37) — per-restaurant factor status/score/confidence/coverage/methodologyVersion; can derive from `EvidenceRecord` + in-memory resolver instead.
  - `ConnectedAccount` (OAuth token + `permissionScope` + `integrationType`) — needed for LEVEL 1–5; securely stores access tokens. **High security surface — see §14.**
  - `MarketingOpportunity` (spec §10) — factor/rootCause/evidence/current/desired/impact/confidence/effort/urgency/dependencies/action/verification.

**Design-first default:** prefer reusing the evidence/knowledge/decision tables and resolving factor observations in-memory (like RDI) before adding any new tables. A migration is only warranted when a new persisted object is proven necessary.

---

# 13. Required Dependencies (if any)

**No new paid service. No new external provider in this planning phase.**

For the **public-intelligence batch (§6)**: build on existing scraping/scanning + AI capability layer (NVIDIA NIM → Ollama Cloud → local Ollama) already in `backend/src/infrastructure/ai/`. Public-data factors need **no new dependencies** — they reuse existing crawlers, connectors, and validated-AI extraction. Optional OSS crawler helpers may be added but are already largely covered by the existing `crawl`/`scan`/`connector`/`services/connectors` stack.

For **future connected phases (§7)** each integration is a dependency decision made when that phase is reached (Search Console/GA4/Ads/Meta/email/SMS/CRM/ordering/reservations/loyalty/POS SDKs + OAuth). These are deliberately deferred and each must pass a review gate before being pulled in. No new paid SaaS is implied by Phase 1.

---

# 14. Security Implications

- **Connected marketing data is tenant-scoped, authenticated, permission-controlled, encrypted where appropriate, never cross-restaurant, never unnecessarily exposed in prompts** (spec §45).
- **OAuth tokens / credentials of connected accounts are the critical secret.** Must follow the existing credential hygiene (see `Connector.credentials` "encrypted in prod"; no hardcoded creds — a P0 was already fixed for admin passwords). Token storage plan must be reviewed before LEVEL 1.
- **Privacy:** customer-level data only processed with a valid permissioned basis; data minimization; Ristorante need not retain every raw customer field (spec §46).
- **Internal-only exposure guard** (§11): no customer route leaks factor internals.
- **No new auth model** is required in Phase 1 (public factors need restaurant-level scoping already present via `RestaurantMember`/`OrganizationRestaurant`). Connected phases add OAuth scopes — reviewed at that phase.
- **Prompt exposure control:** connected metrics (spend, orders, revenue, customer identity, attribution) must not be sent to AI prompts unnecessarily (spec §23 AI boundary). Keep deterministic pipelines AI-free.

---

# 15. Implementation Phases

Recommended phasing (mirrors spec §40 implementation order + RDI signal-design phases). **Nothing is auto-executed; each phase is a separate approved increment.**

```
PHASE 1  Registry & types     Define 20 domains → 100 factors → signals + validateRegistry()
PHASE 2  Map RDI reuse        Wire the 25 existing factors into their marketing factor equivalents
PHASE 3  Map public signals   Adapt already-collected public evidence into marketing signals
PHASE 4  Internal diagnostic  Build the 8-state status layer + priority model v1 (public factors only)
PHASE 5  Connect analytics    Search Console → GA4 (LEVEL 1)
PHASE 6  Connect advertising  Google Ads → Meta Ads (LEVEL 2)
PHASE 7  Connect CRM/lifecycle email/SMS/CRM/loyalty (LEVEL 3)
PHASE 8  Connect transactions ordering/reservations/POS (LEVEL 4)
PHASE 9  Attribution          Build measurement/attribution (spec §16)
PHASE 10 Close loop           Action → result → learning (F85); LEVEL 5
```

First executable increment = **Phase 1 registry + Phase 2 reuse map + Phase 3 on the Tier-1 public batch**, with no connected accounts and no new dependencies.

---

# 16. Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| **Spec path confusion** (handoff cited nonexistent `docs/marketing-intelligence/`) | High | Canonical spec is `rist-rdi-008`. Do not fork. Documented in §0. |
| Attempting all 100 factors at once | High | Phase-gate; execute public Tier-1/2 only. Spec §40 is explicit. |
| `NOT_CONNECTED` misread as `WEAK` → restaurant unfairly penalized | High | 8-state status + hard-invariant enforcement + UI copy; deterministic tests. |
| Scope creep into connected/paid/transaction without approval | High | §5/§7 roadmaps are plans only; STOP_GATE on any connect. |
| Double-counting signals across domains (spec §20) | Medium | Canonical single-origin rule; one observation may feed multiple analyses only via explicit relationship rules; control aggregate weighting. |
| Fabricated attribution/revenue (spec §23 AI boundary) | Medium | Deterministic pipelines own measurement; AI never invents conversion counts/revenue; "never estimate without evidence." |
| Parallel architecture drift | Medium | Reuse RDI machinery; share `SignalProcessor`/`FactorEngine`/evidence/decision infra. |
| Connected OAuth token exposure | Medium | Tenant-scoped, encrypted, permission-controlled; secret-review gate before LEVEL 1. |
| Public-quality signals (presence-only) mistaken for quality | Medium | Status/confidence reflect evidence source (presence < live column < connector); `partially_supported` honesty. |
| Migration disruption to frozen RDI | Low (by construction) | No change to 25-factor scoring/APIs; additive internal layer only. |

---

# 17. Deferred Items

Explicitly deferred (no work now; each is a future, separately-approved phase):
- Any connected account integration (Search Console, GA4, Ads, Meta, email, SMS, CRM, ordering, reservation, loyalty, POS).
- All `connected_data_required` / `transaction_data_required` / `historical_data_required` / `future_only` factors (F1–5, 11–15, 21, 41–45, 52, 54, 57, 61–85, 91–100, and historical-capacity factors).
- All `marketing_priority` constant calibration, attribution, experimentation, marketing-economics, governance/resilience factors.
- Multi-tenant enforcement completion (RIST-MT-001) — unrelated to this model but a prerequisite security baseline for connected data.
- Creating a `docs/marketing-intelligence/` directory (avoids spec fork).

---

# 18. Recommended First Executable Increment

> **UPDATE (design correction, per `docs/ristorante-marketing-intelligence-architecture.md` §61–62 & the SOLID principles doc):** the previously-landed single `FactorEvaluator.ts` (155 lines, factor-specific logic inlined, no strategy/policy separation) failed 5 of 7 axes on the blueprint's Immediate-Correction gate. Per §61/§62 it is being **corrected, not expanded**. The corrected foundation is the blueprint's layer shape (§3): `types/`, `registry/` (domain + factor + methodology), `strategies/` (scoring), `policies/` (status/coverage/confidence/freshness), `evaluation/` (generic evaluator + opportunity detector + priority engine + recommendation builder), then one use case and a real-data vertical slice (§46–47). Factor definitions become declarative (`signals[]`, `methodology{type,version}`, `applicability`, `freshnessExpectation`) per §5–6; the `FactorEvaluator` knows no factor-specific logic (§8); extension adds a registry entry + existing strategy, never an engine edit (§8, §51). This supersedes the earlier `FactorEvaluator.ts`/registry re-plan in this section.

A self-contained, **internal-only diagnostic layer** delivered without connected accounts, without new dependencies, without touching frozen RDI. **Backend design follows `docs/ristorante-implementation-principles.md` (SOLID) + `docs/ristorante-marketing-intelligence-architecture.md` (implementation blueprint).**

Target structure under `backend/src/domain/marketing-intelligence/`:
- `types/` — `marketing-factor.ts`, `marketing-signal.ts`, `marketing-opportunity.ts`, `marketing-recommendation.ts`, `evidence.ts` (pure domain types)
- `registry/` — `marketing-domain-registry.ts` (20 domains), `marketing-factor-registry.ts` (**100 declarative factors**: signals[], methodology{type,version}, applicability, evidence-class, funnel, freshness), `methodology-registry.ts` (name→strategy dispatch)
- `strategies/` — `signal-scoring-strategy.ts` (interface) + boolean/threshold/range/ratio/benchmark/categorical/trend/composite (reusable; 6–10 support ~all factors per §9)
- `policies/` — `factor-status-policy.ts`, `factor-coverage-policy.ts`, `confidence-policy.ts`, `freshness-policy.ts` (cross-cutting rules externalized per §11)
- `evaluation/` — `factor-evaluator.ts` (generic: applies declaration + strategy + policies; knows zero factor-specific rules per §8), `opportunity-detector.ts` (detect only, §13), `priority-engine.ts` (rank only, versioned `marketing_priority_v1`, §15), `recommendation-builder.ts` (§18)

First vertical slice (§47): 8–12 **real-data-backed** factors (Google Business Presence, Local Search Visibility, Website Technical Health, Review Strength/Freshness/Management, Menu Availability, Online Ordering, Reservation Availability) proven end-to-end (Evidence→Signal→Factor→Opportunity→Priority→Recommendation→customer-safe projection) on current real RTP restaurants — no synthetic data.

**Acceptance (Definition of Done):**
- Registry valid: exactly 20 domains, 100 factors, unique IDs, valid domain + methodology + evidence classes, required-signal refs valid, no orphan signals, methodology version present (§53).
- Generic `FactorEvaluator`: passes §62 gate (`generic:true`, no 100-factor switch, no embedded factor rule, registry_driven, strategy_driven, status_policy_externalized, confidence_policy_externalized).
- **OCP proof test** (§51): a test-only factor using an existing strategy evaluates correctly with `FactorEvaluator` source **unchanged**.
- `OpportunityDetector` only detects WEAK/CRITICAL (never NOT_CONNECTED/PENDING_DATA/NA); `PriorityEngine` only ranks (versioned); `RecommendationBuilder` only builds.
- Status tests (§55): missing connected → NOT_CONNECTED; insufficient history → INSUFFICIENT_HISTORY; not relevant → NOT_APPLICABLE; missing public → PENDING_DATA; no accidental zero.
- Domain purity (§52): domain imports none of @prisma/express/http/provider SDKs.
- Real-data vertical slice on The Mill Raleigh produces the §49 structural shape.
- **No change** to frozen RDI scoring, no connected account code, no new dependency, no migration, no customer-facing 100-factor exposure, RIST-AI-001 preserved.

---

# STOP GATES

Per the handoff, implementation halts and returns a **STOP_GATE** if the design requires any of:
- **changing the frozen 25-factor RDI** → not required; additive parallel layer only
- **changing score mathematics** → not required; marketing factors are a separate internal score domain
- **major DB redesign** → not required; evidence/knowledge/decision reuse; only optional additive models
- **new paid service** → not required for Phase 1
- **new external provider** → not required for Phase 1 (deferred to connected phases)
- **new auth model** → not required for Phase 1
- **customer-facing exposure of all 100 factors** → explicitly prohibited and guarded against
- **major new dependency** → not required for Phase 1
- **destructive migration** → not required
- **broad product redesign** → not required

**No STOP_GATE is triggered for the recommended first increment.** None of the frozen invariants, score math, DB, dependencies, or customer surface are changed.

---

## Final Operating Principle (spec §50, §52)

> **Keep the complexity inside Ristorante and deliver clarity to the restaurant.**
> The 100-factor marketing intelligence model is an internal decision system, not a customer-facing dashboard.
> Immediate mission: **Understand → map → design → prioritize.** Do not build the entire marketing intelligence system yet.
