// Domain — Connector
export class ConnectorConfig {
  constructor(public readonly id: string, public readonly organizationId: string, public readonly type: string,
    public readonly label: string, public readonly status: string, public readonly lastSyncAt: Date | null) {}
}
export class ConnectorSyncJob {
  constructor(public readonly id: string, public readonly connectorId: string, public readonly status: string,
    public readonly itemsProcessed: number, public readonly itemsFailed: number) {}
}
