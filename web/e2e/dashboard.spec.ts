import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const AUTH_DIR = path.join(__dirname, '.auth');
const BASE_URL = process.env.WEB_URL || 'http://localhost:3099';

test.describe('Dashboard - unauthenticated', () => {
  test('landing page renders branding', async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page.locator('text=Zipminator').first()).toBeVisible();
    await page.screenshot({ path: 'e2e/screenshots/landing.png' });
  });

  test('dashboard route is gated by auth (no dashboard-root visible)', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded' });
    const root = page.getByTestId('dashboard-root');
    const visible = await root.isVisible({ timeout: 3_000 }).catch(() => false);
    expect(visible, 'dashboard-root must NOT be visible without auth').toBe(false);
  });
});

const PROVIDERS = ['github', 'google', 'linkedin'] as const;

for (const provider of PROVIDERS) {
  const statePath = path.join(AUTH_DIR, `${provider}.json`);

  test.describe(`Dashboard - ${provider} session`, () => {
    test.skip(
      !fs.existsSync(statePath),
      `Seed state missing. Run: pnpm exec playwright test e2e/_seed-auth.spec.ts --project=seed --headed`,
    );
    test.use({ storageState: statePath });

    test(`${provider}: dashboard-root renders`, async ({ page }) => {
      await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
      await expect(page.getByTestId('dashboard-root')).toBeVisible({ timeout: 15_000 });
    });

    test(`${provider}: /api/me reflects session cookie`, async ({ request }) => {
      const res = await request.get('/api/me');
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.user).toBeTruthy();
      expect(body.provider).toBe(provider);
    });
  });
}
