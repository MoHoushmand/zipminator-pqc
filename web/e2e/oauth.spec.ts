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

  // ──────────────────────────────────────────────────────────────────
  // v21 G5: tighter assertions + missing flow coverage.
  // ──────────────────────────────────────────────────────────────────

  test('GitHub button fires the signin endpoint specifically (not just any nav)', async ({ page }) => {
    // The original assertion at oauth.spec.ts:44 is `signinReq !== null || page.url() !== ...`.
    // That OR-truthy false-positives if a JS error or modal causes ANY URL change.
    // This test pins the specific assertion: the signin endpoint MUST be hit.
    await page.goto(`${BASE_URL}/auth/login`);
    const signinPromise = page.waitForRequest(
      (req) => req.url().includes('/api/auth/signin/github'),
      { timeout: 5_000 }
    );

    await page.getByRole('button', { name: /Continue with GitHub/ }).click();
    const signinReq = await signinPromise;

    expect(signinReq).not.toBeNull();
    expect(signinReq.url()).toContain('/api/auth/signin/github');
  });

  test('callback URL with malicious open-redirect is rejected', async ({ page }) => {
    // CSRF / open-redirect: hitting the callback with a hostile callbackUrl
    // must NOT navigate to the attacker domain. next-auth v5 should refuse
    // any callbackUrl whose origin differs from BASE_URL.
    await page.goto(
      `${BASE_URL}/api/auth/signin/github?callbackUrl=https://evil.example.com/steal`
    );
    // Either we end up on the OAuth provider OR we stay on our origin.
    // What we MUST NOT see: a navigation to evil.example.com with our session.
    await page.waitForLoadState('domcontentloaded');
    const finalUrl = page.url();
    expect(finalUrl).not.toContain('evil.example.com');
  });

  test('error page handles arbitrary error param without XSS', async ({ page }) => {
    // The error param flows through to the page. Confirm it is escaped, not
    // rendered as HTML. A regression here is a stored-XSS primitive on a
    // page users land on after a failed login.
    const xssPayload = '<script>window.__pwned=true</script>';
    await page.goto(`${BASE_URL}/auth/error?error=${encodeURIComponent(xssPayload)}`);
    const pwned = await page.evaluate(() => (window as any).__pwned);
    expect(pwned).toBeUndefined();
  });

  // TODO(mom5): user-contribution required.
  // The sign-out flow is not currently tested. There are two viable shapes:
  //   (S1) Click the sign-out button on /dashboard and assert redirect to /
  //       (requires an authed storageState; see playwright.config.ts `authed`
  //       project at line 36-42).
  //   (S2) POST /api/auth/signout directly and assert the next-auth.session-token
  //       cookie is cleared.
  // Pick one. S1 is more end-to-end; S2 is faster and CI-friendlier.
  test.skip('sign-out clears session', async ({ page }) => {
    // Implement after picking S1 or S2.
  });
});
