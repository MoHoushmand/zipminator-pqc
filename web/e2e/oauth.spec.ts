import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const AUTH_DIR = path.join(__dirname, '.auth');
const PROVIDERS = ['github', 'google', 'linkedin'] as const;
type Provider = typeof PROVIDERS[number];

test.describe('OAuth login page (unauthenticated)', () => {
  test('login page renders with OAuth providers', async ({ page }) => {
    await page.goto('/auth/login');

    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    await expect(emailInput).toBeVisible({ timeout: 15_000 });

    const providerTriggers = PROVIDERS.map((p) => {
      const label = p[0].toUpperCase() + p.slice(1);
      return page
        .getByRole('button', { name: new RegExp(label, 'i') })
        .or(page.getByRole('link', { name: new RegExp(label, 'i') }))
        .first();
    });

    const visible = await Promise.all(
      providerTriggers.map((t) => t.isVisible().catch(() => false)),
    );
    const visibleCount = visible.filter(Boolean).length;
    expect(visibleCount, 'at least one OAuth provider trigger must be visible').toBeGreaterThan(0);

    await page.screenshot({ path: 'e2e/screenshots/oauth-login.png' });
  });
});

for (const provider of PROVIDERS) {
  const statePath = path.join(AUTH_DIR, `${provider}.json`);

  test.describe(`OAuth authenticated session (${provider})`, () => {
    test.skip(
      !fs.existsSync(statePath),
      `Seed state missing. Run: pnpm exec playwright test e2e/_seed-auth.spec.ts --project=seed --headed`,
    );
    test.use({ storageState: statePath });

    test(`${provider}: /api/me returns authenticated user`, async ({ request }) => {
      const res = await request.get('/api/me');
      expect(res.status(), `/api/me for ${provider}`).toBe(200);
      const body = await res.json();
      expect(body.user, 'user payload present').toBeTruthy();
      expect(body.user.email || body.user.name, 'user has email or name').toBeTruthy();
      expect(body.provider, 'session records the provider').toBe(provider);
    });

    test(`${provider}: /dashboard renders with session`, async ({ page }) => {
      await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
      await expect(page.getByTestId('dashboard-root')).toBeVisible({ timeout: 15_000 });
      await page.screenshot({ path: `e2e/screenshots/dashboard-${provider}.png` });
    });
  });
}

test.describe('OAuth redirect (live provider)', () => {
  test.skip(
    process.env.MARATHON_ALLOW_LIVE_OAUTH !== '1',
    'Live OAuth redirect test disabled in marathon loop (uses seeded storageState). Set MARATHON_ALLOW_LIVE_OAUTH=1 to run locally.',
  );

  test('GitHub trigger redirects to github.com', async ({ page }) => {
    await page.goto('/auth/login');
    const gh = page.getByRole('button', { name: /github/i }).first();
    await gh.click();
    await page.waitForURL(/github\.com/, { timeout: 15_000 });
    await page.screenshot({ path: 'e2e/screenshots/oauth-github-redirect.png' });
  });
});
