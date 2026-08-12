import { Router, Request, Response } from 'express';
import { getScorecard } from '../../domain/scorecard/ScorecardService';
import { captureSnapshot, getSnapshotHistory } from '../../domain/scorecard/ScorecardSnapshotService';
import { computeBenchmarks, getBenchmarks, latestBenchmarkTime, type BenchmarkDimension } from '../../domain/scorecard/BenchmarkService';

const router = Router();

router.get('/restaurants/:id/scorecard', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No authorization token' });
    const token = authHeader.replace('Bearer ', '');
    const scorecard = await getScorecard(req.params.id, token);
    // Capture a snapshot so history accumulates on every read.
    await captureSnapshot(req.params.id);
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

export default router;
