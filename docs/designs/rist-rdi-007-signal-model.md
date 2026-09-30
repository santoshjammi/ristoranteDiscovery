# RIST-RDI-007 — 25-Factor Discovery Signal Model Implementation

**Status:** Approved Design for Implementation
**Scope:** RistoranteDiscovery only
**Applies to:** 25-Factor / Sub-Factor Signal Model v1.0 (the expert spec)

---

## 1. Goal

Implement the **deep signal layer beneath the existing frozen 25-factor scorecard**:

- A **canonical signal registry** (spec §29) keyed by factor, enumerating ~140 discovery signals.
- A **`DiscoverySignal` domain model** with the 5-state spec §3 semantics (`measured | partial | pending_observation | not_applicable | stale`) + `rawValue`, `normalizedValue`, `scoreContribution`, `confidence`, `observedAt`, `sourceRefs`, `methodologyVersion`.
- **Deterministic signal → factor wiring** (spec §10, §28 step 7-8) that preserves the existing frozen scorecard math (`types.ts` / `ScorecardService.ts`) as the authoritative factor source.
- **Per-factor signal accounting** (spec §10): `measuredSignalCount / totalSignalCount / pendingSignalCount / evidenceCount / lastObservedAt`.
- **Restaurant-level accounting** (spec §27): `supportedSignals / observedSignals / pendingSignals`.
- **End-to-end drill-down payload** (spec §16): Score → Factor → Signal → Evidence/Source.
- **Methodology versioning** (spec §30).
- **Per-signal freshness** (spec §18) rules rather than one global TTL.

## 2. Non-Goals (from spec §34)

- No new top-level factors (still exactly 25).
- No financial/revenue/inventory staffing/POS scoring.
- No synthetic observations, no fake benchmarks, no fake history.
- No AI involvement in scoring arithmetic (RIST-AI-001 frozen boundary preserved).

## 3. Architectural Invariant (spec §37 — unchanged)

> Signals describe observable facts. Factors interpret them through deterministic scoring. Categories summarize factors. AI may enrich interpretation/communication but may not manufacture observations or own scoring arithmetic.

---

## 4. Canonical Signal Registry

### 4.1 Structure

Create `backend/src/domain/scorecard/signalRegistry.ts`:

```typescript
export type SignalStatus =
  | 'measured'            // real evidence → contributes
  | 'partial'             // some but not all evidence → contributes (lower weight)
  | 'pending_observation' // no source/observation yet → never contributes, never 0
  | 'not_applicable'      // restaurant genuinely doesn't offer it (e.g. no reservations) → excluded from factor math
  | 'stale';              // was measured but fresh evidence expired beyond its TTL → treated as pending for scoring

export type SignalValueType = 'number' | 'boolean' | 'string' | 'count' | 'duration';

export interface SignalDef {
  id: string;                 // canonical snake_case id
  factorId: string;           // owning factor (must exist in FACTORS)
  label: string;              // customer-facing (Terminology spec §31)
  description: string;
  valueType: SignalValueType;
  weight: number;             // relative weight within its factor (sum per factor normalized to 1)
  methodologyVersion: string; // '1.0'
  freshnessTTL: {             // spec §18 — per-signal-type freshness
    kind: 'hours' | 'days' | 'months' | 'continuous';
    value: number;            // TTL in the kind unit
  };
  source: SignalSource;       // deterministic source descriptor
  // NA rule: only set when a restaurant provably doesn't offer the capability.
  applicable?: 'always' | 'whenCapability' | 'whenData';
  capabilityKey?: string;     // e.g. 'hasReservations' on restaurant for N/A detection
}
```

### 4.2 Signal sources (deterministic, real-evidence-backed)

| Source kind | Resolves from |
|---|---|
| `scalar` | a Restaurant column (`hasRealContent`-gated, non-default) |
| `count` | Prisma `count()` on related model (MenuItem, ReviewAnalysis, FAQ, SEOMarkup) |
| `presence` | boolean from profile field / relation existence |
| `connector` | `ConnectorScorecardData.row` (per-factor connector scores) |
| `scan` | recent `EvidenceRecord` rows from the ScanEngine (`sourceType` + `observedAt`) |
| `benchmark` | `Benchmark` percentiles (already MIN_PEERS=3 guarded) |
| `history` | `ScorecardSnapshot` deltas (trend signals) |
| `unavailable` | no current source — signal stays `pending_observation` |

### 4.3 Signal → factor mapping (25 factors, ~140 signals)

The registry enumerates the signals listed in spec §4-8. **Implementation rule:** every signal resolves through one of the above deterministic sources. Signals whose source has no current real data resolve to `pending_observation` (never 0). Full enumeration lives in the implemented `signalRegistry.ts`; each factor gets between 2 and 15 signals (progressive — exact count per factor captured in the spec's list, we implement every enumerable one whose source exists; truly unobservable signals stay `pending_observation`).

This is the single canonical definition (spec §29) — one place that says which signals support which factor. `ScorecardService.ts` must import factor→signal mapping FROM this registry, not redefine it.

---

## 5. Domain Model (`DiscoverySignal`)

Create `backend/src/domain/scorecard/DiscoverySignal.ts` (mirroring spec §9):

```typescript
export interface DiscoverySignal {
  id: string;
  factorId: string;
  label: string;
  description: string;
  status: SignalStatus;
  rawValue?: unknown;
  normalizedValue?: number | string | boolean;
  scoreContribution?: number;   // null when not contributing (pending/NA/stale)
  confidence?: number;          // from evidence confidence, 0..1
  observedAt?: string;          // ISO
  sourceRefs: string[];         // evidence ledger / connector / scan source ids or urls
  methodologyVersion: string;
}
```

FactorScore gets an added field:
```typescript
signals: DiscoverySignal[];         // the expanded Level-4 drill-down
measuredSignalCount: number;
totalSignalCount: number;
pendingSignalCount: number;
notApplicableCount: number;
staleCount: number;
```

---

## 6. Scoring wiring (spec §10, §28 step 7-8)

- **The existing frozen `getScorecard` remains the authoritative factor scorer.** We do NOT replace its math.
- The signal layer is computed **alongside**: for each factor, `resolveFactorSignals(factorId, restaurant, presence, connectorMap, scanEvidence, snapshots, benchmarks)` returns the signals array + accounting.
- **Only `measured` and `partial` signals contribute** to `measuredSignalCount`. `pending` and `stale` never count as zero; `not_applicable` is excluded from both numerator and denominator (spec §21).
- Where a factor's score still comes from the frozen DB-fallback (as today), the signal layer **explains that score's evidence**; it does not override it. This satisfies spec §35 "map what exists, then deepen evidence underneath."

### Aggregation (kept honest)
- `scoreContribution = normalizedValue (0..1) × weight` for contributing signals.
- Factor score remains whatever `getScorecard` produced; signal layer supplies provenance + accounting + confidence + freshness.
- If a factor has ALL signals `pending_observation` → factor stays `pending_observation` (spec §20). No invented scores.

---

## 7. Restaurant-level accounting (spec §27)

`getScorecard` returns an added summary:

```yaml
signalModel:
  supportedSignals: <int>   # total in canonical registry
  observedSignals: <int>    # measured + partial across all factors
  pendingSignals: <int>
  notApplicableSignals: <int>
realSourcesOnly: true
syntheticInputs: 0
manualOverrides: 0
```

Asserted in tests.

---

## 8. API / drill-down (spec §16)

- `GET /api/restaurants/:id/scorecard` — existing payload **gains** `factor.signals[]` + accounting (backward compatible, additive only).
- `GET /api/restaurants/:id/signals?factorId=` — optional dedicated drill-down returning signal-level sourceRefs with URLs/observedAt (for Level-4 customer UI).
- No route is removed or re-named.

---

## 9. Freshness (spec §18)

- Per-signal `freshnessTTL` from registry drives status: if `observedAt` + TTL < now → `stale`.
- Staleness rules differ per source (hours=hours TTL, address=months, reviews=continuous, website=days). No single global TTL.
- `stale` contributes to `pendingSignalCount` for scoring purposes (spec §25 "fail toward Pending"), while still reported distinctly.

---

## 10. Methodology versioning (spec §30)

- Registry carries `methodologyVersion: '1.0'` globally + per signal.
- Persisted on the signal payload and re-asserted in the response so a future scoring change keeps historical interpretability.

---

## 11. Test plan (spec §26 — minimal classes, NOT one-per-signal)

New `backend/src/domain/scorecard/SignalModel.test.ts` + tests for `signalRegistry.ts`:

1. **Registry integrity** — every signal has a valid `factorId` existing in FACTORS; every factor present; no duplicate signal ids; weights per factor normalize to ~1; ids snake_case.
2. **Evidence present** → signal `measured`, contributes.
3. **Evidence absent** → `pending_observation`, contributes `scoreContribution: null`, NOT zero.
4. **Malformed evidence** (empty `[]`, `{}`, whitespace, bad JSON) → `pending_observation` (reuses `hasRealContent` rule).
5. **Stale evidence** (observedAt beyond TTL) → `stale`, excluded from measured count.
6. **Conflicting sources** (connector vs DB disagree) → connector takes priority (matching frozen behavior); low confidence propagates.
7. **Low confidence** → confidence surfaced, `measured` retained (low-confidence ≠ zero), visually distinguishable.
8. **Source mismatch** (signal id not in its factor's registry → rejected/dropped).
9. **Normalization** — raw → normalized unit mapping correct.
10. **Factor aggregation** — only measured/partial sum; pending/NA/stale excluded; measuredSignalCount/total/pending correct.
11. **Not-Appplicable semantics** — restaurant without reservations → `not_applicable`, excluded from denominator.
12. **Restaurant-level accounting** — supported/observed/pending/notApplicable counts add up.
13. **Synthetic-input gate** — a restaurant with only default columns → all relevant signals pending, `syntheticInputs:0`.
14. **Benchmark discipline** — `MIN_PEERS=3` guard still refuses percentile for tiny cohort; no synthetic peers.
15. **Trend discipline** — no artificial history; `NEW` until real snapshots exist.
16. **Backward compatibility** — existing `getScorecard` score values unchanged after adding signals (AI on == off, frozen math preserved).

Plus E2E (Phase E) for the customer UI drill-down.

---

## 12. Implementation order (spec §28)

1. ~Done — current factor inputs inventoried (this design).
2. Map existing signals → spec (registry).
3. Identify already-implemented sub-signals (they become registry signals with existing sources).
4. Identify missing-but-measurable signals (added with existing sources).
5. Identify unavailable signals (source: `unavailable` → stay pending).
6. Create canonical registry ✅.
7. Normalize evidence → signals.
8. Feed into existing factor scoring (additive signal layer).
9. Expose drill-down in factor cards.
10. Verify with RTP restaurants + tests.

---

## 13. Backward compatibility guarantee

- `FACTORS`, `CATEGORIES`, frozen factor score computation in `ScorecardService.ts` are **unchanged** (spec §35 "do not replace existing working factor logic").
- The signal layer is additive: new registry file + new functions + new response fields.
- RIST-AI-001 boundary is untouched: zero AI involvement in signal scoring.

---

## 14. Definition of Done (spec §36 mapping)

```yaml
signal_registry: { exists: true, canonical: true }  # new signalRegistry.ts
factors:       { signals_mapped: true }             # all 25 factors have >=1 registry signal
evidence:      { provenance_preserved: true,         # sourceRefs to ledger/connector/scan
                 confidence_supported: true,
                 freshness_supported: true }         # per-signal TTL
scoring:       { missing_not_zero: true,             # pending != 0
                 synthetic_inputs: false,
                 deterministic_factor_scores: true }
ui:            { 25_factor_model_preserved: true,
                 expandable_signal_details: true,    # Level-4 signal drill-down
                 evidence_traceable: true }
ai:            { deterministic_boundary_preserved: true,
                 evidence_grounded: true }
real_data:     { rtp_restaurants_verified: true }    # tested with real rows
```

All validated by the test suite (Phase B) + E2E (Phase E) + typecheck + build.
