import { test, expect } from '@playwright/test';

const BASE_URL = process.env.WEB_URL || 'http://localhost:3099';

// Login is OAuth-only as of 2026-04-29 (no email/password). The historical
// email-attempt sub-tests were removed when the form was deprecated; the
// surface this spec verifies is the three OAuth provider buttons + a redirect
// path to /api/auth/signin/<provider> when clicked.

test.describe('OAuth Flow', () => {
  test('login page renders 3 OAuth providers + back-link', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/login`);

    // OAuth provider buttons (next-auth v5 wired via OAuthButtons.tsx)
    for (const name of ['Google', 'GitHub', 'LinkedIn']) {
      await expect(
        page.getByRole('button', { name: new RegExp(`Continue with ${name}`) })
      ).toBeVisible();
    }

    // Back-to-home affordance
    await expect(page.getByRole('link', { name: /Back to home/ })).toBeVisible();

    await page.screenshot({ path: 'test-results/e2e/web-login.png' });
  });

  test('GitHub button initiates next-auth signin redirect', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/login`);

    const githubBtn = page.getByRole('button', { name: /Continue with GitHub/ });
    await expect(githubBtn).toBeVisible();

    // Don't actually traverse to github.com (would need real OAuth app + secrets);
    // instead, intercept the network request and confirm next-auth's signin handler is hit.
    const signinPromise = page.waitForRequest(
      (req) => req.url().includes('/api/auth/signin/github') || req.url().includes('github.com/login/oauth'),
      { timeout: 5_000 }
    );

    await githubBtn.click();
    const signinReq = await signinPromise.catch(() => null);

    // Either the signin endpoint fired OR the page navigated; both prove the button works.
    expect(signinReq !== null || page.url() !== `${BASE_URL}/auth/login`).toBe(true);

    await page.screenshot({ path: 'test-results/e2e/web-github-redirect.png' });
  });

  test('auth error page renders Try-again CTA', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/error?error=Default`);
    await expect(page.getByRole('heading', { name: /Authentication Error/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Try again/ })).toBeVisible();
  });
});
