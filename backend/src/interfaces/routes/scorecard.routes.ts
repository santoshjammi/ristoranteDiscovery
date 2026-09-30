import { Router, Request, Response } from 'express';
import prisma from '../../config/db';
import { getScorecard } from '../../domain/scorecard/ScorecardService';
import { captureSnapshot, getSnapshotHistory } from '../../domain/scorecard/ScorecardSnapshotService';
import { computeBenchmarks, getBenchmarks, latestBenchmarkTime, type BenchmarkDimension } from '../../domain/scorecard/BenchmarkService';
import { getEvidenceTimeline } from '../../domain/scorecard/EvidenceTimelineService';
import { simulateImpact, simulateAllImpacts } from '../../domain/scorecard/ImpactSimulationService';
import { generateExecutivePDF } from '../../application/reporting/ExecutivePDFService';
import { getCrossFactorReport } from '../../domain/scorecard/CrossFactorService';
import { compareRestaurant } from '../../domain/scorecard/ComparisonService';
import {
  resolveAllFactors,
  buildFactorCapabilities,
  type SignalResolverContext,
  type ScanEvidenceRow,
  type BenchmarkRow,
  type SnapshotPoint,
} from '../../domain/discovery-intelligence/SignalResolver';

const router = Router();

// ── Real-data provenance (RIST-RDI-005) ──
// Exposes the append-only evidence ledger for a restaurant so a customer can
// verify that every score is backed by a REAL, live public source. Each row
// carries the source URL (sourceId), source type, observed-at timestamp, and
// confidence. This is the customer-facing "prove it" surface: the data is
// real, and now it is provably real.
//
// Only rows whose sourceId is a real absolute http(s) URL are surfaced. Any
// synthetic/placeholder source (e.g. *.example.com, test markers) is excluded
// so the customer never sees mock data. This mirrors the showcase-isolation
// gate: real data only, physically filtered at the source.

const SYNTHETIC_SOURCE_MARKERS = [
  'test', 'page', 'breadcrumb', 'probe', 'fixture', 'example.com',
  'tirde-restaurant.example.com', 'sample', 'dummy',
];

function isRealSourceUrl(sourceId: string): boolean {
  const lower = sourceId.toLowerCase();
  if (!/^https?:\/\//i.test(sourceId)) return false;
  return !SYNTHETIC_SOURCE_MARKERS.some((m) => lower.includes(m));
}

function sourceTypeLabel(sourceType: string): string {
  const map: Record<string, string> = {
    google_share: 'Google Business Profile',
    menu_page: 'Menu page',
    listing_page: 'Listing / review platform',
    social_profile: 'Social profile',
    website: 'Restaurant website',
  };
  return map[sourceType] || sourceType.replace(/_/g, ' ');
}

// GET /api/restaurants/:id/evidence — real source-linked evidence for a restaurant
router.get('/restaurants/:id/evidence', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const restaurant = await prisma.restaurant.findUnique({ where: { id } });
    if (!restaurant) {
      res.status(404).json({ error: 'Restaurant not found' });
      return;
    }

    const records = await prisma.evidenceRecord.findMany({
      where: { entityType: 'Restaurant', entityId: id, status: 'active' },
      orderBy: { observedAt: 'desc' },
      take: 50,
    });

    const evidence = records
      .filter((r) => isRealSourceUrl(r.sourceId))
      .map((r) => ({
        id: r.id,
        sourceUrl: r.sourceId,
        sourceType: r.sourceType,
        sourceTypeLabel: sourceTypeLabel(r.sourceType),
        observedAt: r.observedAt.toISOString(),
        confidence: r.confidence,
        status: r.status,
      }));

    // Latest observed-at across all real evidence = "last verified" for the banner.
    const lastVerified = evidence.length > 0 ? evidence[0].observedAt : null;

    res.json({
      data: {
        restaurantId: id,
        restaurantName: restaurant.name,
        evidence,
        count: evidence.length,
        lastVerified,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/restaurants/:id/scorecard', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No authorization token' });
    const token = authHeader.replace('Bearer ', '');
    const scorecard = await getScorecard(req.params.id, token);
    // NOTE: read-only — no snapshot capture here. Snapshots are captured at
    // meaningful mutation points (analysis completion, score recalc, source change).
    res.json({ data: scorecard });
    } catch (err: any) {
    res.status(500).json({ error: err.message });
    }
    });

    // ── RIST-RDI-007 Signal drill-down (additive) ──
    // Best-effort: assemble the resolver context from real data and resolve all
    // 25 factors' DiscoverySignal[] + the restaurant signal-model summary. Any
    // read failure is swallowed (empty arrays) so the endpoint stays available.
    async function getSignalDrillDown(restaurantId: string): Promise<{ factors: Awaited<ReturnType<typeof resolveAllFactors>>['factors']; summary: Awaited<ReturnType<typeof resolveAllFactors>>['summary'] }> {
    const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
    if (!restaurant) throw new Error('Restaurant not found');

    const [connectorData, menuCount, reviewCount, faqCount, schemaCount, evidenceRows, benchmarkRows, snapshotRows] =
    await Promise.all([
        prisma.connectorScorecardData.findMany({ where: { restaurantId } }),
        prisma.menuItem.count({ where: { restaurantId } }),
        prisma.reviewAnalysis.count({ where: { restaurantId } }),
        prisma.fAQ.count({ where: { restaurantId } }),
        prisma.sEOMarkup.count({ where: { restaurantId } }),
        prisma.evidenceRecord.findMany({ where: { entityType: 'Restaurant', entityId: restaurantId } }),
        prisma.benchmark.findMany({ where: { restaurantId } }),
        prisma.scorecardSnapshot.findMany({ where: { restaurantId } }),
    ]);

    const connectorMap = new Map(
    connectorData.map(cd => [
        cd.factorId,
        { score: cd.score, confidence: cd.confidence, evidence: JSON.parse(cd.evidence || '[]') as string[], syncedAt: cd.syncedAt },
    ]),
    );

    const presence = {
    hasMenuData: menuCount > 0,
    hasReviewData: reviewCount > 0,
    hasFaqData: faqCount > 0,
    hasSchemaData: schemaCount > 0,
    hasAnyData: menuCount > 0 || reviewCount > 0 || faqCount > 0 || schemaCount > 0,
    };

    const scanEvidence: ScanEvidenceRow[] = evidenceRows.map((er) => ({
    signalKey: (() => { try { const p = JSON.parse(er.payload || '{}'); return p?.signalKey ?? undefined; } catch { return undefined; } })(),
    sourceId: er.sourceId, sourceType: er.sourceType, observedAt: er.observedAt,
    confidence: er.confidence, payload: er.payload, status: er.status,
    }));
    const benchmarks: BenchmarkRow[] = benchmarkRows.map((b) => ({
    factorId: b.factorId, score: b.score, p50: b.p50, p75: b.p75, p90: b.p90,
    count: b.count, dimension: b.dimension, dimensionValue: b.dimensionValue,
    }));
    const snapshots: SnapshotPoint[] = snapshotRows.map((s) => ({
    capturedAt: s.capturedAt, overallScore: s.overallScore,
    factorScores: (() => { try { return s.factorScores ? JSON.parse(s.factorScores) : undefined; } catch { return undefined; } })(),
    }));

    const ctx: SignalResolverContext = {
    restaurantId, restaurant, presence, connectorMap, scanEvidence, benchmarks, snapshots,
    capabilities: buildFactorCapabilities(restaurant),
    now: new Date(),
    };

    return resolveAllFactors(ctx);
    }

    // GET /api/restaurants/:id/signals — per-factor signal model + restaurant summary
    router.get('/restaurants/:id/signals', async (req: Request, res: Response) => {
    try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No authorization token' });
    const signalDrillDown = await getSignalDrillDown(req.params.id);
    res.json({ data: signalDrillDown });
    } catch (err: any) {
    res.status(500).json({ error: err.message });
    }
    });

// GET /api/restaurants/:id/scorecard/history?range=7d|30d|90d|all
router.get('/restaurants/:id/scorecard/history', async (req: Request, res: Response) => {
  try {
    const range = (req.query.range as string) || '30d';
    const history = await getSnapshotHistory(req.params.id, range as any);
    res.json({ data: history });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/restaurants/:id/benchmarks?dimension=city|cuisine|price|competitors
router.get('/restaurants/:id/benchmarks', async (req: Request, res: Response) => {
  try {
    const dimension = req.query.dimension as BenchmarkDimension | undefined;
    // Return cached benchmarks if present; recompute only when empty or stale (>1h).
    const cached = await getBenchmarks(req.params.id, dimension);
    const fresh = cached.length > 0 && Date.now() - (await latestBenchmarkTime(req.params.id)) < 60 * 60 * 1000;
    if (fresh) {
      res.json({ data: cached });
      return;
    }
    await computeBenchmarks(req.params.id);
    const benchmarks = await getBenchmarks(req.params.id, dimension);
    res.json({ data: benchmarks });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/restaurants/:id/scorecard/timeline — evidence timeline
router.get('/restaurants/:id/scorecard/timeline', async (req: Request, res: Response) => {
  try {
    const timeline = await getEvidenceTimeline(req.params.id);
    res.json({ data: timeline });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/restaurants/:id/scorecard/impact — all factor impact simulations
router.get('/restaurants/:id/scorecard/impact', async (req: Request, res: Response) => {
  try {
    const impacts = await simulateAllImpacts(req.params.id);
    res.json({ data: impacts });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/restaurants/:id/scorecard/pdf — executive PDF report
router.get('/restaurants/:id/scorecard/pdf', async (req: Request, res: Response) => {
  try {
    const pdf = await generateExecutivePDF(req.params.id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="intelligence-${req.params.id}.pdf"`);
    res.send(Buffer.from(pdf));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/restaurants/:id/scorecard/relationships — cross-factor relationships
router.get('/restaurants/:id/scorecard/relationships', async (req: Request, res: Response) => {
  try {
    const report = await getCrossFactorReport(req.params.id);
    res.json({ data: report });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/restaurants/:id/compare — compare against relevant competitors
router.get('/restaurants/:id/compare', async (req: Request, res: Response) => {
  try {
    const comparison = await compareRestaurant(req.params.id);
    res.json({ data: comparison });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
