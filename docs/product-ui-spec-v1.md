# Restaurant Intelligence Platform — Product UI Specification v1.0

> **Design Philosophy:** This is not an analytics platform, CRM, or SEO dashboard. It is a **Decision Intelligence Workspace**. Every screen should help a restaurant owner answer one question: *"What should I do next, and why?"* Charts, tables, and metrics exist only to support better decisions—not to fill space. Focus on clarity, evidence, prioritization, and action over density of information.

---

## 1. Site Map

```
/                                   Home (Public)
/auth                               Sign In / Sign Up
/pricing                            Pricing
/success-stories                    Success Stories
/learn                              Learn (Educational Content)
/learn/[topic]                      Learn Topic Detail

/dashboard                          Home (Authenticated — Decision Workspace)
/dashboard/restaurants              Restaurant List
/dashboard/restaurants/[id]         Restaurant Overview
/dashboard/restaurants/[id]/profile Restaurant Profile
/dashboard/restaurants/[id]/presence Digital Presence
/dashboard/restaurants/[id]/connections Connections

/dashboard/intelligence             Intelligence Overview
/dashboard/intelligence/analysis    Current Analysis
/dashboard/intelligence/recommendations     Recommendations
/dashboard/intelligence/recommendations/[id] Recommendation Detail
/dashboard/intelligence/visibility  Visibility
/dashboard/intelligence/competitors Competitors
/dashboard/intelligence/reviews     Reviews
/dashboard/intelligence/website     Website Intelligence
/dashboard/intelligence/search      Search Visibility

/dashboard/actions                  Decision Center
/dashboard/actions/tasks            Tasks
/dashboard/actions/outcomes         Outcomes

/dashboard/reports                  Reports
/dashboard/reports/audit/[id]       Visibility Audit
/dashboard/reports/weekly           Weekly Report
/dashboard/reports/monthly          Monthly Report
/dashboard/reports/history          Report History
/dashboard/reports/export           Export

/dashboard/discover                Market Intelligence
/dashboard/discover/local-market    Local Market
/dashboard/discover/trends          Trending Searches
/dashboard/discover/competitor-activity Competitor Activity
/dashboard/discover/opportunities   Opportunities
/dashboard/discover/seasonal        Seasonal Trends

/dashboard/team                     Team
/dashboard/settings                 Settings
/dashboard/settings/organization    Organization Settings
/dashboard/settings/billing         Billing
/dashboard/settings/notifications   Notifications
/dashboard/settings/integrations    Integrations
/dashboard/settings/preferences     Preferences

/dashboard/help                     Help & Support

/admin                              Admin Dashboard
/admin/customers                    Customers
/admin/restaurants                  Restaurants
/admin/scans                        Scans
/admin/reports                      Reports
/admin/jobs                         Jobs
/admin/monitoring                   Monitoring
/admin/feature-flags                Feature Flags
/admin/system                       System Health
```

---

## 2. Route Tree

```
/ (public)
├── /auth
├── /pricing
├── /success-stories
├── /learn
│   └── /learn/[topic]

/dashboard (authenticated)
├── /dashboard
├── /dashboard/restaurants
│   └── /dashboard/restaurants/[id]
│       ├── /dashboard/restaurants/[id]/profile
│       ├── /dashboard/restaurants/[id]/presence
│       └── /dashboard/restaurants/[id]/connections
├── /dashboard/intelligence
│   ├── /dashboard/intelligence/analysis
│   ├── /dashboard/intelligence/recommendations
│   │   └── /dashboard/intelligence/recommendations/[id]
│   ├── /dashboard/intelligence/visibility
│   ├── /dashboard/intelligence/competitors
│   ├── /dashboard/intelligence/reviews
│   ├── /dashboard/intelligence/website
│   └── /dashboard/intelligence/search
├── /dashboard/actions
│   ├── /dashboard/actions/tasks
│   └── /dashboard/actions/outcomes
├── /dashboard/reports
│   ├── /dashboard/reports/audit/[id]
│   ├── /dashboard/reports/weekly
│   ├── /dashboard/reports/monthly
│   ├── /dashboard/reports/history
│   └── /dashboard/reports/export
├── /dashboard/discover
│   ├── /dashboard/discover/local-market
│   ├── /dashboard/discover/trends
│   ├── /dashboard/discover/competitor-activity
│   ├── /dashboard/discover/opportunities
│   └── /dashboard/discover/seasonal
├── /dashboard/team
├── /dashboard/settings
│   ├── /dashboard/settings/organization
│   ├── /dashboard/settings/billing
│   ├── /dashboard/settings/notifications
│   ├── /dashboard/settings/integrations
│   └── /dashboard/settings/preferences
└── /dashboard/help

/admin (authenticated + admin role)
├── /admin/customers
├── /admin/restaurants
├── /admin/scans
├── /admin/reports
├── /admin/jobs
├── /admin/monitoring
├── /admin/feature-flags
└── /admin/system
```

---

## 3. Navigation Hierarchy

### 3.1 Public Navigation (Header)

```
[Logo]  Home  Pricing  Success Stories  Learn  [Sign In]  [Run Free Audit]
```

### 3.2 Authenticated Navigation (Sidebar)

```
┌─────────────────────────────┐
│  Ristorante                 │
│  Organization Name          │
├─────────────────────────────┤
│  📊  Home                   │  ← Decision Workspace
│  🍽️  Restaurant             │
│  🧠  Intelligence           │
│  ✅  Actions                │
│  📄  Reports                │
│  🔍  Discover               │
├─────────────────────────────┤
│  📚  Learn                  │
│  👥  Team                   │
│  ⚙️  Settings               │
│  ❓  Help                   │
├─────────────────────────────┤
│  User Name                  │
│  user@email.com              │
│  [Sign Out]                 │
└─────────────────────────────┘
```

### 3.3 Intelligence Sub-navigation

```
Intelligence
├── Overview
├── Analysis
├── Recommendations
├── Visibility
├── Competitors
├── Reviews
├── Website
└── Search
```

### 3.4 Actions Sub-navigation

```
Actions
├── Decision Center
├── Tasks
└── Outcomes
```

### 3.5 Reports Sub-navigation

```
Reports
├── Visibility Audit
├── Weekly Report
├── Monthly Report
├── History
└── Export
```

### 3.6 Discover Sub-navigation

```
Discover
├── Local Market
├── Trending Searches
├── Competitor Activity
├── Opportunities
└── Seasonal Trends
```

### 3.7 Settings Sub-navigation

```
Settings
├── Organization
├── Billing
├── Notifications
├── Integrations
└── Preferences
```

### 3.8 Admin Navigation

```
Admin
├── Dashboard
├── Customers
├── Restaurants
├── Scans
├── Reports
├── Jobs
├── Monitoring
├── Feature Flags
└── System Health
```

---

## 4. Screen Inventory

| # | Screen | Route | Type | Auth | Priority |
|---|--------|-------|------|------|----------|
| 1 | Home (Public) | `/` | Public | No | P0 |
| 2 | Sign In / Sign Up | `/auth` | Public | No | P0 |
| 3 | Pricing | `/pricing` | Public | No | P0 |
| 4 | Success Stories | `/success-stories` | Public | No | P1 |
| 5 | Learn | `/learn` | Public | No | P1 |
| 6 | Learn Topic | `/learn/[topic]` | Public | No | P1 |
| 7 | Dashboard Home | `/dashboard` | Authenticated | Yes | P0 |
| 8 | Restaurant List | `/dashboard/restaurants` | Authenticated | Yes | P0 |
| 9 | Restaurant Overview | `/dashboard/restaurants/[id]` | Authenticated | Yes | P0 |
| 10 | Restaurant Profile | `/dashboard/restaurants/[id]/profile` | Authenticated | Yes | P1 |
| 11 | Digital Presence | `/dashboard/restaurants/[id]/presence` | Authenticated | Yes | P1 |
| 12 | Connections | `/dashboard/restaurants/[id]/connections` | Authenticated | Yes | P1 |
| 13 | Intelligence Overview | `/dashboard/intelligence` | Authenticated | Yes | P0 |
| 14 | Analysis | `/dashboard/intelligence/analysis` | Authenticated | Yes | P0 |
| 15 | Recommendations | `/dashboard/intelligence/recommendations` | Authenticated | Yes | P0 |
| 16 | Recommendation Detail | `/dashboard/intelligence/recommendations/[id]` | Authenticated | Yes | P0 |
| 17 | Visibility | `/dashboard/intelligence/visibility` | Authenticated | Yes | P1 |
| 18 | Competitors | `/dashboard/intelligence/competitors` | Authenticated | Yes | P1 |
| 19 | Reviews | `/dashboard/intelligence/reviews` | Authenticated | Yes | P1 |
| 20 | Website | `/dashboard/intelligence/website` | Authenticated | Yes | P1 |
| 21 | Search | `/dashboard/intelligence/search` | Authenticated | Yes | P1 |
| 22 | Decision Center | `/dashboard/actions` | Authenticated | Yes | P0 |
| 23 | Tasks | `/dashboard/actions/tasks` | Authenticated | Yes | P1 |
| 24 | Outcomes | `/dashboard/actions/outcomes` | Authenticated | Yes | P1 |
| 25 | Reports | `/dashboard/reports` | Authenticated | Yes | P0 |
| 26 | Visibility Audit | `/dashboard/reports/audit/[id]` | Authenticated | Yes | P0 |
| 27 | Weekly Report | `/dashboard/reports/weekly` | Authenticated | Yes | P1 |
| 28 | Monthly Report | `/dashboard/reports/monthly` | Authenticated | Yes | P2 |
| 29 | Report History | `/dashboard/reports/history` | Authenticated | Yes | P2 |
| 30 | Export | `/dashboard/reports/export` | Authenticated | Yes | P2 |
| 31 | Discover | `/dashboard/discover` | Authenticated | Yes | P1 |
| 32 | Local Market | `/dashboard/discover/local-market` | Authenticated | Yes | P1 |
| 33 | Trending Searches | `/dashboard/discover/trends` | Authenticated | Yes | P2 |
| 34 | Competitor Activity | `/dashboard/discover/competitor-activity` | Authenticated | Yes | P2 |
| 35 | Opportunities | `/dashboard/discover/opportunities` | Authenticated | Yes | P1 |
| 36 | Seasonal Trends | `/dashboard/discover/seasonal` | Authenticated | Yes | P2 |
| 37 | Team | `/dashboard/team` | Authenticated | Yes | P1 |
| 38 | Settings | `/dashboard/settings` | Authenticated | Yes | P1 |
| 39 | Organization Settings | `/dashboard/settings/organization` | Authenticated | Yes | P1 |
| 40 | Billing | `/dashboard/settings/billing` | Authenticated | Yes | P1 |
| 41 | Notifications | `/dashboard/settings/notifications` | Authenticated | Yes | P1 |
| 42 | Integrations | `/dashboard/settings/integrations` | Authenticated | Yes | P2 |
| 43 | Preferences | `/dashboard/settings/preferences` | Authenticated | Yes | P2 |
| 44 | Help | `/dashboard/help` | Authenticated | Yes | P1 |
| 45 | Admin Dashboard | `/admin` | Admin | Yes | P1 |
| 46 | Admin Customers | `/admin/customers` | Admin | Yes | P1 |
| 47 | Admin Restaurants | `/admin/restaurants` | Admin | Yes | P1 |
| 48 | Admin Scans | `/admin/scans` | Admin | Yes | P2 |
| 49 | Admin Reports | `/admin/reports` | Admin | Yes | P2 |
| 50 | Admin Jobs | `/admin/jobs` | Admin | Yes | P2 |
| 51 | Admin Monitoring | `/admin/monitoring` | Admin | Yes | P2 |
| 52 | Admin Feature Flags | `/admin/feature-flags` | Admin | Yes | P2 |
| 53 | Admin System Health | `/admin/system` | Admin | Yes | P2 |

---

## 5. Page Hierarchy

### 5.1 Public Pages

#### Home (`/`)

| Field | Value |
|-------|-------|
| **Purpose** | Explain the product and immediately guide visitors to the Free Audit |
| **Personas** | First-time visitor, restaurant owner researching visibility tools |
| **Goal** | Understand value proposition in < 10 seconds, click "Run Free Audit" |
| **Entry Points** | Direct URL, search, referral, social |
| **Exit Points** | Free Audit, Pricing, Sign In |
| **Layout** | Full-width hero → benefits grid → product overview → customer outcomes → CTA |
| **Components** | HeroSection, BenefitsGrid, ProductOverview, CustomerOutcomes, CTASection |
| **Empty State** | N/A (static page) |
| **Loading State** | N/A (static page) |
| **Error State** | N/A (static page) |
| **Permissions** | None |
| **API Dependencies** | None |
| **Events** | `page_view_home`, `cta_click_free_audit` |
| **Analytics** | Visitor count, CTA click rate, scroll depth |
| **Acceptance** | Hero visible above fold, CTA button prominent, loads in < 2s |

#### Auth (`/auth`)

| Field | Value |
|-------|-------|
| **Purpose** | Sign in or create an account |
| **Personas** | New user, returning user |
| **Goal** | Authenticate in < 30 seconds |
| **Entry Points** | "Sign In" button, "Get Started" CTA |
| **Exit Points** | Dashboard (on success), Home |
| **Layout** | Centered card with toggle between Sign In / Sign Up |
| **Components** | SignInForm, SignUpForm, SocialLoginButtons |
| **Empty State** | N/A |
| **Loading State** | Button shows spinner, inputs disabled |
| **Error State** | Inline error message below form heading |
| **Permissions** | None |
| **API Dependencies** | `POST /api/auth/signup`, `POST /api/auth/signin` |
| **Events** | `user_registered`, `user_signed_in` |
| **Analytics** | Signup conversion rate, signin success rate |
| **Acceptance** | Signup creates user + organization, redirects to dashboard |

#### Pricing (`/pricing`)

| Field | Value |
|-------|-------|
| **Purpose** | Explain plans and upgrade path |
| **Personas** | Evaluating visitor, trial user |
| **Goal** | Understand what each plan offers and choose one |
| **Entry Points** | Navigation, "View Pricing" CTA |
| **Exit Points** | Sign Up, Free Audit |
| **Layout** | 2-column pricing cards (Free / Growth) with feature comparison |
| **Components** | PricingCard, FeatureComparison, FAQ |
| **Empty State** | N/A |
| **Loading State** | N/A |
| **Error State** | N/A |
| **Permissions** | None |
| **API Dependencies** | `GET /api/billing/plans` |
| **Events** | `pricing_page_view`, `plan_selected` |
| **Analytics** | Plan view rate, plan selection rate |
| **Acceptance** | Both plans visible, CTA links to signup |

---

### 5.2 Authenticated Pages

#### Dashboard Home (`/dashboard`)

| Field | Value |
|-------|-------|
| **Purpose** | Decision Workspace — answer "What should I do today?" |
| **Personas** | Restaurant owner, manager |
| **Goal** | See current status, top priority, and take action |
| **Entry Points** | Post-login redirect, sidebar "Home" |
| **Exit Points** | Restaurant detail, Intelligence, Actions |
| **Layout** | Score card → Today's Priorities → Recent Improvements → Quick Actions |
| **Components** | OverallScoreCard, PriorityList, ImprovementList, QuickActionButtons |
| **Widgets** | Restaurant Score, Today's Priorities, Recent Improvements, Latest Scan, Active Tasks |
| **Empty State** | "Get started — add your first restaurant" with CTA |
| **Loading State** | Skeleton cards (3) |
| **Error State** | "Failed to load dashboard" with Retry button |
| **Permissions** | Authenticated user |
| **API Dependencies** | `GET /api/restaurants`, `GET /api/restaurants/:id/decision-stats` |
| **Events** | `dashboard_viewed`, `dashboard_action_clicked` |
| **Analytics** | DAU, WAU, action completion rate |
| **Acceptance** | Shows score, priorities, quick actions. Empty state when no restaurants. |

#### Restaurant List (`/dashboard/restaurants`)

| Field | Value |
|-------|-------|
| **Purpose** | View and manage all restaurants |
| **Personas** | Restaurant owner, multi-unit manager |
| **Goal** | See all restaurants at a glance, add new ones, navigate to detail |
| **Entry Points** | Sidebar "Restaurant", Dashboard quick action |
| **Exit Points** | Restaurant detail, Add form |
| **Layout** | Header with count → Add button → Card grid |
| **Components** | RestaurantCard, AddRestaurantForm, EmptyState, LoadingSkeleton |
| **Widgets** | Score badge (Good/Needs Work/Critical), city, cuisine |
| **Empty State** | Emoji + "No restaurants yet" + "Add Your First Restaurant" CTA |
| **Loading State** | 3 skeleton cards with pulsing animation |
| **Error State** | "Failed to load restaurants" with Retry button |
| **Permissions** | Authenticated user |
| **API Dependencies** | `GET /api/restaurants`, `POST /api/restaurants` |
| **Events** | `restaurant_list_viewed`, `restaurant_created` |
| **Analytics** | Restaurant count, creation rate |
| **Acceptance** | Lists all restaurants, add form works, empty state when none |

#### Restaurant Overview (`/dashboard/restaurants/[id]`)

| Field | Value |
|-------|-------|
| **Purpose** | See everything about one restaurant and take action |
| **Personas** | Restaurant owner, manager |
| **Goal** | Understand current position, run analysis, view decisions |
| **Entry Points** | Restaurant list click |
| **Exit Points** | Intelligence, Actions, Reports |
| **Layout** | Header (name, address, cuisine, score) → Tab bar → Tab content |
| **Components** | RestaurantHeader, ScoreGrid, TabBar, DecisionQueue, ConnectDataPanel, VerificationPanel, WeeklySummary |
| **Widgets** | 8 score cards, decision queue, data sources, verification status |
| **Empty State** | "No data yet. Run an analysis to get started." |
| **Loading State** | Skeleton header + skeleton score grid |
| **Error State** | "Restaurant not found" or "Failed to load" with Retry |
| **Permissions** | Authenticated user, member of the organization that owns the restaurant |
| **API Dependencies** | `GET /api/restaurants/:id`, `POST /api/restaurants/:id/analyze`, `GET /api/restaurants/:id/decisions` |
| **Events** | `restaurant_viewed`, `analysis_run`, `decision_accepted`, `decision_dismissed` |
| **Analytics** | Analysis run rate, decision action rate |
| **Acceptance** | Shows all 8 scores, run analysis works, decisions display |

#### Intelligence Overview (`/dashboard/intelligence`)

| Field | Value |
|-------|-------|
| **Purpose** | Overall intelligence summary across all restaurants |
| **Personas** | Restaurant owner, manager |
| **Goal** | See which areas need attention and where to focus |
| **Entry Points** | Sidebar "Intelligence" |
| **Exit Points** | Analysis, Recommendations, Visibility, Competitors |
| **Layout** | Summary cards → Category breakdown → Quick links to sub-pages |
| **Components** | IntelligenceSummary, CategoryBreakdown, QuickLinks |
| **Widgets** | Overall score, category scores, issue count |
| **Empty State** | "Run an analysis to see intelligence data" |
| **Loading State** | Skeleton summary cards |
| **Error State** | "Failed to load intelligence" with Retry |
| **Permissions** | Authenticated user |
| **API Dependencies** | `GET /api/restaurants`, `GET /api/restaurants/:id/decision-stats` |
| **Events** | `intelligence_overview_viewed` |
| **Analytics** | Page views, sub-page navigation rate |
| **Acceptance** | Shows summary across restaurants, links to sub-pages |

#### Recommendations (`/dashboard/intelligence/recommendations`)

| Field | Value |
|-------|-------|
| **Purpose** | Prioritized list of all recommendations across restaurants |
| **Personas** | Restaurant owner, manager |
| **Goal** | See what to fix first, understand evidence, take action |
| **Entry Points** | Intelligence sub-nav, Dashboard priority list |
| **Exit Points** | Recommendation detail, Decision Center |
| **Layout** | Filter bar (status, category, restaurant) → Prioritized card list |
| **Components** | RecommendationCard, FilterBar, EmptyState, LoadingSkeleton |
| **Widgets** | Priority badge, confidence score, impact estimate, evidence summary |
| **Empty State** | "No recommendations yet. Run an analysis to get started." |
| **Loading State** | 5 skeleton recommendation cards |
| **Error State** | "Failed to load recommendations" with Retry |
| **Permissions** | Authenticated user |
| **API Dependencies** | `GET /api/restaurants/:id/decisions` |
| **Events** | `recommendation_viewed`, `recommendation_accepted`, `recommendation_dismissed` |
| **Analytics** | Acceptance rate, dismissal rate, time to action |
| **Acceptance** | Lists all recommendations, filter works, accept/dismiss works |

#### Recommendation Detail (`/dashboard/intelligence/recommendations/[id]`)

| Field | Value |
|-------|-------|
| **Purpose** | Full detail of one recommendation with evidence, reasoning, and action plan |
| **Personas** | Restaurant owner, manager |
| **Goal** | Understand why this recommendation exists and decide what to do |
| **Entry Points** | Recommendation card click |
| **Exit Points** | Decision Center, Actions |
| **Layout** | Header (title, priority, confidence) → Problem → Evidence → Reasoning → Impact → Action plan → Decision buttons |
| **Components** | RecommendationHeader, EvidencePanel, ReasoningChain, ImpactEstimate, ActionPlan, DecisionButtons |
| **Widgets** | Evidence sources, freshness indicator, confidence meter, impact gauge |
| **Empty State** | N/A (404 if not found) |
| **Loading State** | Skeleton detail layout |
| **Error State** | "Recommendation not found" |
| **Permissions** | Authenticated user, member of the restaurant's organization |
| **API Dependencies** | `GET /api/decisions/:id` |
| **Events** | `recommendation_detail_viewed`, `recommendation_accepted`, `recommendation_dismissed` |
| **Analytics** | Detail view rate, evidence expand rate, decision rate |
| **Acceptance** | Shows full evidence, reasoning, impact. Accept/dismiss works. |

#### Decision Center (`/dashboard/actions`)

| Field | Value |
|-------|-------|
| **Purpose** | Track all decisions — accepted, dismissed, completed, pending |
| **Personas** | Restaurant owner, manager |
| **Goal** | See what's been decided, what's in progress, what's done |
| **Entry Points** | Sidebar "Actions" |
| **Exit Points** | Tasks, Outcomes, Recommendation detail |
| **Layout** | Tab bar (All / Accepted / Dismissed / Completed / Pending) → Decision list |
| **Components** | DecisionTabs, DecisionList, DecisionCard, EmptyState, LoadingSkeleton |
| **Widgets** | Count badges per tab, status indicator |
| **Empty State** | "No decisions yet. Run an analysis to get recommendations." |
| **Loading State** | Skeleton decision cards |
| **Error State** | "Failed to load decisions" with Retry |
| **Permissions** | Authenticated user |
| **API Dependencies** | `GET /api/restaurants/:id/decisions`, `GET /api/restaurants/:id/decision-stats` |
| **Events** | `decision_center_viewed`, `decision_status_changed` |
| **Analytics** | Decision completion rate, time to completion |
| **Acceptance** | Shows all decisions, filter by status works, status change works |

#### Reports (`/dashboard/reports`)

| Field | Value |
|-------|-------|
| **Purpose** | View and generate reports — audit, weekly, monthly |
| **Personas** | Restaurant owner, manager |
| **Goal** | See progress over time, share insights with team |
| **Entry Points** | Sidebar "Reports" |
| **Exit Points** | Audit report, weekly report, export |
| **Layout** | Restaurant selector → Expandable stats panel → Quick links to audit/weekly/monthly |
| **Components** | RestaurantSelector, StatsPanel, ReportLinks, StatBox, EmptyState, LoadingSkeleton |
| **Widgets** | Decision stats (4-column), outcome stats, weekly summary, risk alert |
| **Empty State** | "No reports yet. Add a restaurant and run an analysis." |
| **Loading State** | Skeleton restaurant list |
| **Error State** | "Failed to load reports" with Retry |
| **Permissions** | Authenticated user |
| **API Dependencies** | `GET /api/restaurants`, `GET /api/restaurants/:id/decision-stats`, `GET /api/restaurants/:id/outcome-stats`, `GET /api/restaurants/:id/summary` |
| **Events** | `reports_viewed`, `report_audit_viewed`, `report_weekly_viewed` |
| **Analytics** | Report view rate, export rate |
| **Acceptance** | Shows restaurant list, expandable stats, links to audit/weekly |

#### Visibility Audit (`/dashboard/reports/audit/[id]`)

| Field | Value |
|-------|-------|
| **Purpose** | Full visibility audit report for one restaurant |
| **Personas** | Restaurant owner, manager |
| **Goal** | See overall score, top issues, score breakdown, and upgrade CTA |
| **Entry Points** | Reports page "View Audit" link, Restaurant page "Run Audit" button |
| **Exit Points** | Reports, Settings (subscription) |
| **Layout** | Header → Overall Score → Strengths/Weaknesses/Quick Wins → Top 5 Issues → Score Breakdown → Subscription CTA |
| **Components** | OverallScoreCard, SummaryGrid, IssueList, ScoreBreakdown, SubscriptionCTA |
| **Widgets** | Severity badges, category icons, score bars |
| **Empty State** | N/A (404 if restaurant not found) |
| **Loading State** | "Running your visibility audit..." with description |
| **Error State** | Error message with details |
| **Permissions** | Authenticated user, member of the restaurant's organization |
| **API Dependencies** | `POST /api/audit/restaurants/:id` |
| **Events** | `audit_viewed`, `audit_subscription_cta_clicked` |
| **Analytics** | Audit completion rate, subscription CTA click rate |
| **Acceptance** | Shows score, top 5 issues, score breakdown, subscription CTA |

#### Settings (`/dashboard/settings`)

| Field | Value |
|-------|-------|
| **Purpose** | Manage organization, billing, notifications, integrations, preferences |
| **Personas** | Restaurant owner, admin |
| **Goal** | Update business information, manage subscription, configure notifications |
| **Entry Points** | Sidebar "Settings" |
| **Exit Points** | Any settings sub-page |
| **Layout** | Sub-navigation tabs → Content panel |
| **Components** | SettingsNav, OrganizationForm, BillingPanel, NotificationPreferences, IntegrationList |
| **Widgets** | Plan badge, usage meter |
| **Empty State** | N/A |
| **Loading State** | Skeleton form fields |
| **Error State** | "Failed to load settings" with Retry |
| **Permissions** | Authenticated user, admin for organization settings |
| **API Dependencies** | `GET /api/organizations`, `GET /api/billing/subscription`, `GET /api/settings` |
| **Events** | `settings_viewed`, `settings_updated`, `subscription_changed` |
| **Analytics** | Settings page views, update rate |
| **Acceptance** | Shows all settings sections, updates save correctly |

---

## 6. Component Inventory

### 6.1 Shared / Reusable Components

| Component | Props | Used On |
|-----------|-------|---------|
| `Sidebar` | activeRoute, user, organization, onSignOut | All authenticated pages |
| `PublicHeader` | activeRoute | All public pages |
| `LoadingSkeleton` | count, height, width | All data pages |
| `EmptyState` | icon, title, description, ctaText, ctaAction | All list pages |
| `ErrorState` | message, onRetry | All data pages |
| `ScoreCard` | label, value, color | Dashboard, Restaurant Overview |
| `StatBox` | label, value, color | Reports, Intelligence |
| `SeverityBadge` | severity | Recommendation cards, Audit |
| `CategoryIcon` | category | Recommendation cards, Audit |
| `EvidencePanel` | evidence, sources, freshness | Recommendation Detail |
| `DecisionButtons` | onAccept, onDismiss, onComplete | Recommendation Detail, Decision Center |
| `TabBar` | tabs, activeTab, onTabChange | Restaurant Overview, Actions |
| `FilterBar` | filters, activeFilter, onFilterChange | Recommendations |
| `Breadcrumb` | path | All authenticated pages |
| `NotificationBell` | count | Sidebar |
| `UserMenu` | user, onSignOut | Sidebar |

### 6.2 Page-Specific Components

| Component | Page | Description |
|-----------|------|-------------|
| `HeroSection` | Home | Main hero with headline, subtitle, CTA |
| `BenefitsGrid` | Home | 6 benefit cards |
| `ProductOverview` | Home | How it works steps |
| `CustomerOutcomes` | Home | Customer results |
| `CTASection` | Home | Final CTA |
| `SignInForm` | Auth | Email/password sign in |
| `SignUpForm` | Auth | Name/email/password/organization sign up |
| `PricingCard` | Pricing | Plan card with features |
| `FeatureComparison` | Pricing | Feature comparison table |
| `RestaurantCard` | Restaurant List | Card with name, city, cuisine, score badge |
| `AddRestaurantForm` | Restaurant List | Inline form with name, address, city, cuisine |
| `RestaurantHeader` | Restaurant Overview | Name, address, cuisine, score, action buttons |
| `ScoreGrid` | Restaurant Overview | 8 score cards |
| `DecisionQueue` | Restaurant Overview | List of decisions |
| `ConnectDataPanel` | Restaurant Overview | Data source connection UI |
| `VerificationPanel` | Restaurant Overview | GBP/Domain verification |
| `WeeklySummary` | Restaurant Overview | Weekly stats |
| `IntelligenceSummary` | Intelligence Overview | Summary cards |
| `CategoryBreakdown` | Intelligence Overview | Category scores |
| `RecommendationCard` | Recommendations | Card with priority, confidence, impact, evidence |
| `RecommendationHeader` | Recommendation Detail | Title, priority, confidence |
| `ReasoningChain` | Recommendation Detail | Engine contributions |
| `ImpactEstimate` | Recommendation Detail | Business impact |
| `ActionPlan` | Recommendation Detail | Steps, owner, due date |
| `DecisionTabs` | Decision Center | All/Accepted/Dismissed/Completed/Pending |
| `DecisionList` | Decision Center | Filtered decision list |
| `DecisionCard` | Decision Center | Decision with status |
| `StatsPanel` | Reports | Decision stats, outcome stats, weekly summary |
| `ReportLinks` | Reports | Links to audit/weekly/monthly |
| `OverallScoreCard` | Audit | Large score display |
| `SummaryGrid` | Audit | Strengths/Weaknesses/Quick Wins |
| `IssueList` | Audit | Top 5 issues with severity |
| `ScoreBreakdown` | Audit | Score bars |
| `SubscriptionCTA` | Audit | Upgrade prompt |
| `SettingsNav` | Settings | Sub-navigation tabs |
| `OrganizationForm` | Settings | Organization name, slug |
| `BillingPanel` | Settings | Plan, payment, invoices |
| `NotificationPreferences` | Settings | Notification toggles |

---

## 7. Reusable Layouts

### 7.1 Public Layout

```
┌─────────────────────────────────────┐
│  PublicHeader (Logo, Nav, CTA)      │
├─────────────────────────────────────┤
│                                     │
│  Page Content (full width)          │
│                                     │
├─────────────────────────────────────┤
│  Footer                             │
└─────────────────────────────────────┘
```

### 7.2 Authenticated Layout

```
┌──────────────┬──────────────────────────────┐
│              │  Breadcrumb                   │
│   Sidebar    ├──────────────────────────────┤
│              │                              │
│  240px       │  Page Content                │
│  fixed       │  (max-width: 1000px)         │
│              │                              │
│              │                              │
├──────────────┴──────────────────────────────┤
│  Notification Toast (fixed bottom-right)    │
└─────────────────────────────────────────────┘
```

### 7.3 Admin Layout

```
┌──────────────┬──────────────────────────────┐
│              │  Admin Header (status bar)     │
│  Admin Nav   ├──────────────────────────────┤
│              │                              │
│  200px       │  Admin Content               │
│  fixed       │  (full width)                │
│              │                              │
└──────────────┴──────────────────────────────┘
```

---

## 8. User Journeys

### 8.1 First-Time Visitor → Free Audit

```
Home → Free Audit (search restaurant) → Select Restaurant → 
Verify Ownership (optional) → Generate Report → 
Preview Recommendations → Upgrade CTA → Sign Up → Dashboard
```

### 8.2 New User Onboarding

```
Sign Up → Create Organization → Add Restaurant → 
Run Analysis → View Recommendations → Accept First Recommendation → 
Track Progress → Return for Weekly Summary
```

### 8.3 Daily Decision Workflow

```
Dashboard (Today's Priorities) → View Top Recommendation → 
Review Evidence → Accept / Dismiss → Track in Decision Center → 
Return Tomorrow
```

### 8.4 Weekly Review Workflow

```
Dashboard → Reports → Select Restaurant → View Weekly Summary → 
Review Completed Outcomes → Check New Recommendations → 
Export Report
```

### 8.5 Audit → Subscription Flow

```
Home / Dashboard → Run Free Audit → View Audit Report → 
See Top 5 Issues → "View Subscription Plans" CTA → 
Pricing → Sign Up → Subscribe → Continuous Monitoring
```

---

## 9. Cross-page Navigation

| From | To | Trigger | Behavior |
|------|----|---------|----------|
| Home | Free Audit | CTA click | Navigate to `/auth` (if not signed in) or `/dashboard/restaurants/new` |
| Dashboard | Restaurant | Card click | Navigate to `/dashboard/restaurants/[id]` |
| Dashboard | Intelligence | Priority click | Navigate to `/dashboard/intelligence/recommendations` |
| Dashboard | Actions | Quick action | Navigate to `/dashboard/actions` |
| Restaurant | Analysis | "Run Analysis" click | Stay on page, show results in Decisions tab |
| Restaurant | Audit | "Run Audit" click | Navigate to `/dashboard/reports/audit/[id]` |
| Restaurant | Intelligence | Tab click | Navigate to `/dashboard/intelligence` |
| Recommendations | Detail | Card click | Navigate to `/dashboard/intelligence/recommendations/[id]` |
| Detail | Actions | Accept/Dismiss | Navigate to `/dashboard/actions` |
| Reports | Audit | "View Audit" click | Navigate to `/dashboard/reports/audit/[id]` |
| Audit | Settings | "View Subscription Plans" | Navigate to `/dashboard/settings/billing` |
| Actions | Tasks | Tab click | Navigate to `/dashboard/actions/tasks` |
| Actions | Outcomes | Tab click | Navigate to `/dashboard/actions/outcomes` |

---

## 10. Breadcrumb Rules

| Page | Breadcrumb |
|------|------------|
| `/dashboard` | Home |
| `/dashboard/restaurants` | Home > Restaurants |
| `/dashboard/restaurants/[id]` | Home > Restaurants > [Restaurant Name] |
| `/dashboard/intelligence` | Home > Intelligence |
| `/dashboard/intelligence/recommendations` | Home > Intelligence > Recommendations |
| `/dashboard/intelligence/recommendations/[id]` | Home > Intelligence > Recommendations > [Title] |
| `/dashboard/actions` | Home > Actions |
| `/dashboard/reports` | Home > Reports |
| `/dashboard/reports/audit/[id]` | Home > Reports > Visibility Audit |
| `/dashboard/settings` | Home > Settings |
| `/dashboard/settings/billing` | Home > Settings > Billing |
| `/dashboard/team` | Home > Team |
| `/dashboard/discover` | Home > Discover |

**Rules:**
- Breadcrumbs start at "Home" for all authenticated pages
- Maximum depth: 4 levels
- Current page is always the last item (not a link)
- Parent pages are clickable links
- Truncate restaurant/decision names to 30 characters

---

## 11. Global Search Behavior

- **Trigger:** Cmd+K or click search bar in sidebar header
- **Scope:** Restaurants, recommendations, actions
- **Results:** Show top 5 matches with type icon and link
- **Empty:** "No results found"
- **Loading:** Spinner
- **Error:** "Search unavailable"
- **Behavior:** Navigate to result on click, close on Escape

---

## 12. Notification Behavior

- **Bell icon** in sidebar header shows unread count badge
- **Click** opens notification dropdown (last 10)
- **Types:** New recommendation, analysis complete, weekly summary, team invitation
- **Click notification** navigates to relevant page
- **Empty state:** "No new notifications"
- **Mark as read:** On click or "Mark all read" button

---

## 13. Mobile Navigation

- **Breakpoint:** < 768px
- **Sidebar collapses** to hamburger menu
- **Bottom tab bar** for primary navigation (Home, Restaurant, Intelligence, Actions, Reports)
- **Sub-navigation** becomes accordion within hamburger menu
- **Search** moves to top bar
- **Notifications** remain in top bar

---

## 14. Responsive Behavior

| Breakpoint | Layout Changes |
|------------|---------------|
| > 1024px | Full sidebar, 3-column grids, full-width content |
| 768-1024px | Collapsed sidebar (icons only), 2-column grids |
| < 768px | Hamburger menu, single column, bottom tabs |
| < 480px | Compact cards, reduced padding, stacked forms |

---

## 15. Page-by-Page Build Order

### Phase 1 (P0 — Core Customer Journey)
1. `/dashboard` — Decision Workspace (exists, needs rewrite)
2. `/dashboard/restaurants` — Restaurant List (exists, recently rewritten)
3. `/dashboard/restaurants/[id]` — Restaurant Overview (exists, needs rewrite)
4. `/dashboard/intelligence/recommendations` — Recommendations (new)
5. `/dashboard/intelligence/recommendations/[id]` — Recommendation Detail (new)
6. `/dashboard/actions` — Decision Center (new)
7. `/dashboard/reports` — Reports (exists, recently rewritten)
8. `/dashboard/reports/audit/[id]` — Visibility Audit (exists)

### Phase 2 (P1 — Depth)
9. `/dashboard/intelligence` — Intelligence Overview (new)
10. `/dashboard/intelligence/analysis` — Analysis (new)
11. `/dashboard/intelligence/visibility` — Visibility (new)
12. `/dashboard/intelligence/competitors` — Competitors (new)
13. `/dashboard/intelligence/reviews` — Reviews (new)
14. `/dashboard/actions/tasks` — Tasks (new)
15. `/dashboard/actions/outcomes` — Outcomes (new)
16. `/dashboard/reports/weekly` — Weekly Report (new)
17. `/dashboard/settings` — Settings (exists, needs rewrite)
18. `/dashboard/team` — Team (new)
19. `/dashboard/discover` — Discover (new)
20. `/dashboard/help` — Help (new)

### Phase 3 (P2 — Polish)
21. `/pricing` — Pricing (new)
22. `/success-stories` — Success Stories (new)
23. `/learn` — Learn (new)
24. `/dashboard/reports/monthly` — Monthly Report (new)
25. `/dashboard/reports/history` — Report History (new)
26. `/dashboard/reports/export` — Export (new)
27. `/dashboard/discover/*` — All Discover sub-pages (new)
28. `/admin/*` — All Admin pages (new)

---

## 16. Acceptance Criteria (Global)

Every page must pass:

1. **Route resolves** — No 404 for the defined route
2. **Loading state renders** — Skeleton or spinner appears while data loads
3. **Empty state renders** — Appropriate message and CTA when no data
4. **Error state renders** — Error message with retry option on failure
5. **Primary action works** — The page's main CTA functions correctly
6. **Navigation works** — All links and buttons navigate to correct routes
7. **Responsive** — Layout works at desktop, tablet, and mobile
8. **Events fire** — All defined analytics events are emitted
9. **No console errors** — Zero JavaScript errors in browser console
10. **Loads in < 2s** — Time to interactive under 2 seconds
