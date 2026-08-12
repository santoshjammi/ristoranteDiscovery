import { Router, Request, Response } from 'express';
import { getPortfolio } from '../../application/portfolio/PortfolioService';

const router = Router();

// GET /api/portfolio — executive portfolio view (all restaurants' scores)
// Supports ?limit=N to cap the number of restaurants scored per request.
router.get('/', async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : undefined;
    const portfolio = await getPortfolio(limit);
    res.json({ data: portfolio });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
