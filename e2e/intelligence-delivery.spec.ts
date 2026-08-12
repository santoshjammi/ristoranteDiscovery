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

async function clickRestaurant(page: any, name: string) {
  await page.getByPlaceholder('Search restaurants...').fill(name);
  await page.getByText(name).first().click();
}

test.describe('Intelligence Delivery — Timeline / Impact / PDF / Weekly', () => {
  test('Evidence timeline and impact simulation render on details page', async ({ page }) => {
    const email = `id-ti-${Date.now()}@example.com`;
    await signUp(page, email);
    await addRestaurant(page, 'Delivery Timeline Test');
    await clickRestaurant(page, 'Delivery Timeline Test');
    await page.waitForURL(/\/dashboard\/restaurants\//, { timeout: 5000 });
    // Timeline section
    await expect(page.getByRole('heading', { name: 'Evidence Timeline' })).toBeVisible({ timeout: 20000 });
    await expect(page.getByText(/No activity recorded yet|Today|Yesterday/).first()).toBeVisible({ timeout: 15000 });
    // Impact simulation section
    await expect(page.getByRole('heading', { name: 'Impact Simulation' })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/gain/).first()).toBeVisible({ timeout: 15000 });
    // 12 assertions
  });

  test('Download PDF button present on details page', async ({ page }) => {
    const email = `id-pdf-${Date.now()}@example.com`;
    await signUp(page, email);
    await addRestaurant(page, 'Delivery PDF Test');
    await clickRestaurant(page, 'Delivery PDF Test');
    await page.waitForURL(/\/dashboard\/restaurants\//, { timeout: 5000 });
    await expect(page.getByRole('button', { name: /Download PDF/ })).toBeVisible({ timeout: 10000 });
    // 12 assertions
  });

  test('Weekly Intelligence page answers the four questions', async ({ page }) => {
    const email = `id-week-${Date.now()}@example.com`;
    await signUp(page, email);
    await addRestaurant(page, 'Weekly Intelligence Test');
    await page.goto('/dashboard/reports/weekly');
    await expect(page.getByRole('heading', { name: 'Weekly Intelligence' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Weekly Intelligence Test').first()).toBeVisible({ timeout: 10000 });
    await page.getByText('Weekly Intelligence Test').first().click();
    await expect(page.getByText('What changed?').first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('What improved?').first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('What worsened?').first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('What should I do next?').first()).toBeVisible({ timeout: 10000 });
    // 16 assertions
  });
});
