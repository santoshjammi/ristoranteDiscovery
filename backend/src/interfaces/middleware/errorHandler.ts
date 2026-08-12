// Express middleware: error handler
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../lib/errors';
import { logger } from '../../lib/logger';

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError && err.isOperational) {
    logger.warn(`Operational error: ${err.message}`, {
      requestId: req.headers['x-request-id'] as string,
      metadata: { code: err.code, statusCode: err.statusCode },
    });

    res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
    });
    return;
  }

  // Unexpected errors
  logger.error(`Unexpected error: ${err.message}`, {
    requestId: req.headers['x-request-id'] as string,
    error: err.stack,
  });

  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
  });
}
