// Razorpay subscription routes — mounted under /api/subscription

import { Request, Response, Router } from 'express';
import { RazorpaySubscriptionService } from '../../application/billing/RazorpaySubscriptionService';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const subscriptionService = new RazorpaySubscriptionService();

// Get available plans
router.get('/plans', async (_req: Request, res: Response) => {
  try {
    const plans = await subscriptionService.getPlans();
    res.json({ data: plans });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get current subscription for organization
router.get('/current', authMiddleware, async (req: Request, res: Response) => {
  try {
    const orgId = req.headers['x-org-id'] as string;
    if (!orgId) { res.status(400).json({ error: 'x-org-id header required' }); return; }
    const sub = await subscriptionService.getCurrentSubscription(orgId);
    res.json({ data: sub });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get invoices
router.get('/invoices', authMiddleware, async (req: Request, res: Response) => {
  try {
    const orgId = req.headers['x-org-id'] as string;
    if (!orgId) { res.status(400).json({ error: 'x-org-id header required' }); return; }
    const invoices = await subscriptionService.getInvoices(orgId);
    res.json({ data: invoices });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Razorpay webhook handler (no auth — verified by signature)
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string;
    const result = await subscriptionService.handleWebhookEvent(req.body, signature);
    res.json(result);
  } catch (error: any) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Create a Razorpay order for subscription
router.post('/create-order', authMiddleware, async (req: Request, res: Response) => {
  try {
    const orgId = req.headers['x-org-id'] as string;
    const { planSlug } = req.body;
    if (!orgId || !planSlug) {
      res.status(400).json({ error: 'x-org-id and planSlug required' });
      return;
    }
    const result = await subscriptionService.createOrder(orgId, planSlug);
    res.json({ data: result });
  } catch (error: any) {
    console.error('Create order error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Verify payment and activate subscription
router.post('/verify', authMiddleware, async (req: Request, res: Response) => {
  try {
    const orgId = req.headers['x-org-id'] as string;
    const { planSlug, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
    if (!orgId || !planSlug || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }
    const valid = subscriptionService.verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
    if (!valid) {
      res.status(400).json({ error: 'Payment verification failed' });
      return;
    }
    await subscriptionService.activateSubscription(orgId, planSlug, razorpayOrderId, razorpayPaymentId, razorpaySignature);
    res.json({ data: { status: 'active' } });
  } catch (error: any) {
    console.error('Verify payment error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Cancel subscription
router.post('/cancel', authMiddleware, async (req: Request, res: Response) => {
  try {
    const orgId = req.headers['x-org-id'] as string;
    if (!orgId) {
      res.status(400).json({ error: 'x-org-id header required' });
      return;
    }
    await subscriptionService.cancelSubscription(orgId);
    res.json({ data: { status: 'canceled' } });
  } catch (error: any) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
