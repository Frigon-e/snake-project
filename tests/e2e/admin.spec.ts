import { test, expect } from '@playwright/test';

test.describe('admin auth protection', () => {
  test('unauthenticated request to /admin redirects away from admin', async ({ page }) => {
    await page.goto('/admin');
    // Clerk middleware redirects unauthenticated users to Clerk sign-in
    await expect(page).not.toHaveURL(/^http:\/\/localhost:4321\/admin$/);
  });

  test('unauthenticated request to /admin/snakes is protected', async ({ page }) => {
    await page.goto('/admin/snakes');
    await expect(page).not.toHaveURL(/^http:\/\/localhost:4321\/admin\/snakes$/);
  });
});
