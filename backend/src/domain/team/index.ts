// Domain — Team
export class TeamInvitation {
  constructor(public readonly id: string, public readonly organizationId: string, public readonly email: string,
    public readonly role: string, public readonly token: string, public readonly status: string, public readonly expiresAt: Date) {}
}
