import { test, expect } from '@playwright/test';

test.describe('public pages', () => {
  test('homepage has correct title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/BC Exotix/);
  });

  test('homepage has brand name in header', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText("BC Exotix")).toBeVisible();
  });

  test('collection page renders heading', async ({ page }) => {
    await page.goto('/snakes');
    await expect(page.getByText('The Collection')).toBeVisible();
  });

  test('header navigation to collection works', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Collection' }).first().click();
    await expect(page).toHaveURL(/\/snakes/);
  });
});

test.describe('animal detail page', () => {
  // These tests rely on at least one snake existing in the dev DB.
  // If the DB is empty, tests are skipped gracefully.

  test('detail page renders specimen name in heading', async ({ page }) => {
    await page.goto('/snakes');
    const firstLink = page.locator('a[href^="/snakes/"]').first();
    if (await firstLink.count() === 0) { test.skip(); return; }
    await page.goto((await firstLink.getAttribute('href'))!);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('detail page renders Acquisition Details section', async ({ page }) => {
    await page.goto('/snakes');
    const firstLink = page.locator('a[href^="/snakes/"]').first();
    if (await firstLink.count() === 0) { test.skip(); return; }
    await page.goto((await firstLink.getAttribute('href'))!);
    await expect(page.getByText('Acquisition Details')).toBeVisible();
  });

  test('detail page shows Email Inquiry button', async ({ page }) => {
    await page.goto('/snakes');
    const firstLink = page.locator('a[href^="/snakes/"]').first();
    if (await firstLink.count() === 0) { test.skip(); return; }
    await page.goto((await firstLink.getAttribute('href'))!);
    await expect(page.getByText('Email Inquiry')).toBeVisible();
  });

  test('unknown slug redirects to /snakes', async ({ page }) => {
    await page.goto('/snakes/this-slug-does-not-exist-xyz');
    await expect(page).toHaveURL(/\/snakes$/);
  });
});
