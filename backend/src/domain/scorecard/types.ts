// ── Restaurant Intelligence Scorecard v1.0 ──
// 30 factors across 5 categories. Frozen architecture.
// Future connectors only populate data — no UI redesign needed.

export type FactorStatus = 'excellent' | 'good' | 'fair' | 'needs_attention' | 'critical' | 'pending_observation';

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

// ── Factor Definitions (frozen) ──

export interface FactorDefinition {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  businessImpact: string;
  recommendedActions: string[];
  expectedImprovement: string;
  connectorRequired?: string;
}

export const CATEGORIES = [
  { id: 'discoverability', name: 'Discoverability', description: 'How easily customers find your restaurant online' },
  { id: 'reputation', name: 'Reputation', description: 'What customers say about your restaurant' },
  { id: 'digital', name: 'Website & Digital Experience', description: 'Your restaurant\'s digital presence' },
  { id: 'information', name: 'Restaurant Information', description: 'Completeness of your business information' },
  { id: 'market', name: 'Market Position', description: 'Your position in the local market' },
] as const;

export const FACTORS: FactorDefinition[] = [
  // Category 1: Discoverability (6 factors)
  { id: 'gbp_profile', name: 'Google Business Profile', description: 'Completeness and optimization of your GBP listing', categoryId: 'discoverability', businessImpact: 'Directly affects local search ranking and visibility', recommendedActions: ['Complete all GBP fields', 'Add high-quality photos', 'Verify business categories'], expectedImprovement: '+15% local search visibility' },
  { id: 'maps_presence', name: 'Google Maps Presence', description: 'How well your restaurant appears in Google Maps', categoryId: 'discoverability', businessImpact: 'Affects foot traffic and discovery', recommendedActions: ['Verify location accuracy', 'Encourage Google Maps check-ins', 'Respond to Maps questions'], expectedImprovement: '+20% map discovery' },
  { id: 'local_search', name: 'Local Search Visibility', description: 'Your ranking in local search results', categoryId: 'discoverability', businessImpact: 'Primary driver of new customer acquisition', recommendedActions: ['Optimize for local keywords', 'Build local citations', 'Get local backlinks'], expectedImprovement: '+25% local search traffic' },
  { id: 'business_categories', name: 'Business Categories', description: 'Accuracy and completeness of your business categories', categoryId: 'discoverability', businessImpact: 'Helps search engines understand your business', recommendedActions: ['Select primary and secondary categories', 'Add service categories', 'Review competitor categories'], expectedImprovement: '+10% relevant search appearances' },
  { id: 'location_accuracy', name: 'Location Accuracy', description: 'Precision of your business location across platforms', categoryId: 'discoverability', businessImpact: 'Prevents customer confusion and lost visits', recommendedActions: ['Verify address on all platforms', 'Fix pin location on Maps', 'Add landmark descriptions'], expectedImprovement: '+8% accurate directions' },
  { id: 'delivery_platforms', name: 'Delivery Platforms', description: 'Your presence on food delivery platforms', categoryId: 'discoverability', businessImpact: 'Expands customer reach beyond dine-in', recommendedActions: ['List on Zomato/Swiggy', 'Optimize delivery menu', 'Set accurate delivery zones'], expectedImprovement: '+30% delivery orders', connectorRequired: 'Delivery Platform Connector' },

  // Category 2: Reputation (6 factors)
  { id: 'avg_rating', name: 'Average Rating', description: 'Your overall rating across platforms', categoryId: 'reputation', businessImpact: 'Primary trust signal for potential customers', recommendedActions: ['Encourage positive reviews', 'Address common complaints', 'Highlight top-rated dishes'], expectedImprovement: '+0.3 rating points' },
  { id: 'review_volume', name: 'Review Volume', description: 'Number of reviews across all platforms', categoryId: 'reputation', businessImpact: 'More reviews = more social proof', recommendedActions: ['Ask every customer for a review', 'Create review QR codes', 'Follow up after visits'], expectedImprovement: '+50 reviews per month' },
  { id: 'review_freshness', name: 'Review Freshness', description: 'How recent your reviews are', categoryId: 'reputation', businessImpact: 'Fresh reviews signal active business', recommendedActions: ['Maintain weekly review cadence', 'Respond to all new reviews', 'Feature recent positive reviews'], expectedImprovement: '+15% customer trust' },
  { id: 'review_response', name: 'Review Response Rate', description: 'Percentage of reviews you respond to', categoryId: 'reputation', businessImpact: 'Shows you care about customer feedback', recommendedActions: ['Respond within 24 hours', 'Personalize each response', 'Address negative reviews constructively'], expectedImprovement: '+20% customer satisfaction' },
  { id: 'sentiment', name: 'Customer Sentiment', description: 'Overall sentiment analysis of reviews', categoryId: 'reputation', businessImpact: 'Qualitative measure of customer happiness', recommendedActions: ['Monitor sentiment trends', 'Address negative patterns', 'Highlight positive themes'], expectedImprovement: '+10% sentiment score' },
  { id: 'social_presence', name: 'Social Presence', description: 'Your activity and engagement on social media', categoryId: 'reputation', businessImpact: 'Builds brand awareness and community', recommendedActions: ['Post weekly content', 'Engage with followers', 'Share customer photos'], expectedImprovement: '+25% social engagement', connectorRequired: 'Social Media Connector' },

  // Category 3: Website & Digital Experience (6 factors)
  { id: 'website_health', name: 'Website Health', description: 'Overall health and performance of your website', categoryId: 'digital', businessImpact: 'First digital impression for many customers', recommendedActions: ['Fix broken links', 'Update content regularly', 'Ensure SSL certificate is valid'], expectedImprovement: '+20% website traffic' },
  { id: 'mobile_experience', name: 'Mobile Experience', description: 'How well your website works on mobile devices', categoryId: 'digital', businessImpact: 'Most customers browse on mobile', recommendedActions: ['Test on multiple devices', 'Optimize page load speed', 'Simplify mobile navigation'], expectedImprovement: '+30% mobile engagement' },
  { id: 'menu_availability', name: 'Menu Availability', description: 'Whether your menu is available online', categoryId: 'digital', businessImpact: 'Customers need to see your menu before visiting', recommendedActions: ['Upload menu to website', 'Add menu to GBP', 'Create PDF menu'], expectedImprovement: '+15% menu views' },
  { id: 'online_ordering', name: 'Online Ordering', description: 'Availability of online ordering', categoryId: 'digital', businessImpact: 'Convenience drives orders', recommendedActions: ['Set up online ordering system', 'Integrate with delivery platforms', 'Offer direct ordering'], expectedImprovement: '+40% online orders' },
  { id: 'website_performance', name: 'Website Performance', description: 'Page load speed and technical performance', categoryId: 'digital', businessImpact: 'Slow sites lose customers', recommendedActions: ['Optimize images', 'Enable caching', 'Minimize JavaScript'], expectedImprovement: '+15% page views' },
  { id: 'reservations', name: 'Reservations', description: 'Online reservation system availability', categoryId: 'digital', businessImpact: 'Makes booking convenient for customers', recommendedActions: ['Set up online reservations', 'Integrate with OpenTable', 'Manage table availability'], expectedImprovement: '+25% advance bookings', connectorRequired: 'Reservation Platform Connector' },

  // Category 4: Restaurant Information (6 factors)
  { id: 'business_completeness', name: 'Business Completeness', description: 'Completeness of your business information online', categoryId: 'information', businessImpact: 'Complete info builds customer trust', recommendedActions: ['Fill all GBP fields', 'Add service options', 'Update holiday hours'], expectedImprovement: '+10% customer confidence' },
  { id: 'opening_hours', name: 'Opening Hours', description: 'Accuracy and completeness of operating hours', categoryId: 'information', businessImpact: 'Wrong hours = lost customers', recommendedActions: ['Verify hours on all platforms', 'Update holiday hours in advance', 'Add special hours for events'], expectedImprovement: '-90% wrong-hour complaints' },
  { id: 'contact_info', name: 'Contact Information', description: 'Accuracy of phone, email, and contact details', categoryId: 'information', businessImpact: 'Customers need to reach you', recommendedActions: ['Verify phone number on all platforms', 'Add WhatsApp number', 'Set up contact form'], expectedImprovement: '+20% contactability' },
  { id: 'photos_media', name: 'Photos & Media', description: 'Quality and quantity of your restaurant photos', categoryId: 'information', businessImpact: 'Photos drive customer decisions', recommendedActions: ['Add professional food photos', 'Show interior and exterior', 'Update seasonally'], expectedImprovement: '+35% menu item views' },
  { id: 'menu_quality', name: 'Menu Quality', description: 'Quality and completeness of your menu presentation', categoryId: 'information', businessImpact: 'Menu is your primary sales tool', recommendedActions: ['Add descriptions to all items', 'Include prices and photos', 'Highlight specialties'], expectedImprovement: '+20% menu engagement' },
  { id: 'local_citations', name: 'Local Citations', description: 'Your business listed on local directories', categoryId: 'information', businessImpact: 'Citations improve local search authority', recommendedActions: ['List on all major directories', 'Ensure NAP consistency', 'Build local backlinks'], expectedImprovement: '+12% local search authority', connectorRequired: 'Citation Platform Connector' },

  // Category 5: Market Position (6 factors)
  { id: 'competitive_position', name: 'Competitive Position', description: 'Your position relative to competitors', categoryId: 'market', businessImpact: 'Understanding competition drives strategy', recommendedActions: ['Analyze top competitors', 'Identify gaps in market', 'Differentiate your offering'], expectedImprovement: '+15% market share' },
  { id: 'local_authority', name: 'Local Authority', description: 'Your restaurant\'s authority in the local market', categoryId: 'market', businessImpact: 'Authority drives customer trust', recommendedActions: ['Build local partnerships', 'Get featured in local media', 'Participate in community events'], expectedImprovement: '+20% local recognition' },
  { id: 'visibility_trend', name: 'Visibility Trend', description: 'How your visibility is changing over time', categoryId: 'market', businessImpact: 'Trends indicate business health direction', recommendedActions: ['Monitor weekly changes', 'Invest in improving areas', 'Capitalize on strengths'], expectedImprovement: '+10% visibility growth' },
  { id: 'business_trust', name: 'Business Trust', description: 'Overall trust signals for your business', categoryId: 'market', businessImpact: 'Trust converts lookers to customers', recommendedActions: ['Display certifications', 'Share customer testimonials', 'Maintain consistent quality'], expectedImprovement: '+25% conversion rate' },
  { id: 'growth_opportunity', name: 'Growth Opportunity', description: 'Identified opportunities for business growth', categoryId: 'market', businessImpact: 'Growth opportunities drive revenue', recommendedActions: ['Expand delivery area', 'Add catering service', 'Launch loyalty program'], expectedImprovement: '+30% revenue potential' },
  { id: 'customer_engagement', name: 'Customer Engagement', description: 'How engaged your customers are with your brand', categoryId: 'market', businessImpact: 'Engaged customers are repeat customers', recommendedActions: ['Start loyalty program', 'Send promotional offers', 'Collect customer feedback'], expectedImprovement: '+40% repeat visits', connectorRequired: 'Customer Engagement Connector' },
];
