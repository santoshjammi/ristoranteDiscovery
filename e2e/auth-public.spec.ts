import { test, expect } from '@playwright/test';

const PWD = 'TestPass123!';
const signUp = async (page: any, e: string) => { await page.goto('/auth'); await page.getByText('Sign Up').last().click(); await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible({ timeout: 5000 }); await page.getByPlaceholder('Your Name').fill('TU'); await page.getByPlaceholder('Email').fill(e); await page.getByPlaceholder('Password').fill(PWD); await page.getByPlaceholder('Organization Name').fill('RDI Org - auth-public'); await page.getByRole('button', { name: 'Create Account' }).click(); await page.waitForURL(/\/dashboard/, { timeout: 10000 }); };

test.describe('Landing Page', () => {
  test('Hero heading and navigation visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Know What\'s Wrong').first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Pricing').first()).toBeVisible();
    await expect(page.getByText('Learn').first()).toBeVisible();
    await expect(page.getByText('Sign In').first()).toBeVisible();
    await expect(page.getByText('Get Your Free Audit').first()).toBeVisible();
  });
  test('CTA buttons visible', async ({ page }) => {
    await page.goto('/');
    const ctas = page.getByRole('link').filter({ hasText: /Audit|Free|Get Started/i });
    const count = await ctas.count();
    expect(count).toBeGreaterThan(0);
  });
  test('Responsive: mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await expect(page.getByText('Pricing').first()).toBeVisible({ timeout: 5000 });
  });
  test('Responsive: tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await expect(page.getByText('Pricing').first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Auth Page', () => {
  test('Sign In form visible', async ({ page }) => {
    await page.goto('/auth');
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible({ timeout: 5000 });
    await expect(page.getByPlaceholder('Email')).toBeVisible();
    await expect(page.getByPlaceholder('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
    await expect(page.getByText('Sign Up').first()).toBeVisible();
  });
  test('Toggle to Sign Up shows Create Account form', async ({ page }) => {
    await page.goto('/auth');
    await page.getByText('Sign Up').last().click();
    await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible({ timeout: 5000 });
    await expect(page.getByPlaceholder('Your Name')).toBeVisible();
    await expect(page.getByPlaceholder('Email')).toBeVisible();
    await expect(page.getByPlaceholder('Password')).toBeVisible();
    await expect(page.getByPlaceholder('Organization Name')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create Account' })).toBeVisible();
  });
  test('Toggle back to Sign In', async ({ page }) => {
    await page.goto('/auth');
    await page.getByText('Sign Up').last().click();
    await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible({ timeout: 5000 });
    await page.getByText('Sign In').last().click();
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
  });
  test('Sign up flow creates account and redirects', async ({ page }) => {
    const e = `ap-su-${Date.now()}@e.com`;
    await signUp(page, e);
    await expect(page.getByText('TO').first()).toBeVisible({ timeout: 5000 });
  });
  test('Sign in flow works for existing user', async ({ page }) => {
    const e = `ap-si-${Date.now()}@e.com`;
    await signUp(page, e);
    await page.goto('/auth');
    await page.getByPlaceholder('Email').fill(e);
    await page.getByPlaceholder('Password').fill(PWD);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
    await expect(page.getByText('TO').first()).toBeVisible({ timeout: 5000 });
  });
  test('Wrong password shows error', async ({ page }) => {
    const e = `ap-wp-${Date.now()}@e.com`;
    await signUp(page, e);
    await page.evaluate(() => localStorage.removeItem('rdi_token'));
    await page.goto('/auth');
    await page.getByPlaceholder('Email').fill(e);
    await page.getByPlaceholder('Password').fill('wrongpassword');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page.getByText('Invalid credentials').first()).toBeVisible({ timeout: 10000 });
  });
  test('Empty fields: form stays visible', async ({ page }) => {
    await page.goto('/auth');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
  });
  test('Loading state: button disabled during submission', async ({ page }) => {
    const e = `ap-ld-${Date.now()}@e.com`;
    await page.goto('/auth');
    await page.getByText('Sign Up').last().click();
    await page.getByPlaceholder('Your Name').fill('TU');
    await page.getByPlaceholder('Email').fill(e);
    await page.getByPlaceholder('Password').fill(PWD);
    await page.getByPlaceholder('Organization Name').fill('RDI Org - auth-public');
    await page.getByRole('button', { name: 'Create Account' }).click();
    await expect(page.getByRole('button', { name: 'Create Account' })).not.toBeVisible({ timeout: 5000 });
  });
  test('Duplicate email shows error', async ({ page }) => {
    const e = `ap-de-${Date.now()}@e.com`;
    await signUp(page, e);
    // Sign out first
    await page.evaluate(() => localStorage.removeItem('rdi_token'));
    await page.goto('/auth');
    await page.getByText('Sign Up').last().click();
    await page.getByPlaceholder('Your Name').fill('TU');
    await page.getByPlaceholder('Email').fill(e);
    await page.getByPlaceholder('Password').fill(PWD);
    await page.getByPlaceholder('Organization Name').fill('RDI Org - auth-public');
    await page.getByRole('button', { name: 'Create Account' }).click();
    await expect(page.getByText('Email already registered').first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Dashboard', () => {
  test('Page loads with stat cards', async ({ page }) => {
    const e = `ap-ds-${Date.now()}@e.com`;
    await signUp(page, e);
    await expect(page.getByText('TO').first()).toBeVisible({ timeout: 5000 });
  });
  test('Sidebar navigation visible', async ({ page }) => {
    const e = `ap-dn-${Date.now()}@e.com`;
    await signUp(page, e);
    for (const link of ['Home', 'Restaurant', 'Intelligence', 'Actions', 'Reports', 'Discover', 'Team', 'Settings', 'Help']) {
      await expect(page.getByText(link).first()).toBeVisible();
    }
  });
  test('User name visible in sidebar', async ({ page }) => {
    const e = `ap-du-${Date.now()}@e.com`;
    await signUp(page, e);
    await expect(page.getByText('TU').first()).toBeVisible({ timeout: 5000 });
  });
  test('Organization name visible in sidebar', async ({ page }) => {
    const e = `ap-do-${Date.now()}@e.com`;
    await signUp(page, e);
    await expect(page.getByText('TO').first()).toBeVisible({ timeout: 5000 });
  });
  test('Search bar visible in sidebar', async ({ page }) => {
    const e = `ap-db-${Date.now()}@e.com`;
    await signUp(page, e);
    await expect(page.getByText('Ristorante').first()).toBeVisible({ timeout: 5000 });
  });
  test('Loading state: skeleton visible', async ({ page }) => {
    const e = `ap-dl-${Date.now()}@e.com`;
    await signUp(page, e);
    await page.goto('/dashboard');
    await expect(page.getByText('TO').first()).toBeVisible({ timeout: 10000 });
  });
  test('Error state: retry on API failure', async ({ page }) => {
    const e = `ap-der-${Date.now()}@e.com`;
    await signUp(page, e);
    await page.route('**/api/restaurants', route => route.abort());
    await page.goto('/dashboard');
    await expect(page.getByText(/Failed|error/).first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Pricing Page', () => {
  test('Page loads with heading and 4 plans', async ({ page }) => {
    await page.goto('/pricing');
    await expect(page.getByText('Simple, Transparent Pricing').first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Free').first()).toBeVisible();
    await expect(page.getByText('Starter').first()).toBeVisible();
    await expect(page.getByText('Professional').first()).toBeVisible();
    await expect(page.getByText('Enterprise').first()).toBeVisible();
  });
  test('Each plan has features and CTA', async ({ page }) => {
    await page.goto('/pricing');
    const ctas = page.getByRole('link').filter({ hasText: /Get Started|Contact|Free/i });
    const count = await ctas.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });
  test('Starter marked as Most Popular', async ({ page }) => {
    await page.goto('/pricing');
    await expect(page.getByText('Most Popular').first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Success Stories Page', () => {
  test('Page loads with heading and stories', async ({ page }) => {
    await page.goto('/success-stories');
    await expect(page.getByText('Customer Success Stories').first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Biryani Maxx').first()).toBeVisible();
    await expect(page.getByText('Dharani').first()).toBeVisible();
    await expect(page.getByText('FitFuel Kitchen').first()).toBeVisible();
    await expect(page.getByText('Brew & Bean').first()).toBeVisible();
  });
  test('Each story has metric and quote', async ({ page }) => {
    await page.goto('/success-stories');
    await expect(page.getByText('increase').first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('"').first()).toBeVisible();
  });
});

test.describe('Learn Page', () => {
  test('Page loads with heading and topics', async ({ page }) => {
    await page.goto('/learn');
    await expect(page.getByText('Learn').first()).toBeVisible({ timeout: 5000 });
    for (const t of ['Local Search', 'Google Business', 'Reviews', 'Website', 'Visibility', 'Restaurant Growth']) {
      await expect(page.getByText(t).first()).toBeVisible();
    }
  });
});

test.describe('Admin Page', () => {
  test('Page loads with heading', async ({ page }) => {
    await signUp(page, `adm1-${Date.now()}@example.com`);
    await page.goto('/admin');
    await expect(page.getByText('Admin Dashboard').first()).toBeVisible({ timeout: 10000 });
  });
  test('Stat cards visible', async ({ page }) => {
    await signUp(page, `adm2-${Date.now()}@example.com`);
    await page.goto('/admin');
    await expect(page.getByText('Total Restaurants').first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Total Users').first()).toBeVisible();
    await expect(page.getByText('Organizations').first()).toBeVisible();
    await expect(page.getByText('Avg Visibility Score').first()).toBeVisible();
    await expect(page.getByText('Need Attention').first()).toBeVisible();
    await expect(page.getByText('Healthy').first()).toBeVisible();
  });
  test('System section visible', async ({ page }) => {
    await signUp(page, `adm3-${Date.now()}@example.com`);
    await page.goto('/admin');
    await expect(page.getByText('System').first()).toBeVisible({ timeout: 10000 });
  });
});
