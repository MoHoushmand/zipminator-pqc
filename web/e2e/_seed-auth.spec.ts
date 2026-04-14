import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const AUTH_DIR = path.join(__dirname, '.auth');
const SEED_TIMEOUT = 10 * 60_000;

test.beforeAll(() => {
  if (!fs.existsSync(AUTH_DIR)) fs.mkdirSync(AUTH_DIR, { recursive: true });
});

type Provider = 'github' | 'google' | 'linkedin';

const providers: Provider[] = ['github', 'google', 'linkedin'];

for (const provider of providers) {
  test(`seed ${provider} session`, async ({ page }) => {
    test.setTimeout(SEED_TIMEOUT);

    await page.goto('/auth/login');

    const providerLabel = provider[0].toUpperCase() + provider.slice(1);
    const trigger = page
      .getByRole('button', { name: new RegExp(providerLabel, 'i') })
      .or(page.getByRole('link', { name: new RegExp(providerLabel, 'i') }))
      .or(page.locator(`[aria-label*="${providerLabel}" i]`))
      .first();

    await expect(trigger, `${provider} sign-in trigger`).toBeVisible({ timeout: 20_000 });
    await trigger.click();

    await page.waitForURL(
      (url) => !url.pathname.startsWith('/auth/') && !url.host.endsWith('localhost:3099') === false
        ? !url.pathname.startsWith('/auth/')
        : !url.pathname.startsWith('/auth/'),
      { timeout: SEED_TIMEOUT },
    );

    const meRes = await page.request.get('/api/me');
    expect(meRes.ok(), `/api/me must return 2xx after ${provider} sign-in`).toBe(true);
    const me = await meRes.json();
    expect(me.user, `/api/me must include user payload for ${provider}`).toBeTruthy();

    const statePath = path.join(AUTH_DIR, `${provider}.json`);
    await page.context().storageState({ path: statePath });
    console.log(`[seed] Wrote ${statePath}`);
  });
}
