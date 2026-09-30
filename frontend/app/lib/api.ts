import { API_URL } from "@/app/lib/api-config";

export interface Restaurant {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string | null;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  website: string | null;
  cuisineTypes: string[];
  regionalCuisine: string | null;
  priceRange: string | null;
  discoverabilityScore: number;
  aiVisibilityScore: number;
  localSearchScore: number;
  menuDiscoverabilityScore: number;
  conversationalSearchScore: number;
  dishRetrievalScore: number;
  restaurantClarityScore: number;
  gbpHealthScore: number;
  createdAt: string;
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  sectionId: string;
  name: string;
  description: string | null;
  price: number;
  ingredients: string[];
  dietaryType: string[];
  spiceLevel: string | null;
  allergens: string[];
  mealType: string[];
  popularityScore: number;
}

export interface MenuSection {
  id: string;
  restaurantId: string;
  name: string;
  description: string | null;
  order: number;
  items: MenuItem[];
}

export interface ReviewAnalysis {
  id: string;
  restaurantId: string;
  overallSentiment: number;
  sentimentSummary: string;
  popularDishes: Array<{ dishName: string; sentiment: string; mentions: number }>;
  ambienceTags: string[];
  serviceInsights: string;
  topicClusters: Array<{ topic: string; summary: string }>;
  complaints: string[];
  audienceProfile: Record<string, string>;
}

export interface FAQ {
  id: string;
  restaurantId: string;
  question: string;
  answer: string;
  category: string;
  voiceSnippet: string | null;
}

export interface SEOMarkup {
  id: string;
  restaurantId: string;
  type: string;
  jsonld: any;
}

export interface RestaurantDetail extends Restaurant {
  menuSections: MenuSection[];
  reviewAnalyses: ReviewAnalysis[];
  faqs: FAQ[];
  schemas: SEOMarkup[];
  querySimulation: any;
}

export async function fetchRestaurants(): Promise<Restaurant[]> {
  const res = await fetch(`${API_URL}/api/restaurants`);
  if (!res.ok) throw new Error("Failed to fetch restaurants");
  return res.json();
}

export async function fetchRestaurant(id: string): Promise<RestaurantDetail> {
  const res = await fetch(`${API_URL}/api/restaurants/${id}`);
  if (!res.ok) throw new Error("Failed to fetch restaurant");
  return res.json();
}

export async function createRestaurant(data: Partial<Restaurant>): Promise<Restaurant> {
  const res = await fetch(`${API_URL}/api/restaurants`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create restaurant");
  return res.json();
}

export async function generateFAQs(restaurantId: string, restaurantInfo: any, menuSummary?: string, reviewSummary?: string): Promise<any> {
  const res = await fetch(`${API_URL}/api/faqs/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ restaurantId, restaurantInfo, menuSummary, reviewSummary }),
  });
  if (!res.ok) throw new Error("Failed to generate FAQs");
  return res.json();
}

export async function generateSchema(restaurantId: string): Promise<any> {
  const res = await fetch(`${API_URL}/api/seo/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ restaurantId }),
  });
  if (!res.ok) throw new Error("Failed to generate schema");
  return res.json();
}

export async function getSchemas(restaurantId: string): Promise<SEOMarkup[]> {
  const res = await fetch(`${API_URL}/api/seo/schemas/${restaurantId}`);
  if (!res.ok) throw new Error("Failed to fetch schemas");
  return res.json();
}

export async function getPublicSchema(restaurantId: string): Promise<any> {
  const res = await fetch(`${API_URL}/api/seo/public/${restaurantId}`);
  if (!res.ok) throw new Error("Failed to fetch public schema");
  return res.json();
}

export async function getSEOAudit(restaurantId: string): Promise<any> {
  const res = await fetch(`${API_URL}/api/seo/${restaurantId}/audit`);
  if (!res.ok) throw new Error("Failed to fetch SEO audit");
  return res.json();
}

export async function searchChat(query: string, token?: string): Promise<any> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_URL}/api/search/chat`, {
    method: "POST",
    headers,
    body: JSON.stringify({ query }),
  });
  if (!res.ok) throw new Error("Failed to search");
  return res.json();
}

export async function buildIndex(restaurantId: string, token?: string): Promise<any> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_URL}/api/search/index`, {
    method: "POST",
    headers,
    body: JSON.stringify({ restaurantId }),
  });
  if (!res.ok) throw new Error("Failed to build index");
  return res.json();
}

export async function optimizeNames(restaurantId: string): Promise<any> {
  const res = await fetch(`${API_URL}/api/restaurants/${restaurantId}/optimize/names`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to optimize names");
  return res.json();
}

export async function optimizeLandmarks(restaurantId: string): Promise<any> {
  const res = await fetch(`${API_URL}/api/restaurants/${restaurantId}/optimize/landmarks`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to optimize landmarks");
  return res.json();
}

export interface AuditIssue {
  category: 'menu' | 'reviews' | 'seo' | 'competitive' | 'market' | 'discoverability';
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  impact: string;
  evidence: string;
}

export interface AuditReport {
  restaurantId: string;
  restaurantName: string;
  overallScore: number;
  topIssues: AuditIssue[];
  allIssues: AuditIssue[];
  summary: {
    strengths: string[];
    weaknesses: string[];
    quickWins: string[];
  };
  scores: Record<string, number>;
  generatedAt: string;
}

export interface IntakeEvidence {
  sourceUrl: string;
  sourceType: string;
  observedAt?: string;
  confidence?: number;
  normalizedValue?: any;
  status?: string;
}

export interface IntakeResponse {
  identityState: 'confirmed' | 'probable' | 'ambiguous' | 'unresolved';
  restaurant: { id: string; name: string; address: string; city?: string; website?: string | null } | null;
  evidence: IntakeEvidence[];
  scorecard: any;
  audit: AuditReport | null;
}

export async function intakeRestaurant(data: { name: string; address: string; city?: string; googleShareUrl?: string; website?: string; menuUrl?: string }): Promise<IntakeResponse> {
  const res = await fetch(`${API_URL}/api/discovery/intake`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to intake restaurant");
  const json = await res.json();
  return json.data;
}

export async function runAudit(restaurantId: string, token: string): Promise<AuditReport> {
  const res = await fetch(`${API_URL}/api/audit/restaurants/${restaurantId}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to run audit");
  const json = await res.json();
  return json.data;
}
