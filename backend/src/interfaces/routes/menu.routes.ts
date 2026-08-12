// Menu Intelligence routes — mounted under /api/v1/menu

import { Router } from 'express';
import { MenuController } from '../../interfaces/controllers/MenuController';

const router = Router();
const controller = new MenuController();

// Analyze a restaurant's menu
router.post('/restaurants/:id/analyze', controller.analyze);

export default router;
