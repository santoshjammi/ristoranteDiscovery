// Market Intelligence routes — mounted under /api/v1/market

import { Router } from 'express';
import { MarketController } from '../../interfaces/controllers/MarketController';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const controller = new MarketController(prisma);

const router = Router();

router.post('/analyze', controller.analyze);

export default router;
