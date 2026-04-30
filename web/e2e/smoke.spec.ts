import { test, expect, type ConsoleMessage } from '@playwright/test';

/** Filter out benign console errors so the smoke gate only fails on real product errors. */
function isKnownBenignError(text: string): boolean {
  return (
    // WebGL: no GPU in headless Chromium
    text.includes('WebGLRenderer') ||
    text.includes('WebGL context') ||
    // 404s on non-critical static assets
    text.includes('Failed to load resource') ||
    // next-auth provider list 404 when running without OAuth secrets in local env
    text.includes('/api/auth/providers') ||
    // Hydration warnings emitted by Framer Motion / Radix without action items
    text.includes('Extra attributes from the server') ||
    text.includes('hydration')
  );
}

test.describe('Landing page', () => {
  test('loads with hero content', async ({ page }) => {
    // domcontentloaded, not networkidle: home keeps long-lived analytics requests
    // open and never reaches idle, causing 30s timeout.
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1')).toContainText('Quantum-Secure', { timeout: 20_000 });
    await expect(page.getByText(/NIST FIPS 203/i).first()).toBeVisible({ timeout: 10_000 });
    await page.screenshot({ path: 'e2e/screenshots/landing.png', fullPage: false });
  });

  test('waitlist section shows sign-in prompt for unauthenticated users', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    // WaitlistForm is a Client Component that renders the sign-in card only
    // after useSession() resolves to "unauthenticated". This requires a /api/auth/session
    // round-trip; allow up to 25s.
    const signInHeading = page.getByRole('heading', { name: /Sign in to join/i });
    await signInHeading.scrollIntoViewIfNeeded().catch(() => undefined);
    await expect(signInHeading).toBeVisible({ timeout: 25_000 });
  });
});

test.describe('Navigation', () => {
  test('Features link navigates to /features', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('navigation', { name: 'Main navigation' })
      .getByRole('link', { name: 'Features' }).click();
    await expect(page).toHaveURL(/\/features/);
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Key routes load', () => {
  test('dashboard renders', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toBeVisible();
    await page.screenshot({ path: 'e2e/screenshots/dashboard.png', fullPage: false });
  });

  test('pitch deck renders', async ({ page }) => {
    await page.goto('/invest', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toBeVisible();
    await page.screenshot({ path: 'e2e/screenshots/pitch-deck.png', fullPage: false });
  });

  test('technology page loads', async ({ page }) => {
    await page.goto('/technology', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toBeVisible();
  });

  test('demo page loads', async ({ page }) => {
    await page.goto('/demo', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Console errors', () => {
  const routes = ['/', '/features', '/dashboard', '/invest', '/technology'];

  test('no unexpected console errors across pages', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg: ConsoleMessage) => {
      if (msg.type() === 'error' && !isKnownBenignError(msg.text())) {
        errors.push(`${page.url()}: ${msg.text()}`);
      }
    });

    for (const route of routes) {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2_000);
    }

    if (errors.length > 0) {
      console.log('Unexpected console errors:', errors);
    }
    expect(errors).toHaveLength(0);
  });
});
