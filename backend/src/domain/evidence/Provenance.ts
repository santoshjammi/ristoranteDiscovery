// Domain value object — how evidence was obtained
// Pure domain — zero framework dependencies
// Separate from Evidence: Evidence says "what we observed", Provenance says "how we obtained it"

export interface ProvenanceProps {
  readonly observationId: string;
  readonly sourceId: string;
  readonly connectorVersion: string;
  readonly parserVersion: string;
  readonly crawlId: string | null;
  readonly importJobId: string | null;
  readonly normalizationVersion: string;
  readonly recordedAt: Date;
}

export class Provenance {
  public readonly observationId: string;
  public readonly sourceId: string;
  public readonly connectorVersion: string;
  public readonly parserVersion: string;
  public readonly crawlId: string | null;
  public readonly importJobId: string | null;
  public readonly normalizationVersion: string;
  public readonly recordedAt: Date;

  constructor(props: ProvenanceProps) {
    this.observationId = props.observationId;
    this.sourceId = props.sourceId;
    this.connectorVersion = props.connectorVersion;
    this.parserVersion = props.parserVersion;
    this.crawlId = props.crawlId;
    this.importJobId = props.importJobId;
    this.normalizationVersion = props.normalizationVersion;
    this.recordedAt = props.recordedAt;
  }
}
