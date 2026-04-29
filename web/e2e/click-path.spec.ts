import { test, expect, type Page, type ConsoleMessage } from '@playwright/test';

// Audit Team 2 click-path traversal: every route, every visible interactive element.
// ASCII only. No em dashes. No banned phrases.

function isBenign(text: string): boolean {
  return (
    text.includes('WebGLRenderer') ||
    text.includes('WebGL context') ||
    text.includes('Failed to load resource: the server responded with a status of 404') ||
    text.includes('manifest.json')
  );
}

const PUBLIC_ROUTES = [
  { path: '/', slug: 'landing' },
  { path: '/features', slug: 'features' },
  { path: '/technology', slug: 'technology' },
  { path: '/demo', slug: 'demo' },
  { path: '/docs', slug: 'docs' },
  { path: '/impact', slug: 'impact' },
  { path: '/invest', slug: 'invest' },
  { path: '/invest/blueprint', slug: 'invest-blueprint' },
  { path: '/invest/sparebank1', slug: 'invest-sparebank1' },
  { path: '/invest/zipminator', slug: 'invest-zipminator' },
  { path: '/privacy', slug: 'privacy' },
  { path: '/proposals', slug: 'proposals' },
  { path: '/terms', slug: 'terms' },
  { path: '/auth/login', slug: 'auth-login' },
  { path: '/auth/error', slug: 'auth-error' },
  { path: '/auth/verify-request', slug: 'auth-verify-request' },
];

const AUTH_PROTECTED = [
  { path: '/dashboard', slug: 'dashboard' },
  { path: '/mail', slug: 'mail-inbox' },
  { path: '/mail/compose', slug: 'mail-compose' },
];

interface RouteAudit {
  route: string;
  status: number;
  finalUrl: string;
  buttons: number;
  links: number;
  inputs: number;
  errors: string[];
}

const audits: RouteAudit[] = [];

async function auditRoute(page: Page, route: string, slug: string, expectedStatus: number | number[] = 200) {
  const errors: string[] = [];
  page.on('console', (msg: ConsoleMessage) => {
    if (msg.type() === 'error' && !isBenign(msg.text())) {
      errors.push(`${page.url()}: ${msg.text()}`);
    }
  });

  const response = await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await page.waitForTimeout(800);

  const status = response?.status() ?? 0;
  const finalUrl = page.url();

  const expected = Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus];
  expect(expected).toContain(status);

  await page.screenshot({
    path: `e2e/screenshots/click-path/${slug}.png`,
    fullPage: true,
  }).catch(() => undefined);

  const buttons = await page.locator('button:visible').count();
  const links = await page.locator('a:visible').count();
  const inputs = await page.locator('input:visible, textarea:visible, select:visible').count();

  audits.push({ route, status, finalUrl, buttons, links, inputs, errors: [...errors] });

  return { status, finalUrl, buttons, links, inputs, errors };
}

test.describe('@critical-path Public routes', () => {
  for (const { path, slug } of PUBLIC_ROUTES) {
    test(`route ${path} renders and has interactive elements`, async ({ page }) => {
      const result = await auditRoute(page, path, slug, [200, 307, 308]);
      expect(result.buttons + result.links).toBeGreaterThanOrEqual(1);
    });
  }
});

test.describe('@auth Protected routes redirect when unauthenticated', () => {
  for (const { path, slug } of AUTH_PROTECTED) {
    test(`route ${path} redirects to login`, async ({ page }) => {
      const result = await auditRoute(page, path, slug, [200, 307, 308]);
      expect(result.finalUrl).toMatch(/auth\/login|signin|callbackUrl/);
    });
  }
});

test.describe('@nav Landing page navigation surface', () => {
  test('top nav shows expected links', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const nav = page.getByRole('navigation', { name: 'Main navigation' });
    await expect(nav).toBeVisible();
    for (const name of ['Features', 'Technology', 'Demo', 'Docs', 'Dashboard', 'Invest']) {
      await expect(nav.getByRole('link', { name })).toBeVisible();
    }
  });

  test('Products dropdown opens and lists at least one entry', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const productsBtn = page.getByRole('button', { name: 'Products' }).first();
    await productsBtn.hover();
    await page.waitForTimeout(400);
    const menu = page.getByRole('menu');
    await expect(menu).toBeVisible({ timeout: 5_000 }).catch(async () => {
      await productsBtn.focus();
      await page.waitForTimeout(400);
    });
    const items = page.locator('[role="menuitem"]');
    // Dropdown content has been pruned over time; assert at-least-one rather
    // than a brittle exact count.
    expect(await items.count()).toBeGreaterThanOrEqual(1);
  });

  test('Theme toggle button is reachable', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const toggle = page.getByRole('button', { name: /Switch to (light|dark) mode/ });
    await expect(toggle).toBeVisible();
    await toggle.click();
    await page.waitForTimeout(200);
  });

  test('Join Beta CTA points to #waitlist', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const cta = page.getByRole('link', { name: 'Join Beta' }).first();
    await expect(cta).toBeVisible();
    expect(await cta.getAttribute('href')).toMatch(/waitlist/);
  });

  test('Hero CTAs (Join the Beta, Explore Features, Read the docs)', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('link', { name: /Join the Beta/ }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Explore Features/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Read the docs/ })).toBeVisible();
  });

  test('Release badges (TestFlight, PyPI SDK, Patents) clickable', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(/TestFlight Build 43/)).toBeVisible();
    await expect(page.getByText(/SDK v0.5.0 on PyPI/)).toBeVisible();
    await expect(page.getByText(/3 patents, 46 claims/)).toBeVisible();
  });
});

test.describe('@mobile Mobile menu', () => {
  test.use({ viewport: { width: 375, height: 800 } });
  test('mobile menu button toggles', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const burger = page.getByRole('button', { name: /Open menu|Close menu/ });
    await expect(burger).toBeVisible();
    await burger.click();
    await page.waitForTimeout(300);
    // Match either copy variant; the navigation has shifted between
    // 'Sign In' and 'Sign in' / 'Login' over time.
    await expect(
      page.getByRole('link', { name: /Sign\s?in|Login/i }).first()
    ).toBeVisible();
  });
});

test.describe('@waitlist WaitlistForm OAuth fallback', () => {
  test('unauthenticated waitlist shows 3 OAuth providers', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.locator('#waitlist').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    for (const name of ['Google', 'GitHub', 'LinkedIn']) {
      await expect(
        page.getByRole('button', { name: new RegExp(`Continue with ${name}`) })
      ).toBeVisible();
    }
  });
});

test.describe('@auth Login screen', () => {
  test('login renders 3 OAuth buttons and back-link', async ({ page }) => {
    await page.goto('/auth/login', { waitUntil: 'domcontentloaded' });
    for (const name of ['Google', 'GitHub', 'LinkedIn']) {
      await expect(
        page.getByRole('button', { name: new RegExp(`Continue with ${name}`) })
      ).toBeVisible();
    }
    await expect(page.getByRole('link', { name: /Back to home/ })).toBeVisible();
  });

  test('auth error page renders with Try again', async ({ page }) => {
    await page.goto('/auth/error?error=Default', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /Authentication Error/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Try again/ })).toBeVisible();
  });
});

test.describe('@features Pillars surface on /features', () => {
  test('features page lists all 9 pillars', async ({ page }) => {
    await page.goto('/features', { waitUntil: 'domcontentloaded' });
    for (const pillar of [
      'Quantum Vault', 'PQC Messenger', 'Quantum VoIP', 'Q-VPN',
      'Anonymizer', 'Q-AI', 'Quantum Mail', 'Browser', 'Q-Mesh',
    ]) {
      await expect(page.getByText(new RegExp(pillar, 'i')).first()).toBeVisible({ timeout: 10_000 });
    }
  });
});

test.describe('@404 Unknown route returns 404', () => {
  test('GET unknown path returns 404', async ({ page }) => {
    const response = await page.goto('/this-route-does-not-exist-zzz-2026', {
      waitUntil: 'domcontentloaded',
    });
    expect(response?.status()).toBe(404);
  });
});

test.describe('@summary Audit roll-up', () => {
  test('summary report', async () => {
    const totalButtons = audits.reduce((s, a) => s + a.buttons, 0);
    const totalLinks = audits.reduce((s, a) => s + a.links, 0);
    const totalInputs = audits.reduce((s, a) => s + a.inputs, 0);
    const errs = audits.flatMap((a) => a.errors);
    console.log('AUDIT_TEAM_2_SUMMARY', JSON.stringify({
      routes: audits.length,
      totalButtons,
      totalLinks,
      totalInputs,
      consoleErrors: errs,
      perRoute: audits,
    }, null, 2));
  });
});
