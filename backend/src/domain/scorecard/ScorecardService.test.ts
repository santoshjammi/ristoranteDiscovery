// ── ScorecardService Unit Tests ──
// Tests the scorecard computation logic in isolation.

import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.hoisted ensures the mock function is created before vi.mock runs
const mockFindUnique = vi.hoisted(() => vi.fn());
const mockConnectorFindMany = vi.hoisted(() => vi.fn());

vi.mock('../../config/db', () => ({
  default: {
    restaurant: {
      findUnique: mockFindUnique,
    },
    connectorScorecardData: {
      findMany: mockConnectorFindMany,
    },
  },
}));

import { getScorecard } from './ScorecardService';

describe('ScorecardService', () => {
  const mockRestaurant = {
    id: 'test-123',
    name: 'Test Restaurant',
    address: '123 Main St',
    city: 'Mumbai',
    cuisineTypes: '["Indian","Chinese"]',
    gbpHealthScore: 75,
    localSearchScore: 80,
    aiVisibilityScore: 70,
    menuDiscoverabilityScore: 65,
    conversationalSearchScore: 60,
    restaurantClarityScore: 85,
    discoverabilityScore: 72,
    phone: '+911234567890',
    website: 'https://example.com',
    disabled: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockConnectorFindMany.mockResolvedValue([]);
  });

  it('should return a scorecard with 30 factors across 5 categories', async () => {
    mockFindUnique.mockResolvedValue(mockRestaurant);
    const result = await getScorecard('test-123', 'fake-token');
    expect(result).toBeDefined();
    expect(result.restaurantId).toBe('test-123');
    expect(result.restaurantName).toBe('Test Restaurant');
    expect(result.categories).toHaveLength(5);
    expect(result.totalFactors).toBe(30);
  });

  it('should compute liveFactors and pendingFactors correctly', async () => {
    mockFindUnique.mockResolvedValue(mockRestaurant);
    const result = await getScorecard('test-123', 'fake-token');
    expect(result.liveFactors).toBeGreaterThan(0);
    expect(result.pendingFactors).toBeGreaterThan(0);
    expect(result.liveFactors + result.pendingFactors).toBe(30);
  });

  it('should throw error for non-existent restaurant', async () => {
    mockFindUnique.mockResolvedValue(null);
    await expect(getScorecard('non-existent', 'fake-token')).rejects.toThrow('Restaurant not found');
  });

  it('should have correct category structure', async () => {
    mockFindUnique.mockResolvedValue(mockRestaurant);
    const result = await getScorecard('test-123', 'fake-token');
    const categoryNames = result.categories.map(c => c.name);
    expect(categoryNames).toContain('Discoverability');
    expect(categoryNames).toContain('Reputation');
    expect(categoryNames).toContain('Website & Digital Experience');
    expect(categoryNames).toContain('Restaurant Information');
    expect(categoryNames).toContain('Market Position');
  });

  it('should have 6 factors in each category', async () => {
    mockFindUnique.mockResolvedValue(mockRestaurant);
    const result = await getScorecard('test-123', 'fake-token');
    for (const category of result.categories) {
      expect(category.factors).toHaveLength(6);
    }
  });

  it('should mark factors with null scores as pending_observation', async () => {
    mockFindUnique.mockResolvedValue(mockRestaurant);
    const result = await getScorecard('test-123', 'fake-token');
    const allFactors = result.categories.flatMap(c => c.factors);
    const pendingFactors = allFactors.filter(f => f.status === 'pending_observation');
    expect(pendingFactors.length).toBeGreaterThan(0);
    for (const f of pendingFactors) {
      expect(f.score).toBeNull();
    }
  });

  it('should compute category scores as averages of live factors', async () => {
    mockFindUnique.mockResolvedValue(mockRestaurant);
    const result = await getScorecard('test-123', 'fake-token');
    for (const category of result.categories) {
      if (category.score !== null) {
        const liveScores = category.factors
          .filter(f => f.score !== null)
          .map(f => f.score as number);
        const expectedAvg = Math.round(liveScores.reduce((a, b) => a + b, 0) / liveScores.length);
        expect(category.score).toBe(expectedAvg);
      }
    }
  });

  it('should include recommendedActions for each factor', async () => {
    mockFindUnique.mockResolvedValue(mockRestaurant);
    const result = await getScorecard('test-123', 'fake-token');
    const allFactors = result.categories.flatMap(c => c.factors);
    for (const f of allFactors) {
      expect(f.recommendedActions.length).toBeGreaterThan(0);
      expect(f.businessImpact).toBeTruthy();
      expect(f.expectedImprovement).toBeTruthy();
    }
  });

  it('should have trend data for live factors', async () => {
    mockFindUnique.mockResolvedValue(mockRestaurant);
    const result = await getScorecard('test-123', 'fake-token');
    const allFactors = result.categories.flatMap(c => c.factors);
    const liveFactors = allFactors.filter(f => f.score !== null);
    for (const f of liveFactors) {
      expect(f.trend).not.toBeNull();
    }
  });

  it('should have confidence data for live factors', async () => {
    mockFindUnique.mockResolvedValue(mockRestaurant);
    const result = await getScorecard('test-123', 'fake-token');
    const allFactors = result.categories.flatMap(c => c.factors);
    const liveFactors = allFactors.filter(f => f.score !== null);
    for (const f of liveFactors) {
      expect(f.confidence).not.toBeNull();
    }
  });
});
