// Domain — Usage
export class UsageRecord {
  constructor(public readonly id: string, public readonly organizationId: string, public readonly metric: string,
    public readonly value: number, public readonly periodStart: Date, public readonly periodEnd: Date) {}
}
