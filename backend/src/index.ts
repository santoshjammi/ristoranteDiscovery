import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

import apiRoutes from './routes/api.routes';
import healthRoutes from './interfaces/routes/health.routes';
import { requestLogger } from './interfaces/middleware/requestLogger';
import { errorHandler } from './interfaces/middleware/errorHandler';
import { loadConfig } from './lib/config';
import { logger } from './lib/logger';
import { seedDefaultAdmin, seedDefaultConnectors } from './lib/seed';
import { aiService } from './services/ai.service';

// Load environment variables
dotenv.config();
const config = loadConfig();

const app = express();

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Request logging
app.use(requestLogger);

// CORS
app.use(cors({
  origin: config.corsOrigins.includes('*') ? true : config.corsOrigins,
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Mount health check routes (before API routes for liveness/readiness)
app.use('/', healthRoutes);

// Mount API routes
app.use('/api', apiRoutes);

// Central error handler (must be last middleware)
app.use(errorHandler);

// Start Server (only when run directly, not when imported for testing)
if (!process.env.VITEST) {
  app.listen(config.port, async () => {
    await seedDefaultAdmin();
    await seedDefaultConnectors();
    await aiService.init();
    logger.info(`RDI Backend running on http://localhost:${config.port}`, {
      metadata: { port: config.port, env: config.nodeEnv, version: config.appVersion },
    });
  });
}

export default app;
