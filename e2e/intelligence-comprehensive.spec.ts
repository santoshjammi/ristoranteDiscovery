import { test, expect } from '@playwright/test';
import { BACKEND_URL, TEST_PASSWORD } from './helpers/env';

const signUp = async (page: any, e: string) => { await page.goto('/auth'); await page.getByText('Sign Up').last().click(); await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible({ timeout: 5000 }); await page.getByPlaceholder('Your Name').fill('TU'); await page.getByPlaceholder('Email').fill(e); await page.getByPlaceholder('Password').fill(PWD); await page.getByPlaceholder('Organization Name').fill('RDI Org - intelligence-comprehensive'); await page.getByRole('button', { name: 'Create Account' }).click(); await page.waitForURL(/\/dashboard/, { timeout: 10000 }); };
const addR = async (page: any, n: string) => {
  const token = await page.evaluate(() => localStorage.getItem('rdi_token'));
  if (!token) return;
  await page.request.post(`${BACKEND_URL}/api/restaurants`, {
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    data: { name: n, address: '123 St', city: 'Mumbai', cuisineTypes: ['Indian'] },
  });
};

test.describe('Intelligence — Comprehensive', () => {
  test('Overview: sections visible', async ({ page }) => {
    const e = `io-${Date.now()}@e.com`; await signUp(page, e); await page.goto('/dashboard/intelligence');
    await expect(page.getByRole('heading', { name: 'Intelligence', exact: true })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Category Breakdown').first()).toBeVisible();
    await expect(page.getByText('Explore').first()).toBeVisible();
    for (const t of ['Analysis', 'Recommendations', 'Visibility', 'Competitors', 'Reviews', 'Website', 'Search']) {
      await expect(page.getByText(t).first()).toBeVisible();
    }
  });
  test('Analysis: loads', async ({ page }) => {
    const e = `ia-${Date.now()}@e.com`; await signUp(page, e); await addR(page, 'AT'); await page.goto('/dashboard/intelligence/analysis');
    await expect(page.getByRole('heading', { name: 'Analysis' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('AT').first()).toBeVisible();
  });
  test('Visibility: score grid', async ({ page }) => {
    const e = `iv-${Date.now()}@e.com`; await signUp(page, e); await addR(page, 'VT'); await page.goto('/dashboard/intelligence/visibility');
    await expect(page.getByRole('heading', { name: 'Visibility', exact: true })).toBeVisible({ timeout: 10000 });
    for (const l of ['Discoverability', 'AI Visibility', 'Local Search', 'Menu', 'Conversational Search', 'Dish Retrieval', 'Clarity', 'GBP Health']) {
      await expect(page.getByText(l).first()).toBeVisible();
    }
  });
  test('Competitors: loads', async ({ page }) => {
    const e = `ic-${Date.now()}@e.com`; await signUp(page, e); await addR(page, 'CT'); await page.goto('/dashboard/intelligence/competitors');
    await expect(page.getByRole('heading', { name: 'Competitors' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('CT').first()).toBeVisible();
  });
  test('Reviews: loads', async ({ page }) => {
    const e = `ir-${Date.now()}@e.com`; await signUp(page, e); await addR(page, 'RT'); await page.goto('/dashboard/intelligence/reviews');
    await expect(page.getByRole('heading', { name: 'Reviews' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('RT').first()).toBeVisible();
  });
  test('Website: loads', async ({ page }) => {
    const e = `iw-${Date.now()}@e.com`; await signUp(page, e); await addR(page, 'WT'); await page.goto('/dashboard/intelligence/website');
    await expect(page.getByRole('heading', { name: 'Website', exact: true })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('WT').first()).toBeVisible();
  });
  test('Search: loads', async ({ page }) => {
    const e = `is-${Date.now()}@e.com`; await signUp(page, e); await addR(page, 'ST'); await page.goto('/dashboard/intelligence/search');
    await expect(page.getByRole('heading', { name: 'Search', exact: true })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('ST').first()).toBeVisible();
  });
  test('Decision Center: 5 tabs', async ({ page }) => {
    test.setTimeout(120000);
    const e = `id-${Date.now()}@e.com`; await signUp(page, e);
    // Mock API responses
    await page.route('**/api/restaurants', route => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });
    await page.route('**/api/decisions/batch*', route => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [] }) });
    });
    await page.goto('/dashboard/actions');
    await expect(page.getByRole('heading', { name: 'Decision Center' })).toBeVisible({ timeout: 60000 });
    for (const t of ['All', 'Pending', 'Accepted', 'Dismissed', 'Completed']) {
      await expect(page.getByRole('button', { name: t })).toBeVisible();
    }
  });
  test('Tasks: loads', async ({ page }) => {
    test.setTimeout(120000);
    const e = `it-${Date.now()}@e.com`; await signUp(page, e); await page.goto('/dashboard/actions/tasks');
    await expect(page.getByRole('heading', { name: 'Tasks', exact: true })).toBeVisible({ timeout: 60000 });
  });
  test('Outcomes: loads', async ({ page }) => {
    test.setTimeout(120000);
    const e = `io-${Date.now()}@e.com`; await signUp(page, e); await page.goto('/dashboard/actions/outcomes');
    await expect(page.getByRole('heading', { name: 'Outcomes' })).toBeVisible({ timeout: 60000 });
  });
  test('Weekly Report: loads', async ({ page }) => {
    const e = `iwr-${Date.now()}@e.com`; await signUp(page, e); await addR(page, 'WT'); await page.goto('/dashboard/reports/weekly');
    await expect(page.getByRole('heading', { name: 'Weekly Report' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('WT').first()).toBeVisible();
  });
  test('Reports: loads', async ({ page }) => {
    const e = `irp-${Date.now()}@e.com`; await signUp(page, e); await addR(page, 'RPT'); await page.goto('/dashboard/reports');
    await expect(page.getByRole('heading', { name: 'Reports' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('RPT').first()).toBeVisible();
  });
  test('Responsive: mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    const e = `irm-${Date.now()}@e.com`; await signUp(page, e); await page.goto('/dashboard/intelligence');
    await expect(page.getByRole('heading', { name: 'Intelligence', exact: true })).toBeVisible({ timeout: 10000 });
  });
  test('Responsive: tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    const e = `irt-${Date.now()}@e.com`; await signUp(page, e); await page.goto('/dashboard/intelligence');
    await expect(page.getByRole('heading', { name: 'Intelligence', exact: true })).toBeVisible({ timeout: 10000 });
  });
});
