// ── Evidence-grounded enrichment unit tests ──
// Verifies the honesty contract: challenge/noise pages are NEVER enriched from,
// while real, high-confidence, non-challenge pages ARE — and only real,
// verifiable signals (phone, own-website, cuisine, hours-presence) are persisted.

import { describe, it, expect } from 'vitest';
import {
  isChallengePage,
  extractPhoneFromHtml,
  detectCuisinesFromHtml,
  detectOpenHoursFromHtml,
  determineEnrichment,
  looksLikeOwnRestaurant,
  hasRealContent,
  type EnrichmentCandidate,
  type ExistingProfile,
} from './evidenceEnrichment';

const REAL_PAGE_HTML = `
<html><head><title>The Mill Raleigh | 3201 Edwards Mill Rd, Raleigh NC</title></head>
<body>
  <p>Welcome to The Mill Raleigh. We serve steaks, burgers, and pasta.</p>
  <p>Call us at (984) 218-1558 or 919-555-0134.</p>
  <p>Hours: Monday 11:30 AM - 9:00 PM, Tuesday 11:30 AM - 10:00 PM</p>
</body></html>
`;

const CHALLENGE_HTML = `
<html><head><title>Just a moment...</title></head>
<body><div>Enable JavaScript and cookies to continue. Cloudflare Ray ID: 123</div>
<p>Monday 11:00 AM (984) 218-1558 burger</p></body></html>
`;

const EMPTY_PROFILE: ExistingProfile = { website: null, phone: null, cuisineTypes: '[]', timings: null };

function realCandidate(overrides: Partial<EnrichmentCandidate> = {}): EnrichmentCandidate {
  return {
    sourceUrl: 'https://themillraleigh.com/',
    sourceType: 'website',
    confidence: 0.78,
    title: 'The Mill Raleigh | Restaurant & Hours',
    html: REAL_PAGE_HTML,
    ...overrides,
  };
}

function challengeCandidate(overrides: Partial<EnrichmentCandidate> = {}): EnrichmentCandidate {
  return {
    sourceUrl: 'https://themillraleigh.com/',
    sourceType: 'website',
    confidence: 0.78,
    title: 'Just a moment...',
    html: CHALLENGE_HTML,
    ...overrides,
  };
}

describe('isChallengePage', () => {
  it('flags Cloudflare / Just a moment interstitials as challenge pages', () => {
    expect(isChallengePage('Just a moment...', CHALLENGE_HTML)).toBe(true);
    expect(isChallengePage('Attention Required! | Cloudflare', '')).toBe(true);
    expect(isChallengePage('403 Forbidden', '')).toBe(true);
  });

  it('does NOT flag a real restaurant page', () => {
    expect(isChallengePage('The Mill Raleigh | Hours', REAL_PAGE_HTML)).toBe(false);
  });
});

describe('extractPhoneFromHtml', () => {
  it('extracts a (XXX) XXX-XXXX phone from a real page', () => {
    expect(extractPhoneFromHtml(REAL_PAGE_HTML)).toBe('(984) 218-1558');
  });
});

describe('looksLikeOwnRestaurant', () => {
  it('accepts a restaurant-named own-site page', () => {
    expect(looksLikeOwnRestaurant('https://www.themillraleigh.com/', 'website', 'The Mill Raleigh | Hours', 'The Mill Raleigh')).toBe(true);
  });
  it('rejects directory / aggregator / share pages', () => {
    expect(looksLikeOwnRestaurant('https://usarestaurants.info/explore/the-mill-raleigh.htm', 'website', 'The Mill Raleigh', 'The Mill Raleigh')).toBe(false);
    expect(looksLikeOwnRestaurant('https://share.google/themill', 'google_share', 'The Mill Raleigh', 'The Mill Raleigh')).toBe(false);
    expect(looksLikeOwnRestaurant('https://www.chamberofcommerce.com/.../the-mill-raleigh', 'listing_page', 'The Mill Raleigh', 'The Mill Raleigh')).toBe(false);
  });
  it('rejects a page whose title does not actually mention the restaurant', () => {
    expect(looksLikeOwnRestaurant('https://somegeneric.com/', 'website', 'Generic Aggregator Homepage', 'The Mill Raleigh')).toBe(false);
  });
});

describe('detectCuisinesFromHtml', () => {
  it('detects conservative cuisine set from real keywords', () => {
    const cuisines = detectCuisinesFromHtml(REAL_PAGE_HTML);
    expect(cuisines).toContain('American'); // steak/burger
    expect(cuisines).toContain('Italian');  // pasta
  });
  it('returns empty for a page with no cuisine keywords', () => {
    expect(detectCuisinesFromHtml('<p>Contact us: hello@example.com</p>')).toEqual([]);
  });
});

describe('determineEnrichment', () => {
  it('extracts real signals from a high-confidence non-challenge page', () => {
    const result = determineEnrichment([realCandidate()], 'The Mill Raleigh', EMPTY_PROFILE);
    expect(result.website).toBe('https://themillraleigh.com/');
    expect(result.phone).toBe('(984) 218-1558');
    expect(result.cuisineTypes).toContain('American');
    expect(result.timings?.openingHoursPresent).toBe(true);
  });

  it('NEVER extracts from a challenge page, even when confidence is high', () => {
    const result = determineEnrichment([challengeCandidate()], 'The Mill Raleigh', EMPTY_PROFILE);
    expect(result).toEqual({});
  });

  it('returns empty when ALL records are challenge/noise', () => {
    const result = determineEnrichment(
      [challengeCandidate(), realCandidate({ html: CHALLENGE_HTML, title: 'Just a moment...' })],
      'The Mill Raleigh',
      EMPTY_PROFILE,
    );
    expect(result).toEqual({});
  });

  it('never overwrites existing real profile values', () => {
    const existing: ExistingProfile = { website: 'https://existing.com', phone: '(000) 000-0000', cuisineTypes: '["Mexican"]', timings: '{"openHours":"existing"}' };
    const result = determineEnrichment([realCandidate()], 'The Mill Raleigh', existing);
    expect(result).toEqual({});
  });

  it('ignores low-confidence candidates even when non-challenge', () => {
    expect(determineEnrichment([realCandidate({ confidence: 0.42 })], 'The Mill Raleigh', EMPTY_PROFILE)).toEqual({});
  });
});

describe('hasRealContent', () => {
  it('treats empty JSON array/object and whitespace as ABSENT', () => {
    expect(hasRealContent('[]')).toBe(false);
    expect(hasRealContent('{}')).toBe(false);
    expect(hasRealContent('   ')).toBe(false);
    expect(hasRealContent('')).toBe(false);
    expect(hasRealContent(null)).toBe(false);
    expect(hasRealContent(undefined)).toBe(false);
  });
  it('treats real values as present', () => {
    expect(hasRealContent('["Indian"]')).toBe(true);
    expect(hasRealContent('{"open":true}')).toBe(true);
    expect(hasRealContent('(984) 218-1558')).toBe(true);
  });
});
