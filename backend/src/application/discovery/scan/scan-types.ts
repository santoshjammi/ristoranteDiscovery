// ── Scan types registry (RIST-RDI-006) ──
// Every distinct "kind" of scan a restaurant can run. Each scan type owns its
// own discovery queries, URL classifier, and category label. Adding a new scan
// type = add one entry here + (optionally) a classifier rule + query builder
// below. No controller changes needed.

export type ScanType =
  | 'google_business_profile' // Google Maps / GBP share + search listings
  | 'website'                // the restaurant's own site
  | 'menu'                   // menu pages (own site, aggregators, menu web)
  | 'reviews'                // review platforms (TripAdvisor, Yelp, Justdial, district)
  | 'listings'               // ordering + listing platforms (Zomato, Swiggy, OpenTable, UberEats)
  | 'social'                 // social profiles (Facebook, Instagram, TikTok)
  | 'ordering';              // delivery / online-order platforms (Grubhub, DoorDash, Postmates)

export const ALL_SCAN_TYPES: ScanType[] = [
  'google_business_profile',
  'website',
  'menu',
  'reviews',
  'listings',
  'social',
  'ordering',
];

export const SCAN_TYPE_LABEL: Record<ScanType, string> = {
  google_business_profile: 'Google Business Profile',
  website: 'Restaurant website',
  menu: 'Menu page',
  reviews: 'Review platform',
  listings: 'Listing platform',
  social: 'Social profile',
  ordering: 'Online ordering',
};

// Host → scan type classification. Most-specific first.
const HOST_TYPE_RULES: Array<{ re: RegExp; type: ScanType }> = [
  { re: /google\.|maps\.google|goo\.gl|googleusercontent/i, type: 'google_business_profile' },
  { re: /tripadvisor|yelp|restaurantji|district\.in|justdial/i, type: 'reviews' },
  { re: /zomato|swiggy|opentable|dineout|magicpin/i, type: 'listings' },
  { re: /grubhub|doordash|ubereats|postmates|seamless/i, type: 'ordering' },
  { re: /facebook|instagram|tiktok|linkedin/i, type: 'social' },
];

export function classifySourceType(url: string): ScanType {
  const host = hostOf(url);
  for (const rule of HOST_TYPE_RULES) {
    if (rule.re.test(host) || rule.re.test(url)) return rule.type;
  }
  // Path-based: /menu → menu.
  if (/\/menu|menu/i.test(url)) return 'menu';
  return 'website';
}

export function hostOf(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./i, ''); } catch { return url; }
}

export function isHttpUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

// ── Synthetic / placeholder markers that must NEVER be real ──
const SYNTHETIC_MARKERS = ['test', 'page', 'breadcrumb', 'probe', 'fixture', 'example.com', 'tirde-restaurant.example.com', 'sample', 'dummy'];

export function isSyntheticUrl(url: string): boolean {
  const lower = url.toLowerCase();
  return SYNTHETIC_MARKERS.some((m) => lower.includes(m));
}

// ── Noise / auth-walled URLs excluded from real evidence ──
const NOISE_URL_RE =
  /(?:\/login|\/signup|\/account|\/privacy|\/terms|\/jobs|\/careers|\/blog|\/press|\/cart|\/checkout|facebook\.com\/login|instagram\.com\/accounts|linkedin\.com\/auth|duckduckgo\.com)/i;

export function isNoiseUrl(url: string): boolean {
  return NOISE_URL_RE.test(url);
}
