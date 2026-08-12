// Domain value object — an assertion that explains how evidence became structured knowledge
// Pure domain — zero framework dependencies
// Immutable — once created, never modified

export type AssertionStatus = 'active' | 'superseded' | 'invalidated';

export interface AssertionProps {
  readonly id: string;
  readonly evidenceId: string;
  readonly ruleName: string;
  readonly ruleVersion: string;
  readonly subject: string;       // e.g., "restaurant:rest-001"
  readonly predicate: string;     // e.g., "supports-diet"
  readonly object: string;        // e.g., "vegan"
  readonly confidence: number;     // 0.0 to 1.0
  readonly explanation: string;   // How evidence became this assertion
  readonly assertedAt: Date;
  readonly status: AssertionStatus;
}

export class Assertion {
  public readonly id: string;
  public readonly evidenceId: string;
  public readonly ruleName: string;
  public readonly ruleVersion: string;
  public readonly subject: string;
  public readonly predicate: string;
  public readonly object: string;
  public readonly confidence: number;
  public readonly explanation: string;
  public readonly assertedAt: Date;
  public readonly status: AssertionStatus;

  constructor(props: AssertionProps) {
    this.id = props.id;
    this.evidenceId = props.evidenceId;
    this.ruleName = props.ruleName;
    this.ruleVersion = props.ruleVersion;
    this.subject = props.subject;
    this.predicate = props.predicate;
    this.object = props.object;
    this.confidence = props.confidence;
    this.explanation = props.explanation;
    this.assertedAt = props.assertedAt;
    this.status = props.status;
  }
}
