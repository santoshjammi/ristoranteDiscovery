// ── Restaurant Intelligence Scorecard v2.0 ──
// 25 customer-facing factors across 5 categories (5 each).
// Merged factors from v1.0 are preserved as sub-signals/evidence internally,
// so no source intelligence is lost even though the customer sees 25 factors.
//
// v2.0 migration notes:
//   - 30 factors -> 25 factors. Merged factors become `subSignals`.
//   - AI Visibility / Conversational Search only shows a live score when real
//     connector/evidence data exists; otherwise it stays `pending_observation`.

export type FactorStatus = 'excellent' | 'good' | 'fair' | 'needs_attention' | 'critical' | 'pending_observation';

export interface SubSignal {
  id: string;
  name: string;
  score: number | null;
  status: FactorStatus;
  evidence: string[];
}

export interface FactorScore {
  id: string;
  name: string;
  description: string;
  score: number | null;          // null = pending observation
  status: FactorStatus;
  trend: 'up' | 'down' | 'stable' | null;
  confidence: number | null;      // null = pending
  lastUpdated: string | null;     // ISO date or null
  businessImpact: string;
  evidenceCount: number;
  subSignals: SubSignal[];        // v2.0: merged factors preserved as evidence
  connectorRequired?: string;     // e.g. "Google Business Profile API"
  recommendedActions: string[];
  expectedImprovement: string;
}

export interface CategoryScore {
  id: string;
  name: string;
  description: string;
  score: number | null;
  factors: FactorScore[];
  healthyCount: number;
  attentionCount: number;
  criticalCount: number;
  pendingCount: number;
  trend: 'up' | 'down' | 'stable' | null;
  confidence: number | null;
}

export interface Scorecard {
  restaurantId: string;
  restaurantName: string;
  overallScore: number | null;
  overallStatus: FactorStatus;
  categories: CategoryScore[];
  totalFactors: number;
  liveFactors: number;
  pendingFactors: number;
  lastUpdated: string;
}

// ── Factor Definitions (v2.0 — 25 factors) ──

export interface FactorDefinition {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  businessImpact: string;
  recommendedActions: string[];
  expectedImprovement: string;
  subSignals: SubSignalDefinition[];   // merged v1.0 factors kept as evidence
  connectorRequired?: string;
  requiresEvidence?: boolean;          // v2.0: only live with real evidence (e.g. AI Visibility)
}

export interface SubSignalDefinition {
  id: string;
  name: string;
}

export const CATEGORIES = [
  { id: 'discoverability', name: 'Discoverability', description: 'How easily customers find your restaurant online' },
  { id: 'reputation', name: 'Reputation', description: 'What customers say about your restaurant' },
  { id: 'digital', name: 'Website & Digital Experience', description: 'Your restaurant\'s digital presence' },
  { id: 'information', name: 'Restaurant Information', description: 'Completeness of your business information' },
  { id: 'market', name: 'Market Position', description: 'Your position in the local market' },
] as const;

export const FACTORS: FactorDefinition[] = [
  // Category 1: Discoverability (5 factors)
  { id: 'gbp_profile', name: 'Google Business Profile', description: 'Completeness and optimization of your GBP listing', categoryId: 'discoverability', businessImpact: 'Directly affects local search ranking and visibility', recommendedActions: ['Complete all GBP fields', 'Add high-quality photos', 'Verify business categories'], expectedImprovement: '+15% local search visibility', subSignals: [{ id: 'maps_presence', name: 'Google Maps Presence' }, { id: 'business_categories', name: 'Business Categories' }] },
  { id: 'local_search', name: 'Local Search Visibility', description: 'Your ranking in local search results', categoryId: 'discoverability', businessImpact: 'Primary driver of new customer acquisition', recommendedActions: ['Optimize for local keywords', 'Build local citations', 'Get local backlinks'], expectedImprovement: '+25% local search traffic', subSignals: [{ id: 'local_search_score', name: 'Local Search Score' }] },
  { id: 'location_accuracy', name: 'Location Accuracy', description: 'Precision of your business location across platforms', categoryId: 'discoverability', businessImpact: 'Prevents customer confusion and lost visits', recommendedActions: ['Verify address on all platforms', 'Fix pin location on Maps', 'Add landmark descriptions'], expectedImprovement: '+8% accurate directions', subSignals: [] },
  { id: 'delivery_platforms', name: 'Delivery Platforms', description: 'Your presence on food delivery platforms', categoryId: 'discoverability', businessImpact: 'Expands customer reach beyond dine-in', recommendedActions: ['List on Zomato/Swiggy', 'Optimize delivery menu', 'Set accurate delivery zones'], expectedImprovement: '+30% delivery orders', connectorRequired: 'Delivery Platform Connector', subSignals: [] },
  { id: 'ai_visibility', name: 'AI Visibility / Conversational Search', description: 'How well your restaurant surfaces in AI search and conversational assistants', categoryId: 'discoverability', businessImpact: 'Emerging discovery channel as users shift to AI search', recommendedActions: ['Ensure structured data is complete', 'Maintain consistent NAP across sources', 'Accumulate authoritative reviews and citations'], expectedImprovement: '+18% AI-assisted discovery', requiresEvidence: true, subSignals: [{ id: 'ai_visibility_score', name: 'AI Visibility Score' }, { id: 'conversational_search', name: 'Conversational Search' }] },

  // Category 2: Reputation (5 factors)
  { id: 'avg_rating', name: 'Average Rating', description: 'Your overall rating across platforms', categoryId: 'reputation', businessImpact: 'Primary trust signal for potential customers', recommendedActions: ['Encourage positive reviews', 'Address common complaints', 'Highlight top-rated dishes'], expectedImprovement: '+0.3 rating points', subSignals: [] },
  { id: 'review_volume_freshness', name: 'Review Volume & Freshness', description: 'Number and recency of reviews across all platforms', categoryId: 'reputation', businessImpact: 'Volume builds social proof; freshness signals an active business', recommendedActions: ['Ask every customer for a review', 'Maintain weekly review cadence', 'Follow up after visits'], expectedImprovement: '+50 reviews per month', subSignals: [{ id: 'review_volume', name: 'Review Volume' }, { id: 'review_freshness', name: 'Review Freshness' }] },
  { id: 'review_response', name: 'Review Response Rate', description: 'Percentage of reviews you respond to', categoryId: 'reputation', businessImpact: 'Shows you care about customer feedback', recommendedActions: ['Respond within 24 hours', 'Personalize each response', 'Address negative reviews constructively'], expectedImprovement: '+20% customer satisfaction', subSignals: [] },
  { id: 'sentiment', name: 'Customer Sentiment', description: 'Overall sentiment analysis of reviews', categoryId: 'reputation', businessImpact: 'Qualitative measure of customer happiness', recommendedActions: ['Monitor sentiment trends', 'Address negative patterns', 'Highlight positive themes'], expectedImprovement: '+10% sentiment score', subSignals: [] },
  { id: 'overall_trust', name: 'Overall Trust', description: 'Composite trust signals for your business', categoryId: 'reputation', businessImpact: 'Trust converts lookers to customers', recommendedActions: ['Display certifications', 'Share customer testimonials', 'Maintain consistent quality'], expectedImprovement: '+25% conversion rate', subSignals: [{ id: 'business_trust', name: 'Business Trust' }, { id: 'social_presence', name: 'Social Presence' }] },

  // Category 3: Website & Digital Experience (5 factors)
  { id: 'website_health', name: 'Website Health', description: 'Overall health and performance of your website', categoryId: 'digital', businessImpact: 'First digital impression for many customers', recommendedActions: ['Fix broken links', 'Update content regularly', 'Ensure SSL certificate is valid'], expectedImprovement: '+20% website traffic', subSignals: [{ id: 'website_performance', name: 'Website Performance' }] },
  { id: 'mobile_experience', name: 'Mobile Experience', description: 'How well your website works on mobile devices', categoryId: 'digital', businessImpact: 'Most customers browse on mobile', recommendedActions: ['Test on multiple devices', 'Optimize page load speed', 'Simplify mobile navigation'], expectedImprovement: '+30% mobile engagement', subSignals: [] },
  { id: 'menu_availability_quality', name: 'Menu Availability & Quality', description: 'Whether your menu is available online and how well it is presented', categoryId: 'digital', businessImpact: 'Customers need to see your menu before visiting', recommendedActions: ['Upload menu to website', 'Add descriptions to all items', 'Create PDF menu'], expectedImprovement: '+15% menu views', subSignals: [{ id: 'menu_availability', name: 'Menu Availability' }, { id: 'menu_quality', name: 'Menu Quality' }, { id: 'menu_publishing', name: 'Menu Publishing' }] },
  { id: 'online_ordering', name: 'Online Ordering', description: 'Availability of online ordering', categoryId: 'digital', businessImpact: 'Convenience drives orders', recommendedActions: ['Set up online ordering system', 'Integrate with delivery platforms', 'Offer direct ordering'], expectedImprovement: '+40% online orders', subSignals: [] },
  { id: 'reservations', name: 'Reservations', description: 'Online reservation system availability', categoryId: 'digital', businessImpact: 'Makes booking convenient for customers', recommendedActions: ['Set up online reservations', 'Integrate with OpenTable', 'Manage table availability'], expectedImprovement: '+25% advance bookings', connectorRequired: 'Reservation Platform Connector', subSignals: [] },

  // Category 4: Restaurant Information (5 factors)
  { id: 'business_completeness', name: 'Business Completeness', description: 'Completeness of your business information online', categoryId: 'information', businessImpact: 'Complete info builds customer trust', recommendedActions: ['Fill all GBP fields', 'Add service options', 'Update holiday hours'], expectedImprovement: '+10% customer confidence', subSignals: [{ id: 'restaurant_clarity', name: 'Restaurant Clarity' }] },
  { id: 'opening_hours', name: 'Opening Hours', description: 'Accuracy and completeness of operating hours', categoryId: 'information', businessImpact: 'Wrong hours = lost customers', recommendedActions: ['Verify hours on all platforms', 'Update holiday hours in advance', 'Add special hours for events'], expectedImprovement: '-90% wrong-hour complaints', subSignals: [] },
  { id: 'contact_info', name: 'Contact Information', description: 'Accuracy of phone, email, and contact details', categoryId: 'information', businessImpact: 'Customers need to reach you', recommendedActions: ['Verify phone number on all platforms', 'Add WhatsApp number', 'Set up contact form'], expectedImprovement: '+20% contactability', subSignals: [] },
  { id: 'photos_media', name: 'Photos & Media', description: 'Quality and quantity of your restaurant photos', categoryId: 'information', businessImpact: 'Photos drive customer decisions', recommendedActions: ['Add professional food photos', 'Show interior and exterior', 'Update seasonally'], expectedImprovement: '+35% menu item views', subSignals: [] },
  { id: 'local_citations', name: 'Local Citations', description: 'Your business listed on local directories', categoryId: 'information', businessImpact: 'Citations improve local search authority', recommendedActions: ['List on all major directories', 'Ensure NAP consistency', 'Build local backlinks'], expectedImprovement: '+12% local search authority', connectorRequired: 'Citation Platform Connector', subSignals: [] },

  // Category 5: Market Position (5 factors)
  { id: 'competitive_position', name: 'Competitive Position', description: 'Your position relative to competitors', categoryId: 'market', businessImpact: 'Understanding competition drives strategy', recommendedActions: ['Analyze top competitors', 'Identify gaps in market', 'Differentiate your offering'], expectedImprovement: '+15% market share', subSignals: [] },
  { id: 'local_authority', name: 'Local Authority', description: 'Your restaurant\'s authority in the local market', categoryId: 'market', businessImpact: 'Authority drives customer trust', recommendedActions: ['Build local partnerships', 'Get featured in local media', 'Participate in community events'], expectedImprovement: '+20% local recognition', subSignals: [] },
  { id: 'visibility_trend', name: 'Visibility Trend', description: 'How your visibility is changing over time', categoryId: 'market', businessImpact: 'Trends indicate business health direction', recommendedActions: ['Monitor weekly changes', 'Invest in improving areas', 'Capitalize on strengths'], expectedImprovement: '+10% visibility growth', subSignals: [] },
  { id: 'growth_opportunity', name: 'Growth Opportunity', description: 'Identified opportunities for business growth', categoryId: 'market', businessImpact: 'Growth opportunities drive revenue', recommendedActions: ['Expand delivery area', 'Add catering service', 'Launch loyalty program'], expectedImprovement: '+30% revenue potential', subSignals: [] },
  { id: 'customer_engagement', name: 'Customer Engagement', description: 'How engaged your customers are with your brand', categoryId: 'market', businessImpact: 'Engaged customers are repeat customers', recommendedActions: ['Start loyalty program', 'Send promotional offers', 'Collect customer feedback'], expectedImprovement: '+40% repeat visits', connectorRequired: 'Customer Engagement Connector', subSignals: [] },
];

// ── v2.0 sub-signal score mapping ──
// Maps a merged v1.0 factor id (or a derived signal) to the v2.0 factor it feeds.
// Used by ScorecardService to preserve merged source data as sub-signal evidence.
export const SUBSIGNAL_SOURCE_MAP: Record<string, string> = {
  maps_presence: 'gbp_profile',
  business_categories: 'gbp_profile',
  local_search_score: 'local_search',
  ai_visibility_score: 'ai_visibility',
  conversational_search: 'ai_visibility',
  review_volume: 'review_volume_freshness',
  review_freshness: 'review_volume_freshness',
  business_trust: 'overall_trust',
  social_presence: 'overall_trust',
  website_performance: 'website_health',
  menu_availability: 'menu_availability_quality',
  menu_quality: 'menu_availability_quality',
  menu_publishing: 'menu_availability_quality',
  restaurant_clarity: 'business_completeness',
};
