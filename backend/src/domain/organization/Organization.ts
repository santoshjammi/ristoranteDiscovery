// Domain entity — Organization
// Pure domain — zero framework dependencies

export type MemberRole = 'admin' | 'member' | 'viewer';

export interface OrganizationProps {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly ownerId: string;
  readonly createdAt: Date;
}

export class Organization {
  public readonly id: string;
  public readonly name: string;
  public readonly slug: string;
  public readonly ownerId: string;
  public readonly createdAt: Date;

  constructor(props: OrganizationProps) {
    this.id = props.id;
    this.name = props.name;
    this.slug = props.slug;
    this.ownerId = props.ownerId;
    this.createdAt = props.createdAt;
  }
}
