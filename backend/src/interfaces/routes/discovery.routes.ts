// Discovery routes — mounted under /api/v1/discovery

import { Router } from 'express';
import { DiscoveryController } from '../../interfaces/controllers/DiscoveryController';

const router = Router();
const controller = new DiscoveryController();

// Intake a restaurant: resolve → observe → score → audit
router.post('/intake', controller.intake);

// Analyze a restaurant: evidence → scores → recommendations → report
router.post('/restaurants/:id/analyze', controller.analyze);

// Get the current Digital Twin state
router.get('/restaurants/:id/twin', controller.getTwin);

export default router;
