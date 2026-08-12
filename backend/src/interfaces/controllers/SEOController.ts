// Interface adapter: SEO Intelligence Controller
// Thin — delegates to domain/application logic, formats HTTP responses

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { SchemaAuditEngine } from '../../application/seo/SchemaAuditEngine';
import { PrismaSEORepository } from '../../infrastructure/persistence/seo/PrismaSEORepository';

export class SEOController {
  private readonly engine: SchemaAuditEngine;
  private readonly repository: PrismaSEORepository;

  constructor(private readonly prisma: PrismaClient) {
    this.engine = new SchemaAuditEngine();
    this.repository = new PrismaSEORepository(this.prisma);
  }

  audit = async (req: Request, res: Response): Promise<void> => {
    try {
      const { restaurantId } = req.params;

      const schemas = await this.repository.findByRestaurantId(restaurantId);

      if (schemas.length === 0) {
        res.status(404).json({ error: 'No schemas found. Generate schemas first.' });
        return;
      }

      const audit = this.engine.audit({
        restaurantId,
        schemas,
      });

      res.json({
        data: {
          restaurantId: audit.restaurantId,
          coverage: audit.coverage,
          completeness: audit.completeness,
          schemaTypesPresent: audit.schemaTypesPresent,
          schemas: audit.schemas.map(s => ({
            type: s.type,
            isValid: s.isValid,
            coverageScore: s.coverageScore,
          })),
          issues: audit.issues.map(i => ({
            schemaType: i.schemaType,
            field: i.field,
            description: i.description,
            severity: i.severity,
          })),
          auditedAt: audit.auditedAt,
        },
      });
    } catch (error) {
      console.error('SEO audit error:', error);
      res.status(500).json({ error: 'Failed to audit SEO schemas' });
    }
  };

  auditAll = async (_req: Request, res: Response): Promise<void> => {
    try {
      const allSchemas = await this.repository.findAll();

      // Group by restaurant
      const byRestaurant = new Map<string, typeof allSchemas>();
      for (const s of allSchemas) {
        const existing = byRestaurant.get(s.restaurantId) || [];
        existing.push(s);
        byRestaurant.set(s.restaurantId, existing);
      }

      const audits = Array.from(byRestaurant.entries()).map(([restaurantId, schemas]) => {
        const audit = this.engine.audit({ restaurantId, schemas });
        return {
          restaurantId: audit.restaurantId,
          coverage: audit.coverage,
          completeness: audit.completeness,
          issueCount: audit.issues.length,
          criticalIssues: audit.criticalIssues.length,
          highIssues: audit.highIssues.length,
        };
      });

      const avgCoverage = audits.length > 0
        ? Math.round(audits.reduce((s, a) => s + a.coverage, 0) / audits.length)
        : 0;
      const avgCompleteness = audits.length > 0
        ? Math.round(audits.reduce((s, a) => s + a.completeness, 0) / audits.length)
        : 0;

      res.json({
        data: {
          totalRestaurants: audits.length,
          averageCoverage: avgCoverage,
          averageCompleteness: avgCompleteness,
          totalIssues: audits.reduce((s, a) => s + a.issueCount, 0),
          totalCritical: audits.reduce((s, a) => s + a.criticalIssues, 0),
          totalHigh: audits.reduce((s, a) => s + a.highIssues, 0),
          audits,
        },
      });
    } catch (error) {
      console.error('SEO audit all error:', error);
      res.status(500).json({ error: 'Failed to audit all SEO schemas' });
    }
  };
}
