// SEO Intelligence routes — mounted under /api/v1/seo

import { Router } from 'express';
import { SEOController } from '../../interfaces/controllers/SEOController';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const controller = new SEOController(prisma);

const router = Router();

router.get('/restaurants/:restaurantId/audit', controller.audit);
router.get('/audit-all', controller.auditAll);

export default router;
