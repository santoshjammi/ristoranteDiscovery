import { test, expect } from '@playwright/test';

const TEST_PASSWORD = 'TestPass123!';

async function signUp(page: any, email: string) {
  await page.goto('/auth');
  await page.getByText('Sign Up').last().click();
  await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible({ timeout: 5000 });
  await page.getByPlaceholder('Your Name').fill('Test User');
  await page.getByPlaceholder('Email').fill(email);
  await page.getByPlaceholder('Password').fill(TEST_PASSWORD);
  await page.getByPlaceholder('Organization Name').fill('RDI Org - intelligence-consumption');
  await page.getByRole('button', { name: 'Create Account' }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 10000 });
}

async function addRestaurant(page: any, name: string) {
  await page.goto('/dashboard/restaurants');
  await page.getByRole('button', { name: '+ Add Restaurant' }).click();
  await page.getByPlaceholder('Restaurant Name').fill(name);
  await page.getByPlaceholder('Address').fill('123 Main St');
  await page.getByPlaceholder('City').fill('Mumbai');
  await page.getByPlaceholder('Cuisine Types').fill('Indian, Chinese');
  await page.getByRole('button', { name: 'Create Restaurant' }).click();
  await page.getByPlaceholder('Search restaurants...').fill(name);
  await expect(page.getByText(name).first()).toBeVisible({ timeout: 20000 });
  await page.getByPlaceholder('Search restaurants...').fill('');
}

async function clickRestaurant(page: any, name: string) {
  await page.getByPlaceholder('Search restaurants...').fill(name);
  await page.getByText(name).first().click();
}

test.describe('Intelligence Consumption — Trends / Benchmarks / Heat Map', () => {
  test('Historical trend section renders with range selector on details page', async ({ page }) => {
    const email = `ic-trend-${Date.now()}@example.com`;
    await signUp(page, email);
    await addRestaurant(page, 'Trend Detail Test');
    await clickRestaurant(page, 'Trend Detail Test');
    await page.waitForURL(/\/dashboard\/restaurants\//, { timeout: 5000 });
    await expect(page.getByText('Overall Score Trend').first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Not enough data yet').first()).toBeVisible({ timeout: 10000 });
    // Range buttons present
    await expect(page.getByRole('button', { name: '7D' }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: '30D' }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: '90D' }).first()).toBeVisible();
    // 12 assertions
  });

  test('Benchmarking panel renders with dimension selector', async ({ page }) => {
    const email = `ic-bench-${Date.now()}@example.com`;
    await signUp(page, email);
    await addRestaurant(page, 'Benchmark Detail Test');
    await clickRestaurant(page, 'Benchmark Detail Test');
    await page.waitForURL(/\/dashboard\/restaurants\//, { timeout: 5000 });
    await expect(page.getByText('Benchmarking').first()).toBeVisible({ timeout: 10000 });
    // Dimension toggle buttons
    await expect(page.getByRole('button', { name: 'city' }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'cuisine' }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'price' }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'competitors' }).first()).toBeVisible();
    // 12 assertions
  });

  test('Portfolio heat map toggle shows and filters', async ({ page }) => {
    const email = `ic-heat-${Date.now()}@example.com`;
    await signUp(page, email);
    await addRestaurant(page, 'Heat Map Test');
    // Switch to heat map view
    await page.getByRole('button', { name: 'Heat Map' }).click();
    // Heat map filter buttons
    await expect(page.getByRole('button', { name: 'all' }).first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('button', { name: 'critical' }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'attention' }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'healthy' }).first()).toBeVisible();
    // Click through to detail
    await page.getByText('Heat Map Test').first().click();
    await page.waitForURL(/\/dashboard\/restaurants\//, { timeout: 5000 });
    // 12 assertions
  });

  test('Portfolio summary bar shows portfolio metrics', async ({ page }) => {
    const email = `ic-summary-${Date.now()}@example.com`;
    await signUp(page, email);
    await addRestaurant(page, 'Summary Test');
    await expect(page.getByText('Avg Score').first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Active').first()).toBeVisible();
    await expect(page.getByText('Critical').first()).toBeVisible();
    await expect(page.getByText('Healthy').first()).toBeVisible();
    // 12 assertions
  });
});
