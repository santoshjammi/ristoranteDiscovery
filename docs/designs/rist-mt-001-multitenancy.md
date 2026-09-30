# RIST-MT-001 — Multi-Tenant Architecture Design Direction (FROZEN)

> **Status: Design locked. No implementation started.**
> This document captures the agreed multi-tenant direction for RistoranteDiscovery.
> It is the contract for all future implementation. Nothing here is code — it is
> the architecture Hermes owns and will implement only when Santosh gives the word.

## 1. Tenant Model (confirmed)

```
Organization (tenant)                     ── owns ──► many
   └─ 4 fixed personas (No RBAC engine)
Restaurant                               ── belongs to exactly one Organization + one Market/Country
   ├─ per-restaurant tier: $49 Starter | $99 Growth | (Enterprise org override)
   ├─ PREPAID subscription window (start/end) — NO refund
   ├─ lifecycle: Onboarded → Audited → In-Covered-Market → Available (billable)
   │                          ↘ Marked Unavailable (not-required) → closed after period
   └─ child data preserved on all state changes (evidence, snapshots, cohort)
Market / Country (coverage flag)         ──► audit engine produces intelligence only here
Postgres  ── RLS by organization_id ── app-layer scoping ── full tenant isolation
```

## 2. Key Decisions (all agreed)

| # | Decision | Resolution |
|---|---|---|
| A | Market span | Fully open: city → multi-city → country → worldwide. Org owns restaurants anywhere. |
| B | Onboarding | **Audit first, always.** Assess before taking on any restaurant. |
| C | Pricing | Per-restaurant **$49** or **$99** chosen by the user for each restaurant; **Enterprise** is an org-level override that supersedes both. |
| C2 | Non-Enterprise billing | Per-restaurant invoices (NOT consolidated by org). |
| D | Personas | **4 fixed personas**, no RBAC matrix. |
| E | Isolation | App-layer scoping **+** Postgres Row-Level Security. |
| P1 | Invoicing | Per-restaurant invoices. |
| P2 | Billable set | Only restaurants **marked Available** (in a covered market) are billable. |
| P3 | Cancellation | **Org Admin only** + requires written email authorization from the owner. No refund mid-period; service runs to period end; then entry closed / marked not-required. |

## 3. The 4 Fixed Personas (confirmed)

| Persona | Can do | Cannot do |
|---|---|---|
| **Org Admin** | Manage org, all restaurants, billing, availability (incl. cancellation w/ email auth), membership | — |
| **Restaurant Operator** | Operate assigned restaurant(s): menu, reviews, actions, decisions | Cancel billing; change org scope |
| **Read-only Viewer** | View scorecards, evidence, reports for granted restaurants | Any write |
| **Agency Account Manager** | Cross-tenant portfolio view of client restaurants/orgs, reports, recommendations | **Initiate any changes — read-only for now** |

**Critical separation:** these 4 personas simplify the *permission* matrix, but **data isolation is enforced by organization + restaurant scoping on top** (RLS). Personas do NOT remove the tenant isolation boundary — the trust product must never let one tenant read another's data, whatever their persona.

## 4. Restaurant Lifecycle (Availability state machine)

```
            ┌──────────────────────────────────────────────┐
            ▼                                              │
Onboarded → Audited → In-Covered-Market → Available (billable)
                                              │
                                              ▼        (Org Admin + written email auth)
                                    Marked Unavailable (not-required)
                                              │
                                              ▼
                    Closed at end of prepaid period (child data preserved)
```

- Every restaurant starts at **Onboarded** and is **Audited first**.
- **Available** requires being in a covered market (billable per P2).
- **Marked Unavailable** is an Org-Admin-only action, requiring written email authorization; no refund; service valid until prepaid period ends; then closed.
- **Child data (evidence ledger, scorecard snapshots, competitor cohort, decisions) is preserved across all state changes** — never delete a restaurant (it would shred the integrity trail and corrupt historical benchmark cohorts).

## 5. Pricing & Billing Model (confirmed)

```
Per-restaurant PREPAID subscription, chosen monthly by the user:
   ├─ $49/month  Starter
   ├─ $99/month  Growth
   └─ Enterprise = org-level custom pricing that SUPERSEDES every restaurant's choice

Precedence (deterministic):
   if org Enterprise → restaurant billed at Enterprise custom rate
   else              → restaurant's own $49 or $99 choice

Billing:
   - Per-restaurant invoices (not consolidated)
   - PREPAID: user marks restaurant unavailable to stop; NO refund mid-month
   - Billable set = restaurants marked Available (in a covered market)
   - Subscription = active window (start/end) + availability flag + end-of-period timestamp
   - Cancellation requires written email authorization (recorded as evidence)
```

## 6. Currency (dual USD / INR — confirmed important)

```
Store:   price in USD (canonical list price $49 / $99 / Enterprise)
Display: user chooses to view $49 OR converted ₹ price (live exchange rate)
Pay:     settlement accepted in USD or INR ONLY (two currencies, period)

Recommended rule (to confirm before build):
   - Live exchange rate captured at invoice creation time
   - Invoice stores the settled currency + amount (locked)
   - So a multi-month prepaid invoice keeps ONE locked price in its settlement currency
```

## 7. Market / Geo Strategy

- "Worldwide" is a **per-market roadmap**, one market at a time — each market needs its own:
  - landmark / business-park intelligence for the proximity engine,
  - competitor-discovery + benchmark cohort,
  - discovery-source coverage.
- The current Geo-Intent engine is NC-Triangle-hardcoded; expanding a market is active onboarding, not a config flag.
- **First-mover in a new market:** presence factors (website, menu, reviews, contact) score globally; **benchmarks show Pending** ("insufficient comparison cohort") until a few peers join — this is the honest, agreed behavior.

## 8. Tenant Isolation & Enforcement Gap (the work to close)

- **Current gap (confirmed):** `authMiddleware` attaches only `userId`; restaurant/org scoping is NOT enforced on most read routes (scorecard, evidence, market, competitive). Only search/chat scopes to the user's authorized set. Today any authenticated user can read any restaurant.
- **Target:** resolved **organization context** flows into every read/write; Postgres **RLS keyed by `organization_id`** as the hard backstop; app-layer scoping for clean code.
- This is **DB-agnostic work** → close the enforcement gap BEFORE or alongside the SQLite → Postgres migration.

## 9. Database Strategy

- **Postgres is the destination** (strategic: multi-tenant RLS, connection pooling, scaling with orgs/restaurants, positions per-restaurant pricing long-term).
- SQLite is a valid **on-ramp** for the current 6-restaurant pilot, but is the wrong trajectory for multi-tenancy + growth.
- Firestore is **rejected** (document DB; no Prisma/SQL; wrong model for the relational evidence graph).
- Prisma provider change (`sqlite` → `postgresql`) + data port; the evidence ledger and contamination gates port cleanly.

## 10. What "Done" Looks Like (scope of future implementation)

1. Add `organizationId` ownership to Restaurant + enforce org/restaurant scoping on every route.
2. Add Postgres RLS by `organization_id` as the data-isolation backstop.
3. Implement the restaurant lifecycle state machine (Onboarded → Audited → In-Covered-Market → Available → Unavailable → Closed).
4. Implement the per-restaurant PREPAID subscription + billing engine ($49/$99/Enterprise override, per-restaurant invoices, cancellation-with-email-authorization workflow).
5. Implement dual-currency (USD/INR) display + settlement with locked invoice rate.
6. Implement the 4 personas as fixed roles (no RBAC engine), enforcing data scope via org/restaurant.
7. Build the Market/Coverage entity and migrate the Geo-Intent engine from NC-hardcode to per-market config.
8. Migrate SQLite → Postgres.
9. Wire the pricing tiers into the existing Razorpay subscription integration.

## 11. Open items to confirm during build (no blockers to design)

- Currency conversion live-at-invoice vs. locked — recommended **locked at invoice creation** (see §6).
- Whether Enterprise custom pricing also needs a custom seat/per-persona consideration (currently unlimited seats under org).
- Payment-provider behavior for INR settlement (Razorpay is already the integration; confirm INR support).
