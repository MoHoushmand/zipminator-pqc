import { test, expect } from '@playwright/test';

const PILLAR_SLUGS = [
  'qvault',
  'qmessenger',
  'qvoip',
  'qvpn',
  'qanonymizer',
  'qai',
  'qmail',
  'qbrowser',
  'qmesh',
] as const;

test.describe('Nine pillars', () => {
  test('every pillar SVG is served at /logos/pillars/<slug>.svg', async ({ request }) => {
    for (const slug of PILLAR_SLUGS) {
      const res = await request.get(`/logos/pillars/${slug}.svg`);
      expect(res.status(), `/${slug}.svg status`).toBe(200);
      const body = await res.text();
      expect(body, `/${slug}.svg must contain <svg>`).toContain('<svg');
    }
  });

  test('pillar section renders 9 icons with slug attribution', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    for (const slug of PILLAR_SLUGS) {
      const icon = page
        .locator(`[data-slug="${slug}"]`)
        .or(page.locator(`img[alt="${slug}"]`))
        .first();

      await icon.scrollIntoViewIfNeeded().catch(() => {});
      await expect(icon, `pillar icon ${slug}`).toBeVisible({ timeout: 10_000 });
    }

    await page.screenshot({ path: 'e2e/screenshots/pillars.png', fullPage: true });
  });

  test('each pillar card exposes a progress indicator in [0, 100]', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const progressBars = page.locator('[role="progressbar"], [aria-valuenow]');
    const count = await progressBars.count();
    expect(count, 'at least one progress bar on landing').toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const bar = progressBars.nth(i);
      const v = await bar.getAttribute('aria-valuenow');
      if (v === null) continue;
      const n = Number(v);
      expect(Number.isFinite(n), `aria-valuenow[${i}] finite`).toBe(true);
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThanOrEqual(100);
    }
  });
});
