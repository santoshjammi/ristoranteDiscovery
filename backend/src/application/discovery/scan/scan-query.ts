// ── Per-scan-type discovery query builder (RIST-RDI-006) ──
// Given a restaurant's name/address/city (+ seeds), return the list of search
// queries to run FOR EACH scan type. Seed URLs (website / menuUrl /
// googleShareUrl) are surfaced as-is for their matching scan type.

import type { ScanType } from './scan-types';
import { classifySourceType } from './scan-types';

export interface ScanInput {
  name?: string;
  address?: string;
  city?: string;
  website?: string;
  menuUrl?: string;
  googleShareUrl?: string;
}

const MENU_KEYWORDS = ['menu', 'dosa', 'biryani', 'curry', 'tikka', 'thali', 'naan', 'starters', 'appetizers', 'specials'];
const REVIEW_KEYWORDS = ['reviews', 'rating', 'tripadvisor', 'best', 'must try'];

function norm(s?: string): string {
  return (s ?? '').trim().replace(/\s+/g, ' ');
}

function base(input: ScanInput): string {
  return [input.name, input.city, input.address].map(norm).filter(Boolean).join(' ').trim();
}

/** Per-scan-type discovery queries. Each type has its own focused intent. */
export function buildScanTypeQueries(type: ScanType, input: ScanInput): string[] {
  const b = base(input);
  const name = norm(input.name);
  const city = norm(input.city);
  const queries: string[] = [];

  switch (type) {
    case 'google_business_profile':
      queries.push(
        [b, 'google business profile'].filter(Boolean).join(' ').trim(),
        [b, 'google maps'].filter(Boolean).join(' ').trim(),
      );
      break;
    case 'website':
      queries.push(
        [b, 'official website'].filter(Boolean).join(' ').trim(),
        [name, city, 'website'].filter(Boolean).join(' ').trim(),
      );
      break;
    case 'menu':
      queries.push(
        [b, 'menu'].filter(Boolean).join(' ').trim(),
        ...MENU_KEYWORDS.slice(0, 4).map((k) => [name, city, k].filter(Boolean).join(' ').trim()),
      );
      break;
    case 'reviews':
      queries.push(
        [b, 'reviews'].filter(Boolean).join(' ').trim(),
        [name, city, 'reviews rating'].filter(Boolean).join(' ').trim(),
        ...REVIEW_KEYWORDS.slice(0, 3).map((k) => [name, city, k].filter(Boolean).join(' ').trim()),
      );
      break;
    case 'listings':
      queries.push(
        [b, 'order online'].filter(Boolean).join(' ').trim(),
        [name, city, 'zomato swiggy'].filter(Boolean).join(' ').trim(),
        [name, city, 'table booking'].filter(Boolean).join(' ').trim(),
      );
      break;
    case 'social':
      queries.push(
        [name, city, 'instagram facebook'].filter(Boolean).join(' ').trim(),
        [b, 'social media'].filter(Boolean).join(' ').trim(),
      );
      break;
    case 'ordering':
      queries.push(
        [b, 'delivery doordash grubhub ubereats'].filter(Boolean).join(' ').trim(),
        [name, city, 'delivery'].filter(Boolean).join(' ').trim(),
      );
      break;
  }

  return Array.from(new Set(queries.filter(Boolean)));
}

/**
 * Map a supplied seed URL to its scan type so seeds are attributed correctly.
 * Google share → gbp; /menu → menu; aggregator host → its type; else website.
 */
export function seedToScanType(url: string): ScanType {
  return classifySourceType(url);
}
