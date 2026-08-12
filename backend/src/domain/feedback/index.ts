// Domain — Feedback
export class Feedback {
  constructor(
    public readonly id: string,
    public readonly decisionId: string | null,
    public readonly restaurantId: string,
    public readonly type: string,
    public readonly rating: number | null,
    public readonly comment: string | null,
  ) {}
}
