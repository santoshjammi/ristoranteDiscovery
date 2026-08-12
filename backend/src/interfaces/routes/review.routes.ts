// Review Intelligence routes — mounted under /api/v1/reviews

import { Router } from 'express';
import { ReviewController } from '../../interfaces/controllers/ReviewController';

const router = Router();
const controller = new ReviewController();

// Analyze reviews for a restaurant
router.post('/restaurants/:id/analyze', controller.analyze);

export default router;
