// ── ScorecardService Unit Tests ──
// Tests the scorecard computation logic in isolation.

import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.hoisted ensures the mock function is created before vi.mock runs
const mockFindUnique = vi.hoisted(() => vi.fn());
const mockConnectorFindMany = vi.hoisted(() => vi.fn());
const mockMenuItemCount = vi.hoisted(() => vi.fn());
const mockReviewCount = vi.hoisted(() => vi.fn());
const mockFaqCount = vi.hoisted(() => vi.fn());
const mockSchemaCount = vi.hoisted(() => vi.fn());

vi.mock('../../config/db', () => ({
  default: {
    restaurant: {
      findUnique: mockFindUnique,
    },
    connectorScorecardData: {
      findMany: mockConnectorFindMany,
    },
    menuItem: {
      count: mockMenuItemCount,
    },
    reviewAnalysis: {
      count: mockReviewCount,
    },
    fAQ: {
      count: mockFaqCount,
    },
    sEOMarkup: {
      count: mockSchemaCount,
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
    // Bare by default: no real related data rows exist.
    mockMenuItemCount.mockResolvedValue(0);
    mockReviewCount.mockResolvedValue(0);
    mockFaqCount.mockResolvedValue(0);
    mockSchemaCount.mockResolvedValue(0);
  });

  it('should return a scorecard with 25 factors across 5 categories', async () => {
    mockFindUnique.mockResolvedValue(mockRestaurant);
    const result = await getScorecard('test-123', 'fake-token');
    expect(result).toBeDefined();
    expect(result.restaurantId).toBe('test-123');
    expect(result.restaurantName).toBe('Test Restaurant');
    expect(result.categories).toHaveLength(5);
    expect(result.totalFactors).toBe(25);
  });

  it('should compute liveFactors and pendingFactors correctly', async () => {
    mockFindUnique.mockResolvedValue(mockRestaurant);
    const result = await getScorecard('test-123', 'fake-token');
    expect(result.liveFactors).toBeGreaterThan(0);
    expect(result.pendingFactors).toBeGreaterThan(0);
    expect(result.liveFactors + result.pendingFactors).toBe(25);
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

  it('should have 5 factors in each category', async () => {
    mockFindUnique.mockResolvedValue(mockRestaurant);
    const result = await getScorecard('test-123', 'fake-token');
    for (const category of result.categories) {
      expect(category.factors).toHaveLength(5);
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

  it('should preserve merged v1.0 factors as sub-signals', async () => {
    mockFindUnique.mockResolvedValue(mockRestaurant);
    const result = await getScorecard('test-123', 'fake-token');
    const allFactors = result.categories.flatMap(c => c.factors);
    // review_volume_freshness should carry review_freshness as a sub-signal
    const rvf = allFactors.find(f => f.id === 'review_volume_freshness');
    expect(rvf).toBeDefined();
    expect(rvf!.subSignals.some(s => s.id === 'review_freshness')).toBe(true);
    // overall_trust should carry social_presence
    const trust = allFactors.find(f => f.id === 'overall_trust');
    expect(trust).toBeDefined();
    expect(trust!.subSignals.some(s => s.id === 'social_presence')).toBe(true);
  });

  it('should keep AI Visibility pending without real evidence', async () => {
    mockFindUnique.mockResolvedValue(mockRestaurant);
    mockConnectorFindMany.mockResolvedValue([]);
    const result = await getScorecard('test-123', 'fake-token');
    const allFactors = result.categories.flatMap(c => c.factors);
    const ai = allFactors.find(f => f.id === 'ai_visibility');
    expect(ai).toBeDefined();
    expect(ai!.score).toBeNull();
    expect(ai!.status).toBe('pending_observation');
  });

  it('should surface a live AI Visibility score when connector evidence exists', async () => {
    mockFindUnique.mockResolvedValue(mockRestaurant);
    mockConnectorFindMany.mockResolvedValue([
      { factorId: 'ai_visibility_score', score: 82, confidence: 0.85, evidence: JSON.stringify(['AI search snippet found']) },
    ]);
    const result = await getScorecard('test-123', 'fake-token');
    const allFactors = result.categories.flatMap(c => c.factors);
    const ai = allFactors.find(f => f.id === 'ai_visibility');
    expect(ai).toBeDefined();
    expect(ai!.score).toBe(82);
    expect(ai!.status).toBe('excellent');
  });

  // RIST-RDI-002 pending-state honesty:
  // A freshly-created real restaurant with NO real evidence (score columns at
  // Prisma defaults, no menuItems/reviews/faqs/schemas, no connector data)
  // must report ALL 25 factors as Pending Observation — never fabricated
  // scores from default-0/default-70 columns.
  it('should show all 25 factors as pending for a bare restaurant with no real evidence', async () => {
    const bareRestaurant = {
      id: 'bare-123',
      name: 'Bare Restaurant',
      address: '', // no real address
      city: 'Pune',
      cuisineTypes: '', // no cuisines
      // All score columns at Prisma defaults:
      gbpHealthScore: 70,             // default is 70
      localSearchScore: 0,
      aiVisibilityScore: 0,
      menuDiscoverabilityScore: 0,
      conversationalSearchScore: 0,
      restaurantClarityScore: 0,
      discoverabilityScore: 0,
      phone: null,
      website: null,
      disabled: false,
    };
    mockFindUnique.mockResolvedValue(bareRestaurant);
    mockConnectorFindMany.mockResolvedValue([]);
    mockMenuItemCount.mockResolvedValue(0);
    mockReviewCount.mockResolvedValue(0);
    mockFaqCount.mockResolvedValue(0);
    mockSchemaCount.mockResolvedValue(0);

    const result = await getScorecard('bare-123', 'fake-token');

    // No live factors, no fabricated overall/category scores.
    expect(result.liveFactors).toBe(0);
    expect(result.pendingFactors).toBe(25);
    expect(result.totalFactors).toBe(25);
    expect(result.overallScore).toBeNull();
    expect(result.overallStatus).toBe('pending_observation');

    // Every factor and category stays pending.
    const allFactors = result.categories.flatMap(c => c.factors);
    expect(allFactors).toHaveLength(25);
    for (const f of allFactors) {
      expect(f.score).toBeNull();
      expect(f.status).toBe('pending_observation');
    }
    for (const category of result.categories) {
      expect(category.score).toBeNull();
      expect(category.pendingCount).toBe(5);
    }
  });

  // Guard: a restaurant with genuinely populated (non-default) score columns
  // must still score live even when no related rows exist — the honesty gate
  // must only suppress default-0/default-70 columns, never measured values.
  it('should keep populated non-default score columns live even without related rows', async () => {
    mockFindUnique.mockResolvedValue(mockRestaurant); // non-default scores (75/80/…)
    mockConnectorFindMany.mockResolvedValue([]);
    mockMenuItemCount.mockResolvedValue(0);
    mockReviewCount.mockResolvedValue(0);
    mockFaqCount.mockResolvedValue(0);
    mockSchemaCount.mockResolvedValue(0);

    const result = await getScorecard('test-123', 'fake-token');
    expect(result.liveFactors).toBeGreaterThan(0);
    expect(result.overallScore).not.toBeNull();
  });

  // RIST-RDI-002 residual honesty fix: an empty JSON array/object string
  // ('[]' / '{}') or whitespace-only string must be treated as ABSENT, so the
  // Google Business Profile / business_categories factor stays Pending rather
  // than scoring 65 on a bare restaurant with no real cuisine data.
  it('should treat empty JSON-array cuisineTypes as pending for business_categories', async () => {
    const bareWithEmptyArray = {
      ...mockRestaurant,
      cuisineTypes: '[]', // empty JSON array — truthy string but NO real cuisines
      address: '   ',      // whitespace-only address
      phone: '[]',         // empty JSON array, not a real phone
      website: null,
      // Non-default score columns so only the string-column gates are under test.
      gbpHealthScore: 75,
      localSearchScore: 80,
      aiVisibilityScore: 70,
      menuDiscoverabilityScore: 65,
      conversationalSearchScore: 60,
      restaurantClarityScore: 85,
      discoverabilityScore: 72,
    };
    mockFindUnique.mockResolvedValue(bareWithEmptyArray);
    mockConnectorFindMany.mockResolvedValue([]);
    mockMenuItemCount.mockResolvedValue(0);
    mockReviewCount.mockResolvedValue(0);
    mockFaqCount.mockResolvedValue(0);
    mockSchemaCount.mockResolvedValue(0);

    const result = await getScorecard('test-123', 'fake-token');
    const allFactors = result.categories.flatMap(c => c.factors);

    // Empty '[]' cuisineTypes must NOT yield a 65 for the GBP categories factor.
    const gbp = allFactors.find(f => f.subSignals.some(s => s.id === 'business_categories'));
    const bcSub = gbp?.subSignals.find(s => s.id === 'business_categories');
    expect(bcSub).toBeDefined();
    expect(bcSub!.score).toBeNull();
    expect(bcSub!.status).toBe('pending_observation');
  });

  it('should score business_categories live with non-empty cuisine data', async () => {
    // Non-empty cuisine array must still score 65 (factor/formulas unchanged).
    mockFindUnique.mockResolvedValue(mockRestaurant); // cuisineTypes: '["Indian","Chinese"]'
    mockConnectorFindMany.mockResolvedValue([]);
    mockMenuItemCount.mockResolvedValue(0);
    mockReviewCount.mockResolvedValue(0);
    mockFaqCount.mockResolvedValue(0);
    mockSchemaCount.mockResolvedValue(0);

    const result = await getScorecard('test-123', 'fake-token');
    const allFactors = result.categories.flatMap(c => c.factors);
    const gbp = allFactors.find(f => f.subSignals?.some(s => s.id === 'business_categories'));
    const bcSub = gbp?.subSignals.find(s => s.id === 'business_categories');
    expect(bcSub).toBeDefined();
    expect(bcSub!.score).toBe(65);
  });
});
