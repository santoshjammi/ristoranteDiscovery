// Interface adapter: Auth Controller

import { Request, Response } from 'express';
import { AuthService } from '../../application/auth/AuthService';
import { PrismaAuthRepository } from '../../infrastructure/persistence/auth/PrismaAuthRepository';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const repo = new PrismaAuthRepository(prisma);
const authService = new AuthService(repo);

export class AuthController {
  signUp = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password, name } = req.body;
      if (!email || !password || !name) {
        res.status(400).json({ error: 'email, password, and name are required' });
        return;
      }
      const result = await authService.signUp({ email, password, name });
      res.status(201).json({ data: { user: { id: result.user.id, email: result.user.email, name: result.user.name }, token: result.token } });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  signIn = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        res.status(400).json({ error: 'email and password are required' });
        return;
      }
      const result = await authService.signIn({ email, password });
      res.json({ data: { user: { id: result.user.id, email: result.user.email, name: result.user.name }, token: result.token } });
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  };

  profile = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).userId;
      const user = await authService.getProfile(userId);
      if (!user) { res.status(404).json({ error: 'User not found' }); return; }
      res.json({ data: { id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl } });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };
}
