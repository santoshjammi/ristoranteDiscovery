// Competitive Intelligence routes — mounted under /api/v1/competitive

import { Router } from 'express';
import { CompetitiveController } from '../../interfaces/controllers/CompetitiveController';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const controller = new CompetitiveController(prisma);

const router = Router();

router.post('/restaurants/:restaurantId/analyze', controller.analyze);
router.get('/restaurants/:restaurantId/competitive-set', controller.getCompetitiveSet);

export default router;
