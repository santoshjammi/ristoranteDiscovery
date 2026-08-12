// Interface adapter: Audit Controller
// Thin — delegates to AuditService, formats HTTP responses

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuditService } from '../../application/audit/AuditService';

export class AuditController {
  private auditService: AuditService;

  constructor() {
    this.auditService = new AuditService(new PrismaClient());
  }

  /**
   * POST /api/audit/restaurants/:id
   * Run a full audit across all intelligence engines
   */
  runAudit = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const report = await this.auditService.runAudit(id);
      res.json({ data: report });
    } catch (error: any) {
      console.error('Audit failed:', error);
      res.status(500).json({ error: { code: 'AUDIT_FAILED', message: error.message } });
    }
  };
}
