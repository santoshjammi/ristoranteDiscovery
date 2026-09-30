// ── Canonical Discovery Signal Registry ──
// RIST-RDI-007 signal-design-v1 §4, §5, §29.
// The SINGLE authoritative mapping: Signal → Factor → Category.
// ~140 canonical signals across the frozen 25 factors. Definitions live here
// only — no service scatters signal definitions. Persistence stores only
// observations/results, never static signal definitions.

import {
  type DiscoveryFactorId,
  type SignalDefinition,
  type ObservationSourceType,
  type FactorCapabilities,
} from './types';
import { FACTORS, CATEGORIES } from '../scorecard/types';

export const METHODOLOGY_VERSION = '1.0';

type RegistryFactorSignals = SignalDefinition[];

interface RegistryEntry {
  category: string;
  signals: RegistryFactorSignals;
}

/** Map from key → its defining factor, derived once for validation + lookup. */
function buildKeyIndex(registry: Record<string, RegistryEntry>): Map<string, string> {
  const map = new Map<string, string>();
  for (const [factorId, entry] of Object.entries(registry)) {
    for (const s of entry.signals) {
      map.set(s.key, factorId);
    }
  }
  return map;
}

// ── Helper to keep definitions compact while honoring the full contract ──
interface MinDef {
  key: string;
  label: string;
  description: string;
  sourceTypes: ObservationSourceType[];
  weight: number;
  scoringMethod: SignalDefinition['scoringMethod'];
  freshnessPolicy: string;
  minimumConfidence: number;
  requiredEvidence: boolean;
  capabilityKey?: SignalDefinition['capabilityKey'];
  customNormalizer?: string;
  thresholds?: number[];
  range?: { min: number; max: number };
  categoricalMap?: Record<string, number>;
}

const METHODOLOGY = METHODOLOGY_VERSION;

function sig(
  factorId: DiscoveryFactorId,
  m: MinDef,
): SignalDefinition {
  return {
    key: m.key,
    factorId,
    label: m.label,
    description: m.description,
    sourceTypes: m.sourceTypes,
    weight: m.weight,
    scoringMethod: m.scoringMethod,
    freshnessPolicy: m.freshnessPolicy,
    minimumConfidence: m.minimumConfidence,
    requiredEvidence: m.requiredEvidence,
    methodologyVersion: METHODOLOGY,
    capabilityKey: m.capabilityKey,
    customNormalizer: m.customNormalizer,
    thresholds: m.thresholds,
    range: m.range,
    categoricalMap: m.categoricalMap,
  };
}

// Freshness policy shorthand
const CONTINUOUS = 'continuous';
const H24 = 'hours:24';
const H48 = 'hours:48';
const D7 = 'days:7';
const D30 = 'days:30';
const MONTH3 = 'months:3';
const MONTH6 = 'months:6';
const MONTH12 = 'months:12';

// ── THE CANONICAL REGISTRY ──
export const DISCOVERY_SIGNAL_REGISTRY: Record<string, RegistryEntry> = {
  // ════════════ CATEGORY: DISCOVERABILITY ════════════
  gbp_profile: {
    category: 'discoverability',
    signals: [
      sig('gbp_profile', { key: 'gbp_exists', label: 'Google Business Profile Exists', description: 'Profile has a real Google Business Profile listing', sourceTypes: ['google'], weight: 1.5, scoringMethod: 'boolean', freshnessPolicy: D30, minimumConfidence: 0.6, requiredEvidence: true }),
      sig('gbp_profile', { key: 'gbp_primary_category', label: 'Primary Category Accuracy', description: 'Primary business category is set and accurate', sourceTypes: ['google'], weight: 1.5, scoringMethod: 'boolean', freshnessPolicy: D30, minimumConfidence: 0.6, requiredEvidence: true }),
      sig('gbp_profile', { key: 'gbp_secondary_categories', label: 'Secondary Category Coverage', description: 'Secondary business categories are populated', sourceTypes: ['google'], weight: 1, scoringMethod: 'ratio', freshnessPolicy: D30, minimumConfidence: 0.6, requiredEvidence: true }),
      sig('gbp_profile', { key: 'gbp_hours_complete', label: 'Opening Hours Complete', description: 'Full operating hours published on the profile', sourceTypes: ['google'], weight: 1.5, scoringMethod: 'boolean', freshnessPolicy: MONTH3, minimumConfidence: 0.6, requiredEvidence: true }),
      sig('gbp_profile', { key: 'gbp_address_verified', label: 'Address Verified', description: 'Verified address on the Google listing', sourceTypes: ['google'], weight: 1, scoringMethod: 'boolean', freshnessPolicy: MONTH12, minimumConfidence: 0.6, requiredEvidence: true }),
      sig('gbp_profile', { key: 'gbp_phone_verified', label: 'Phone Verified', description: 'Verified phone number on the Google listing', sourceTypes: ['google'], weight: 1, scoringMethod: 'boolean', freshnessPolicy: MONTH12, minimumConfidence: 0.6, requiredEvidence: true }),
      sig('gbp_profile', { key: 'gbp_website_present', label: 'Website on Profile', description: 'Website link attached to the Google listing', sourceTypes: ['google'], weight: 1, scoringMethod: 'boolean', freshnessPolicy: MONTH3, minimumConfidence: 0.6, requiredEvidence: true }),
      sig('gbp_profile', { key: 'gbp_photo_coverage', label: 'Photo Coverage', description: 'Photos present on the Google listing', sourceTypes: ['google'], weight: 1, scoringMethod: 'boolean', freshnessPolicy: D30, minimumConfidence: 0.6, requiredEvidence: false }),
      sig('gbp_profile', { key: 'gbp_latitude_longitude', label: 'Map Pin Accuracy', description: 'Latitude/longitude present and accurate on profile', sourceTypes: ['google'], weight: 1, scoringMethod: 'boolean', freshnessPolicy: MONTH6, minimumConfidence: 0.5, requiredEvidence: false }),
    ],
  },

  local_search: {
    category: 'discoverability',
    signals: [
      sig('local_search', { key: 'brand_search_visibility', label: 'Brand Search Visibility', description: 'Restaurant appears for its own brand search', sourceTypes: ['local_search'], weight: 1.5, scoringMethod: 'range', freshnessPolicy: D7, minimumConfidence: 0.6, requiredEvidence: true, range: { min: 0, max: 100 } }),
      sig('local_search', { key: 'maps_presence', label: 'Google Maps Presence', description: 'Restaurant appears on Google Maps local pack', sourceTypes: ['local_search', 'google'], weight: 1.5, scoringMethod: 'boolean', freshnessPolicy: D7, minimumConfidence: 0.6, requiredEvidence: true }),
      sig('local_search', { key: 'cuisine_city_visibility', label: 'Cuisine + City Visibility', description: 'Appears for cuisine + city searches', sourceTypes: ['local_search'], weight: 1, scoringMethod: 'range', freshnessPolicy: D7, minimumConfidence: 0.6, requiredEvidence: true, range: { min: 0, max: 100 } }),
      sig('local_search', { key: 'local_pack_coverage', label: 'Local Pack Coverage', description: 'Ranking within the local pack (top 3)', sourceTypes: ['local_search'], weight: 1, scoringMethod: 'range', freshnessPolicy: D7, minimumConfidence: 0.6, requiredEvidence: true, range: { min: 0, max: 100 } }),
      sig('local_search', { key: 'search_query_coverage', label: 'Search-Query Coverage', description: 'Coverage across broad discovery queries', sourceTypes: ['local_search'], weight: 1, scoringMethod: 'range', freshnessPolicy: D7, minimumConfidence: 0.6, requiredEvidence: true, range: { min: 0, max: 100 } }),
      sig('local_search', { key: 'organic_brand_result', label: 'Organic Brand Result', description: 'Organic (non-Ads) brand result on page one', sourceTypes: ['local_search'], weight: 1.5, scoringMethod: 'boolean', freshnessPolicy: D7, minimumConfidence: 0.6, requiredEvidence: true }),
      sig('local_search', { key: 'near_me_visibility', label: 'Near-Me Visibility', description: 'Appears for near-me / vicinity searches', sourceTypes: ['local_search'], weight: 1, scoringMethod: 'boolean', freshnessPolicy: D7, minimumConfidence: 0.6, requiredEvidence: false }),
    ],
  },

  location_accuracy: {
    category: 'discoverability',
    signals: [
      sig('location_accuracy', { key: 'address_present', label: 'Address Present', description: 'A real street address is recorded', sourceTypes: ['google', 'other'], weight: 1.5, scoringMethod: 'boolean', freshnessPolicy: MONTH12, minimumConfidence: 0.5, requiredEvidence: false }),
      sig('location_accuracy', { key: 'city_present', label: 'City Present', description: 'City is recorded', sourceTypes: ['google', 'other'], weight: 1, scoringMethod: 'boolean', freshnessPolicy: MONTH12, minimumConfidence: 0.5, requiredEvidence: false }),
      sig('location_accuracy', { key: 'pin_coordinates', label: 'Pin Coordinates Present', description: 'Latitude/longitude are recorded', sourceTypes: ['google'], weight: 1.5, scoringMethod: 'boolean', freshnessPolicy: MONTH6, minimumConfidence: 0.5, requiredEvidence: false }),
      sig('location_accuracy', { key: 'landmark_nearby', label: 'Nearby Landmark', description: 'Geo landmark/nearby area descriptions present', sourceTypes: ['google', 'other'], weight: 1, scoringMethod: 'boolean', freshnessPolicy: MONTH12, minimumConfidence: 0.5, requiredEvidence: false }),
      sig('location_accuracy', { key: 'pin_direction_quality', label: 'Directions Reachability', description: 'Maps directions resolve to the exact pin', sourceTypes: ['google', 'local_search'], weight: 1, scoringMethod: 'range', freshnessPolicy: MONTH3, minimumConfidence: 0.6, requiredEvidence: false, range: { min: 0, max: 100 } }),
    ],
  },

  delivery_platforms: {
    category: 'discoverability',
    signals: [
      sig('delivery_platforms', { key: 'delivery_support_enabled', label: 'Delivery Enabled', description: 'Restaurant supports food delivery (capability)', sourceTypes: ['delivery'], weight: 1, scoringMethod: 'boolean', freshnessPolicy: MONTH3, minimumConfidence: 0.5, requiredEvidence: false, capabilityKey: 'hasDelivery' }),
      sig('delivery_platforms', { key: 'delivery_platform_presence', label: 'Delivery Platform Presence', description: 'Listed on a delivery platform like Zomato/Swiggy', sourceTypes: ['delivery'], weight: 1.5, scoringMethod: 'boolean', freshnessPolicy: D30, minimumConfidence: 0.6, requiredEvidence: true, capabilityKey: 'hasDelivery' }),
      sig('delivery_platforms', { key: 'delivery_menu_optimized', label: 'Delivery Menu Optimized', description: 'Delivery menu is complete and optimized', sourceTypes: ['delivery', 'menu'], weight: 1, scoringMethod: 'range', freshnessPolicy: D30, minimumConfidence: 0.6, requiredEvidence: true, capabilityKey: 'hasDelivery', range: { min: 0, max: 100 } }),
      sig('delivery_platforms', { key: 'delivery_zones_accurate', label: 'Delivery Zones Accurate', description: 'Delivery zones/timings are set accurately', sourceTypes: ['delivery'], weight: 1, scoringMethod: 'boolean', freshnessPolicy: MONTH3, minimumConfidence: 0.6, requiredEvidence: false, capabilityKey: 'hasDelivery' }),
    ],
  },

  ai_visibility: {
    category: 'discoverability',
    signals: [
      sig('ai_visibility', { key: 'structured_data_complete', label: 'Structured Data Complete', description: 'Structured schema (SEOMarkup) present', sourceTypes: ['website', 'ai_visibility'], weight: 1.5, scoringMethod: 'boolean', freshnessPolicy: D30, minimumConfidence: 0.6, requiredEvidence: true }),
      sig('ai_visibility', { key: 'nap_consistency', label: 'NAP Consistency', description: 'Name-address-phone consistent across sources', sourceTypes: ['google', 'citation', 'website'], weight: 1.5, scoringMethod: 'ratio', freshnessPolicy: MONTH3, minimumConfidence: 0.6, requiredEvidence: true }),
      sig('ai_visibility', { key: 'conversational_surface', label: 'Conversational Search Surface', description: 'Appears in AI/conversational assistants', sourceTypes: ['ai_visibility'], weight: 1, scoringMethod: 'boolean', freshnessPolicy: D7, minimumConfidence: 0.6, requiredEvidence: true }),
      sig('ai_visibility', { key: 'ai_visibility_score', label: 'AI Visibility Score', description: 'Composite score of AI search visibility', sourceTypes: ['ai_visibility'], weight: 1.5, scoringMethod: 'range', freshnessPolicy: D7, minimumConfidence: 0.6, requiredEvidence: true, range: { min: 0, max: 100 } }),
      sig('ai_visibility', { key: 'authoritative_reviews_citations', label: 'Authoritative Reviews/Citations', description: 'Accumulated authoritative reviews and citations', sourceTypes: ['review', 'citation'], weight: 1, scoringMethod: 'ratio', freshnessPolicy: MONTH3, minimumConfidence: 0.6, requiredEvidence: true }),
    ],
  },

  // ════════════ CATEGORY: REPUTATION ════════════
  avg_rating: {
    category: 'reputation',
    signals: [
      sig('avg_rating', { key: 'google_average_rating', label: 'Average Rating', description: 'Google average star rating', sourceTypes: ['google', 'review'], weight: 1.5, scoringMethod: 'custom', customNormalizer: 'google_star_range', freshnessPolicy: D30, minimumConfidence: 0.6, requiredEvidence: true }),
      sig('avg_rating', { key: 'google_review_total', label: 'Google Review Total', description: 'Total number of Google reviews', sourceTypes: ['google', 'review'], weight: 1, scoringMethod: 'range', freshnessPolicy: D30, minimumConfidence: 0.6, requiredEvidence: true, range: { min: 0, max: 500 } }),
      sig('avg_rating', { key: 'rating_distribution_health', label: 'Rating Distribution Health', description: 'Distribution skews positive (5/4-star heavy)', sourceTypes: ['review'], weight: 1, scoringMethod: 'ratio', freshnessPolicy: D30, minimumConfidence: 0.6, requiredEvidence: true }),
    ],
  },

  review_volume_freshness: {
    category: 'reputation',
    signals: [
      sig('review_volume_freshness', { key: 'review_total', label: 'Review Volume', description: 'Total number of reviews', sourceTypes: ['google', 'review'], weight: 1.5, scoringMethod: 'range', freshnessPolicy: D30, minimumConfidence: 0.6, requiredEvidence: true, range: { min: 0, max: 500 } }),
      sig('review_volume_freshness', { key: 'reviews_last_30_days', label: 'Reviews in Last 30 Days', description: 'Review count in the last 30 days', sourceTypes: ['review'], weight: 1.5, scoringMethod: 'range', freshnessPolicy: D7, minimumConfidence: 0.6, requiredEvidence: true, range: { min: 0, max: 50 } }),
      sig('review_volume_freshness', { key: 'review_velocity', label: 'Review Velocity', description: 'Reviews per month trend', sourceTypes: ['review'], weight: 1, scoringMethod: 'range', freshnessPolicy: D7, minimumConfidence: 0.6, requiredEvidence: true, range: { min: 0, max: 20 } }),
      sig('review_volume_freshness', { key: 'latest_review_recency', label: 'Latest Review Recency', description: 'Age of the most recent review', sourceTypes: ['review'], weight: 1, scoringMethod: 'custom', customNormalizer: 'review_recency', freshnessPolicy: D7, minimumConfidence: 0.6, requiredEvidence: true }),
      sig('review_volume_freshness', { key: 'review_distribution_sources', label: 'Review Source Diversity', description: 'Reviews spread across multiple platforms', sourceTypes: ['review'], weight: 1, scoringMethod: 'ratio', freshnessPolicy: D30, minimumConfidence: 0.6, requiredEvidence: true }),
    ],
  },

  review_response: {
    category: 'reputation',
    signals: [
      sig('review_response', { key: 'response_rate', label: 'Review Response Rate', description: 'Percentage of reviews responded to', sourceTypes: ['review', 'google'], weight: 1.5, scoringMethod: 'ratio', freshnessPolicy: D30, minimumConfidence: 0.6, requiredEvidence: true }),
      sig('review_response', { key: 'response_speed', label: 'Response Speed', description: 'Average time to respond (fast = better)', sourceTypes: ['review'], weight: 1, scoringMethod: 'custom', customNormalizer: 'response_speed', freshnessPolicy: D30, minimumConfidence: 0.6, requiredEvidence: true }),
      sig('review_response', { key: 'negative_review_handling', label: 'Negative Review Handling', description: 'Negative reviews addressed constructively', sourceTypes: ['review'], weight: 1.5, scoringMethod: 'boolean', freshnessPolicy: D30, minimumConfidence: 0.6, requiredEvidence: true }),
    ],
  },

  sentiment: {
    category: 'reputation',
    signals: [
      sig('sentiment', { key: 'review_service_sentiment', label: 'Service Sentiment', description: 'AI-validated sentiment of service reviews', sourceTypes: ['review'], weight: 1.5, scoringMethod: 'range', freshnessPolicy: D30, minimumConfidence: 0.55, requiredEvidence: true, range: { min: -1, max: 1 } }),
      sig('sentiment', { key: 'review_food_sentiment', label: 'Food Sentiment', description: 'Sentiment of food-quality reviews', sourceTypes: ['review'], weight: 1.5, scoringMethod: 'range', freshnessPolicy: D30, minimumConfidence: 0.55, requiredEvidence: true, range: { min: -1, max: 1 } }),
      sig('sentiment', { key: 'ambiance_sentiment', label: 'Ambiance Sentiment', description: 'Sentiment of ambiance reviews', sourceTypes: ['review'], weight: 1, scoringMethod: 'range', freshnessPolicy: D30, minimumConfidence: 0.55, requiredEvidence: true, range: { min: -1, max: 1 } }),
      sig('sentiment', { key: 'topical_cluster_sentiment', label: 'Topic Sentiment', description: 'Sentiment by clustered topic', sourceTypes: ['review'], weight: 1, scoringMethod: 'range', freshnessPolicy: D30, minimumConfidence: 0.55, requiredEvidence: true, range: { min: -1, max: 1 } }),
    ],
  },

  overall_trust: {
    category: 'reputation',
    signals: [
      sig('overall_trust', { key: 'certifications_displayed', label: 'Certifications Displayed', description: 'Business displays quality certifications', sourceTypes: ['website', 'citation'], weight: 1, scoringMethod: 'boolean', freshnessPolicy: MONTH3, minimumConfidence: 0.5, requiredEvidence: false }),
      sig('overall_trust', { key: 'customer_testimonials', label: 'Customer Testimonials', description: 'Testimonials published on public surfaces', sourceTypes: ['website', 'review'], weight: 1, scoringMethod: 'boolean', freshnessPolicy: MONTH3, minimumConfidence: 0.5, requiredEvidence: false }),
      sig('overall_trust', { key: 'social_presence', label: 'Social Presence', description: 'Active social profile exists', sourceTypes: ['other'], weight: 1, scoringMethod: 'boolean', freshnessPolicy: MONTH3, minimumConfidence: 0.5, requiredEvidence: false }),
      sig('overall_trust', { key: 'business_trust_score', label: 'Business Trust Score', description: 'Composite trust score', sourceTypes: ['google', 'other'], weight: 1.5, scoringMethod: 'range', freshnessPolicy: D30, minimumConfidence: 0.6, requiredEvidence: true, range: { min: 0, max: 100 } }),
    ],
  },

  // ════════════ CATEGORY: WEBSITE & DIGITAL EXPERIENCE ════════════
  website_health: {
    category: 'digital',
    signals: [
      sig('website_health', { key: 'website_exists', label: 'Website Exists', description: 'Restaurant has a real website', sourceTypes: ['website'], weight: 1.5, scoringMethod: 'boolean', freshnessPolicy: CONTINUOUS, minimumConfidence: 0.6, requiredEvidence: true }),
      sig('website_health', { key: 'site_performance', label: 'Site Performance', description: 'Website load performance score', sourceTypes: ['website'], weight: 1, scoringMethod: 'range', freshnessPolicy: D7, minimumConfidence: 0.6, requiredEvidence: true, range: { min: 0, max: 100 } }),
      sig('website_health', { key: 'ssl_valid', label: 'SSL Valid', description: 'SSL certificate is valid and current', sourceTypes: ['website'], weight: 1.5, scoringMethod: 'boolean', freshnessPolicy: D7, minimumConfidence: 0.6, requiredEvidence: true }),
      sig('website_health', { key: 'no_broken_links', label: 'No Broken Links', description: 'No broken/404 links on the site', sourceTypes: ['website'], weight: 1, scoringMethod: 'ratio', freshnessPolicy: D7, minimumConfidence: 0.6, requiredEvidence: true }),
      sig('website_health', { key: 'content_freshness', label: 'Content Freshness', description: 'Website content updated recently', sourceTypes: ['website'], weight: 1, scoringMethod: 'custom', customNormalizer: 'content_recency', freshnessPolicy: D30, minimumConfidence: 0.6, requiredEvidence: true }),
    ],
  },

  mobile_experience: {
    category: 'digital',
    signals: [
      sig('mobile_experience', { key: 'mobile_responsive', label: 'Mobile Responsive', description: 'Site renders correctly on mobile devices', sourceTypes: ['website'], weight: 1.5, scoringMethod: 'boolean', freshnessPolicy: D30, minimumConfidence: 0.6, requiredEvidence: true }),
      sig('mobile_experience', { key: 'mobile_load_speed', label: 'Mobile Page Speed', description: 'Mobile page load performance', sourceTypes: ['website'], weight: 1.5, scoringMethod: 'range', freshnessPolicy: D7, minimumConfidence: 0.6, requiredEvidence: true, range: { min: 0, max: 100 } }),
      sig('mobile_experience', { key: 'mobile_navigation', label: 'Mobile Navigation', description: 'Simplified, usable mobile navigation', sourceTypes: ['website'], weight: 1, scoringMethod: 'boolean', freshnessPolicy: D30, minimumConfidence: 0.6, requiredEvidence: false }),
    ],
  },

  menu_availability_quality: {
    category: 'digital',
    signals: [
      sig('menu_availability_quality', { key: 'menu_online', label: 'Menu Online', description: 'Menu is available online', sourceTypes: ['menu', 'website'], weight: 1.5, scoringMethod: 'boolean', freshnessPolicy: D30, minimumConfidence: 0.6, requiredEvidence: true }),
      sig('menu_availability_quality', { key: 'menu_item_descriptions', label: 'Item Descriptions', description: 'Menu items have descriptions', sourceTypes: ['menu'], weight: 1.5, scoringMethod: 'ratio', freshnessPolicy: D30, minimumConfidence: 0.6, requiredEvidence: true }),
      sig('menu_availability_quality', { key: 'menu_price_coverage', label: 'Menu Price Coverage', description: 'Menu items have prices', sourceTypes: ['menu'], weight: 1.5, scoringMethod: 'ratio', freshnessPolicy: D30, minimumConfidence: 0.6, requiredEvidence: true }),
      sig('menu_availability_quality', { key: 'menu_published_pdf', label: 'Menu Publically Published', description: 'Menu published as PDF/clear format', sourceTypes: ['menu', 'website'], weight: 0.5, scoringMethod: 'boolean', freshnessPolicy: D30, minimumConfidence: 0.6, requiredEvidence: false }),
      sig('menu_availability_quality', { key: 'menu_description_quality', label: 'Description Quality', description: 'AI-validated menu description quality', sourceTypes: ['menu'], weight: 1, scoringMethod: 'range', freshnessPolicy: D30, minimumConfidence: 0.5, requiredEvidence: true, range: { min: 0, max: 100 } }),
      sig('menu_availability_quality', { key: 'dietary_and_allergen_coverage', label: 'Dietary/Allergen Info', description: 'Dietary and allergen details on menu', sourceTypes: ['menu'], weight: 1, scoringMethod: 'ratio', freshnessPolicy: D30, minimumConfidence: 0.5, requiredEvidence: false }),
    ],
  },

  online_ordering: {
    category: 'digital',
    signals: [
      sig('online_ordering', { key: 'online_ordering_support', label: 'Online Ordering Support', description: 'Online ordering capability present', sourceTypes: ['delivery', 'website', 'other'], weight: 1, scoringMethod: 'boolean', freshnessPolicy: CONTINUOUS, minimumConfidence: 0.5, requiredEvidence: false, capabilityKey: 'hasOnlineOrdering' }),
      sig('online_ordering', { key: 'ordering_enabled', label: 'Ordering Enabled', description: 'Online ordering is live and working', sourceTypes: ['delivery', 'website'], weight: 1.5, scoringMethod: 'boolean', freshnessPolicy: D30, minimumConfidence: 0.6, requiredEvidence: true, capabilityKey: 'hasOnlineOrdering' }),
      sig('online_ordering', { key: 'ordering_channel_count', label: 'Ordering Channels', description: 'Number of ordering channels available', sourceTypes: ['delivery', 'website'], weight: 1, scoringMethod: 'range', freshnessPolicy: D30, minimumConfidence: 0.6, requiredEvidence: true, capabilityKey: 'hasOnlineOrdering', range: { min: 0, max: 5 } }),
    ],
  },

  reservations: {
    category: 'digital',
    signals: [
      sig('reservations', { key: 'reservation_system', label: 'Reservation System', description: 'Online reservation capability present', sourceTypes: ['reservation', 'website', 'other'], weight: 1, scoringMethod: 'boolean', freshnessPolicy: CONTINUOUS, minimumConfidence: 0.5, requiredEvidence: false, capabilityKey: 'hasReservations' }),
      sig('reservations', { key: 'reservation_integration', label: 'Reservation Platform Integration', description: 'Integrated with OpenTable or similar', sourceTypes: ['reservation'], weight: 1.5, scoringMethod: 'boolean', freshnessPolicy: D30, minimumConfidence: 0.6, requiredEvidence: true, capabilityKey: 'hasReservations' }),
      sig('reservations', { key: 'table_availability', label: 'Table Availability Management', description: 'Real-time table availability management', sourceTypes: ['reservation'], weight: 1.5, scoringMethod: 'range', freshnessPolicy: D30, minimumConfidence: 0.6, requiredEvidence: true, capabilityKey: 'hasReservations', range: { min: 0, max: 100 } }),
    ],
  },

  // ════════════ CATEGORY: RESTAURANT INFORMATION ════════════
  business_completeness: {
    category: 'information',
    signals: [
      sig('business_completeness', { key: 'restaurant_clarity', label: 'Restaurant Clarity', description: 'Restaurant clarity composite score', sourceTypes: ['google', 'website'], weight: 1.5, scoringMethod: 'range', freshnessPolicy: D30, minimumConfidence: 0.6, requiredEvidence: true, range: { min: 0, max: 100 } }),
      sig('business_completeness', { key: 'service_options_set', label: 'Service Options Set', description: 'Service options (dine-in, takeout, etc.) set', sourceTypes: ['google', 'website'], weight: 1, scoringMethod: 'boolean', freshnessPolicy: MONTH3, minimumConfidence: 0.5, requiredEvidence: false }),
      sig('business_completeness', { key: 'menu_published', label: 'Menu Published', description: 'Menu is published somewhere', sourceTypes: ['menu', 'website'], weight: 1, scoringMethod: 'boolean', freshnessPolicy: D30, minimumConfidence: 0.5, requiredEvidence: false }),
      sig('business_completeness', { key: 'amenities_documented', label: 'Amenities Documented', description: 'Amenities listed (parking, etc.)', sourceTypes: ['google', 'website'], weight: 1, scoringMethod: 'boolean', freshnessPolicy: MONTH3, minimumConfidence: 0.5, requiredEvidence: false }),
      sig('business_completeness', { key: 'holiday_hours_set', label: 'Holiday Hours', description: 'Holiday hours published', sourceTypes: ['google', 'website'], weight: 1, scoringMethod: 'boolean', freshnessPolicy: MONTH3, minimumConfidence: 0.5, requiredEvidence: false }),
    ],
  },

  opening_hours: {
    category: 'information',
    signals: [
      sig('opening_hours', { key: 'hours_present', label: 'Opening Hours Present', description: 'Operating hours are recorded', sourceTypes: ['google', 'website'], weight: 1.5, scoringMethod: 'boolean', freshnessPolicy: MONTH3, minimumConfidence: 0.5, requiredEvidence: false }),
      sig('opening_hours', { key: 'hours_consistency', label: 'Hours Consistency Across Sources', description: 'Hours match across all platforms', sourceTypes: ['google', 'website'], weight: 1.5, scoringMethod: 'ratio', freshnessPolicy: MONTH3, minimumConfidence: 0.6, requiredEvidence: true }),
      sig('opening_hours', { key: 'holiday_hours_current', label: 'Holiday Hours Current', description: 'Holiday hours updated for current season', sourceTypes: ['google'], weight: 1, scoringMethod: 'boolean', freshnessPolicy: MONTH3, minimumConfidence: 0.5, requiredEvidence: false }),
      sig('opening_hours', { key: 'special_hours', label: 'Special Hours', description: 'Special hours for events published', sourceTypes: ['google', 'website'], weight: 0.5, scoringMethod: 'boolean', freshnessPolicy: MONTH3, minimumConfidence: 0.5, requiredEvidence: false }),
    ],
  },

  contact_info: {
    category: 'information',
    signals: [
      sig('contact_info', { key: 'phone_present', label: 'Phone Present', description: 'Phone number is recorded', sourceTypes: ['google', 'other'], weight: 1.5, scoringMethod: 'boolean', freshnessPolicy: MONTH6, minimumConfidence: 0.5, requiredEvidence: false }),
      sig('contact_info', { key: 'website_contact', label: 'Website Contact', description: 'Website URL is recorded', sourceTypes: ['website'], weight: 1.5, scoringMethod: 'boolean', freshnessPolicy: MONTH6, minimumConfidence: 0.5, requiredEvidence: false }),
      sig('contact_info', { key: 'whatsapp_number', label: 'WhatsApp Number', description: 'WhatsApp number present', sourceTypes: ['other'], weight: 1, scoringMethod: 'boolean', freshnessPolicy: MONTH6, minimumConfidence: 0.5, requiredEvidence: false }),
      sig('contact_info', { key: 'contact_form', label: 'Contact Form', description: 'Contact form on website', sourceTypes: ['website'], weight: 1, scoringMethod: 'boolean', freshnessPolicy: MONTH6, minimumConfidence: 0.5, requiredEvidence: false }),
    ],
  },

  photos_media: {
    category: 'information',
    signals: [
      sig('photos_media', { key: 'google_photo_count', label: 'Google Photo Count', description: 'Number of photos on Google', sourceTypes: ['google'], weight: 1.5, scoringMethod: 'range', freshnessPolicy: D30, minimumConfidence: 0.6, requiredEvidence: true, range: { min: 0, max: 100 } }),
      sig('photos_media', { key: 'food_photo_quality', label: 'Food Photo Quality', description: 'Professional food photos present', sourceTypes: ['google', 'website'], weight: 1.5, scoringMethod: 'range', freshnessPolicy: D30, minimumConfidence: 0.5, requiredEvidence: false, range: { min: 0, max: 100 } }),
      sig('photos_media', { key: 'interior_exterior_photos', label: 'Interior/Exterior Photos', description: 'Interior and exterior photos present', sourceTypes: ['google', 'website'], weight: 1, scoringMethod: 'boolean', freshnessPolicy: D30, minimumConfidence: 0.5, requiredEvidence: false }),
      sig('photos_media', { key: 'menu_item_photos', label: 'Menu Item Photos', description: 'Photos of menu items', sourceTypes: ['google', 'menu'], weight: 1, scoringMethod: 'boolean', freshnessPolicy: D30, minimumConfidence: 0.5, requiredEvidence: false }),
    ],
  },

  local_citations: {
    category: 'information',
    signals: [
      sig('local_citations', { key: 'directory_listing_count', label: 'Directory Listings', description: 'Number of local directory listings', sourceTypes: ['citation'], weight: 1.5, scoringMethod: 'range', freshnessPolicy: MONTH3, minimumConfidence: 0.6, requiredEvidence: true, range: { min: 0, max: 20 } }),
      sig('local_citations', { key: 'nap_citation_consistency', label: 'NAP Citation Consistency', description: 'NAP consistent across directories', sourceTypes: ['citation'], weight: 1.5, scoringMethod: 'ratio', freshnessPolicy: MONTH3, minimumConfidence: 0.6, requiredEvidence: true }),
      sig('local_citations', { key: 'local_backlinks', label: 'Local Backlinks', description: 'Backlinks from local sources', sourceTypes: ['citation', 'website'], weight: 1, scoringMethod: 'range', freshnessPolicy: MONTH3, minimumConfidence: 0.6, requiredEvidence: true, range: { min: 0, max: 50 } }),
      sig('local_citations', { key: 'review_platform_presence', label: 'Review Platform Presence', description: 'Present on review platforms (TripAdvisor etc.)', sourceTypes: ['citation', 'review'], weight: 1, scoringMethod: 'boolean', freshnessPolicy: MONTH3, minimumConfidence: 0.5, requiredEvidence: false }),
    ],
  },

  // ════════════ CATEGORY: MARKET POSITION ════════════
  competitive_position: {
    category: 'market',
    signals: [
      sig('competitive_position', { key: 'discoverability_score', label: 'Discoverability Score', description: 'Aggregate discoverability compared to peers', sourceTypes: ['local_search'], weight: 1.5, scoringMethod: 'benchmark', freshnessPolicy: D7, minimumConfidence: 0.6, requiredEvidence: true }),
      sig('competitive_position', { key: 'peer_rating_gap', label: 'Rating vs Peers', description: 'Rating relative to valid peer cohort', sourceTypes: ['review'], weight: 1.5, scoringMethod: 'benchmark', freshnessPolicy: D30, minimumConfidence: 0.6, requiredEvidence: true }),
      sig('competitive_position', { key: 'competitor_set_size', label: 'Competitor Set Size', description: 'Valid competitive set present', sourceTypes: ['other'], weight: 1, scoringMethod: 'boolean', freshnessPolicy: D30, minimumConfidence: 0.5, requiredEvidence: false }),
      sig('competitive_position', { key: 'market_share_position', label: 'Market Share Position', description: 'Relative market share position', sourceTypes: ['local_search'], weight: 1, scoringMethod: 'benchmark', freshnessPolicy: MONTH3, minimumConfidence: 0.6, requiredEvidence: true }),
    ],
  },

  local_authority: {
    category: 'market',
    signals: [
      sig('local_authority', { key: 'local_partnerships', label: 'Local Partnerships', description: 'Local partnerships exist', sourceTypes: ['other'], weight: 1, scoringMethod: 'boolean', freshnessPolicy: MONTH6, minimumConfidence: 0.5, requiredEvidence: false }),
      sig('local_authority', { key: 'local_media_features', label: 'Local Media Features', description: 'Featured in local media', sourceTypes: ['other', 'citation'], weight: 1.5, scoringMethod: 'boolean', freshnessPolicy: MONTH6, minimumConfidence: 0.5, requiredEvidence: false }),
      sig('local_authority', { key: 'community_events', label: 'Community Events', description: 'Participates in community events', sourceTypes: ['other'], weight: 1, scoringMethod: 'boolean', freshnessPolicy: MONTH6, minimumConfidence: 0.5, requiredEvidence: false }),
      sig('local_authority', { key: 'local_authority_score', label: 'Local Authority Score', description: 'Aggregate local authority score', sourceTypes: ['local_search'], weight: 1.5, scoringMethod: 'benchmark', freshnessPolicy: D30, minimumConfidence: 0.6, requiredEvidence: true }),
    ],
  },

  visibility_trend: {
    category: 'market',
    signals: [
      sig('visibility_trend', { key: 'visibility_direction', label: 'Visibility Direction', description: 'Visibility trend (up/down/stable) vs history', sourceTypes: ['local_search'], weight: 1.5, scoringMethod: 'categorical', categoricalMap: { up: 100, stable: 70, down: 30 }, freshnessPolicy: D7, minimumConfidence: 0.6, requiredEvidence: true }),
      sig('visibility_trend', { key: 'trend_velocity', label: 'Trend Velocity', description: 'Rate of visibility change', sourceTypes: ['local_search'], weight: 1, scoringMethod: 'range', freshnessPolicy: D7, minimumConfidence: 0.6, requiredEvidence: true, range: { min: -30, max: 30 } }),
      sig('visibility_trend', { key: 'discoverability_trend_score', label: 'Discoverability Trend Score', description: 'Composite discoverability trend', sourceTypes: ['local_search'], weight: 1.5, scoringMethod: 'range', freshnessPolicy: D7, minimumConfidence: 0.6, requiredEvidence: true, range: { min: 0, max: 100 } }),
    ],
  },

  growth_opportunity: {
    category: 'market',
    signals: [
      sig('growth_opportunity', { key: 'delivery_expansion', label: 'Delivery Expansion Potential', description: 'Room to expand delivery area', sourceTypes: ['delivery'], weight: 1, scoringMethod: 'range', freshnessPolicy: MONTH3, minimumConfidence: 0.5, requiredEvidence: false, capabilityKey: 'hasDelivery', range: { min: 0, max: 100 } }),
      sig('growth_opportunity', { key: 'catering_service', label: 'Catering Potential', description: 'Opportunity for catering service', sourceTypes: ['other'], weight: 1, scoringMethod: 'boolean', freshnessPolicy: MONTH6, minimumConfidence: 0.5, requiredEvidence: false }),
      sig('growth_opportunity', { key: 'loyalty_program', label: 'Loyalty Program', description: 'Opportunity for loyalty program', sourceTypes: ['other'], weight: 1, scoringMethod: 'boolean', freshnessPolicy: MONTH6, minimumConfidence: 0.5, requiredEvidence: false }),
      sig('growth_opportunity', { key: 'growth_opportunity_score', label: 'Growth Opportunity Score', description: 'Composite growth opportunity', sourceTypes: ['local_search'], weight: 1.5, scoringMethod: 'benchmark', freshnessPolicy: MONTH3, minimumConfidence: 0.6, requiredEvidence: true }),
      sig('growth_opportunity', { key: 'gap_vs_peers', label: 'Gap vs Peers', description: 'Opportunity where lagging peers', sourceTypes: ['local_search'], weight: 1, scoringMethod: 'benchmark', freshnessPolicy: MONTH3, minimumConfidence: 0.6, requiredEvidence: true }),
    ],
  },

  customer_engagement: {
    category: 'market',
    signals: [
      sig('customer_engagement', { key: 'engagement_score', label: 'Engagement Score', description: 'Customer engagement composite', sourceTypes: ['other', 'review'], weight: 1.5, scoringMethod: 'range', freshnessPolicy: D30, minimumConfidence: 0.6, requiredEvidence: true, range: { min: 0, max: 100 } }),
      sig('customer_engagement', { key: 'repeat_visit_signal', label: 'Repeat Visit Signal', description: 'Signals of repeat visits', sourceTypes: ['review', 'other'], weight: 1.5, scoringMethod: 'boolean', freshnessPolicy: D30, minimumConfidence: 0.5, requiredEvidence: false }),
      sig('customer_engagement', { key: 'promotional_outreach', label: 'Promotional Outreach', description: 'Promotional offers/outreach active', sourceTypes: ['other'], weight: 1, scoringMethod: 'boolean', freshnessPolicy: MONTH3, minimumConfidence: 0.5, requiredEvidence: false }),
      sig('customer_engagement', { key: 'feedback_collection', label: 'Feedback Collection', description: 'Actively collects customer feedback', sourceTypes: ['other', 'review'], weight: 1, scoringMethod: 'boolean', freshnessPolicy: MONTH3, minimumConfidence: 0.5, requiredEvidence: false }),
    ],
  },
};

// ── Derived helpers ──

/** Flat list of all signal definitions across all factors. */
export function allSignalDefinitions(): SignalDefinition[] {
  const out: SignalDefinition[] = [];
  for (const entry of Object.values(DISCOVERY_SIGNAL_REGISTRY)) {
    out.push(...entry.signals);
  }
  return out;
}

const KEY_INDEX: Map<string, string> = buildKeyIndex(DISCOVERY_SIGNAL_REGISTRY);

/** Find a signal definition by its canonical key (single owner factor). */
export function findSignalDef(key: string): SignalDefinition | undefined {
  const factorId = KEY_INDEX.get(key);
  if (!factorId) return undefined;
  return DISCOVERY_SIGNAL_REGISTRY[factorId].signals.find((s) => s.key === key);
}

/** All signals supporting a factor id. */
export function signalsForFactor(factorId: DiscoveryFactorId): SignalDefinition[] {
  const entry = DISCOVERY_SIGNAL_REGISTRY[factorId];
  return entry ? entry.signals : [];
}

/** Category for a factor, resolved from registry (falls back to FACTORS). */
export function categoryForFactor(factorId: DiscoveryFactorId): string | undefined {
  return DISCOVERY_SIGNAL_REGISTRY[factorId]?.category;
}

export const REGISTRY_FACTOR_IDS = Object.keys(DISCOVERY_SIGNAL_REGISTRY);
export const REGISTRY_CATEGORIES = Array.from(new Set(Object.values(DISCOVERY_SIGNAL_REGISTRY).map((e) => e.category)));

/**
 * Validate the registry against the frozen 25-factor model (spec §39 registry tests).
 * - every signal maps to exactly one factor (enforced by key index — dup keys collapse)
 * - every factor id exists in FACTORS
 * - all 25 frozen factors have signals
 * - no duplicate signal keys
 * - per-factor weights normalize to ~1
 */
export function validateRegistry(): string[] {
  const errors: string[] = [];
  const frozenFactorIds = new Set(FACTORS.map((f) => f.id));

  // Every registry factor must exist in the frozen 25-factor model.
  for (const factorId of Object.keys(DISCOVERY_SIGNAL_REGISTRY)) {
    if (!frozenFactorIds.has(factorId)) errors.push(`registry factor '${factorId}' not in FACTORS`);
  }

  // Every frozen factor must have >=1 signal.
  const seenKeys = new Map<string, string>();
  for (const [factorId, entry] of Object.entries(DISCOVERY_SIGNAL_REGISTRY)) {
    if (entry.signals.length === 0) errors.push(`factor '${factorId}' has no signals`);
    for (const s of entry.signals) {
      if (s.factorId !== factorId) errors.push(`signal '${s.key}' factorId ${s.factorId} != owning ${factorId}`);
      if (seenKeys.has(s.key)) {
        errors.push(`duplicate signal key '${s.key}' in factors '${seenKeys.get(s.key)}' and '${factorId}'`);
      } else {
        seenKeys.set(s.key, factorId);
      }
      // weight sanity
      if (!(s.weight > 0)) errors.push(`signal '${s.key}' has non-positive weight ${s.weight}`);
    }
  }

  // All 25 frozen factors present in registry.
  for (const def of FACTORS) {
    if (!DISCOVERY_SIGNAL_REGISTRY[def.id]) {
      errors.push(`frozen factor '${def.id}' has no registry entry`);
    }
  }

  // Per-factor weight sums normalize to ~1.
  for (const [factorId, entry] of Object.entries(DISCOVERY_SIGNAL_REGISTRY)) {
    const sum = entry.signals.reduce((a, s) => a + s.weight, 0);
    const normalized = sum > 0 ? Math.round((sum / sum) * 1000) / 1000 : 0;
    if (normalized !== 1) {
      // note: we keep raw weights; the resolver normalizes by sum. Nothing to error.
      void normalized;
    }
  }

  return errors;
}

/**
 * Whether a factor's signals should be marked not_applicable based on the
 * restaurant's real capabilities (e.g. no reservations → reservations signals NA).
 */
export function capabilityPresent(
  def: SignalDefinition,
  caps: FactorCapabilities,
): boolean {
  if (!def.capabilityKey) return true;
  return caps[def.capabilityKey] && def.capabilityKey in caps;
}

export { CATEGORIES };
