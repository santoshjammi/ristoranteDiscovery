// Domain — Analysis
export class Analysis {
  constructor(
    public readonly id: string,
    public readonly restaurantId: string,
    public readonly status: string,
    public readonly startedAt: Date | null,
    public readonly completedAt: Date | null,
    public readonly errorLog: string | null,
  ) {}
}
