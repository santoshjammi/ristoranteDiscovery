import { Request, Response, Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { AnalysisService } from '../../application/analysis/AnalysisService';
import { DecisionService } from '../../application/decision/DecisionService';
import { OutcomeService } from '../../application/outcome/OutcomeService';
import { FeedbackService } from '../../application/feedback/FeedbackService';
import { EventService } from '../../application/event/EventService';
import { VerificationService } from '../../application/verification/VerificationService';
import { ConnectDataService } from '../../application/connect/ConnectDataService';
import { NotesService } from '../../application/notes/NotesService';
import { WeeklySummaryService } from '../../application/summary/WeeklySummaryService';
import { NotificationService } from '../../application/notifications/NotificationService';
import { authMiddleware } from '../middleware/auth';
import { captureSnapshot } from '../../domain/scorecard/ScorecardSnapshotService';

const prisma = new PrismaClient();
const analysis = new AnalysisService(prisma);
const decisions = new DecisionService(prisma);
const outcomes = new OutcomeService(prisma);
const feedback = new FeedbackService(prisma);
const events = new EventService(prisma);
const verification = new VerificationService(prisma);
const connect = new ConnectDataService(prisma);
const notes = new NotesService(prisma);
const summary = new WeeklySummaryService(prisma);
const notifications = new NotificationService(prisma);

const router = Router();

// ── Phase 3: Observe — Connect Data ──
router.post('/restaurants/:id/connect/website', authMiddleware, async (req: Request, res: Response) => {
  res.json({ data: await connect.scanWebsite(req.params.id) });
});
router.post('/restaurants/:id/connect/gbp', authMiddleware, async (req: Request, res: Response) => {
  res.json({ data: await connect.connectGBP(req.params.id, req.body.gbpUrl) });
});
router.get('/restaurants/:id/connect/sources', authMiddleware, async (req: Request, res: Response) => {
  res.json({ data: await connect.getConnectedSources(req.params.id) });
});

// ── Phase 2: Start — Verification ──
router.post('/restaurants/:id/verify/gbp', authMiddleware, async (req: Request, res: Response) => {
  res.json({ data: await verification.startGBPVerification(req.params.id) });
});
router.post('/restaurants/:id/verify/domain', authMiddleware, async (req: Request, res: Response) => {
  res.json({ data: await verification.startDomainVerification(req.params.id, req.body.domain) });
});
router.post('/restaurants/:id/verify/confirm', authMiddleware, async (req: Request, res: Response) => {
  res.json({ data: await verification.confirm(req.params.id, req.body.method) });
});
router.get('/restaurants/:id/verify/status', authMiddleware, async (req: Request, res: Response) => {
  res.json({ data: await verification.getStatus(req.params.id) });
});

// ── Phase 6: Act — Notes ──
router.post('/decisions/:id/notes', authMiddleware, async (req: Request, res: Response) => {
  res.json({ data: await notes.add(req.params.id, req.body.content, (req as any).userId) });
});
router.get('/decisions/:id/notes', authMiddleware, async (req: Request, res: Response) => {
  res.json({ data: await notes.getByDecision(req.params.id) });
});

// ── Phase 8: Return — Weekly Summary ──
router.get('/restaurants/:id/summary', authMiddleware, async (req: Request, res: Response) => {
  res.json({ data: await summary.generate(req.params.id) });
});

// ── Phase 8: Return — Notifications ──
router.post('/restaurants/:id/notifications/send', authMiddleware, async (req: Request, res: Response) => {
  res.json({ data: await notifications.send(req.params.id, req.body.type, req.body.title, req.body.message) });
});
router.post('/restaurants/:id/notifications/weekly', authMiddleware, async (req: Request, res: Response) => {
  res.json({ data: await notifications.sendWeeklySummary(req.params.id) });
});
router.post('/restaurants/:id/notifications/new-recommendations', authMiddleware, async (req: Request, res: Response) => {
  res.json({ data: await notifications.sendNewRecommendations(req.params.id) });
});

// ── Phase 4: Understand — Analysis ──
router.post('/restaurants/:id/analyze', authMiddleware, async (req: Request, res: Response) => {
  const a = await analysis.start(req.params.id);
  await analysis.complete(a.id);
  await events.track('analysis_completed', { restaurantId: req.params.id, userId: (req as any).userId });
  // Capture a snapshot on analysis completion — a meaningful score change point.
  await captureSnapshot(req.params.id);
  res.json({ data: { id: a.id, status: 'completed' } });
});
router.get('/restaurants/:id/analyses', authMiddleware, async (req: Request, res: Response) => {
  res.json({ data: await analysis.getByRestaurant(req.params.id) });
});

// ── Phase 5: Decide — Decisions ──
// Batch endpoint must come BEFORE :id route to avoid 'batch' matching :id
router.get('/decisions/batch', authMiddleware, async (req: Request, res: Response) => {
  const restaurantIds = (req.query.restaurantIds as string || '').split(',').filter(Boolean);
  const status = req.query.status as string | undefined;
  if (restaurantIds.length === 0) { res.json({ data: [] }); return; }
  const all = await decisions.getByRestaurants(restaurantIds, status);
  res.json({ data: all });
});
router.get('/restaurants/:id/decisions', authMiddleware, async (req: Request, res: Response) => {
  const status = req.query.status as string | undefined;
  res.json({ data: await decisions.getByRestaurant(req.params.id, status) });
});
router.get('/decisions/:id', authMiddleware, async (req: Request, res: Response) => {
  res.json({ data: await decisions.getById(req.params.id) });
});
router.post('/decisions/:id/accept', authMiddleware, async (req: Request, res: Response) => {
  await decisions.accept(req.params.id);
  await events.track('decision_accepted', { restaurantId: req.body.restaurantId, userId: (req as any).userId, properties: { decisionId: req.params.id } });
  res.json({ message: 'Decision accepted' });
});
router.post('/decisions/:id/dismiss', authMiddleware, async (req: Request, res: Response) => {
  await decisions.dismiss(req.params.id);
  await events.track('decision_dismissed', { restaurantId: req.body.restaurantId, userId: (req as any).userId, properties: { decisionId: req.params.id } });
  res.json({ message: 'Decision dismissed' });
});
router.post('/decisions/:id/complete', authMiddleware, async (req: Request, res: Response) => {
  await decisions.complete(req.params.id);
  await events.track('decision_completed', { restaurantId: req.body.restaurantId, userId: (req as any).userId, properties: { decisionId: req.params.id } });
  res.json({ message: 'Decision completed' });
});
router.get('/restaurants/:id/decision-stats', authMiddleware, async (req: Request, res: Response) => {
  res.json({ data: await decisions.getStats(req.params.id) });
});

// ── Phase 7: Measure — Outcomes ──
router.post('/decisions/:id/outcomes', authMiddleware, async (req: Request, res: Response) => {
  const o = await outcomes.record({ decisionId: req.params.id, ...req.body });
  await events.track('outcome_recorded', { restaurantId: req.body.restaurantId, userId: (req as any).userId, properties: { decisionId: req.params.id, status: req.body.status } });
  res.json({ data: o });
});
router.get('/restaurants/:id/outcome-stats', authMiddleware, async (req: Request, res: Response) => {
  res.json({ data: await outcomes.getStats(req.params.id) });
});

// ── Batch outcome-stats endpoint ──
router.get('/outcomes/batch', authMiddleware, async (req: Request, res: Response) => {
  const restaurantIds = (req.query.restaurantIds as string || '').split(',').filter(Boolean);
  if (restaurantIds.length === 0) { res.json({ data: [] }); return; }
  const statsMap = await outcomes.getStatsByRestaurants(restaurantIds);
  const all = restaurantIds.map((rid) => ({
    restaurantId: rid,
    ...(statsMap.get(rid) || { total: 0, completed: 0, inProgress: 0, blocked: 0, highImpact: 0 }),
  }));
  res.json({ data: all });
});

// ── Phase 7: Measure — Feedback ──
router.post('/feedback', authMiddleware, async (req: Request, res: Response) => {
  const f = await feedback.submit({ ...req.body, restaurantId: req.body.restaurantId });
  await events.track('feedback_submitted', { restaurantId: req.body.restaurantId, userId: (req as any).userId, properties: { type: req.body.type } });
  res.json({ data: f });
});
router.get('/feedback/stats', authMiddleware, async (_req: Request, res: Response) => {
  res.json({ data: await feedback.getStats() });
});

// ── Events (Product Analytics) ──
router.post('/events/track', authMiddleware, async (req: Request, res: Response) => {
  const e = await events.track(req.body.eventType, { ...req.body, userId: (req as any).userId });
  res.json({ data: e });
});
router.get('/events/funnel', authMiddleware, async (req: Request, res: Response) => {
  const stages = (req.query.stages as string || '').split(',').filter(Boolean);
  const since = req.query.since ? new Date(req.query.since as string) : undefined;
  res.json({ data: await events.getFunnel(stages, since) });
});
router.get('/events/stats', authMiddleware, async (req: Request, res: Response) => {
  const since = req.query.since ? new Date(req.query.since as string) : undefined;
  res.json({ data: await events.getStats(since) });
});

export default router;
