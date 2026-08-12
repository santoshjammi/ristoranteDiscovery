// Domain — Product Event
export class ProductEvent {
  constructor(
    public readonly id: string,
    public readonly eventType: string,
    public readonly organizationId: string | null,
    public readonly restaurantId: string | null,
    public readonly userId: string | null,
    public readonly properties: Record<string, unknown>,
  ) {}
}
