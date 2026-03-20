import { test, expect } from '@playwright/test';

test.describe('public pages', () => {
  test('homepage has correct title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Serpent's Edge/);
  });

  test('homepage has brand name in header', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText("The Serpent's Edge")).toBeVisible();
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
