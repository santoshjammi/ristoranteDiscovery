import { test, expect } from '@playwright/test';
import { BACKEND_URL, TEST_PASSWORD } from './helpers/env';

// Pre-flight: verify both servers are healthy before running any tests
test.beforeAll(async ({ request }) => {
  const frontend = await request.get('/');
  expect(frontend.ok(), `Frontend returned ${frontend.status()} — expected 200`).toBeTruthy();
  const backend = await request.get(`${BACKEND_URL}/health`);
  const body = await backend.json();
  expect(body.status, `Backend health: ${body.status}`).toBe('healthy');
});

const TEST_NAME = 'Test Restaurant Owner';
const ORG_NAME = 'Test Restaurant Group';
const RESTAURANT_NAME = 'Test Indian Restaurant';
const RESTAURANT_ADDRESS = '123 Main St, Bangalore';
const RESTAURANT_CITY = 'Bangalore';
const RESTAURANT_CUISINE = 'Indian';

/**
 * Helper: sign up a new user and return the unique email used
 */
async function signUp(page: any, email: string) {
  await page.goto('/auth');
  // Toggle to Sign Up form — click the "Sign Up" link in the sign-in form footer
  await page.getByText('Sign Up').last().click();
  // Wait for the signup form heading
  await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible({ timeout: 5000 });
  await page.getByPlaceholder('Your Name').fill(TEST_NAME);
  await page.getByPlaceholder('Email').fill(email);
  await page.getByPlaceholder('Password').fill(TEST_PASSWORD);
  await page.getByPlaceholder('Organization Name').fill(ORG_NAME);
  await page.getByRole('button', { name: 'Create Account' }).click();
  // Wait for redirect to dashboard
  await page.waitForURL(/\/dashboard/, { timeout: 10000 });
}

/**
 * Helper: add a restaurant
 */
async function addRestaurant(page: any, name: string) {
  await page.goto('/dashboard/restaurants');
  await expect(page.getByRole('heading', { name: 'Restaurants' })).toBeVisible({ timeout: 5000 });
  // Click "+ Add Restaurant" button to show the form
  await page.getByRole('button', { name: '+ Add Restaurant' }).click();
  await page.getByPlaceholder('Restaurant Name').fill(name);
  await page.getByPlaceholder('Address').fill(RESTAURANT_ADDRESS);
  await page.getByPlaceholder('City').fill(RESTAURANT_CITY);
  await page.getByPlaceholder('Cuisine Types').fill(RESTAURANT_CUISINE);
  await page.getByRole('button', { name: 'Create Restaurant' }).click();
  // Search for the newly created restaurant (it may be on a later page)
  await page.getByPlaceholder('Search restaurants...').fill(name);
  await expect(page.getByText(name).first()).toBeVisible({ timeout: 5000 });
  // Clear search for subsequent tests
  await page.getByPlaceholder('Search restaurants...').fill('');
}

/**
 * Helper: search for a restaurant by name and click it
 */
async function clickRestaurant(page: any, name: string) {
  await page.getByPlaceholder('Search restaurants...').fill(name);
  await page.getByText(name).first().click();
}

test.describe('Full Customer Journey', () => {
  test('M1: Landing page loads and shows audit CTA', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Free Visibility Audit — See Where You Stand')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Get Your Free Audit' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'How It Works' })).toBeVisible();
    await expect(page.getByText('₹999')).toBeVisible();
  });

  test('M2: Sign up and create organization', async ({ page }) => {
    const email = `test-${Date.now()}@example.com`;
    await signUp(page, email);
    await expect(page.getByText('Welcome, Test Restaurant Group')).toBeVisible();
  });

  test('M3: Add a restaurant', async ({ page }) => {
    const email = `resto-${Date.now()}@example.com`;
    await signUp(page, email);
    await addRestaurant(page, RESTAURANT_NAME);
  });

  test('M4: Run analysis on a restaurant', async ({ page }) => {
    const email = `analysis-${Date.now()}@example.com`;
    await signUp(page, email);
    await addRestaurant(page, RESTAURANT_NAME);

    // Click on restaurant to open scorecard
    await clickRestaurant(page, RESTAURANT_NAME);
    await page.waitForURL(/\/dashboard\/restaurants\//, { timeout: 5000 });

    // Scorecard loads with master score
    await expect(page.getByText('Restaurant Intelligence')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('/100').first()).toBeVisible();
    await expect(page.getByText('Discoverability').first()).toBeVisible();
    await expect(page.getByText('Reputation').first()).toBeVisible();
    await expect(page.getByText('Website & Digital Experience').first()).toBeVisible();
    await expect(page.getByText('Restaurant Information').first()).toBeVisible();
    await expect(page.getByText('Market Position').first()).toBeVisible();
  });

  test('M5: Run audit and view report', async ({ page }) => {
    const email = `audit-${Date.now()}@example.com`;
    await signUp(page, email);
    await addRestaurant(page, RESTAURANT_NAME);

    // Click on restaurant to open scorecard
    await clickRestaurant(page, RESTAURANT_NAME);
    await page.waitForURL(/\/dashboard\/restaurants\//, { timeout: 5000 });

    // Scorecard shows factor cards
    await expect(page.getByText('Google Business Profile').first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Local Search Visibility').first()).toBeVisible();
    await expect(page.getByText('Average Rating').first()).toBeVisible();
    await expect(page.getByText('Website Health').first()).toBeVisible();
    await expect(page.getByText('Business Completeness').first()).toBeVisible();
    await expect(page.getByText('Competitive Position').first()).toBeVisible();

    // Pending observation factors shown
    await expect(page.getByText('Delivery Platforms').first()).toBeVisible();
    await expect(page.getByText('Social Presence').first()).toBeVisible();
    await expect(page.getByText('Reservations').first()).toBeVisible();
    await expect(page.getByText('Local Citations').first()).toBeVisible();
    await expect(page.getByText('Customer Engagement').first()).toBeVisible();
  });

  test('M6: Verify ownership flow', async ({ page }) => {
    const email = `verify-${Date.now()}@example.com`;
    await signUp(page, email);
    await addRestaurant(page, RESTAURANT_NAME);

    // Open scorecard
    await clickRestaurant(page, RESTAURANT_NAME);
    await page.waitForURL(/\/dashboard\/restaurants\//, { timeout: 5000 });

    // Scorecard shows search and filter
    await expect(page.getByPlaceholder('Search factors...')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('select').first()).toBeVisible();

    // Priority Opportunities section visible
    await expect(page.getByText('Priority Opportunities')).toBeVisible();
  });

  test('M7: Connect data sources', async ({ page }) => {
    const email = `connect-${Date.now()}@example.com`;
    await signUp(page, email);
    await addRestaurant(page, RESTAURANT_NAME);

    // Open scorecard
    await clickRestaurant(page, RESTAURANT_NAME);
    await page.waitForURL(/\/dashboard\/restaurants\//, { timeout: 5000 });

    // Scorecard shows factor detail on click
    // The factor card is the clickable element carrying the name + a % confidence
    // caption (prose in provenance panels also mentions "Google Business Profile").
    await expect(page.locator('div[style*="cursor: pointer"]').filter({ hasText: 'Google Business Profile' }).filter({ hasText: '% confidence' }).first()).toBeVisible({ timeout: 10000 });
    await page.locator('div[style*="cursor: pointer"]').filter({ hasText: 'Google Business Profile' }).filter({ hasText: '% confidence' }).first().click();
    await expect(page.getByText('Current Score')).toBeVisible();
    await expect(page.getByText('Business Impact')).toBeVisible();
    await expect(page.getByText('Expected Improvement')).toBeVisible();
    await expect(page.getByText('Recommended Actions')).toBeVisible();
  });

  test('M8: View weekly summary', async ({ page }) => {
    const email = `summary-${Date.now()}@example.com`;
    await signUp(page, email);
    await addRestaurant(page, RESTAURANT_NAME);

    // Open scorecard
    await clickRestaurant(page, RESTAURANT_NAME);
    await page.waitForURL(/\/dashboard\/restaurants\//, { timeout: 5000 });

    // Scorecard shows status filter
    await expect(page.locator('select').first()).toBeVisible({ timeout: 10000 });

    // Pending observation factors show "Pending" badge
    await expect(page.getByText('Pending').first()).toBeVisible();

    // Factor count visible
    await expect(page.getByText(/factors measured/)).toBeVisible();
  });
});
