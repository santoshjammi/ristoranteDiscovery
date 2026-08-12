// ── API Integration Tests ──
// Single sequential test to avoid Vitest parallel execution issues.
// Tests all major API endpoints via supertest against the Express app.

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';

// Mock the AI service so AI-backed endpoints (e.g. SEO audit) return
// deterministically instead of blocking on an unreachable LLM backend.
vi.mock('../../services/ai.service', () => ({
  aiService: {
    generateJSON: vi.fn().mockResolvedValue({
      scorecard: { photoCompleteness: 80, descriptionCompleteness: 70, hoursCompleteness: 90, overallScore: 78 },
      neighborhoods: ['Neighborhood A'],
      landmarks: ['Landmark A'],
      keywordOpportunities: ['best italian in city'],
      actionItems: [{ task: 'Update description', priority: 'High', impact: 'Improves visibility' }],
    }),
  },
}));

let app: any;
const prisma = new PrismaClient();

const ADMIN_EMAIL = 'admin@ristorante.app';
const ADMIN_PASS = 'admin123';
const TEST_EMAIL = `int-test-${Date.now()}@example.com`;
const TEST_PASS = 'TestPass123!';
const TEST_ORG = 'Integration Test Org';

beforeAll(async () => {
  app = (await import('../../index')).default;
}, 15000);

describe('API Integration', () => {
  let adminToken = '';
  let userToken = '';
  let restaurantId = '';
  let orgId = '';

  it('runs all API endpoint tests sequentially', { timeout: 60000 }, async () => {
    // ── Health ──
    let res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');

    // ── Auth: signin admin ──
    res = await request(app)
      .post('/api/auth/signin')
      .send({ email: ADMIN_EMAIL, password: ADMIN_PASS });
    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeTruthy();
    adminToken = res.body.data.token;

    // ── Auth: wrong password ──
    res = await request(app)
      .post('/api/auth/signin')
      .send({ email: ADMIN_EMAIL, password: 'wrongpassword' });
    expect(res.status).toBe(401);

    // ── Auth: signup ──
    res = await request(app)
      .post('/api/auth/signup')
      .send({ email: TEST_EMAIL, password: TEST_PASS, name: 'Test User' });
    expect(res.status).toBe(201);
    expect(res.body.data.token).toBeTruthy();
    userToken = res.body.data.token;

    // ── Auth: duplicate email ──
    res = await request(app)
      .post('/api/auth/signup')
      .send({ email: TEST_EMAIL, password: TEST_PASS, name: 'Test User' });
    expect(res.status).toBe(400); // Controller returns 400 for duplicate email

    // ── Auth: profile ──
    res = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(TEST_EMAIL);

    // ── Auth: no token ──
    res = await request(app).get('/api/auth/profile');
    expect(res.status).toBe(401);

    // ── Organizations: create one for the test user ──
    res = await request(app)
      .post('/api/organizations')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: TEST_ORG });
    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe(TEST_ORG);

    // ── Organizations: list ──
    res = await request(app)
      .get('/api/organizations')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    orgId = res.body.data[0].id;

    // ── Organizations: get by id ──
    res = await request(app)
      .get(`/api/organizations/${orgId}`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(orgId);
    expect(res.body.data.name).toBe(TEST_ORG);

    // ── Organizations: members ──
    res = await request(app)
      .get(`/api/organizations/${orgId}/members`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].role).toBe('admin');

    // ── Organizations: invitations (unknown user) ──
    res = await request(app)
      .post(`/api/organizations/${orgId}/invitations`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ email: 'nobody@example.com', role: 'member' });
    expect(res.status).toBe(404);
    expect(res.body.error).toContain('User not found');

    // ── Organizations: create ──
    res = await request(app)
      .post('/api/organizations')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Second Org' });
    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Second Org');

    // ── Restaurants: create ──
    res = await request(app)
      .post('/api/restaurants')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Integration Test Restaurant', address: '456 Test Ave', city: 'Mumbai', cuisineTypes: ['Indian', 'Chinese'] });
    expect(res.status).toBe(201);
    expect(res.body).toBeDefined();
    restaurantId = res.body.id || res.body._id;

    // ── Restaurants: validation ──
    res = await request(app)
      .post('/api/restaurants')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Incomplete' });
    expect(res.status).toBe(400);

    // ── Restaurants: list ──
    res = await request(app)
      .get('/api/restaurants')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);

    // ── Restaurants: get by id ──
    res = await request(app)
      .get(`/api/restaurants/${restaurantId}`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    // getDetails returns the serialized restaurant directly (not wrapped in {data: ...})
    expect(res.body.name).toBe('Integration Test Restaurant');

    // ── Scorecard ──
    res = await request(app)
      .get(`/api/restaurants/${restaurantId}/scorecard`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.restaurantId).toBe(restaurantId);
    expect(res.body.data.categories).toHaveLength(5);
    expect(res.body.data.totalFactors).toBe(30);

    // ── Restaurants: disable toggle ──
    res = await request(app)
      .patch(`/api/restaurants/${restaurantId}/disable`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.disabled).toBe(true);
    res = await request(app)
      .patch(`/api/restaurants/${restaurantId}/disable`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.disabled).toBe(false);

    // ── Restaurants: delete ──
    res = await request(app)
      .post('/api/restaurants')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'To Delete', address: '1 Del St', city: 'Delhi', cuisineTypes: ['Indian'] });
    const delId = res.body.id || res.body._id;
    res = await request(app)
      .delete(`/api/restaurants/${delId}`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);

    // ── Decisions: list (empty) ──
    res = await request(app)
      .get(`/api/restaurants/${restaurantId}/decisions`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);

    // ── Decisions: batch ──
    res = await request(app)
      .get('/api/decisions/batch?restaurantIds=nonexistent')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(0);

    // ── Analysis: create ──
    res = await request(app)
      .post(`/api/restaurants/${restaurantId}/analyze`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('completed');

    // ── Analysis: list ──
    res = await request(app)
      .get(`/api/restaurants/${restaurantId}/analyses`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);

    // ── Decision stats ──
    res = await request(app)
      .get(`/api/restaurants/${restaurantId}/decision-stats`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.total).toBeDefined();
    expect(typeof res.body.data.total).toBe('number');

    // ── Outcome stats ──
    res = await request(app)
      .get(`/api/restaurants/${restaurantId}/outcome-stats`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.total).toBeDefined();

    // ── Connect sources ──
    res = await request(app)
      .get(`/api/restaurants/${restaurantId}/connect/sources`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);

    // ── Verify status ──
    res = await request(app)
      .get(`/api/restaurants/${restaurantId}/verify/status`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();

    // ── Weekly summary ──
    res = await request(app)
      .get(`/api/restaurants/${restaurantId}/summary`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();

    // ── SEO audit ──
    res = await request(app)
      .get(`/api/seo/${restaurantId}/audit`)
      .set('Authorization', `Bearer ${userToken}`);
    expect([200, 404]).toContain(res.status);
  });
});

afterAll(async () => {
  if (TEST_EMAIL) {
    try {
      const user = await prisma.user.findUnique({ where: { email: TEST_EMAIL } });
      if (user) {
        await prisma.organizationMember.deleteMany({ where: { userId: user.id } });
        await prisma.organization.deleteMany({ where: { ownerId: user.id } });
        await prisma.user.delete({ where: { id: user.id } });
      }
    } catch {}
  }
  await prisma.$disconnect();
});
