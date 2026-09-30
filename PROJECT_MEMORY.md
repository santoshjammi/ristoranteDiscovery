# PROJECT_MEMORY — RistoranteDiscovery (TIRDE)

> **Durable project identity.** Read at every session start. Updated at every session end.
> Task status lives in `docs/project-ledger.md`; this file captures *who the project is* and *what must never be repeated*.

---

## 1. Identity

- **Product:** RistoranteDiscovery / TIRDE v4.0 — Triangle Indian Restaurant Discoverability Engine
- **Category:** Restaurant Visibility / Decision Intelligence (not SEO, not marketing, not analytics)
- **Mission:** *Know what's wrong. Know what to do next. Measure the improvement.*
- **Stack:** Next.js 16 frontend (port 3000) · Node/Express + Prisma + SQLite backend (port 8040) · Docker multi-app VPS
- **Repo root:** `/Users/santosh/Desktop/projects/ristorante/ristoranteDiscovery`

## 2. Vision & Mission

Turn public restaurant data (website, menu, reviews, Google Business Profile) into a **prioritized, evidence-backed action plan**. Deterministic at the core, AI-augmented at the edges. The core discovery product must remain functional when every AI provider is unavailable.

## 3. Coverage / Scope

- **Geography:** NC Research Triangle (Raleigh, Cary, Morrisville, RTP Corridor) → Indian restaurants (~200) → all cuisines → regional → national
- **Customer-visible production DB:** `backend/prisma/rtp-showcase.db` — **exactly 6 REAL_VERIFIED restaurants**, zero synthetic rows
- **Real restaurants:** The Mill Raleigh, Urban Turban Indian Grill and Bar, Biryani Maxx, Dharani, Tandoori Flame, Anand Bhavan
- **27 pages** · ~30 API routes · 159 tests passing (~1,630 assertions)

## 4. Architecture (Current)

```
Product Experience
  ↓
Application Use Cases (controllers/application)
  ↓
Deterministic Domain (domain/ + application/)   ← ZERO AI dependency, byte-identical
  scorecard · evidence · provenance · benchmarks · trends · decisions · impact
  ↓ capability calls (never provider)
AI Capability Layer (infrastructure/ai/)        ← extraction, RAG, conversation only
  ↓
Providers (NVIDIA NIM → Ollama Cloud → local Ollama)
```

### Multi-Tenant Direction (FROZEN — no implementation yet)

**RIST-MT-001** (`docs/designs/rist-mt-001-multitenancy.md`) is the agreed multi-tenant design. Key points:
- **Organization = tenant**, owns many restaurants globally.
- **4 fixed personas** (Org Admin / Restaurant Operator / Read-only Viewer / Agency Account Manager) — no RBAC engine.
- **Per-restaurant PREPAID pricing** — $49 Starter | $99 Growth | Enterprise org-override (supersedes both). Per-restaurant invoices.
- **Restaurant lifecycle:** Onboarded → Audited → In-Covered-Market → Available (billable) → Unavailable (Org-Admin-only + written email auth) → Closed.
- **Audit before onboarding** any restaurant; intelligence produced only for covered markets.
- **Dual-currency USD/INR** display + settlement.
- **DB strategy:** Postgres final (RLS by `organization_id` + app-layer scoping); SQLite is the on-ramp; Firestore rejected.
- **Enforcement gap (open):** close org/restaurant scoping on ALL routes — currently only search/chat is scoped.

**Frozen invariant (RIST-AI-001):** AI may extract, interpret, retrieve, explain, synthesize, and converse over evidence — but it does **not** own canonical public evidence, scoring arithmetic, identity, provenance, benchmarks, trends, permissions, or business-state transitions.

## 5. Foundation Documents

- `CONSTITUTION.md` · `docs/product-experience-constitution.md` · `docs/qa-constitution.md`
- `docs/designs/rist-ai-001-architecture.md` (AI capability layer, frozen)
- `docs/designs/rist-rdi-003-*.md` (real-data deployment isolation)
- `docs/market-perception.md` · `docs/sales-brief.md` · `docs/walkthrough.md`
- `docs/project-ledger.md` (live task state)

## 6. Current Blockers (P1 — Must Fix)

- **Customer cannot *prove* the data is real.** The engineering guarantees real data (see §10), but the UI does not surface it: the scorecard page does not render the source-linked `EvidencePanel`, and no evidence row shows a clickable source URL, observed-at timestamp, or confidence. A skeptical customer has no way to click through to the live source behind a score. **This is the "prove it" gap.**

## 7. Operating Model

- **Pilot loop (MSP freeze):** `Restaurant → Audit → Conversation → Decision → Action → Outcome → Feedback`
- Goal: **10 pilot restaurants**, personally observed. Uncomfortable metric: *"I didn't know this was a problem, and now I know what to do about it"* + *"Would you pay to keep monitoring this?"*
- GTM wedge: Free Restaurant Intelligence Audit → Score → Problems → Actions → Monitoring → Subscription
- Engineering exceptions only: P0 pilot-blocking defect, P1 no-first-value, P1 score/evidence demonstrably wrong, P1 can't understand/act, P1 repeated pilot request. Everything else → backlog.

## 8. Priority Rules

1. Real-data path is primary: Add Restaurant → discover real public evidence → generate 25-factor scorecard → deploy RTP showcase.
2. **Prove the data is real to the customer** (surface provenance in UI) — the current top priority.
3. No unrelated code changes while a live run is in flight.
4. Design-first: write `docs/designs/*.md` before implementation.

## 9. Session Log

| Date | Key decisions / work |
|------|----------------------|
| 2026-08-30 | Documented the real-data honesty architecture and identified the "prove it" gap: engineering guarantees real data, but the UI does not surface source-linked provenance. Created this PROJECT_MEMORY.md. |

## 10. Recurring Instructions (Santosh's Preferences)

- **Real-data honesty is non-negotiable.** Customer-visible data must be real. Synthetic/test fixtures may exist for testing but must never reach any customer-facing path (portfolio, scorecard, benchmark, search, PDF, RAG context).
- **Prove it, don't just be it.** Every score must be traceable to a live, clickable public source with an observed-at timestamp and confidence. The difference between *being* real and *being provably* real is the customer-facing provenance UI.
- **Preserve + isolate synthetic data.** Never delete synthetic fixtures from dev DB; build a separate clean deployment DB (`rtp-showcase.db`) with only REAL_VERIFIED rows. Isolation via config (`DATABASE_URL`), not read-time filtering.
- **Never ship cached benchmarks** computed against a polluted cohort. Recompute at runtime from the real-only cohort; `MIN_PEERS=3` → show "Pending — insufficient real comparison cohort", never fabricated percentiles.
- **Missing data = Pending Observation, never a fabricated score.** `hasRealContent()` treats `'[]'`/`'{}'`/whitespace/defaults as absent.
- **No hardcoded default credentials.** `ADMIN_PASSWORD` env-driven; `NODE_ENV=production` never auto-creates a default admin.
- **Evidence-grounded enrichment only:** extract real website/phone/cuisine/hours only from ≥0.70-confidence, non-bot-challenge pages. Never fabricate, never overwrite real values.
- **Ports:** frontend 3000, backend 8040 (Port Allocation Standard ADR-001: app N → frontend 4000+N, backend 8000+N).
- **Design-first workflow:** write `docs/designs/*.md` before implementation. Hermes owns architecture/design; coding agent owns implementation.
- **Strict project isolation** — only explicit consolidation when asked.
- **Show full file paths** in every response when creating/editing documents.

## 11. Quick Reference — Common Commands

```bash
# Backend (port 8040)
cd backend && npm run dev

# Frontend (port 3000)
cd frontend && npm run dev

# Build the clean production deployment DB (real-only, 6 restaurants)
node backend/scripts/build-showcase-db.mjs

# Contamination gate (fails build on synthetic leak into showcase DB)
cd backend && npx vitest run src/application/discovery/showcaseIsolation.test.ts

# Full backend test suite
cd backend && npm run build && npx vitest run

# Verify showcase DB contents
sqlite3 backend/prisma/rtp-showcase.db "SELECT COUNT(*) FROM Restaurant;"   # 6
sqlite3 backend/prisma/rtp-showcase.db "SELECT COUNT(*) FROM Benchmark;"     # 0 (recompute at runtime)
```
