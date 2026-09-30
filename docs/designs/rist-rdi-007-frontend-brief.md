# RIST-RDI-007 — Frontend Signal Drill-Down (brief for implementer)

Implement the customer-facing signal drill-down in the RistoranteDiscovery **frontend only**. Do NOT touch backend. Do NOT commit. Do NOT touch unrelated files (working tree has uncommitted prior-session files).

## READ FIRST
1. `docs/designs/rist-rdi-007-signal-design-v1.md` §18–§36 (UI architecture, factor card, expanded factor, SignalRow, EvidenceDrawer, score colors, mobile, search/sort/filter) — the authoritative UX spec.
2. `frontend/app/dashboard/restaurants/[id]/page.tsx` — the restaurant detail page that stitches the scorecard UI.
3. `frontend/components/scorecard/ScorecardComponents.tsx` — exports: `ScorecardData`, `FactorScore` (types), `CategoryScore`, `MasterScore`, `CategoryScoreStrip`, `ExpandableFactorCard`, `FactorCard`, `ProblemFactors`, `PendingFactors`, `statusColor/statusBg/statusLabel`, `formatFreshness`. This is where the factor UI lives.
4. `frontend/lib/design-tokens.ts` — frozen tokens (`colors`, `spacing`, `radius`, `typography`, `scoreColor`, `scoreLabel`). Use them; do NOT introduce new hardcoded colors.
5. `frontend/app/lib/api.ts` and `frontend/app/lib/api-config.ts` — API base URL (`API` from `@/app/lib/api-config`).

## Context — what the backend now returns (Phase A–E landed; verify against the live API)
`GET /api/restaurants/:id/scorecard` response `data` now includes (additive — all existing fields unchanged):
- `Scorecard.signalModel` — `{ supportedSignals, observedSignals, pendingSignals, notApplicableSignals, staleSignals, factors, realSourcesOnly, syntheticInputs, manualOverrides, methodologyVersion }`
- Each `FactorScore` now includes:
  - `signals: Array<{ id, restaurantId, factorId, signalKey, label, description, status: 'measured'|'partial'|'pending_observation'|'not_applicable'|'stale', rawValue?, normalizedValue?, normalizedScale?{min,max}, scoreContribution?, weight, confidence, observedAt?, evidenceRefs: string[], methodologyVersion }>`
  - `coverage?: { measured: number; total: number }`
  - `coverageDetail?: { totalSignals, measured, partial, pending, notApplicable, stale }`
  - `measuredSignalCount?, totalSignalCount?, pendingSignalCount?, notApplicableCount?, staleCount?, lastObservedAt?`
Also `GET /api/restaurants/:id/signals` returns `{ data: { factors, summary } }` (drill-down source if needed).

## Deliverables — follow spec §18–§36 exactly

1. **Extend the scorecard types** in `frontend/components/scorecard/ScorecardComponents.tsx`: add `DiscoverySignal` interface and extend `FactorScore` ADDITIVELY (keep every existing field/export) with `signals`, `coverage?`, `coverageDetail?`, `measuredSignalCount?`, `pendingSignalCount?`, `notApplicableCount?`, `staleCount?`, `lastObservedAt?`. Extend `ScorecardData` with `signalModel?`. Keep fields optional so the UI never crashes when the API omits them.

2. **Factor card shows coverage + confidence** (spec §20): a measurable factor card shows `Coverage X / Y` (from coverageDetail.measured / total), Confidence %, Evidence count, `Updated Nm ago`. Low-confidence factors must be visually distinguishable from high-confidence ones WITHOUT color alone (pair color with a text/badge — spec §27 "Do not use color as the only status indicator"). Pending stays neutral/gray.

3. **Expanded factor drills to signals** (spec §21): inside `ExpandableFactorCard`, render the signal list. Each measured/partial signal shows: status icon (✓/⚠/○), label, observed value, signal score, confidence. Each pending_observation/stale/not_applicable shows a muted row with "Pending Observation"-style text and NO fabricated number. Progressive disclosure: signals are inside the expanded factor, not a giant table.

4. **Create `frontend/components/scorecard/SignalRow.tsx`** (reusable, spec §22): status icon, label, observed value, signal score, confidence (text + color pair), evidence count. Do NOT show technical weights to customers.

5. **Create `frontend/components/scorecard/EvidenceDrawer.tsx`** (reusable, spec §23): clicking a signal's evidence opens a drawer with Observation description, Source (sourceName/sourceType), Observed (observedAt date), Confidence, Methodology (methodologyVersion). Must be dismissible and usable on mobile (full-width).

6. **Top Problems expanded reason** (spec §33–§34): keep Top Problems factor-level; when expanded, show the factor's weak AND strong measured signals (why it's low + what's good).

7. **Search** (spec §30): extend existing search to also match `signal.key` and `signal.label`, surfacing the matching factor cards.

8. **Sort** (spec §31): add sort options — lowest score (default), highest score, lowest confidence, most evidence, most pending signals, category, alphabetical. Default = lowest score / greatest attention first.

9. **Filter** (spec §32): keep primary status filters (Excellent/Good/Fair/Needs Attention/Critical/Pending Observation). Add SECONDARY/advanced filters (collapsed/section) for Low Confidence, Incomplete Coverage, Stale Evidence. Never expose hundreds of controls.

10. **Score colors** (spec §27): reuse frozen `statusColor`/thresholds (90+ Excellent, 80-89 Good, 70-79 Fair, 50-69 Needs Attention, <50 Critical, Pending gray). Do NOT redefine.

11. **Mobile** (spec §28): at 375px, expanded signal list stacks vertically; EvidenceDrawer is full-width and usable. No giant horizontal table.

## Constraints
- Do NOT change existing top-level behavior of `MasterScore`, `CategoryScoreStrip`, `ProblemFactors`, `PendingFactors` (you may enhance internals, keep outward behavior).
- Only wire against fields the backend actually returns; degrade gracefully if a field is absent (do not crash).
- Update types in `frontend/components/scorecard/ScorecardComponents.tsx` and any file that maps the scorecard, so `npm run build` + `npx tsc` pass.
- If any existing Playwright E2E under `e2e/` depends on the old sub-signal block selectors, keep those selectors working OR list the test files/names you changed so they can be re-run.

## Verify (run yourself)
- `cd frontend && npx tsc --noEmit` passes.
- `cd frontend && npm run build` passes (Next.js build).
- If backend (:8040) and frontend (:3000) are running, manually load a restaurant detail page and confirm the expanded factor renders signal rows without console errors.

## Report
Files created/modified; confirm the existing 25-factor layout is preserved; confirm typecheck + build; note any existing E2E selectors you adjusted. Do not commit.
