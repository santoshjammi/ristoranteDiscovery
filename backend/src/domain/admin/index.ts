// Domain — Admin
export class AdminAuditLog {
  constructor(public readonly id: string, public readonly actorId: string, public readonly action: string,
    public readonly resourceType: string, public readonly resourceId: string, public readonly details: Record<string, unknown>,
    public readonly ip: string | null, public readonly createdAt: Date) {}
}
