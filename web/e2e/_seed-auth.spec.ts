import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const BASE_URL = process.env.WEB_URL || 'http://localhost:3099';

const PROVIDERS = [
  {
    id: 'github',
    label: /github/i,
    loginHost: /github\.com/,
    finishWhenUrlMatches: /localhost:3099|zipminator-pqc\.vercel\.app/,
  },
  {
    id: 'google',
    label: /google/i,
    loginHost: /accounts\.google\.com/,
    finishWhenUrlMatches: /localhost:3099|zipminator-pqc\.vercel\.app/,
  },
  {
    id: 'linkedin',
    label: /linkedin/i,
    loginHost: /linkedin\.com/,
    finishWhenUrlMatches: /localhost:3099|zipminator-pqc\.vercel\.app/,
  },
] as const;

for (const provider of PROVIDERS) {
  test(`seed ${provider.id} session`, async ({ page, context }) => {
    test.setTimeout(5 * 60_000);

    const storagePath = `e2e/.auth/${provider.id}.json`;
    mkdirSync(dirname(storagePath), { recursive: true });

    await page.goto(`${BASE_URL}/auth/login`);

    const btn = page
      .getByRole('button', { name: provider.label })
      .or(page.getByRole('link', { name: provider.label }))
      .or(page.locator(`[aria-label*="${provider.id}" i]`))
      .first();

    await expect(btn, `${provider.id} button on /auth/login`).toBeVisible({ timeout: 10_000 });
    await btn.click();

    await page.waitForURL(provider.loginHost, { timeout: 30_000 }).catch(() => {});

    await page.waitForURL(provider.finishWhenUrlMatches, { timeout: 4 * 60_000 });

    const cookies = await context.cookies();
    expect(cookies.length, `${provider.id}: no cookies captured`).toBeGreaterThan(0);

    await context.storageState({ path: storagePath });
  });
}
