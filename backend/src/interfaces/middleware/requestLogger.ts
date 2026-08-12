// Express middleware: request logging
import { Request, Response, NextFunction } from 'express';
import { logger } from '../../lib/logger';

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  const requestId = req.headers['x-request-id'] || `req-${Date.now()}`;

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.originalUrl} ${res.statusCode}`, {
      requestId: requestId as string,
      duration,
      metadata: {
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
      },
    });
  });

  next();
}
