// Discovery API — RVS-001 endpoints
// Extends the existing api.ts with discovery-specific calls

import { API_URL } from "@/app/lib/api-config";

export interface ScoreDimensionData {
  name: string;
  score: number;
  weight: number;
  isInformational: boolean;
}

export interface ScorecardData {
  overallScore: number;
  trend: "up" | "down" | "stable";
  dimensions: ScoreDimensionData[];
}

export interface EvidenceData {
  id: string;
  description: string;
  confidence: "very-high" | "high" | "medium" | "low" | "very-low";
  source: {
    entityType: string;
    entityId: string;
    field: string;
    value: string;
  };
}

// ── Real-data provenance (RIST-RDI-005) ──
// The customer-facing "prove it" surface. Each row is a REAL, live public
// source behind a score — clickable URL, source type, observed-at timestamp,
// and confidence. No synthetic/mock data ever reaches this list.

export interface ProvenanceEvidence {
  id: string;
  sourceUrl: string;
  sourceType: string;
  sourceTypeLabel: string;
  observedAt: string;
  confidence: number;
  status: string;
}

export interface ProvenanceData {
  restaurantId: string;
  restaurantName: string;
  evidence: ProvenanceEvidence[];
  count: number;
  lastVerified: string | null;
}

export async function fetchEvidence(restaurantId: string): Promise<ProvenanceData> {
  const res = await fetch(`${API_URL}/api/restaurants/${restaurantId}/evidence`);
  if (!res.ok) throw new Error("Failed to load evidence");
  const json = await res.json();
  return json.data;
}

// ── On-demand "Scan All Data" (RIST-RDI-006) ──
// Re-scans a restaurant by stored name/address (+ optional GBP URL) and
// returns every discovered source grouped by category, plus a Data Integrity
// summary (real vs pending vs synthetic).

export type ScanSourceStatus = "real" | "synthetic" | "pending" | "noise" | "unavailable";

export interface ScanSource {
  sourceUrl: string;
  sourceType: string;
  sourceTypeLabel: string;
  observedAt: string | null;
  confidence: number | null;
  status: ScanSourceStatus;
  category: string;
  normalizedValue?: { title?: string; observedMenuHint?: string } | null;
  provenance?: Record<string, unknown> | null;
}

export interface ScanIntegrity {
  real: number;
  pending: number;
  unavailable: number;
  synthetic: number;
}

export interface ScanResult {
  restaurantId: string;
  restaurantName: string;
  scannedAt: string;
  integrity: ScanIntegrity;
  groups: Record<string, ScanSource[]>;
  total: number;
}

export async function scanRestaurant(restaurantId: string, googleShareUrl?: string): Promise<ScanResult> {
  const res = await fetch(`${API_URL}/api/discovery/restaurants/${restaurantId}/scan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(googleShareUrl ? { googleShareUrl } : {}),
  });
  if (!res.ok) throw new Error("Failed to scan restaurant data");
  const json = await res.json();
  return json.data;
}

export interface RecommendationData {
  id: string;
  title: string;
  description: string;
  priority: "critical" | "high" | "medium" | "low";
  businessImpact: string;
  implementationEffort: string;
  confidence: "very-high" | "high" | "medium" | "low" | "very-low";
  evidenceIds: string[];
  priorityScore: number;
}

export interface TwinData {
  id: string;
  restaurantId: string;
  status: string;
  hasScorecard: boolean;
  evidenceCount: number;
  scorecard: ScorecardData | null;
}

export interface ReportData {
  restaurantId: string;
  restaurantName: string;
  generatedAt: string;
  executiveSummary: {
    overallScore: number;
    trend: string;
    topFindings: string[];
    topRecommendations: string[];
  };
  sections: Array<{
    title: string;
    content: string[];
    metrics: Array<{ label: string; value: string }>;
  }>;
}

export interface AnalyzeResponse {
  twin: TwinData;
  scorecard: ScorecardData;
  evidence: EvidenceData[];
  recommendations: RecommendationData[];
  report: ReportData;
  events: Array<{ name: string; version: number }>;
}

export async function analyzeRestaurant(restaurantId: string): Promise<AnalyzeResponse> {
  const res = await fetch(`${API_URL}/api/discovery/restaurants/${restaurantId}/analyze`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to analyze restaurant");
  const json = await res.json();
  return json.data;
}

export async function getTwin(restaurantId: string): Promise<TwinData> {
  const res = await fetch(`${API_URL}/api/discovery/restaurants/${restaurantId}/twin`);
  if (!res.ok) throw new Error("Failed to fetch twin");
  const json = await res.json();
  return json.data;
}

// ── Menu Intelligence (RVS-002) ──

export interface MenuInsightData {
  type: string;
  title: string;
  description: string;
  severity: "positive" | "neutral" | "warning" | "critical";
  value: string | number;
}

export interface MenuAnalysisData {
  totalItems: number;
  categories: number;
  averagePrice: number;
  minPrice: number;
  maxPrice: number;
  descriptionCoverage: number;
  priceDistribution: Record<string, number>;
  dietaryBreakdown: Record<string, number>;
  spiceBreakdown: Record<string, number>;
  popularItems: Array<{ name: string; price: number; popularityScore: number }>;
}

export interface MenuAnalysisResponse {
  menu: MenuAnalysisData;
  insights: MenuInsightData[];
  twinEnriched: boolean;
}

export async function analyzeMenu(restaurantId: string): Promise<MenuAnalysisResponse> {
  const res = await fetch(`${API_URL}/api/menu/restaurants/${restaurantId}/analyze`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to analyze menu");
  const json = await res.json();
  return json.data;
}

// ── Review Intelligence (RVS-003) ──

export interface ReviewThemeData {
  name: string;
  label: string;
  mentionCount: number;
  sentiment: "positive" | "negative" | "mixed" | "neutral";
  sampleQuotes: string[];
}

export interface ReviewAggregateData {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: Record<number, number>;
  sentimentBreakdown: Record<string, number>;
  positivePercentage: number;
  negativePercentage: number;
  responseRate: number;
  ratingTrend: "improving" | "declining" | "stable";
  sourceBreakdown: Record<string, number>;
  monthlyTrend: Array<{ month: string; avgRating: number; count: number }>;
  unreviewedCritical: number;
}

export interface ReviewInsightData {
  type: string;
  title: string;
  description: string;
  severity: "positive" | "neutral" | "warning" | "critical";
  value: string | number;
}

export interface ReviewAnalysisResponse {
  aggregate: ReviewAggregateData;
  themes: ReviewThemeData[];
  insights: ReviewInsightData[];
}

export async function analyzeReviews(restaurantId: string): Promise<ReviewAnalysisResponse> {
  const res = await fetch(`${API_URL}/api/reviews/restaurants/${restaurantId}/analyze`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to analyze reviews");
  const json = await res.json();
  return json.data;
}

// ── Competitive Intelligence (RVS-004) ──

export interface ScoreGapData {
  dimension: string;
  focalScore: number;
  competitorScore: number;
  gap: number;
}

export interface CompetitorData {
  name: string;
  distance: number;
  cuisineSimilarity: number;
  priceTierMatch: boolean;
  serviceModelMatch: boolean;
  overallScore: number;
  scoreGaps: ScoreGapData[];
}

export interface BenchmarkData {
  dimension: string;
  average: number;
  median: number;
  min: number;
  max: number;
  focalScore: number;
  focalPercentile: number;
  competitorCount: number;
}

export interface CompetitiveInsightData {
  type: "strength" | "weakness" | "opportunity" | "threat";
  dimension: string;
  description: string;
  gapSize: number;
  severity: "positive" | "neutral" | "warning" | "critical";
}

export interface CompetitiveAnalysisResponse {
  restaurantId: string;
  competitorCount: number;
  competitors: CompetitorData[];
  benchmarks: BenchmarkData[];
  insights: CompetitiveInsightData[];
  generatedAt: string;
}

export async function analyzeCompetitive(restaurantId: string, radius?: number): Promise<CompetitiveAnalysisResponse> {
  const params = new URLSearchParams();
  if (radius) params.set("radius", String(radius));
  const qs = params.toString();
  const res = await fetch(`${API_URL}/api/competitive/restaurants/${restaurantId}/analyze${qs ? `?${qs}` : ""}`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to analyze competitive landscape");
  const json = await res.json();
  return json.data;
}

// ── SEO Intelligence (RVS-005) ──

export interface SEOSchemaData {
  type: string;
  isValid: boolean;
  coverageScore: number;
}

export interface SEOIssueData {
  schemaType: string;
  field: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low";
}

export interface SEOAuditData {
  restaurantId: string;
  coverage: number;
  completeness: number;
  schemaTypesPresent: string[];
  schemas: SEOSchemaData[];
  issues: SEOIssueData[];
  auditedAt: string;
}

export interface SEOAuditAllData {
  totalRestaurants: number;
  averageCoverage: number;
  averageCompleteness: number;
  totalIssues: number;
  totalCritical: number;
  totalHigh: number;
  audits: Array<{
    restaurantId: string;
    coverage: number;
    completeness: number;
    issueCount: number;
    criticalIssues: number;
    highIssues: number;
  }>;
}

export async function auditSEO(restaurantId: string): Promise<SEOAuditData> {
  const res = await fetch(`${API_URL}/api/seo-intelligence/restaurants/${restaurantId}/audit`);
  if (!res.ok) throw new Error("Failed to audit SEO schemas");
  const json = await res.json();
  return json.data;
}

export async function auditAllSEO(): Promise<SEOAuditAllData> {
  const res = await fetch(`${API_URL}/api/seo-intelligence/audit-all`);
  if (!res.ok) throw new Error("Failed to audit all SEO schemas");
  const json = await res.json();
  return json.data;
}

// ── Market Intelligence (RVS-006) ──

export interface MarketAreaData {
  name: string;
  restaurantCount: number;
  cuisineDistribution: Record<string, number>;
  priceDistribution: Record<string, number>;
  averageScores: Record<string, number>;
  totalReviews: number;
  averageRating: number;
  topCuisines: Array<{ cuisine: string; count: number }>;
  dominantPriceTier: string | null;
}

export interface MarketInsightData {
  type: "saturation" | "gap" | "trend" | "benchmark";
  area: string;
  cuisine: string | null;
  description: string;
  metric: number;
  severity: "positive" | "neutral" | "warning" | "critical";
}

export interface MarketTrendData {
  cuisine: string;
  area: string;
  reviewVolume: number;
  averageRating: number;
  sentimentTrend: "improving" | "declining" | "stable";
  period: string;
}

export interface MarketAnalysisResponse {
  areas: MarketAreaData[];
  insights: MarketInsightData[];
  trends: MarketTrendData[];
}

export async function analyzeMarket(): Promise<MarketAnalysisResponse> {
  const res = await fetch(`${API_URL}/api/market/analyze`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to analyze market");
  const json = await res.json();
  return json.data;
}
