// Organization routes — mounted under /api/v1/organizations

import { Router } from 'express';
import { OrganizationController } from '../../interfaces/controllers/OrganizationController';
import { authMiddleware } from '../../interfaces/middleware/auth';

const controller = new OrganizationController();
const router = Router();

router.use(authMiddleware);

router.post('/', controller.create);
router.get('/', controller.listMine);
router.get('/:id', controller.get);
router.post('/:id/restaurants', controller.addRestaurant);
router.get('/:id/members', controller.getMembers);
router.post('/:id/invitations', controller.inviteMember);
router.delete('/:id/members/:memberId', controller.removeMember);

export default router;
