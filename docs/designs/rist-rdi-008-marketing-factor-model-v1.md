# Ristorante Internal Restaurant Marketing Intelligence System

## Complete Marketing System Factor Model v1.0

## Status

**INTERNAL IMPLEMENTATION SPECIFICATION**

Scope:

**RistoranteDiscovery / Ristorante Marketing Intelligence**

Visibility:

**INTERNAL ONLY**

This model must **not be exposed directly to customers as a 100-factor scorecard**.

The purpose of this framework is to give Ristorante a comprehensive internal understanding of the marketing system surrounding a restaurant.

Ristorante may use this intelligence to produce:

* prioritized problems
* recommended actions
* explanations
* opportunities
* campaign suggestions
* marketing plans
* alerts
* benchmarks
* monitoring
* improvement measurement

The restaurant owner should receive the **answer**, not the complexity of the entire internal model.

---

# 1. Core Product Philosophy

The marketing system should answer:

```text
WHO SHOULD CHOOSE THIS RESTAURANT?
          ↓
CAN THEY DISCOVER IT?
          ↓
DO THEY UNDERSTAND IT?
          ↓
DO THEY TRUST IT?
          ↓
CAN WE REACH THEM?
          ↓
CAN WE CONVERT THEM?
          ↓
CAN WE IDENTIFY THEM?
          ↓
CAN WE BRING THEM BACK?
          ↓
CAN WE CREATE ADVOCACY?
          ↓
CAN WE MEASURE ALL OF THIS?
          ↓
CAN WE LEARN AND IMPROVE?
```

---

# 2. Internal Intelligence Architecture

```text
PUBLIC OBSERVATIONS
CONNECTED MARKETING ACCOUNTS
CUSTOMER / TRANSACTION DATA
CAMPAIGN DATA
COMPETITOR DATA
HISTORICAL OBSERVATIONS
            │
            ▼
────────────────────────────────────────
      MARKETING SIGNAL INTELLIGENCE
────────────────────────────────────────
            │
            ▼
20 INTERNAL INTELLIGENCE DOMAINS
            │
            ▼
100 INTERNAL MARKETING FACTORS
            │
            ▼
Hundreds of supporting signals
            │
            ▼
Problems / Opportunities / Causes
            │
            ▼
Recommended Marketing Actions
            │
            ▼
Expected / Measured Impact
```

---

# 3. Data Availability Classes

Every factor must declare its evidence class.

## PUBLIC

Can be evaluated using publicly observable evidence.

Examples:

* Google
* website
* reviews
* search results
* social channels
* public menus
* delivery/reservation platforms

---

## CONNECTED

Requires permissioned access to a restaurant-owned system.

Examples:

* GA4
* Search Console
* Google Ads
* Meta Ads
* CRM
* email
* SMS
* POS
* reservation system
* loyalty platform

---

## DERIVED

Calculated using other verified signals.

Examples:

* opportunity
* channel efficiency
* growth gap
* customer retention health
* attribution confidence

---

## HYBRID

Uses both public and connected signals.

---

# 4. Internal Factor Status

Every internal factor supports:

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

Do not confuse:

```text
NOT_CONNECTED
```

with:

```text
WEAK
```

Lack of Ristorante access is not poor restaurant performance.

---

# 5. Internal Marketing Domains

The complete model contains:

| #  | Domain                                         | Factors |
| -- | ---------------------------------------------- | ------: |
| 1  | Market & Business Context                      |       5 |
| 2  | Brand Positioning                              |       5 |
| 3  | Audience & Demand Intelligence                 |       5 |
| 4  | Local Discovery                                |       5 |
| 5  | Organic Search & Website Discovery             |       5 |
| 6  | Reputation & Trust                             |       5 |
| 7  | Content & Creative                             |       5 |
| 8  | Social & Community                             |       5 |
| 9  | Paid Customer Acquisition                      |       5 |
| 10 | Digital Conversion Experience                  |       5 |
| 11 | Ordering, Reservations & Local Actions         |       5 |
| 12 | Offers & Menu Merchandising                    |       5 |
| 13 | First-Party Data & CRM                         |       5 |
| 14 | Lifecycle Marketing                            |       5 |
| 15 | Loyalty, Retention & Advocacy                  |       5 |
| 16 | Analytics, Measurement & Attribution           |       5 |
| 17 | Experimentation & Optimization                 |       5 |
| 18 | Competitive & Market Intelligence              |       5 |
| 19 | Marketing Economics & Resource Allocation      |       5 |
| 20 | Governance, Data Quality & Marketing Execution |       5 |
|    | **TOTAL**                                      | **100** |

---

# DOMAIN 1 — Market & Business Context

These factors establish what marketing should actually achieve.

---

## Factor 1 — Business Objective Clarity

Determine whether the restaurant has a clear marketing objective.

Signals:

* increase dine-in visits
* increase online orders
* increase reservations
* increase lunch traffic
* increase weekday traffic
* grow catering
* grow delivery
* improve repeat visits
* launch new location
* increase awareness

Without objective clarity, channel optimization becomes meaningless.

**Evidence:** HYBRID

---

## Factor 2 — Revenue-Channel Priorities

Understand which channels matter commercially.

Potential channels:

* dine-in
* takeout
* delivery
* direct online order
* third-party delivery
* reservations
* catering
* private dining
* events
* gift cards

Marketing priorities should reflect actual strategic importance.

**Evidence:** CONNECTED

---

## Factor 3 — Location Economics Context

Understand the location environment.

Signals:

* residential area
* business district
* shopping district
* tourist district
* university area
* commuter area
* walkability
* parking dependency
* delivery catchment
* neighborhood density

This is context, not a direct performance score.

**Evidence:** PUBLIC + CONNECTED

---

## Factor 4 — Service / Daypart Strategy

Understand the restaurant's useful marketing periods.

Examples:

* breakfast
* brunch
* lunch
* afternoon
* happy hour
* dinner
* late-night
* weekday
* weekend

Identify:

* high demand
* weak demand
* available capacity
* promotional opportunity

**Evidence:** CONNECTED

---

## Factor 5 — Growth Objective Alignment

Evaluate whether marketing activity aligns to business priorities.

Example:

```text
Business objective:
Increase weekday lunch.

Marketing behavior:
80% of campaigns promote weekend dinner.

Result:
Strategic misalignment.
```

**Evidence:** DERIVED

---

# DOMAIN 2 — Brand Positioning

---

## Factor 6 — Brand Positioning Clarity

Signals:

* cuisine clearly communicated
* restaurant concept
* experience proposition
* customer segment
* dining occasion
* positioning statement
* reason to choose

---

## Factor 7 — Unique Value Proposition

Identify differentiators:

* signature cuisine
* signature dishes
* chef
* heritage
* premium ingredients
* authenticity
* convenience
* price/value
* service style
* atmosphere
* dietary specialization

---

## Factor 8 — Brand Consistency

Evaluate consistency across:

* website
* Google
* social profiles
* delivery
* reservation platforms
* menus
* advertising
* email

Signals:

* name
* logo
* imagery
* colors
* voice
* description
* positioning

---

## Factor 9 — Audience-Brand Fit

Determine whether current branding appeals to intended audiences.

Examples:

* families
* young professionals
* students
* corporate diners
* premium diners
* tourists
* health-conscious customers
* vegetarian customers

---

## Factor 10 — Occasion Positioning

Identify which dining occasions the restaurant owns.

Examples:

* date night
* quick lunch
* family dinner
* business lunch
* celebration
* casual dinner
* late-night
* brunch
* group dining

---

# DOMAIN 3 — Audience & Demand Intelligence

---

## Factor 11 — Target Customer Definition

Determine whether useful audience segments exist.

Signals:

* demographic groups
* behavioral segments
* geographic segments
* purchase patterns
* cuisine preferences
* occasion segments

---

## Factor 12 — Geographic Demand

Understand customer geography.

Signals:

* ZIP/postcode demand
* neighborhood demand
* drive-time radius
* delivery radius
* visitor origin
* commuter flow

---

## Factor 13 — Search Demand

Observe:

* branded search
* cuisine searches
* dish searches
* restaurant-near-me
* location + cuisine
* occasion searches
* ordering searches
* reservation searches

Search Console can provide impressions, clicks, CTR, average position, and query-level information for owned web properties.

---

## Factor 14 — Demand Seasonality

Identify changes around:

* weekday/weekend
* holidays
* weather
* seasons
* local events
* sports
* festivals
* school/university cycles

---

## Factor 15 — Customer Intent Mix

Classify demand:

```text
DISCOVER
COMPARE
MENU RESEARCH
PRICE RESEARCH
DIRECTIONS
CALL
ORDER
RESERVE
EVENT / CATERING
```

---

# DOMAIN 4 — Local Discovery

This domain uses the existing Ristorante Discovery Intelligence subsystem.

Google states that local results are mainly influenced by relevance, distance, and prominence, while profile completeness, reviews and links contribute to how businesses are understood and surfaced.

---

## Factor 16 — Google Business Presence

Internal signals include:

* profile existence
* profile completeness
* categories
* hours
* menu
* ordering
* reservation links
* attributes
* photos
* social links

Google Business Profile currently supports website information, certain action links, attributes, photos/videos and, in supported regions, multiple social-platform links.

---

## Factor 17 — Local Search Visibility

Signals:

* Maps ranking
* local-pack visibility
* cuisine searches
* neighborhood searches
* non-brand search presence
* query coverage

---

## Factor 18 — Location / NAP Accuracy

Signals:

* name
* address
* phone
* map pin
* postcode
* unit number
* citation consistency

---

## Factor 19 — Platform Discovery Coverage

Observe presence on:

* Google
* Yelp
* TripAdvisor
* Apple Maps
* Bing
* reservation platforms
* delivery platforms
* local directories

---

## Factor 20 — AI / Conversational Discovery

Controlled observation of:

* AI recommendations
* citation inclusion
* restaurant mention rate
* cuisine accuracy
* location accuracy
* query coverage

Internal RAG does not count.

---

# DOMAIN 5 — Organic Search & Website Discovery

---

## Factor 21 — Search Visibility

Signals:

* impressions
* clicks
* CTR
* search positions
* query coverage
* branded/non-branded mix

---

## Factor 22 — Technical SEO

Signals:

* crawlability
* indexability
* canonical configuration
* sitemap
* robots
* HTTPS
* errors
* structured data
* performance

---

## Factor 23 — Local SEO Relevance

Signals:

* cuisine/location content
* location page
* neighborhood relevance
* restaurant schema
* menu content
* directions
* local terminology

---

## Factor 24 — Search Content Coverage

Evaluate pages for:

* cuisine
* menu
* dishes
* events
* catering
* private dining
* reservations
* ordering
* location
* FAQ

---

## Factor 25 — Search Snippet Effectiveness

Signals:

* title
* description
* search intent match
* CTR
* structured appearance
* rich-result eligibility

---

# DOMAIN 6 — Reputation & Trust

Current consumer research continues to show that review recency, consistency, rating quality and owner responses influence local purchasing decisions.

---

## Factor 26 — Rating Strength

Signals:

* platform rating
* weighted rating
* rating distribution
* rating stability
* peer comparison

---

## Factor 27 — Review Volume

Signals:

* total reviews
* peer comparison
* review-source diversity
* volume trend

---

## Factor 28 — Review Freshness & Velocity

Signals:

* reviews 30d
* reviews 90d
* latest-review age
* review velocity
* velocity trend

---

## Factor 29 — Review Sentiment & Themes

Interpret:

* food
* service
* value
* ambience
* wait time
* cleanliness
* consistency
* staff

AI may interpret real review evidence.

---

## Factor 30 — Review Management

Signals:

* response rate
* negative response rate
* response speed
* response quality
* unresolved complaints

---

# DOMAIN 7 — Content & Creative

---

## Factor 31 — Content Strategy

Assess whether content supports:

* discovery
* trust
* menu education
* conversion
* promotions
* retention

---

## Factor 32 — Content Freshness

Signals:

* website freshness
* social freshness
* menu updates
* promotion updates
* event updates

---

## Factor 33 — Food Photography

Evaluate:

* quality
* consistency
* dish coverage
* authenticity
* recency
* mobile impact

---

## Factor 34 — Video Content

Signals:

* short video
* dish preparation
* chef
* atmosphere
* testimonials
* events
* menu showcases

---

## Factor 35 — Creative Message Quality

Evaluate:

* hook
* benefit
* clarity
* offer
* CTA
* local relevance
* branding
* differentiation

---

# DOMAIN 8 — Social & Community

---

## Factor 36 — Social Channel Coverage

Relevant platforms may include:

* Instagram
* Facebook
* TikTok
* YouTube
* other relevant regional channels

Do not penalize absence from irrelevant channels.

---

## Factor 37 — Social Publishing Consistency

Signals:

* posting cadence
* freshness
* content mix
* channel consistency

---

## Factor 38 — Social Engagement

Signals:

* comments
* shares
* saves where available
* reactions
* engagement rate
* customer conversations

---

## Factor 39 — User-Generated Content

Signals:

* tagged content
* food photos
* customer videos
* creator content
* UGC freshness
* UGC sentiment

---

## Factor 40 — Community / Creator Authority

Observe:

* local creators
* food bloggers
* local press
* event participation
* neighborhood organizations
* community partnerships

---

# DOMAIN 9 — Paid Customer Acquisition

---

## Factor 41 — Paid Search Strategy

Evaluate:

* branded campaigns
* cuisine campaigns
* location searches
* dish searches
* catering searches
* competitor intent where appropriate

---

## Factor 42 — Paid Social Strategy

Evaluate:

* awareness
* local audience
* promotions
* video campaigns
* retargeting
* event campaigns

---

## Factor 43 — Geographic Targeting

Signals:

* location radius
* postal targeting
* exclusions
* delivery zone
* commuter targeting
* workplace districts

---

## Factor 44 — Paid Creative Quality

Evaluate:

* asset diversity
* image/video
* message
* CTA
* local relevance
* creative freshness

---

## Factor 45 — Paid Audience Strategy

Assess:

* prospecting
* customer lists
* remarketing
* lookalike/similar audiences where available
* high-value audiences
* lapsed audiences

Google's store-goal campaigns can optimize for physical-location outcomes such as store visits, store sales, contacts and directions, demonstrating why offline/local intent should be part of restaurant acquisition measurement rather than treating marketing as website traffic alone.

---

# DOMAIN 10 — Digital Conversion Experience

---

## Factor 46 — Primary CTA Clarity

Can users immediately:

* view menu
* order
* reserve
* call
* get directions

---

## Factor 47 — Conversion Path Length

Measure number of actions required to:

* order
* reserve
* call
* find directions
* submit catering inquiry

---

## Factor 48 — Mobile Conversion Experience

Evaluate:

* menu
* ordering
* reservation
* forms
* call
* directions

---

## Factor 49 — Conversion Friction

Detect:

* broken CTA
* login friction
* redirects
* excessive steps
* confusing menus
* poor forms
* unavailable actions

---

## Factor 50 — Conversion Trust

Signals near conversion:

* reviews
* photos
* price clarity
* cancellation policy
* secure checkout
* contact information
* confirmation

---

# DOMAIN 11 — Ordering, Reservations & Local Actions

Google Ads explicitly supports local-action conversions such as call clicks and direction requests for physical locations.

---

## Factor 51 — Online Ordering Availability

Evaluate:

* direct ordering
* third party
* working links
* menu availability
* pickup
* delivery

---

## Factor 52 — Ordering Conversion Quality

Connected signals:

* menu view
* cart start
* checkout
* completed order
* abandonment
* order conversion rate

---

## Factor 53 — Reservation Availability

Signals:

* reservation provider
* CTA
* availability
* mobile flow
* confirmation

---

## Factor 54 — Reservation Conversion Quality

Connected:

* reservation start
* completion
* abandonment
* party-size patterns
* booking lead time

---

## Factor 55 — Calls / Directions / Visits

Measure where possible:

* click-to-call
* phone calls
* direction requests
* Maps actions
* store visits
* location interactions

---

# DOMAIN 12 — Offers & Menu Merchandising

---

## Factor 56 — Offer Strategy

Evaluate:

* objective
* audience
* value
* timing
* channel
* measurement

---

## Factor 57 — Promotional Economics

Where data exists:

* discount
* margin impact
* incremental orders
* cannibalization
* repeat impact

---

## Factor 58 — Menu Merchandising

Evaluate:

* signature dish prominence
* best-seller prominence
* profitable-item prominence where connected
* description quality
* photography
* category ordering

---

## Factor 59 — Daypart Promotions

Evaluate:

* lunch
* happy hour
* weekday
* late night
* brunch
* slow-period offers

---

## Factor 60 — Seasonal / Event Marketing

Signals:

* holidays
* local events
* sports
* festivals
* limited-time menu
* launches

---

# DOMAIN 13 — First-Party Data & CRM

---

## Factor 61 — Customer Data Capture

Sources:

* ordering
* reservations
* loyalty
* email
* SMS
* Wi-Fi
* catering

---

## Factor 62 — Customer Profile Completeness

Signals:

* email
* phone
* purchase history
* visit history
* preferences
* location
* consent

---

## Factor 63 — Customer Identity Resolution

Determine whether the same customer can be recognized across:

* orders
* reservations
* loyalty
* email
* SMS

---

## Factor 64 — Customer Segmentation

Useful segments:

* new
* repeat
* high-value
* frequent
* lapsed
* delivery
* dine-in
* catering
* VIP

---

## Factor 65 — Preference Intelligence

Where permissioned data exists:

* favorite dishes
* dietary preferences
* preferred daypart
* preferred location
* preferred channel
* dining occasion

---

# DOMAIN 14 — Lifecycle Marketing

---

## Factor 66 — Email Marketing Health

Measure:

* list growth
* delivery
* opens where meaningful
* clicks
* conversion
* unsubscribes
* segmentation

---

## Factor 67 — SMS Marketing Health

Measure:

* opt-in
* delivery
* clicks
* conversions
* opt-out
* cadence

---

## Factor 68 — Welcome Journey

Evaluate:

```text
NEW CUSTOMER
    ↓
WELCOME
    ↓
VALUE / STORY
    ↓
SECOND VISIT
```

---

## Factor 69 — Post-Visit Journey

Possible flows:

* thank-you
* feedback
* review request
* recommendation
* next visit

---

## Factor 70 — Win-Back Journey

Segments:

* 30-day inactive
* 60-day inactive
* 90-day inactive
* high-value lapsed

---

# DOMAIN 15 — Loyalty, Retention & Advocacy

Restaurant-specific research continues to show substantial interest in personalization and tailored loyalty experiences, while many guests still report limited personalized recognition.

---

## Factor 71 — Loyalty Program Availability

Evaluate:

* program exists
* discoverable
* easy enrollment
* digital support

---

## Factor 72 — Reward Quality

Evaluate:

* reward value
* clarity
* attainability
* relevance
* personalization

---

## Factor 73 — Repeat Visit Health

Connected metrics:

* repeat customer percentage
* visit frequency
* time between visits
* retention cohorts

---

## Factor 74 — Personalization

Examples:

* favorite dishes
* birthday
* prior purchase
* preferred location
* tailored rewards
* personal recognition

---

## Factor 75 — Referral / Advocacy

Measure:

* referrals
* sharing
* review generation
* ambassador behavior
* referral conversion

---

# DOMAIN 16 — Analytics, Measurement & Attribution

GA4 treats important business actions as key events and supports attribution across the path to those events.

---

## Factor 76 — Analytics Foundation

Check:

* GA4
* Search Console
* tag manager
* ads integration
* relevant pixels
* consent configuration

---

## Factor 77 — Event Taxonomy

Recommended restaurant events:

```text
menu_view
order_click
order_start
order_complete

reservation_click
reservation_start
reservation_complete

call_click
directions_click

catering_view
catering_lead

gift_card_purchase

loyalty_signup
email_signup
sms_signup
```

---

## Factor 78 — Key Event Integrity

Verify:

* right events marked important
* duplicates absent
* events firing
* correct parameters
* correct environment

---

## Factor 79 — Attribution Quality

Assess:

* source
* medium
* campaign
* UTMs
* channel grouping
* attribution settings
* offline actions
* cross-channel paths

---

## Factor 80 — Marketing-to-Business Outcome Linkage

Highest maturity connects:

```text
Marketing
→ Interaction
→ Conversion
→ Customer
→ Order / Reservation
→ Repeat Visit
→ Revenue
```

Ristorante should never fabricate this connection when data is unavailable.

---

# DOMAIN 17 — Experimentation & Optimization

---

## Factor 81 — Experimentation Capability

Can the restaurant run controlled tests?

Examples:

* landing pages
* offers
* ads
* email
* menu placement

---

## Factor 82 — Creative Testing

Test:

* imagery
* video
* hooks
* headlines
* CTA
* offer

---

## Factor 83 — Audience Testing

Evaluate:

* geographies
* demographics where appropriate
* customer segments
* remarketing
* intent groups

---

## Factor 84 — Offer Testing

Test:

* discount
* bundle
* free item
* loyalty reward
* event offer

---

## Factor 85 — Learning Velocity

Measure the loop:

```text
OBSERVE
  ↓
HYPOTHESIS
  ↓
TEST
  ↓
MEASURE
  ↓
LEARN
  ↓
CHANGE
```

---

# DOMAIN 18 — Competitive & Market Intelligence

---

## Factor 86 — Competitor Set Accuracy

Identify genuine competitors based on:

* geography
* cuisine
* price
* occasion
* customer intent

---

## Factor 87 — Discovery Share vs Competitors

Compare:

* search
* Maps
* reviews
* AI visibility
* directories

---

## Factor 88 — Offer / Menu Competitive Position

Compare:

* price
* product
* bundles
* signature items
* convenience
* promotions

---

## Factor 89 — Reputation Competitive Position

Compare:

* rating
* review volume
* freshness
* sentiment
* response behavior

---

## Factor 90 — Digital Experience Competitive Position

Compare:

* website
* menu
* ordering
* reservations
* mobile
* content
* social

Only valid real competitor data may contribute.

---

# DOMAIN 19 — Marketing Economics & Resource Allocation

This domain requires connected data for credible conclusions.

---

## Factor 91 — Marketing Spend Visibility

Determine whether spend is known across:

* Google
* Meta
* creators
* promotions
* agencies
* software
* sponsorships

---

## Factor 92 — Customer Acquisition Cost

Where valid data exists:

```text
CAC =
Eligible acquisition spend
/
New customers acquired
```

Never estimate without evidence.

---

## Factor 93 — Cost per Marketing Outcome

Examples:

* cost per order
* cost per reservation
* cost per lead
* cost per call
* cost per direction request

---

## Factor 94 — Return on Ad Spend

Where revenue attribution is valid:

```text
ROAS =
Attributed revenue
/
Advertising spend
```

---

## Factor 95 — Budget Allocation Quality

Evaluate whether spending is aligned to:

* objectives
* profitable channels
* acquisition opportunity
* retention opportunity
* seasonal needs

---

# DOMAIN 20 — Governance, Data Quality & Marketing Execution

---

## Factor 96 — Marketing Data Quality

Check:

* duplicate customers
* incorrect tagging
* missing campaign names
* broken events
* invalid emails
* stale data

---

## Factor 97 — Consent & Communication Governance

Evaluate:

* email consent
* SMS consent
* unsubscribe
* opt-out
* privacy notices
* data usage controls

This must adapt to jurisdiction.

---

## Factor 98 — Channel Ownership & Access

Determine whether the restaurant controls:

* domain
* Google profile
* social accounts
* analytics
* Ads
* CRM
* ordering accounts

A restaurant should not be dependent on unknown former vendors for key digital assets.

---

## Factor 99 — Marketing Execution Discipline

Evaluate:

* campaigns scheduled
* promotions updated
* reviews answered
* menus current
* hours current
* analytics checked
* issues assigned

---

## Factor 100 — Marketing System Resilience

Evaluate whether the system can survive:

* staff turnover
* agency change
* password loss
* platform failure
* tracking failure
* restaurant-hours changes
* campaign mistakes

Signals include:

* documented ownership
* backups
* access controls
* monitoring
* repeatable procedures

---

# 6. Internal Intelligence Graph

The factors should not be treated as 100 independent boxes.

Ristorante should model relationships.

Example:

```text
Local Search Visibility
        │
        ├── Google Business completeness
        ├── Reviews
        ├── Website relevance
        └── Local authority

                ↓

Website Visits

                ↓

Menu Views

                ↓

Order / Reservation

                ↓

Customer Identity

                ↓

Lifecycle Marketing

                ↓

Repeat Visit

                ↓

Advocacy / Reviews

                ↓

Higher Local Authority
```

The system forms a feedback loop.

---

# 7. Marketing Funnel Model

Ristorante should map every factor to one or more funnel stages.

```text
AWARENESS
    ↓
DISCOVERY
    ↓
CONSIDERATION
    ↓
TRUST
    ↓
CONVERSION
    ↓
CUSTOMER
    ↓
RETENTION
    ↓
LOYALTY
    ↓
ADVOCACY
```

---

# 8. Factor-to-Funnel Classification

Each factor must support:

```yaml
factor:
  funnelStages:
    - DISCOVERY
    - CONSIDERATION

  evidenceClass:
    - PUBLIC

  controllability:
    HIGH

  expectedTimeToImpact:
    SHORT|MEDIUM|LONG

  effort:
    LOW|MEDIUM|HIGH
```

---

# 9. Root-Cause Intelligence

Ristorante should not only say:

```text
Online ordering is weak.
```

It should identify:

```text
ONLINE ORDERING
      ↓

CTA difficult to find
      ↓

Mobile redirects to third party
      ↓

Menu requires 4 clicks
      ↓

Order abandonment high
```

Then recommend the smallest useful intervention.

---

# 10. Internal Opportunity Model

Every identified opportunity may be represented as:

```yaml
opportunity:

  factor:
  rootCause:

  evidence:

  currentState:

  desiredState:

  expectedImpact:

  confidence:

  effort:

  urgency:

  dependencies:

  recommendedAction:

  verificationMethod:
```

---

# 11. Priority Model

The raw factor score should not alone determine priority.

Conceptually:

```text
Priority =
Problem Severity
× Expected Impact
× Confidence
× Strategic Relevance
× Controllability
÷ Effort
```

Exact mathematics should be deterministic and separately versioned.

---

# 12. Example

Suppose:

```text
Review Response Rate        34
Social Content              48
Menu SEO                    61
Reservation Conversion      82
```

Ristorante should not automatically tell the owner to fix Review Response Rate first.

If:

```text
Current objective:
Increase weekday lunch orders
```

then:

```text
Menu SEO
Lunch content
Local discovery
Lunch offer
Ordering conversion
```

may represent the higher-value path.

---

# 13. Public Intelligence vs Connected Intelligence

## LEVEL A — Public Intelligence

No restaurant integration required.

Includes:

* local discovery
* website
* SEO
* menu
* reviews
* social
* public content
* public competitors
* delivery presence
* reservation presence
* AI visibility

This creates the **initial value proposition**.

---

## LEVEL B — Marketing Account Intelligence

Restaurant connects:

* GA4
* Search Console
* Google Ads
* Meta
* email
* SMS

Ristorante can understand:

```text
Impression
→ Click
→ Website
→ Conversion
```

---

## LEVEL C — Customer Intelligence

Connect:

* ordering
* reservations
* POS
* CRM
* loyalty

Now Ristorante can understand:

```text
Marketing
→ Customer
→ Transaction
→ Repeat Transaction
```

---

## LEVEL D — Marketing Economics

With valid cost + revenue data:

```text
Campaign
→ Spend
→ Acquisition
→ Revenue
→ Retention
→ Marketing Return
```

---

# 14. Connection Maturity States

Every restaurant may internally have:

```text
LEVEL 0
Public observation only

LEVEL 1
Website/search connected

LEVEL 2
Advertising connected

LEVEL 3
CRM/lifecycle connected

LEVEL 4
Ordering/POS connected

LEVEL 5
Full marketing intelligence
```

Do NOT expose these as embarrassing customer grades.

They are internal capability states.

---

# 15. Internal Completeness

The app may calculate:

```text
PUBLIC SIGNAL COVERAGE

CONNECTED SIGNAL COVERAGE

HISTORICAL COVERAGE

ATTRIBUTION COVERAGE
```

These are confidence/coverage measures—not restaurant performance.

---

# 16. Customer Experience

Customers should NOT see:

```text
100 Marketing Factors
437 Sub-factors
100 Scores
Marketing System Score = 67.43
```

Avoid this.

---

# 17. What Customers SHOULD See

Example:

```text
TOP OPPORTUNITIES

1. Improve cuisine-level local discovery
2. Build a stronger review-response habit
3. Reduce ordering friction
4. Reactivate inactive customers
5. Shift advertising toward high-performing geography
```

Then:

```text
WHY THIS MATTERS

WHAT WE OBSERVED

WHAT TO DO

EXPECTED EFFECT

HOW WE WILL MEASURE IT
```

---

# 18. Customer Abstraction

Internal:

```text
100 factors
300–500 signals
multiple systems
complex attribution
```

Customer:

```text
You have 3 important problems.

Here is why.

Here is what to do next.
```

That should be the product philosophy.

---

# 19. Relationship with Existing 25-Factor RDI

Do not replace the frozen Restaurant Discovery Intelligence model.

Existing:

```text
5 Discovery Categories
25 Discovery Factors
~140 Signals
```

remains an important subsystem.

Internally:

```text
Restaurant Marketing Intelligence
        │
        ├── Discovery Intelligence
        │      └── existing 25 factors
        │
        ├── Acquisition Intelligence
        ├── Conversion Intelligence
        ├── Customer Intelligence
        ├── Retention Intelligence
        ├── Measurement Intelligence
        └── Optimization Intelligence
```

---

# 20. Avoid Double Counting

A signal should have one canonical origin.

Example:

```text
Google Rating
```

should not independently inflate:

* reputation
* trust
* discovery
* competitive score

without explicit relationship rules.

The canonical observation may feed multiple analyses, but double counting in aggregate scoring must be controlled.

---

# 21. Evidence Contract

Every measured factor ultimately traces to:

```text
Factor
  ↓
Signal
  ↓
Observation
  ↓
Evidence
  ↓
Source
```

Required metadata:

```yaml
evidence:
  source:
  sourceUrl:
  observedAt:
  restaurantId:
  value:
  confidence:
  freshness:
  evidenceRef:
```

---

# 22. Connected Data Contract

Connected data should additionally record:

```yaml
connectedEvidence:

  integration:
  accountScope:

  metric:
  dimensions:

  periodStart:
  periodEnd:

  retrievedAt:

  confidence:

  sourceRef:
```

---

# 23. AI Boundary

Preserve the frozen RIST-AI-001 invariant.

AI may:

* extract
* interpret
* cluster
* summarize
* explain
* generate marketing copy
* synthesize recommendations

AI may not own:

* canonical measurements
* spend
* orders
* revenue
* conversion counts
* customer identity
* attribution truth
* factor arithmetic

---

# 24. Example AI Usage

```text
300 customer reviews
       ↓
AI interpretation
       ↓
Themes:

Slow service
Excellent food
Good ambience
Parking complaints
       ↓
Validated signals
       ↓
Reputation analysis
```

Valid.

---

# 25. Invalid AI Usage

```text
AI thinks this restaurant
probably has a 6% conversion rate.
```

Forbidden.

---

# 26. Historical Intelligence

Ristorante should retain repeated observations.

Allow:

```text
What changed?

Why?

Did our action cause measurable improvement?
```

Do not invent historical data.

---

# 27. Action Tracking

Each recommendation should eventually support:

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

This closes the intelligence loop.

---

# 28. Intervention Measurement

Example:

```text
Problem:
Low Review Response Rate

Before:
21%

Action:
Review-management workflow introduced

After 60 days:
72%

Related reputation score:
+9

Result:
Improvement observed
```

This is far more valuable than another static report.

---

# 29. Internal Success Model

Ristorante should eventually answer five questions:

```text
1. Where is the restaurant weak?

2. Why?

3. What should change?

4. Did it change?

5. Did business results improve?
```

---

# 30. Marketing Recommendation Types

Recommendations may be classified:

```text
FOUNDATION
DISCOVERY
REPUTATION
CONTENT
SOCIAL
PAID
CONVERSION
CRM
RETENTION
MEASUREMENT
OPTIMIZATION
```

---

# 31. Action Horizon

Every action:

```text
IMMEDIATE
7 DAYS
30 DAYS
90 DAYS
LONG TERM
```

---

# 32. Effort Classification

```text
LOW
MEDIUM
HIGH
```

---

# 33. Impact Classification

```text
LOW
MEDIUM
HIGH
```

Impact must represent expected marketing-system effect, not fabricated revenue.

---

# 34. Confidence

```text
HIGH
MEDIUM
LOW
```

Derived from:

* evidence coverage
* freshness
* source quality
* sample size
* attribution confidence

---

# 35. Marketing Health Is Not One Number

Do not automatically create:

```text
Total Marketing Score = 74
```

That risks hiding useful complexity and creating arbitrary aggregation.

Preferred internal outputs:

```text
Acquisition Health
Conversion Health
Retention Health
Measurement Health
Data Confidence
```

and prioritized issues.

An overall internal score may be introduced later only if methodology proves useful.

---

# 36. Recommended Internal Data Model

Conceptually:

```typescript
MarketingFactorDefinition {
  id
  domainId

  label
  description

  evidenceClass

  funnelStages[]

  requiredSignals[]

  optionalSignals[]

  methodologyVersion
}
```

---

# 37. Factor Observation

```typescript
MarketingFactorObservation {
  restaurantId
  factorId

  status

  score?: number

  confidence

  coverage

  observedAt

  signalRefs[]

  methodologyVersion
}
```

---

# 38. Recommendation

```typescript
MarketingRecommendation {
  restaurantId

  factorId
  rootCause

  title
  explanation

  priority

  impact
  effort
  confidence

  evidenceRefs[]

  successMetric

  status
}
```

---

# 39. Canonical Registry

Create one internal canonical registry:

```text
marketing-intelligence/
    domains/
    factors/
    signals/
    methodologies/
    recommendations/
```

Do not scatter definitions across controllers.

---

# 40. Implementation Order

Do NOT implement 100 factors simultaneously.

Use:

```text
PHASE 1
Define registry

PHASE 2
Map existing RDI intelligence

PHASE 3
Map existing public-data signals

PHASE 4
Create internal diagnostic layer

PHASE 5
Connect analytics/search

PHASE 6
Connect advertising

PHASE 7
Connect CRM/lifecycle

PHASE 8
Connect transactions/POS

PHASE 9
Build attribution

PHASE 10
Close action → result loop
```

---

# 41. First Implementation Priority

Start with factors Ristorante can understand without customer integrations.

This likely includes:

```text
Brand
Discovery
SEO
Website
Reviews
Content
Social
Ordering presence
Reservation presence
Competitive intelligence
```

Then connected intelligence later.

---

# 42. No Customer Exposure

This is a strict rule.

Do NOT expose endpoints such as:

```text
/api/customer/marketing-factors/100
```

unless explicitly approved later.

Do not create a customer page showing all 100.

---

# 43. Internal API

Internal services may consume:

```text
MarketingIntelligenceSnapshot

MarketingOpportunity[]

MarketingRecommendation[]

MarketingEvidenceGraph
```

Customer-facing API should return curated outputs.

---

# 44. Customer-Safe API Example

Instead of:

```json
{
  "factor72": 61,
  "factor81": 45,
  "factor91": 33
}
```

return:

```json
{
  "topOpportunities": [
    {
      "title": "Improve weekday lunch visibility",
      "why": "...",
      "nextAction": "...",
      "confidence": "high"
    }
  ]
}
```

---

# 45. Security

Connected marketing information must be:

* tenant scoped
* authenticated
* permission controlled
* encrypted where appropriate
* never cross-restaurant
* never exposed in prompts unnecessarily

---

# 46. Privacy

Customer-level data should only be processed when there is a valid permissioned basis.

Data minimization applies.

Ristorante does not need to retain every raw customer field to generate useful intelligence.

---

# 47. Methodology Versioning

All internal calculations must support:

```text
methodologyVersion
```

Example:

```text
review_velocity_v1
local_visibility_v2
marketing_priority_v1
```

This prevents silent historical reinterpretation.

---

# 48. System Goal

The final internal system should function as:

```text
Restaurant
   ↓
Observe entire marketing environment
   ↓
Understand current configuration
   ↓
Identify weak links
   ↓
Find root causes
   ↓
Prioritize opportunities
   ↓
Recommend actions
   ↓
Measure implementation
   ↓
Measure resulting change
   ↓
Learn
   ↓
Recommend next action
```

---

# 49. Product Moat

The defensibility should not be:

> "We have 100 scores."

It should be:

> **Ristorante understands the relationships between hundreds of restaurant marketing signals and can identify the small number of actions that matter most for each restaurant.**

---

# 50. Final Architectural Principle

> **Keep the complexity inside Ristorante and deliver clarity to the restaurant.**

Internally:

```text
20 domains
100 factors
hundreds of signals
many integrations
historical intelligence
competitive intelligence
attribution
experimentation
```

Externally:

```text
Here is your problem.

Here is the evidence.

Here is why it matters.

Here is what to do next.

Here is how we will know whether it worked.
```

---

# 51. Canonical Marketing Loop

The complete Ristorante marketing intelligence system follows:

```text
DISCOVER
   ↓
UNDERSTAND
   ↓
TRUST
   ↓
ACQUIRE
   ↓
CONVERT
   ↓
IDENTIFY
   ↓
RETAIN
   ↓
PERSONALIZE
   ↓
ADVOCATE
   ↓
MEASURE
   ↓
LEARN
   ↓
OPTIMIZE
   ↓
REPEAT
```

---

# 52. Final Invariant

> **Ristorante's internal marketing intelligence may be extremely deep. The customer experience must remain extremely clear. Internal factors exist to improve diagnosis and decision quality—not to overwhelm customers with scoring complexity.**
