// Domain — Settings
export class OrganizationSetting {
  constructor(public readonly id: string, public readonly organizationId: string,
    public readonly branding: Record<string, unknown>, public readonly notifications: Record<string, unknown>,
    public readonly preferences: Record<string, unknown>) {}
}
