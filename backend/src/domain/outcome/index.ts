// Domain — Outcome
export class Outcome {
  constructor(
    public readonly id: string,
    public readonly decisionId: string,
    public readonly status: string,
    public readonly effort: string | null,
    public readonly perceivedImpact: string | null,
    public readonly beforeMetric: number | null,
    public readonly afterMetric: number | null,
    public readonly notes: string | null,
  ) {}
}
