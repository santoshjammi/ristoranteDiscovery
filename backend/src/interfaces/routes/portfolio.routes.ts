import { Router, Request, Response } from 'express';
import { getPortfolio } from '../../application/portfolio/PortfolioService';

const router = Router();

// GET /api/portfolio — executive portfolio view (all restaurants' scores)
router.get('/', async (_req: Request, res: Response) => {
  try {
    const portfolio = await getPortfolio();
    res.json({ data: portfolio });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
