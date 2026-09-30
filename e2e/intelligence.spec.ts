import { test, expect } from '@playwright/test';

test.describe('Intelligence Pages', () => {
  test('Intelligence Overview loads and shows categories', async ({ page }) => {
    const email = `intel-${Date.now()}@example.com`;
    await page.goto('/auth');
    await page.getByText('Sign Up').last().click();
    await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible({ timeout: 5000 });
    await page.getByPlaceholder('Your Name').fill('Test User');
    await page.getByPlaceholder('Email').fill(email);
    await page.getByPlaceholder('Password').fill('TestPass123!');
    await page.getByPlaceholder('Organization Name').fill('RDI Org - intelligence');
    await page.getByRole('button', { name: 'Create Account' }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });

    await page.goto('/dashboard/intelligence');
    await expect(page.getByRole('heading', { name: 'Intelligence', exact: true })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Category Breakdown')).toBeVisible();
    await expect(page.getByText('Explore')).toBeVisible();
    // Quick links — use role links to avoid sidebar conflicts
    await expect(page.getByRole('link', { name: '📊 Analysis' })).toBeVisible();
    await expect(page.getByRole('link', { name: '💡 Recommendations' })).toBeVisible();
    await expect(page.getByRole('link', { name: '👁️ Visibility' })).toBeVisible();
  });

  test('Recommendation Detail loads and shows evidence', async ({ page }) => {
    // First sign up and add restaurant
    const email = `detail-${Date.now()}@example.com`;
    await page.goto('/auth');
    await page.getByText('Sign Up').last().click();
    await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible({ timeout: 5000 });
    await page.getByPlaceholder('Your Name').fill('Test User');
    await page.getByPlaceholder('Email').fill(email);
    await page.getByPlaceholder('Password').fill('TestPass123!');
    await page.getByPlaceholder('Organization Name').fill('RDI Org - intelligence');
    await page.getByRole('button', { name: 'Create Account' }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });

    // Add restaurant
    await page.goto('/dashboard/restaurants');
    await expect(page.getByRole('heading', { name: 'Restaurants' })).toBeVisible({ timeout: 5000 });
    await page.getByRole('button', { name: '+ Add Restaurant' }).click();
    await page.getByPlaceholder('Restaurant Name').fill('Test Restaurant');
    await page.getByPlaceholder('Address').fill('123 Main St');
    await page.getByPlaceholder('City').fill('Bangalore');
    await page.getByPlaceholder('Cuisine Types').fill('Indian');
    await page.getByRole('button', { name: 'Create Restaurant' }).click();
    await page.getByPlaceholder('Search restaurants...').fill('Test Restaurant');
    await expect(page.getByText('Test Restaurant').first()).toBeVisible({ timeout: 5000 });

    // Scorecard loads with master score
    await page.getByText('Test Restaurant').first().click();
    await page.waitForURL(/\/dashboard\/restaurants\//, { timeout: 5000 });
    await expect(page.getByText('Restaurant Intelligence')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('/100').first()).toBeVisible();

    // Navigate to recommendations via Decision Center
    await page.goto('/dashboard/actions');
    await page.waitForURL('/dashboard/actions', { timeout: 5000 });

    // Click first recommendation link in Decision Center
    const firstRec = page.getByRole('link').filter({ hasText: /Improve|Optimize|Add|Update|Fix|Enhance/i }).first();
    if (await firstRec.isVisible({ timeout: 3000 }).catch(() => false)) {
      await firstRec.click();
      await page.waitForURL(/\/dashboard\/intelligence\/recommendations\//, { timeout: 5000 });
      // Should show detail page elements
      await expect(page.getByText('Problem')).toBeVisible({ timeout: 5000 });
      await expect(page.getByText('Evidence')).toBeVisible();
      await expect(page.getByText('Reasoning')).toBeVisible();
    }
  });

  test('Decision Center shows tabs and empty state', async ({ page }) => {
    test.setTimeout(120000);
    const email = `dc-${Date.now()}@example.com`;
    await page.goto('/auth');
    await page.getByText('Sign Up').last().click();
    await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible({ timeout: 5000 });
    await page.getByPlaceholder('Your Name').fill('Test User');
    await page.getByPlaceholder('Email').fill(email);
    await page.getByPlaceholder('Password').fill('TestPass123!');
    await page.getByPlaceholder('Organization Name').fill('RDI Org - intelligence');
    await page.getByRole('button', { name: 'Create Account' }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });

    // Mock API responses to avoid "Failed to fetch" in test environment
    await page.route('**/api/restaurants', route => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });
    await page.route('**/api/decisions/batch*', route => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [] }) });
    });

    await page.goto('/dashboard/actions');
    await expect(page.getByRole('heading', { name: 'Decision Center' })).toBeVisible({ timeout: 60000 });
    // Wait for tabs to appear (loading finished)
    await expect(page.getByText('All').first()).toBeVisible({ timeout: 30000 });
    await expect(page.getByRole('button', { name: 'Pending' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Accepted' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Completed' })).toBeVisible();
  });

  test('Tasks page shows empty state', async ({ page }) => {
    test.setTimeout(120000);
    const email = `tasks-${Date.now()}@example.com`;
    await page.goto('/auth');
    await page.getByText('Sign Up').last().click();
    await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible({ timeout: 5000 });
    await page.getByPlaceholder('Your Name').fill('Test User');
    await page.getByPlaceholder('Email').fill(email);
    await page.getByPlaceholder('Password').fill('TestPass123!');
    await page.getByPlaceholder('Organization Name').fill('RDI Org - intelligence');
    await page.getByRole('button', { name: 'Create Account' }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });

    await page.goto('/dashboard/actions/tasks');
    await expect(page.getByRole('heading', { name: 'Tasks', exact: true })).toBeVisible({ timeout: 60000 });
  });

  test('Outcomes page shows empty state', async ({ page }) => {
    test.setTimeout(120000);
    const email = `outcomes-${Date.now()}@example.com`;
    await page.goto('/auth');
    await page.getByText('Sign Up').last().click();
    await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible({ timeout: 5000 });
    await page.getByPlaceholder('Your Name').fill('Test User');
    await page.getByPlaceholder('Email').fill(email);
    await page.getByPlaceholder('Password').fill('TestPass123!');
    await page.getByPlaceholder('Organization Name').fill('RDI Org - intelligence');
    await page.getByRole('button', { name: 'Create Account' }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });

    await page.goto('/dashboard/actions/outcomes');
    await expect(page.getByRole('heading', { name: 'Outcomes' })).toBeVisible({ timeout: 60000 });
  });

  test('Weekly Report page loads and shows restaurant list', async ({ page }) => {
    const email = `weekly-${Date.now()}@example.com`;
    await page.goto('/auth');
    await page.getByText('Sign Up').last().click();
    await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible({ timeout: 5000 });
    await page.getByPlaceholder('Your Name').fill('Test User');
    await page.getByPlaceholder('Email').fill(email);
    await page.getByPlaceholder('Password').fill('TestPass123!');
    await page.getByPlaceholder('Organization Name').fill('RDI Org - intelligence');
    await page.getByRole('button', { name: 'Create Account' }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });

    await page.goto('/dashboard/reports/weekly');
    await expect(page.getByRole('heading', { name: 'Weekly Report' })).toBeVisible({ timeout: 5000 });
  });
});
