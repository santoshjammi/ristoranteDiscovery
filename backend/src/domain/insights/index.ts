// Domain — Insights
export class InsightTemplate {
  constructor(public readonly id: string, public readonly category: string, public readonly title: string,
    public readonly description: string, public readonly priority: number, public readonly businessImpact: string,
    public readonly effort: string) {}
}
