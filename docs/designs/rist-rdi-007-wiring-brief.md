# RIST-RDI-007 Wiring Brief — implementer reference

Wire the ALREADY-BUILT discovery-intelligence signal layer into the RistoranteDiscovery backend ADDITIVELY. The registry + resolver + FactorEngine already exist and are tested; the WIRING from ScorecardService + API route is MISSING. Do not touch frontend. Do not commit. Do not touch unrelated files (working tree has 48 uncommitted prior-session files).

## READ FIRST
1. `docs/designs/rist-rdi-007-signal-design-v1.md` §8-§10, §13, §15, §29, §37-§40.
2. `backend/src/domain/discovery-intelligence/` — COMPLETE module, do NOT rework:
   - `types.ts` exports `FactorCapabilities {hasReservations,hasOnlineOrdering,hasDelivery,hasWebsite:boolean}`, `DiscoverySignal`, `FactorResult` (factorId, score|null, status, confidence, coverage{measured,total}, coverageDetail{totalSignals,measured,partial,pending,notApplicable,stale}, signals, evidenceCount, lastObservedAt?), `SignalModelSummary` (restaurantId, methodologyVersion, supportedSignals, observedSignals, pendingSignals, notApplicableSignals, staleSignals, factors, realSourcesOnly, syntheticInputs, manualOverrides).
   - `SignalResolver.ts` exports `resolveAllFactors(ctx) -> {factors, summary}`, `resolveFactorSignals(ctx, factorId) -> DiscoverySignal[]`. ctx = `SignalResolverContext`: `{ restaurantId, restaurant: Record<string,any>, presence:{hasMenuData,hasReviewData,hasFaqData,hasSchemaData,hasAnyData}, connectorMap: Map<string,{score,confidence,evidence:string[],syncedAt?}>, scanEvidence: ScanEvidenceRow[]{sourceId,sourceType,signalKey?,observedAt?,confidence?,payload?,status?}, benchmarks: BenchmarkRow[]{factorId?,score?,p50?,p75?,p90?,count?,dimension?}, snapshots: SnapshotPoint[]{capturedAt,overallScore?,factorScores?}, capabilities: FactorCapabilities, now? }`.
   - `signal-registry.ts` exports `allSignalDefinitions()`, `signalsForFactor(fid)`, `validateRegistry()`, `DISCOVERY_SIGNAL_REGISTRY`, `METHODOLOGY_VERSION`.
3. `backend/src/domain/scorecard/ScorecardService.ts` — `getScorecard(restaurantId, token)`. Read fully: fetches restaurant row `r`, builds `connectorMap` from `prisma.connectorScorecardData.findMany`, computes `presence` via `prisma.menuItem/reviewAnalysis/fAQ/sEOMarkup` counts, then builds 25 FactorScore + categories + overall. Preserve ALL existing frozen math/return shape EXACTLY.
4. `backend/src/interfaces/routes/scorecard.routes.ts` — existing route style (auth-header check, helper call, `res.json({data:...})`).
5. `backend/src/domain/scorecard/types.ts` — FactorScore + Scorecard interfaces; extend ADDITIVELY.
6. `backend/prisma/schema.prisma` — Restaurant, EvidenceRecord (entityType/entityId/sourceId/sourceType/observedAt/confidence/payload/status), Benchmark (restaurantId, factorId, score, p50/p75/p90, count, dimension), ScorecardSnapshot (read exact fields: capturedAt, overallScore?, factorScores?).

## Restaurant capability derivation
Restaurant columns: address, city, latitude/longitude (Float?), phone/website/timings (String?), cuisineTypes, priceRange, amenities (String), deliverySupport (Boolean @default(false)). NO reservation/ordering booleans. Derive conservatively:
- `hasReservations` = /reserv|booking|opentable|resy/i.test(lowercase amenities)
- `hasOnlineOrdering` = /order|zomato|swiggy/i.test(lowercase amenities) || deliverySupport === true
- `hasDelivery` = deliverySupport === true || /delivery/i.test(lowercase amenities)
- `hasWebsite` = hasRealContent(r.website)
Add exported `buildFactorCapabilities(r: Record<string,any>): FactorCapabilities`.

## CRITICAL
The resolver is PURE. getScorecard is the INTEGRATION POINT. Wire ADDITIVELY — do NOT replace the frozen factor score with the resolver's score. Backward compatibility is a hard requirement: existing score must be byte-identical. Signals/summary are a parallel additive layer.

## Deliverables
1. DELETE `backend/src/domain/discovery-intelligence/debug.test.ts` (junk file — remove entirely).
2. EXTEND `backend/src/domain/scorecard/types.ts` FactorScore ADDITIVELY (never remove/rename existing fields; mark new ones optional `?`): `signals: DiscoverySignal[]`, `coverage?`, `coverageDetail?`, `measuredSignalCount?: number`, `totalSignalCount?: number`, `pendingSignalCount?: number`, `notApplicableCount?: number`, `staleCount?: number`, `lastObservedAt?: string|null`. EXTEND Scorecard ADDITIVELY: `signalModel?: SignalModelSummary`. Import types from `../discovery-intelligence/types`.
3. `backend/src/domain/scorecard/ScorecardService.ts` getScorecard: after existing factorScores/categories/overall built (do NOT alter existing computation), build SignalResolverContext and call `resolveAllFactors`; attach to EACH FactorScore (matched by factor id) `.signals`, `.coverage`, `.coverageDetail`, `.measuredSignalCount`, `.totalSignalCount`, `.pendingSignalCount`, `.notApplicableCount`, `.staleCount`, `.lastObservedAt`. Attach `.signalModel = summary` to the returned Scorecard. Build ctx from data already fetched PLUS new prisma reads: connectorMap reused; presence reused; restaurant `r`; capabilities via buildFactorCapabilities(r); scanEvidence from `prisma.evidenceRecord.findMany({where:{entityType:'Restaurant', entityId:restaurantId}})` mapped to ScanEvidenceRow; benchmarks from `prisma.benchmark.findMany({where:{restaurantId}})`; snapshots from `prisma.scorecardSnapshot.findMany({where:{restaurantId}})` mapped to SnapshotPoint; now = new Date(). Fetch new reads with Promise.all. If a read fails or returns [], pass empty arrays — do NOT throw. Preserve frozen scores EXACTLY.
4. Add `buildFactorCapabilities` as above.
5. Add route GET `/restaurants/:id/signals` in `backend/src/interfaces/routes/scorecard.routes.ts` (same auth style): a helper `getSignalDrillDown(restaurantId)` that fetches ctx data, calls `resolveAllFactors`, returns `{ data: { factors, summary } }` (spec §29/§15). Additive, consistent style.
6. UPDATE tests: `backend/src/domain/discovery-intelligence/SignalResolver.test.ts` and `signal-registry.test.ts` must still pass. Add a wiring test proving getScorecard now returns Scorecard with `signalModel.supportedSignals>0` and each FactorScore has non-empty `signals[]` for a realistic restaurant row (mock `../../config/db` like ScorecardService.test.ts; note ScorecardService now imports evidenceRecord, benchmark, scorecardSnapshot — add those mocks). Also assert frozen scores UNCHANGED (backward compat).

## VERIFY (run yourself)
- `cd backend && npx tsc --noEmit` must pass
- `cd backend && npx vitest run` full suite: ONLY the 2 PRE-EXISTING failures in `src/application/discovery/showcaseIsolation.test.ts` allowed (separate P0 task). Your new tests all pass; no NEW failures.
- Confirm debug.test.ts deleted.

## REPORT
Files created/modified/deleted; confirm signalModel is on Scorecard AND FactorScore.signals populated via getScorecard; confirm frozen scores unchanged (quote backward-compat test); tsc result; vitest pass/fail counts.
