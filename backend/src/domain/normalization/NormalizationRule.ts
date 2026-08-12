// Domain value object — a normalization rule that converts raw observations into evidence
// Pure domain — zero framework dependencies

export interface NormalizationRuleProps {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly sourceType: string;
  readonly inputField: string;
  readonly outputField: string;
  readonly transform: string; // e.g., "lowercase", "trim", "map", "parse-json"
  readonly version: string;
  readonly config: Record<string, unknown>;
}

export class NormalizationRule {
  public readonly id: string;
  public readonly name: string;
  public readonly description: string;
  public readonly sourceType: string;
  public readonly inputField: string;
  public readonly outputField: string;
  public readonly transform: string;
  public readonly version: string;
  public readonly config: Record<string, unknown>;

  constructor(props: NormalizationRuleProps) {
    this.id = props.id;
    this.name = props.name;
    this.description = props.description;
    this.sourceType = props.sourceType;
    this.inputField = props.inputField;
    this.outputField = props.outputField;
    this.transform = props.transform;
    this.version = props.version;
    this.config = { ...props.config };
  }
}
