// Domain — Feature Flags
export class FeatureFlag {
  constructor(public readonly id: string, public readonly name: string, public readonly description: string,
    public readonly enabled: boolean, public readonly enabledOrgs: string[]) {}
}
