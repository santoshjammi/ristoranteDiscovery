// Application — Team Service
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
export class TeamService {
  constructor(private prisma: PrismaClient) {}
  async invite(orgId: string, email: string, role: string, invitedBy: string) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(); expiresAt.setDate(expiresAt.getDate() + 7);
    return this.prisma.teamInvitation.create({ data: { organizationId: orgId, email, role, invitedBy, token, expiresAt } });
  }
  async accept(token: string, userId: string) {
    const invitation = await this.prisma.teamInvitation.findUnique({ where: { token } });
    if (!invitation || invitation.status !== 'pending') throw new Error('Invalid or expired invitation');
    if (new Date() > invitation.expiresAt) throw new Error('Invitation expired');
    await this.prisma.organizationMember.create({ data: { organizationId: invitation.organizationId, userId, role: invitation.role } });
    return this.prisma.teamInvitation.update({ where: { id: invitation.id }, data: { status: 'accepted' } });
  }
  async getMembers(orgId: string) {
    return this.prisma.organizationMember.findMany({ where: { organizationId: orgId }, include: { user: { select: { id: true, name: true, email: true } } } });
  }
  async removeMember(orgId: string, userId: string) {
    return this.prisma.organizationMember.delete({ where: { organizationId_userId: { organizationId: orgId, userId } } });
  }
}
