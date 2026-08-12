// Application — Notes Service
import { PrismaClient } from '@prisma/client';
export class NotesService {
  constructor(private prisma: PrismaClient) {}
  async add(decisionId: string, content: string, userId: string) {
    return this.prisma.outcome.create({
      data: { decisionId, status: 'in_progress', notes: content },
    });
  }
  async getByDecision(decisionId: string) {
    return this.prisma.outcome.findMany({ where: { decisionId, notes: { not: null } }, orderBy: { recordedAt: 'desc' } });
  }
}
