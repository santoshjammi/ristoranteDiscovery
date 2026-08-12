// Domain entity — User
// Pure domain — zero framework dependencies

export interface UserProps {
  readonly id: string;
  readonly email: string;
  readonly passwordHash: string;
  readonly name: string;
  readonly avatarUrl: string | null;
  readonly emailVerified: boolean;
  readonly createdAt: Date;
}

export class User {
  public readonly id: string;
  public readonly email: string;
  public readonly passwordHash: string;
  public readonly name: string;
  public readonly avatarUrl: string | null;
  public readonly emailVerified: boolean;
  public readonly createdAt: Date;

  constructor(props: UserProps) {
    this.id = props.id;
    this.email = props.email;
    this.passwordHash = props.passwordHash;
    this.name = props.name;
    this.avatarUrl = props.avatarUrl;
    this.emailVerified = props.emailVerified;
    this.createdAt = props.createdAt;
  }
}
