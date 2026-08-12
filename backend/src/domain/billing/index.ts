// Domain — Billing
export class SubscriptionPlan {
  constructor(public readonly id: string, public readonly name: string, public readonly slug: string,
    public readonly description: string, public readonly priceMonthly: number, public readonly priceYearly: number,
    public readonly maxRestaurants: number, public readonly maxMembers: number, public readonly features: string[]) {}
}
export class Subscription {
  constructor(public readonly id: string, public readonly organizationId: string, public readonly planId: string,
    public readonly status: string, public readonly currentPeriodStart: Date, public readonly currentPeriodEnd: Date) {}
}
export class Invoice {
  constructor(public readonly id: string, public readonly subscriptionId: string, public readonly organizationId: string,
    public readonly amount: number, public readonly status: string, public readonly dueAt: Date) {}
}
