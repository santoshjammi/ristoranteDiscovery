// ── Connector Platform Routes ──
import { Request, Response, Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { ConnectorService } from '../../services/connector.service';

const prisma = new PrismaClient();
const connectorService = new ConnectorService(prisma);

// Register all platform connectors (side-effect: populates registry)
import '../../services/connectors/gbp.service';
import '../../services/connectors/zomato.service';
import '../../services/connectors/swiggy.service';
import '../../services/connectors/justdial.service';
import '../../services/connectors/tripadvisor.service';

// Also register the legacy GBP connector for backward compat
import '../../application/connector/GBPConnector';

const router = Router();

/* ── Platform definitions (always available) ─────────────── */

const PLATFORMS: Record<string, { name: string; icon: string }> = {
  gbp:        { name: 'Google Business Profile', icon: '🔍' },
  zomato:     { name: 'Zomato',                 icon: '🍽️' },
  swiggy:     { name: 'Swiggy',                 icon: '🛵' },
  justdial:   { name: 'JustDial',               icon: '📞' },
  tripadvisor:{ name: 'TripAdvisor',            icon: '✈️' },
};

// GET /api/connectors — list available connectors + their status
router.get('/', async (_req: Request, res: Response) => {
  const configs = await connectorService.listConnectors();
  const configMap = new Map(configs.map((c: any) => [c.type, c]));

  const result = Object.entries(PLATFORMS).map(([type, info]) => {
    const config = configMap.get(type);
    return {
      id:       config?.id || `platform-${type}`,
      name:     info.name,
      type,
      description: `${info.name} integration for restaurant discoverability`,
      icon:     info.icon,
      status:   (config?.status as string) || 'not_configured',
      lastSyncAt: config?.lastSyncAt ? new Date(config.lastSyncAt).toISOString() : null,
      lastError:  config?.lastError || null,
    };
  });

  res.json({ data: result });
});

// POST /api/connectors/connect — connect a connector type
router.post('/connect', async (req: Request, res: Response) => {
  const { type, label, credentials } = req.body as any;
  if (!type) return res.status(400).json({ error: 'Connector type is required' });

  try {
    const connector = await connectorService.connect(type, label || type, credentials || {});
    res.json({ data: connector, message: `${label || type} connected successfully` });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/connectors/:type/sync — sync a connector by type
router.post('/:type/sync', async (req: Request, res: Response) => {
  const type = req.params.type;
  try {
    const result = await connectorService.syncConnector(type);
    res.json({ data: result });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/connectors/:id — disconnect/remove a connector
router.delete('/:id', async (req: Request, res: Response) => {
  const id = req.params.id;
  try {
    await connectorService.disconnect(id);
    res.json({ message: 'Connector disconnected' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/* ── Legacy routes (kept for backward compatibility) ─────── */

// GET /api/connectors/:type/history — sync history
router.get('/:type/history', async (_req: Request, res: Response) => {
  // Placeholder — sync history stored via ConnectorConfig model
  res.json({ data: [] });
});

export default router;
