// Infrastructure: Prisma implementation of Auth repository

import { PrismaClient } from '@prisma/client';
import { User } from '../../../domain/auth/User';
import { type AuthRepository } from '../../../application/auth/AuthService';

export class PrismaAuthRepository implements AuthRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByEmail(email: string): Promise<User | null> {
    const record = await this.prisma.user.findUnique({ where: { email } });
    if (!record) return null;
    return this.toDomain(record);
  }

  async findById(id: string): Promise<User | null> {
    const record = await this.prisma.user.findUnique({ where: { id } });
    if (!record) return null;
    return this.toDomain(record);
  }

  async save(user: User): Promise<void> {
    await this.prisma.user.upsert({
      where: { id: user.id },
      update: { name: user.name, avatarUrl: user.avatarUrl, emailVerified: user.emailVerified },
      create: {
        id: user.id,
        email: user.email,
        passwordHash: user.passwordHash,
        name: user.name,
        avatarUrl: user.avatarUrl,
        emailVerified: user.emailVerified,
      },
    });
  }

  private toDomain(record: any): User {
    return new User({
      id: record.id,
      email: record.email,
      passwordHash: record.passwordHash,
      name: record.name,
      avatarUrl: record.avatarUrl,
      emailVerified: record.emailVerified,
      createdAt: record.createdAt,
    });
  }
}
