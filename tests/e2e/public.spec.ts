import { test, expect } from '@playwright/test';

test.describe('public pages', () => {
  test('homepage presents the small-business story and primary navigation', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/BC Exotix/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Healthy snakes');
    await expect(page.getByRole('link', { name: 'Browse the collection' })).toBeVisible();
  });

  test('collection renders a grid or a purposeful empty state', async ({ page }) => {
    await page.goto('/snakes');
    await expect(page.getByRole('heading', { level: 1, name: 'The collection' })).toBeVisible();

    const cards = page.locator('article');
    if (await cards.count()) {
      await expect(cards.first()).toBeVisible();
    } else {
      await expect(page.getByRole('heading', { name: 'The collection is being updated' })).toBeVisible();
    }
  });

  test('desktop collection navigation works', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name.includes('mobile'), 'Mobile navigation has its own test.');
    await page.goto('/');
    const primaryNav = page.getByRole('navigation', { name: 'Primary navigation' });
    await primaryNav.getByRole('link', { name: 'Collection' }).click();
    await expect(page).toHaveURL(/\/snakes$/);
  });

  test('mobile navigation exposes all public routes', async ({ page }, testInfo) => {
    test.skip(!testInfo.project.name.includes('mobile'), 'Only relevant to the mobile project.');
    await page.goto('/');
    await page.locator('header details > summary').click();
    const mobileNav = page.getByRole('navigation', { name: 'Mobile navigation' });
    await expect(mobileNav.getByRole('link', { name: 'Collection' })).toBeVisible();
    await expect(mobileNav.getByRole('link', { name: 'About' })).toBeVisible();
    await expect(mobileNav.getByRole('link', { name: 'Contact' })).toBeVisible();
  });

  test('pages do not overflow the viewport', async ({ page }) => {
    for (const path of ['/', '/snakes', '/404']) {
      await page.goto(path);
      const sizes = await page.evaluate(() => ({
        viewport: document.documentElement.clientWidth,
        content: document.documentElement.scrollWidth,
      }));
      expect(sizes.content, `${path} should not scroll horizontally`).toBeLessThanOrEqual(sizes.viewport);
    }
  });

  test('unknown specimen returns the custom 404 without hiding the bad URL', async ({ page }) => {
    const response = await page.goto('/snakes/this-slug-does-not-exist-xyz');
    expect(response?.status()).toBe(404);
    await expect(page).toHaveURL(/\/snakes\/this-slug-does-not-exist-xyz$/);
    await expect(page.getByRole('heading', { name: 'That page has moved on' })).toBeVisible();
  });

  test('public internal links do not lead to errors', async ({ page, request }) => {
    await page.goto('/');
    const hrefs = await page.locator('a[href^="/"]').evaluateAll((links) =>
      [...new Set(links.map((link) => (link as HTMLAnchorElement).href))]
        .filter((href) => !href.includes('/admin')),
    );

    for (const href of hrefs) {
      const response = await request.get(href);
      expect(response.status(), `${href} should resolve`).toBeLessThan(400);
    }
  });
});

test.describe('specimen detail page', () => {
  test('renders factual sections and a real inquiry form when a specimen exists', async ({ page }) => {
    await page.goto('/snakes');
    const specimenLinks = page.locator('article a[href^="/snakes/"]');
    if (await specimenLinks.count() === 0) {
      test.skip(true, 'The local D1 collection is empty.');
      return;
    }

    const href = await specimenLinks.first().getAttribute('href');
    await page.goto(href!);
    await expect(page.getByRole('heading', { name: 'Specimen details' })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Ask about/ })).toBeVisible();
    await expect(page.getByLabel('Your name')).toBeVisible();
    await expect(page.getByLabel('Email address')).toBeVisible();
    await expect(page.getByLabel('Question')).toBeVisible();
  });
});

test.describe('demo collection', () => {
  test('shows every lifecycle and listing fallback', async ({ page }) => {
    const response = await page.goto('/snakes/demo-juniper-piebald-ball-python');
    if (response?.status() === 404) {
      test.skip(true, 'Run npm run db:seed:demo to load the optional demo collection.');
      return;
    }

    await page.goto('/snakes');
    await expect(page.getByText('Available', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Reserved', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Placed', { exact: true }).first()).toBeVisible();

    const inquiryOnlyCard = page.locator('article').filter({ hasText: 'Mica' });
    await expect(inquiryOnlyCard.getByText('Inquire for price')).toBeVisible();

    const placeholderCard = page.locator('article').filter({ hasText: 'Lumen' });
    await expect(placeholderCard.locator('img')).toHaveAttribute('src', '/placeholder-snake.svg');
  });

  test('renders a complete researched demo profile', async ({ page }) => {
    const response = await page.goto('/snakes/demo-juniper-piebald-ball-python');
    if (response?.status() === 404) {
      test.skip(true, 'Run npm run db:seed:demo to load the optional demo collection.');
      return;
    }

    await expect(page.getByLabel('Demo specimen notice')).toBeVisible();
    await expect(page.getByText('$450', { exact: true })).toBeVisible();
    await expect(page.getByText('Piebald', { exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Temperament & husbandry' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Moss/ })).toBeVisible();

    const specimenImage = page.locator('img[alt^="Illustrative demo image for Juniper"]');
    await expect(specimenImage).toBeVisible();
    expect(await specimenImage.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
  });
});
