// Application service: Authentication
// Handles sign up, sign in, session management

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../../domain/auth/User';

const JWT_SECRET = process.env.JWT_SECRET || 'rdi-dev-secret-change-in-production';
const SALT_ROUNDS = 10;

export interface AuthRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  save(user: User): Promise<void>;
}

export class AuthService {
  constructor(private readonly repository: AuthRepository) {}

  async signUp(input: { email: string; password: string; name: string }): Promise<{ user: User; token: string }> {
    const existing = await this.repository.findByEmail(input.email);
    if (existing) {
      throw new Error('Email already registered');
    }

    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
    const user = new User({
      id: `usr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      email: input.email.toLowerCase().trim(),
      passwordHash,
      name: input.name,
      avatarUrl: null,
      emailVerified: false,
      createdAt: new Date(),
    });

    await this.repository.save(user);
    const token = this.generateToken(user);

    return { user, token };
  }

  async signIn(input: { email: string; password: string }): Promise<{ user: User; token: string }> {
    const user = await this.repository.findByEmail(input.email.toLowerCase().trim());
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) {
      throw new Error('Invalid email or password');
    }

    const token = this.generateToken(user);
    return { user, token };
  }

  async getProfile(userId: string): Promise<User | null> {
    return this.repository.findById(userId);
  }

  private generateToken(user: User): string {
    return jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' },
    );
  }

  static verifyToken(token: string): { userId: string; email: string } {
    return jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
  }
}
