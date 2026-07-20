import { test, expect } from '@playwright/test';

// A minimal starting point — expand this alongside whatever page(s) you build.
// See current56 (github.com/Dwaynor/current56)'s tests/design.spec.ts and
// tests/cinematic.spec.ts for the kind of design-contract assertions worth
// growing this into once you have real sections to check.
test.describe('Homepage', () => {
  test('loads without console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    expect(errors).toEqual([]);
  });

  test('has a visible h1 and skip link', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('a[href="#main-content"]')).toBeAttached();
  });

  test('no external font or Google Fonts requests', async ({ page }) => {
    const external: string[] = [];
    page.on('request', (req) => {
      const url = req.url();
      if (url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com')) {
        external.push(url);
      }
    });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    expect(external).toEqual([]);
  });

  test('emits valid, parseable JSON-LD', async ({ page }) => {
    await page.goto('/');
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(blocks.length).toBeGreaterThan(0);
    for (const raw of blocks) {
      expect(() => JSON.parse(raw)).not.toThrow();
    }
  });
});
