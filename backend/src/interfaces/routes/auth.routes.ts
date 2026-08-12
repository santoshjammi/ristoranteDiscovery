// Auth routes — mounted under /api/v1/auth

import { Router } from 'express';
import { AuthController } from '../../interfaces/controllers/AuthController';
import { authMiddleware } from '../../interfaces/middleware/auth';

const controller = new AuthController();
const router = Router();

router.post('/signup', controller.signUp);
router.post('/signin', controller.signIn);
router.get('/profile', authMiddleware, controller.profile);

export default router;
