// Domain — Decision
export class Decision {
  constructor(
    public readonly id: string,
    public readonly restaurantId: string,
    public readonly analysisId: string | null,
    public readonly title: string,
    public readonly priority: number,
    public readonly confidence: number,
    public readonly businessImpact: string,
    public readonly effort: string,
    public readonly category: string,
    public readonly observation: string,
    public readonly evidence: any[],
    public readonly reasoning: { engines: string[]; explanation: string },
    public readonly actionSteps: string[],
    public readonly status: string,
    public readonly acceptedAt: Date | null,
    public readonly completedAt: Date | null,
  ) {}
}
