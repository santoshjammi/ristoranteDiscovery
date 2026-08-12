// Audit routes — mounted under /api/audit

import { Router } from 'express';
import { AuditController } from '../controllers/AuditController';

const router = Router();
const controller = new AuditController();

// Run a full audit across all intelligence engines
router.post('/restaurants/:id', controller.runAudit);

export default router;
