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
  await expect(page.getByText(name).first()).toBeVisible({ timeout: 20000 });
  await page.getByPlaceholder('Search restaurants...').fill('');
}

test.describe('Visual QA — cross-device regression', () => {
  test.setTimeout(120000);

  test('Restaurant details renders on desktop, tablet, and mobile', async ({ page }) => {
    const email = `vqa-${Date.now()}@example.com`;
    await signUp(page, email);
    await addRestaurant(page, 'Visual QA Detail');
    await page.getByPlaceholder('Search restaurants...').fill('Visual QA Detail');
    await page.getByText('Visual QA Detail').first().click();
    await page.waitForURL(/\/dashboard\/restaurants\//, { timeout: 5000 });
    await expect(page.getByText('Restaurant Intelligence').first()).toBeVisible({ timeout: 15000 });

    // Desktop
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'visual-screenshots/restaurant-detail-desktop.png', fullPage: true });

    // Tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(800);
    await page.screenshot({ path: 'visual-screenshots/restaurant-detail-tablet.png', fullPage: true });

    // Mobile
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(800);
    await page.screenshot({ path: 'visual-screenshots/restaurant-detail-mobile.png', fullPage: true });
  });

  test('Portfolio page renders on desktop, tablet, and mobile', async ({ page }) => {
    const email = `vqa-p-${Date.now()}@example.com`;
    await signUp(page, email);
    await addRestaurant(page, 'Visual QA Portfolio');
    await page.goto('/dashboard/restaurants');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: 'Restaurants' })).toBeVisible({ timeout: 30000 });
    await page.waitForTimeout(2000);

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'visual-screenshots/portfolio-desktop.png', fullPage: true });

    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'visual-screenshots/portfolio-tablet.png', fullPage: true });

    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'visual-screenshots/portfolio-mobile.png', fullPage: true });
  });

  test('Heat map and weekly report render', async ({ page }) => {
    const email = `vqa-h-${Date.now()}@example.com`;
    await signUp(page, email);
    await addRestaurant(page, 'Visual QA Other');
    await page.goto('/dashboard/restaurants');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('button', { name: 'Heat Map' }).first()).toBeVisible({ timeout: 30000 });
    await page.getByRole('button', { name: 'Heat Map' }).first().click();
    await expect(page.getByRole('button', { name: 'critical' }).first()).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(1000);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.screenshot({ path: 'visual-screenshots/heatmap-desktop.png', fullPage: true });

    // Weekly report
    await page.goto('/dashboard/reports/weekly');
    await expect(page.getByRole('heading', { name: 'Weekly Intelligence' })).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'visual-screenshots/weekly-desktop.png', fullPage: true });
  });

  test('Comparison and cross-factor render on details page', async ({ page }) => {
    const email = `vqa-c-${Date.now()}@example.com`;
    await signUp(page, email);
    await addRestaurant(page, 'Visual QA Comp');
    await page.getByPlaceholder('Search restaurants...').fill('Visual QA Comp');
    await page.getByText('Visual QA Comp').first().click();
    await page.waitForURL(/\/dashboard\/restaurants\//, { timeout: 5000 });
    await expect(page.getByText('Restaurant Intelligence').first()).toBeVisible({ timeout: 15000 });
    // Comparison + cross-factor (may not always have competitors, but cross-factor always renders)
    await expect(page.getByText('Cross-Factor Relationships').first()).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(1000);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.screenshot({ path: 'visual-screenshots/crossfactor-desktop.png', fullPage: true });
  });
});
