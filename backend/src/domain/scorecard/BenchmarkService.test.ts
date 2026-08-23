// ── BenchmarkService Unit Tests — RIST-RDI-003 §14 minimum-cohort honesty ──
// Verifies that percentiles are NOT fabricated from a tiny real peer cohort.
// When fewer than MIN_PEERS real peers contribute scores, p50/p75/p90 must be
// null (so the UI shows "Pending — insufficient comparison cohort") while the
// honest peer `count` is still persisted.

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockRestaurantFindUnique = vi.hoisted(() => vi.fn());
const mockRestaurantFindMany = vi.hoisted(() => vi.fn());
const mockCompetitiveSetFindMany = vi.hoisted(() => vi.fn());
const mockBenchmarkUpsert = vi.hoisted(() => vi.fn());

vi.mock('../../config/db', () => ({
  default: {
    restaurant: {
      findUnique: mockRestaurantFindUnique,
      findMany: mockRestaurantFindMany,
    },
    competitiveSet: {
      findMany: mockCompetitiveSetFindMany,
    },
    benchmark: {
      upsert: mockBenchmarkUpsert,
    },
  },
}));

// Mock the scorecard service so the test drives peer availability deterministically.
vi.mock('./ScorecardService', () => ({
  getScorecard: vi.fn(async (id: string) => {
    // The restaurant under test.
    if (id === 'rest-1') {
      return {
        categories: [
          {
            id: 'cat-1',
            factors: [
              { id: 'F1', score: 80, label: 'Reputation', status: 'computed' },
              { id: 'F2', score: 70, label: 'Visibility', status: 'computed' },
            ],
          },
        ],
      };
    }
    // Peers each expose the same two factor scores.
    const peerScore: Record<string, number> = { 'peer-a': 60, 'peer-b': 62, 'peer-c': 64 };
    return {
      categories: [
        {
          id: 'cat-1',
          factors: [
            { id: 'F1', score: peerScore[id] ?? 50, status: 'computed' },
            { id: 'F2', score: peerScore[id] ?? 51, status: 'computed' },
          ],
        },
      ],
    };
  }),
}));

import { computeBenchmarks, MIN_PEERS } from './BenchmarkService';

const realRestaurant = {
  id: 'rest-1',
  name: 'Real Restaurant',
  city: 'Raleigh',
  cuisineTypes: '["Indian"]',
  priceRange: '$$',
  disabled: false,
};

describe('BenchmarkService — minimum-cohort honesty guard (RIST-RDI-003 §14)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRestaurantFindUnique.mockResolvedValue(realRestaurant);
    mockCompetitiveSetFindMany.mockResolvedValue([]);
    mockBenchmarkUpsert.mockImplementation(async (args) => ({ ...args.create }));
  });

  it('returns null percentiles (Pending) when the real peer cohort is smaller than MIN_PEERS', async () => {
    // Only 2 city peers in the showcase (both real) — under the MIN_PEERS=3 floor.
    mockRestaurantFindMany.mockImplementation(async ({ where }) => {
      if ('city' in where) {
        return [{ id: 'peer-a' }, { id: 'peer-b' }];
      }
      if (where.cuisineTypes !== undefined) {
        return [{ id: 'peer-a' }, { id: 'peer-b' }];
      }
      return [];
    });

    const results = await computeBenchmarks('rest-1');
    const cityF1 = results.find((r) => r.dimension === 'city' && r.factorId === 'F1');

    // Honest cohort size is persisted (2 real peers)…
    expect(cityF1?.count).toBe(2);
    // …but percentiles are withheld — no dishonest numbers from a tiny cohort.
    expect(cityF1?.p50).toBeNull();
    expect(cityF1?.p75).toBeNull();
    expect(cityF1?.p90).toBeNull();
  });

  it('computes honest percentiles once the real peer cohort reaches MIN_PEERS', async () => {
    mockRestaurantFindMany.mockImplementation(async (args) => {
      if (args.where && 'city' in args.where) {
        return [{ id: 'peer-a' }, { id: 'peer-b' }, { id: 'peer-c' }];
      }
      return [];
    });

    const results = await computeBenchmarks('rest-1');
    const cityF1 = results.find((r) => r.dimension === 'city' && r.factorId === 'F1');

    expect(cityF1?.count).toBe(3);
    expect(cityF1?.p50).not.toBeNull();
  });

  it('never reports a dishonest cohort count (count reflects actual real peers)', async () => {
    mockRestaurantFindMany.mockResolvedValue([]); // no city peers at all
    const results = await computeBenchmarks('rest-1');
    const cityF1 = results.find((r) => r.dimension === 'city' && r.factorId === 'F1');
    expect(cityF1?.count).toBe(0);
    expect(cityF1?.p50).toBeNull();
  });
});
