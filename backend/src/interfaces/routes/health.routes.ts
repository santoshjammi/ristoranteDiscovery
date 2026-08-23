// Health check and readiness probe endpoints
// Supports Kubernetes/Docker readiness and liveness probes

import { Request, Response, Router } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

// Liveness probe — is the process alive?
router.get('/health/live', (_req: Request, res: Response) => {
  res.json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Alias for clients that still call /api/health/live
router.get('/api/health/live', (_req: Request, res: Response) => {
  res.json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Readiness probe — is the service ready to serve traffic?
router.get('/health/ready', async (_req: Request, res: Response) => {
  try {
    // Check database connectivity
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      status: 'ready',
      timestamp: new Date().toISOString(),
      checks: {
        database: 'healthy',
      },
    });
  } catch (error) {
    res.status(503).json({
      status: 'not-ready',
      timestamp: new Date().toISOString(),
      checks: {
        database: 'unhealthy',
      },
    });
  }
});

// Detailed health check with all dependencies
router.get('/health', async (_req: Request, res: Response) => {
  const checks: Record<string, string> = {};

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = 'healthy';
  } catch {
    checks.database = 'unhealthy';
  }

  const allHealthy = Object.values(checks).every(c => c === 'healthy');

  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    service: 'Restaurant Discovery Intelligence Backend',
    version: process.env.APP_VERSION || '1.0.0',
    checks,
  });
});

export default router;
