import { Router, Request, Response } from 'express';
import { getScorecard } from '../../domain/scorecard/ScorecardService';
import { captureSnapshot, getSnapshotHistory } from '../../domain/scorecard/ScorecardSnapshotService';
import { computeBenchmarks, getBenchmarks, latestBenchmarkTime, type BenchmarkDimension } from '../../domain/scorecard/BenchmarkService';
import { getEvidenceTimeline } from '../../domain/scorecard/EvidenceTimelineService';
import { simulateImpact, simulateAllImpacts } from '../../domain/scorecard/ImpactSimulationService';
import { generateExecutivePDF } from '../../application/reporting/ExecutivePDFService';
import { getCrossFactorReport } from '../../domain/scorecard/CrossFactorService';
import { compareRestaurant } from '../../domain/scorecard/ComparisonService';

const router = Router();

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
