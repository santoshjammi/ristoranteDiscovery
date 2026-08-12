import { Router, Request, Response } from 'express';
import { getScorecard } from '../../domain/scorecard/ScorecardService';

const router = Router();

router.get('/restaurants/:id/scorecard', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No authorization token' });
    const token = authHeader.replace('Bearer ', '');
    const scorecard = await getScorecard(req.params.id, token);
    res.json({ data: scorecard });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
