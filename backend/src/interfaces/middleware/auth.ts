// Express middleware: authentication
// Verifies JWT token and attaches userId to request

import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../../application/auth/AuthService';

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const payload = AuthService.verifyToken(token);
    (req as any).userId = payload.userId;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
