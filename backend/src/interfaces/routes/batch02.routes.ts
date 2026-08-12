import { Request, Response, Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { BillingService } from '../../application/billing/BillingService';
import { UsageService } from '../../application/usage/UsageService';
import { TeamService } from '../../application/team/TeamService';
import { ConnectorService } from '../../application/connector-platform/ConnectorService';
import { InsightsService } from '../../application/insights/InsightsService';
import { SettingsService } from '../../application/settings/SettingsService';
import { FeatureFlagService } from '../../application/flags/FeatureFlagService';
import { AdminService } from '../../application/admin/AdminService';
import { authMiddleware } from '../middleware/auth';

const prisma = new PrismaClient();
const billing = new BillingService(prisma);
const usage = new UsageService(prisma);
const team = new TeamService(prisma);
const connector = new ConnectorService(prisma);
const insights = new InsightsService(prisma);
const settings = new SettingsService(prisma);
const flags = new FeatureFlagService(prisma);
const admin = new AdminService(prisma);

const router = Router();

// ── Billing ──
router.get('/billing/plans', async (_req: Request, res: Response) => { res.json({ data: await billing.getPlans() }); });
router.get('/billing/subscription', authMiddleware, async (req: Request, res: Response) => {
  const orgId = req.headers['x-org-id'] as string;
  if (!orgId) { res.status(400).json({ error: 'x-org-id header required' }); return; }
  res.json({ data: await billing.getSubscription(orgId) });
});
router.post('/billing/subscribe', authMiddleware, async (req: Request, res: Response) => {
  const orgId = req.headers['x-org-id'] as string;
  const { planId } = req.body;
  if (!orgId || !planId) { res.status(400).json({ error: 'x-org-id and planId required' }); return; }
  res.json({ data: await billing.createSubscription(orgId, planId) });
});
router.get('/billing/invoices', authMiddleware, async (req: Request, res: Response) => {
  const orgId = req.headers['x-org-id'] as string;
  if (!orgId) { res.status(400).json({ error: 'x-org-id header required' }); return; }
  res.json({ data: await billing.getInvoices(orgId) });
});

// ── Usage ──
router.get('/usage', authMiddleware, async (req: Request, res: Response) => {
  const orgId = req.headers['x-org-id'] as string;
  if (!orgId) { res.status(400).json({ error: 'x-org-id header required' }); return; }
  res.json({ data: await usage.getUsage(orgId) });
});

// ── Team ──
router.get('/team/members', authMiddleware, async (req: Request, res: Response) => {
  const orgId = req.headers['x-org-id'] as string;
  if (!orgId) { res.status(400).json({ error: 'x-org-id header required' }); return; }
  res.json({ data: await team.getMembers(orgId) });
});
router.post('/team/invite', authMiddleware, async (req: Request, res: Response) => {
  const orgId = req.headers['x-org-id'] as string;
  const { email, role } = req.body;
  if (!orgId || !email) { res.status(400).json({ error: 'x-org-id and email required' }); return; }
  res.json({ data: await team.invite(orgId, email, role || 'member', (req as any).userId) });
});
router.post('/team/accept', async (req: Request, res: Response) => {
  const { token, userId } = req.body;
  if (!token || !userId) { res.status(400).json({ error: 'token and userId required' }); return; }
  res.json({ data: await team.accept(token, userId) });
});
router.delete('/team/members/:userId', authMiddleware, async (req: Request, res: Response) => {
  const orgId = req.headers['x-org-id'] as string;
  if (!orgId) { res.status(400).json({ error: 'x-org-id header required' }); return; }
  res.json({ data: await team.removeMember(orgId, req.params.userId) });
});

// ── Connectors ──
// (Moved to connector.routes.ts — mounted at /api/connectors in api.routes.ts)

// ── Insights ──
router.get('/insights/templates', async (req: Request, res: Response) => {
  res.json({ data: await insights.getTemplates(req.query.category as string) });
});
router.get('/insights/restaurants/:restaurantId', authMiddleware, async (req: Request, res: Response) => {
  res.json({ data: await insights.getInsightsForRestaurant(req.params.restaurantId) });
});

// ── Settings ──
router.get('/settings', authMiddleware, async (req: Request, res: Response) => {
  const orgId = req.headers['x-org-id'] as string;
  if (!orgId) { res.status(400).json({ error: 'x-org-id header required' }); return; }
  res.json({ data: await settings.get(orgId) });
});
router.put('/settings/branding', authMiddleware, async (req: Request, res: Response) => {
  const orgId = req.headers['x-org-id'] as string;
  if (!orgId) { res.status(400).json({ error: 'x-org-id header required' }); return; }
  res.json({ data: await settings.updateBranding(orgId, req.body) });
});
router.put('/settings/notifications', authMiddleware, async (req: Request, res: Response) => {
  const orgId = req.headers['x-org-id'] as string;
  if (!orgId) { res.status(400).json({ error: 'x-org-id header required' }); return; }
  res.json({ data: await settings.updateNotifications(orgId, req.body) });
});

// ── Feature Flags ──
router.get('/flags', async (_req: Request, res: Response) => { res.json({ data: await flags.getAll() }); });
router.get('/flags/:name', async (req: Request, res: Response) => {
  const orgId = req.headers['x-org-id'] as string;
  res.json({ data: { name: req.params.name, enabled: await flags.isEnabled(req.params.name, orgId) } });
});

// ── Admin ──
router.get('/admin/stats', authMiddleware, async (_req: Request, res: Response) => { res.json({ data: await admin.getStats() }); });
router.get('/admin/users', authMiddleware, async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  res.json({ data: await admin.getUsers(page) });
});
router.get('/admin/organizations', authMiddleware, async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  res.json({ data: await admin.getOrganizations(page) });
});
router.get('/admin/audit-log', authMiddleware, async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  res.json({ data: await admin.getAuditLog(page) });
});
router.get('/admin/connector-jobs', authMiddleware, async (_req: Request, res: Response) => {
  res.json({ data: await admin.getConnectorJobs() });
});

export default router;
