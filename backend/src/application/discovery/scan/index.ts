// Scan engine module (RIST-RDI-006) — public surface.
export { ScanEngine } from './ScanEngine';
export { ALL_SCAN_TYPES, SCAN_TYPE_LABEL, classifySourceType, isHttpUrl, isSyntheticUrl, isNoiseUrl, type ScanType } from './scan-types';
export { buildScanTypeQueries, seedToScanType, type ScanInput } from './scan-query';
export type { ScanSummary, ScanResultSource, DiscoveredSource } from './ScanEngine';
