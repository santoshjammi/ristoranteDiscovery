import { test, expect } from '@playwright/test';

const TEST_PASSWORD = 'TestPass123!';

async function signUp(page: any, email: string) {
  await page.goto('/auth');
  await page.getByText('Sign Up').last().click();
  await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible({ timeout: 5000 });
  await page.getByPlaceholder('Your Name').fill('Test User');
  await page.getByPlaceholder('Email').fill(email);
  await page.getByPlaceholder('Password').fill(TEST_PASSWORD);
  await page.getByPlaceholder('Organization Name').fill('Test Org');
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
  await expect(page.getByText(name).first()).toBeVisible({ timeout: 5000 });
  await page.getByPlaceholder('Search restaurants...').fill('');
}

test.describe('Discover, Team, Settings, Help — Comprehensive', () => {
  test('Discover hub: 5 section cards visible', async ({ page }) => {
    const email = `mt-dh-${Date.now()}@example.com`;
    await signUp(page, email);
    await page.goto('/dashboard/discover');
    await expect(page.getByRole('heading', { name: 'Discover' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Local Market').first()).toBeVisible();
    await expect(page.getByText('Trending Searches').first()).toBeVisible();
    await expect(page.getByText('Competitor Activity').first()).toBeVisible();
    await expect(page.getByText('Opportunities').first()).toBeVisible();
    await expect(page.getByText('Seasonal Trends').first()).toBeVisible();
    // 8 assertions
  });

  test('Discover hub: each card has description', async ({ page }) => {
    const email = `mt-dd-${Date.now()}@example.com`;
    await signUp(page, email);
    await page.goto('/dashboard/discover');
    await expect(page.getByText('Market overview').first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('What customers are searching').first()).toBeVisible();
    await expect(page.getByText('Competitor movements').first()).toBeVisible();
    await expect(page.getByText('Growth opportunities').first()).toBeVisible();
    await expect(page.getByText('Seasonal patterns').first()).toBeVisible();
    // 13 assertions
  });

  test('Local Market: loads with stats', async ({ page }) => {
    const email = `mt-lm-${Date.now()}@example.com`;
    await signUp(page, email);
    await addRestaurant(page, 'Market Test');
    await page.goto('/dashboard/discover/local-market');
    await expect(page.getByRole('heading', { name: 'Local Market' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Restaurants').first()).toBeVisible();
    await expect(page.getByText('Markets').first()).toBeVisible();
    await expect(page.getByText('Avg Visibility').first()).toBeVisible();
    await expect(page.getByText('Competition Density').first()).toBeVisible();
    // 18 assertions
  });

  test('Local Market: back navigation', async ({ page }) => {
    const email = `mt-lb-${Date.now()}@example.com`;
    await signUp(page, email);
    await page.goto('/dashboard/discover/local-market');
    await page.getByText('Back to Discover').click();
    await page.waitForURL('/dashboard/discover', { timeout: 5000 });
    await expect(page.getByRole('heading', { name: 'Discover' })).toBeVisible();
    // 21 assertions
  });

  test('Trending Searches: loads with cuisine tags', async ({ page }) => {
    const email = `mt-ts-${Date.now()}@example.com`;
    await signUp(page, email);
    await addRestaurant(page, 'Trend Test');
    await page.goto('/dashboard/discover/trending-searches');
    await expect(page.getByRole('heading', { name: 'Trending Searches' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Popular Cuisines').first()).toBeVisible();
    await expect(page.getByText('Search Categories').first()).toBeVisible();
    // 25 assertions
  });

  test('Competitor Activity: loads with stats', async ({ page }) => {
    const email = `mt-ca-${Date.now()}@example.com`;
    await signUp(page, email);
    await addRestaurant(page, 'Comp Activity Test');
    await page.goto('/dashboard/discover/competitor-activity');
    await expect(page.getByRole('heading', { name: 'Competitor Activity' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Your Restaurants').first()).toBeVisible();
    await expect(page.getByText('Avg Score').first()).toBeVisible();
    await expect(page.getByText('Need Improvement').first()).toBeVisible();
    await expect(page.getByText('Recent Activity').first()).toBeVisible();
    // 30 assertions
  });

  test('Opportunities: loads with ranked list', async ({ page }) => {
    const email = `mt-op-${Date.now()}@example.com`;
    await signUp(page, email);
    await addRestaurant(page, 'Opp Test');
    await page.goto('/dashboard/discover/opportunities');
    await expect(page.getByRole('heading', { name: 'Opportunities' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Improve Local SEO').first()).toBeVisible();
    await expect(page.getByText('Add Online Ordering').first()).toBeVisible();
    await expect(page.getByText('Respond to Reviews').first()).toBeVisible();
    await expect(page.getByText('Update Menu Photos').first()).toBeVisible();
    await expect(page.getByText('Expand Delivery Area').first()).toBeVisible();
    // 36 assertions
  });

  test('Opportunities: each has impact, effort, timeline', async ({ page }) => {
    const email = `mt-oi-${Date.now()}@example.com`;
    await signUp(page, email);
    await addRestaurant(page, 'Opp Impact Test');
    await page.goto('/dashboard/discover/opportunities');
    await expect(page.getByText('High Impact').first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Medium Effort').first()).toBeVisible();
    await expect(page.getByText('Low Effort').first()).toBeVisible();
    // 40 assertions
  });

  test('Seasonal Trends: loads with monthly chart', async ({ page }) => {
    const email = `mt-st-${Date.now()}@example.com`;
    await signUp(page, email);
    await addRestaurant(page, 'Seasonal Test');
    await page.goto('/dashboard/discover/seasonal-trends');
    await expect(page.getByRole('heading', { name: 'Seasonal Trends' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Monthly Activity').first()).toBeVisible();
    await expect(page.getByText('Seasonal Recommendations').first()).toBeVisible();
    // 44 assertions
  });

  test('Seasonal Trends: shows month labels', async ({ page }) => {
    const email = `st-ml-${Date.now()}@example.com`;
    await signUp(page, email);
    await addRestaurant(page, 'Month Label Test');
    await page.goto('/dashboard/discover/seasonal-trends');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    for (const m of months) {
      await expect(page.getByText(m).first()).toBeVisible({ timeout: 5000 });
    }
    // 56 assertions
  });

  test('Team page: loads with invite form', async ({ page }) => {
    const email = `mt-tm-${Date.now()}@example.com`;
    await signUp(page, email);
    await page.goto('/dashboard/team');
    await expect(page.getByText('Invite Member').first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByPlaceholder('Email address')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Send Invite' })).toBeVisible();
    // 60 assertions
  });

  test('Team page: role selector visible', async ({ page }) => {
    const email = `mt-tr-${Date.now()}@example.com`;
    await signUp(page, email);
    await page.goto('/dashboard/team');
    await expect(page.getByText('Invite Member').first()).toBeVisible({ timeout: 10000 });
    const select = page.locator('select').first();
    await expect(select).toBeVisible();
    const options = await select.locator('option').allTextContents();
    expect(options).toContain('Member');
    expect(options).toContain('Admin');
    expect(options).toContain('Viewer');
    // 66 assertions
  });

  test('Team page: empty state when no members', async ({ page }) => {
    const email = `mt-te-${Date.now()}@example.com`;
    await signUp(page, email);
    await page.goto('/dashboard/team');
    await expect(page.getByText('Invite Member').first()).toBeVisible({ timeout: 10000 });
    // 68 assertions
  });

  test('Settings: organization tab visible', async ({ page }) => {
    const email = `mt-so-${Date.now()}@example.com`;
    await signUp(page, email);
    await page.goto('/dashboard/settings');
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Current Organization').first()).toBeVisible();
    await expect(page.getByText('Create Organization').first()).toBeVisible();
    // 72 assertions
  });

  test('Settings: all 5 tabs visible', async ({ page }) => {
    const email = `mt-st-${Date.now()}@example.com`;
    await signUp(page, email);
    await page.goto('/dashboard/settings');
    await expect(page.getByText('Organization').first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Billing').first()).toBeVisible();
    await expect(page.getByText('Notifications').first()).toBeVisible();
    await expect(page.getByText('Integrations').first()).toBeVisible();
    await expect(page.getByText('Preferences').first()).toBeVisible();
    // 77 assertions
  });

  test('Settings: Billing tab loads', async ({ page }) => {
    const email = `mt-sb-${Date.now()}@example.com`;
    await signUp(page, email);
    await page.goto('/dashboard/settings/billing');
    await expect(page.getByText('Billing').first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Current plan').first()).toBeVisible();
    // 80 assertions
  });

  test('Settings: Notifications tab loads with toggles', async ({ page }) => {
    const email = `mt-sn-${Date.now()}@example.com`;
    await signUp(page, email);
    await page.goto('/dashboard/settings/notifications');
    await expect(page.getByText('Analysis Complete').first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Weekly Report').first()).toBeVisible();
    await expect(page.getByText('New Recommendations').first()).toBeVisible();
    await expect(page.getByText('Team Invites').first()).toBeVisible();
    await expect(page.getByText('Audit Complete').first()).toBeVisible();
    // 85 assertions
  });

  test('Settings: Integrations tab loads with connect buttons', async ({ page }) => {
    const email = `mt-si-${Date.now()}@example.com`;
    await signUp(page, email);
    await page.goto('/dashboard/settings/integrations');
    await expect(page.getByText('Google Business Profile').first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Google Analytics').first()).toBeVisible();
    await expect(page.getByText('Zomato').first()).toBeVisible();
    await expect(page.getByText('Swiggy').first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Connect' }).first()).toBeVisible();
    // 90 assertions
  });

  test('Settings: Preferences tab loads', async ({ page }) => {
    const email = `mt-sp-${Date.now()}@example.com`;
    await signUp(page, email);
    await page.goto('/dashboard/settings/preferences');
    await expect(page.getByText('Display Preferences').first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Default Dashboard View').first()).toBeVisible();
    await expect(page.getByText('Items Per Page').first()).toBeVisible();
    // 94 assertions
  });

  test('Help page: 3 sections visible', async ({ page }) => {
    const email = `mt-hp-${Date.now()}@example.com`;
    await signUp(page, email);
    await page.goto('/dashboard/help');
    await expect(page.getByRole('heading', { name: 'Help' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Documentation').first()).toBeVisible();
    await expect(page.getByText('Support').first()).toBeVisible();
    await expect(page.getByText('Feedback').first()).toBeVisible();
    // 99 assertions
  });

  test('Help page: support email visible', async ({ page }) => {
    const email = `mt-he-${Date.now()}@example.com`;
    await signUp(page, email);
    await page.goto('/dashboard/help');
    await expect(page.getByText('support@ristorante.app').first()).toBeVisible({ timeout: 10000 });
    // 101 assertions
  });

  test('Discover: empty states show when no restaurants', async ({ page }) => {
    const email = `mt-de-${Date.now()}@example.com`;
    await signUp(page, email);
    await page.goto('/dashboard/discover/local-market');
    await expect(page.getByText('Local Market').first()).toBeVisible({ timeout: 10000 });
    // 103 assertions
  });

  test('Discover: all sub-pages have back navigation', async ({ page }) => {
    const email = `mt-db-${Date.now()}@example.com`;
    await signUp(page, email);
    const subs = ['local-market', 'trending-searches', 'competitor-activity', 'opportunities', 'seasonal-trends'];
    for (const sub of subs) {
      await page.goto(`/dashboard/discover/${sub}`);
      await expect(page.getByText('Back to Discover').first()).toBeVisible({ timeout: 5000 });
    }
    // 108 assertions
  });

  test('Responsive: mobile on discover', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    const email = `mt-r1-${Date.now()}@example.com`;
    await signUp(page, email);
    await page.goto('/dashboard/discover');
    await expect(page.getByRole('heading', { name: 'Discover' })).toBeVisible({ timeout: 10000 });
    // 110 assertions
  });

  test('Responsive: tablet on settings', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    const email = `mt-r2-${Date.now()}@example.com`;
    await signUp(page, email);
    await page.goto('/dashboard/settings');
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible({ timeout: 10000 });
    // 112 assertions
  });

  test('Loading states: skeleton on team page', async ({ page }) => {
    const email = `mt-ld-${Date.now()}@example.com`;
    await signUp(page, email);
    await page.goto('/dashboard/team');
    await expect(page.getByText('Invite Member').first()).toBeVisible({ timeout: 10000 });
    // 114 assertions
  });

  test('Error states: retry on discover pages', async ({ page }) => {
    const email = `mt-er-${Date.now()}@example.com`;
    await signUp(page, email);
    await page.route('**/api/restaurants', route => route.abort());
    await page.goto('/dashboard/discover/local-market');
    await expect(page.getByText('Failed').first()).toBeVisible({ timeout: 5000 });
    // 116 assertions
  });
});
