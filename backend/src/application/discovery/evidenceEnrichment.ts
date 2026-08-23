// ── Evidence-grounded structured enrichment (RIST-RDI-002) ──
// Pure, deterministic helpers that extract REAL, verifiable signals from
// collected public-evidence records and persist them into the restaurant
// profile so the frozen 25-factor scorecard can honestly move factors out of
// Pending. NO fabrication, NO LLM calls, NO scorecard changes.
//
// The core honesty rule: signals are ONLY extracted from a record when that
// record (a) is high-confidence (>= 0.70) AND (b) is NOT a bot-challenge /
// interstitial / noise page. Challenge pages contain no real business content,
// so nothing is extracted from them.

export interface EnrichmentCandidate {
  sourceUrl: string;
  sourceType: string;
  confidence: number;
  title: string;
  html: string;
}

export interface EnrichmentResult {
  website?: string;
  phone?: string;
  cuisineTypes?: string[];
  timings?: { source: string; openingHoursPresent: boolean };
}

export interface ExistingProfile {
  website?: string | null;
  phone?: string | null;
  cuisineTypes?: string | null;
  timings?: string | null;
}

/**
 * Title patterns that unambiguously identify a bot-challenge / interstitial /
 * error page. The <title> is the strongest signal — a real restaurant site
 * titles itself with its name, never with these.
 */
const CHALLENGE_TITLE_RE =
  /just a moment|attention required|cloudflare|checking your browser|verify (you are|that you are a) human|unusual traffic|403 forbidden|access denied|are you a (human|robot)|denied|error 4\d\d|captcha|forbidden/i;

/**
 * True when a page's title or body indicates a bot-challenge / interstitial /
 * noise page from which no real business content can be trusted.
 *
 * Body-only heuristics deliberately avoid bare "captcha" / "robots" /
 * "cloudflare" words — legitimate pages use "recaptcha" in forms and
 * <meta name="robots"> tags, so only strong challenge phrasings count.
 */
export function isChallengePage(title: string, html: string): boolean {
  const titleLower = title.toLowerCase();
  const bodyLower = html.toLowerCase();
  if (CHALLENGE_TITLE_RE.test(titleLower)) return true;
  return (
    /just a moment[.!\s]|attention required[!\s]|checking your browser|verify you are human|verify that you are a human|access denied|unusual traffic|enable javascript and cookies to continue/.test(bodyLower)
  );
}

/** Aggregator / directory hosts that are NOT a restaurant's own website. */
const DIRECTORY_HOST_RE =
  /(usarestaurants|chamberofcommerce|findglocal|here-restaurants|restaurantguru|allmenus|restaurantji|yelp|tripadvisor|opentable|ubereats|doordash|grubhub|zomato|swiggy|mapquest|share\.google)/i;

/**
 * A "real restaurant website" must be:
 *  - NOT a challenge/interstitial,
 *  - hosted somewhere other than a directory/aggregator / share link,
 *  - actually ABOUT the restaurant (its own title contains the restaurant name).
 */
export function looksLikeOwnRestaurant(sourceUrl: string, sourceType: string, title: string, restaurantName: string): boolean {
  if (sourceType === 'google_share' || sourceType === 'social_profile') return false;
  if (sourceType === 'listing_page' || sourceType === 'menu_page') return false;
  if (/share\.google/i.test(sourceUrl)) return false;
  let host: string;
  try {
    host = new URL(sourceUrl).hostname.replace(/^www\./i, '');
  } catch {
    host = sourceUrl;
  }
  if (DIRECTORY_HOST_RE.test(host)) return false;
  const nameToken = restaurantName.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  if (nameToken.length < 3) return false;
  return title.toLowerCase().includes(nameToken);
}

const PHONE_PAREN = /\(\d{3}\)\s?\d{3}[-.]?\d{4}/;
const PHONE_FLAT = /\b\d{3}[-.]\d{3}[-.]\d{4}\b/;

/** Extract the first US phone number from raw HTML, preferring (XXX) XXX-XXXX. */
export function extractPhoneFromHtml(html: string): string | null {
  const paren = PHONE_PAREN.exec(html);
  if (paren) return paren[0];
  const flat = PHONE_FLAT.exec(html);
  if (flat) return flat[0];
  return null;
}

interface CuisineRule {
  cuisine: string;
  keywords: string[];
}

const CUISINE_RULES: CuisineRule[] = [
  { cuisine: 'Indian', keywords: ['biryani', 'dosa', 'curry', 'tikka', 'naan', 'samosa', 'paneer', 'korma', 'tandoori', 'masala', 'thali'] },
  { cuisine: 'Italian', keywords: ['pasta', 'risotto', 'gnocchi', 'bruschetta', 'tiramisu', 'carbonara', 'margherita', 'pizza'] },
  { cuisine: 'American', keywords: ['burger', 'steak', 'bbq', 'grilled', 'fries', 'hot dog', 'wings', 'waffle', 'pancake', 'ribs'] },
  { cuisine: 'Mexican', keywords: ['taco', 'quesadilla', 'enchilada', 'guacamole', 'fajita', 'burrito'] },
  { cuisine: 'Asian', keywords: ['sushi', 'ramen', 'wok', 'pad thai', 'tempura', 'pho', 'noodles', 'dim sum', 'teriyaki'] },
  { cuisine: 'Mediterranean', keywords: ['hummus', 'falafel', 'shawarma', 'gyro', 'tahini'] },
];

/**
 * Deterministically map matched cuisine keywords to a small, conservative
 * cuisine set. Only cuisines backed by at least one STRONG keyword match are
 * returned. Never fabricates a cuisine from a weak/generic signal.
 */
export function detectCuisinesFromHtml(html: string): string[] {
  const lower = html.toLowerCase();
  const found: string[] = [];
  for (const rule of CUISINE_RULES) {
    if (rule.keywords.some((k) => lower.includes(k))) {
      found.push(rule.cuisine);
    }
  }
  return found;
}

const DAY_RE = /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)\b/i;
const AMPM_RE = /\b(am|pm)\b/i;

/**
 * True if the page contains real operating-hours text (a day name AND an
 * AM/PM time). Only a truth-flag; no specific hours are ever fabricated.
 */
export function detectOpenHoursFromHtml(html: string): boolean {
  return DAY_RE.test(html) && AMPM_RE.test(html);
}

/**
 * Determine the conservative set of structured signals to persist from the
 * collected real evidence records. Only high-confidence, non-challenge records
 * are considered; existing real values on the profile are never overwritten.
 */
export function determineEnrichment(
  candidates: EnrichmentCandidate[],
  restaurantName: string,
  existing: ExistingProfile,
): EnrichmentResult {
  const real = candidates
    .filter((c) => c.confidence >= 0.70 && !isChallengePage(c.title, c.html))
    .sort((a, b) => b.confidence - a.confidence);

  if (real.length === 0) return {};

  const result: EnrichmentResult = {};

  // Website: best (highest-confidence) real own-restaurant site.
  if (!hasRealContent(existing.website)) {
    const site = real.find((c) => looksLikeOwnRestaurant(c.sourceUrl, c.sourceType, c.title, restaurantName));
    if (site) result.website = site.sourceUrl;
  }

  // Phone: first real phone from any real, high-confidence, non-challenge page.
  if (!hasRealContent(existing.phone)) {
    for (const c of real) {
      const phone = extractPhoneFromHtml(c.html);
      if (phone) {
        result.phone = phone;
        break;
      }
    }
  }

  // Cuisine: only when the profile currently has none.
  if (!hasRealContent(existing.cuisineTypes)) {
    const cuisines = detectCuisinesFromHtml(real.map((c) => c.html).join(' '));
    if (cuisines.length > 0) result.cuisineTypes = cuisines;
  }

  // Hours presence: only when the profile currently records no hours at all.
  if (!hasRealContent(existing.timings)) {
    const hoursSeen = real.some((c) => detectOpenHoursFromHtml(c.html));
    if (hoursSeen) result.timings = { source: 'evidence-hint', openingHoursPresent: true };
  }

  return result;
}

/** Same absent-content rule as the scorecard: empty / '[]' / '{}' / whitespace = absent. */
export function hasRealContent(value: unknown): boolean {
  if (typeof value !== 'string') return value != null;
  const trimmed = value.trim();
  if (trimmed.length === 0) return false;
  if (trimmed.startsWith('[')) {
    try {
      const arr = JSON.parse(trimmed);
      return Array.isArray(arr) && arr.some((item) => typeof item === 'string' && item.trim().length > 0);
    } catch {
      return false;
    }
  }
  if (trimmed.startsWith('{')) {
    try {
      const obj = JSON.parse(trimmed);
      return typeof obj === 'object' && obj !== null && Object.keys(obj).length > 0;
    } catch {
      return false;
    }
  }
  return trimmed.split(',').some((item) => item.trim().length > 0);
}
