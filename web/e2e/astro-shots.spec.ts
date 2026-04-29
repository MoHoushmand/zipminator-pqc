import { test } from '@playwright/test';

const ASTRO_ROUTES = [
  { url: 'http://localhost:4321/', slug: 'astro-home' },
  { url: 'http://localhost:4321/products', slug: 'astro-products' },
  { url: 'http://localhost:4321/features', slug: 'astro-features' },
  { url: 'http://localhost:4321/solutions', slug: 'astro-solutions' },
  { url: 'http://localhost:4321/divisions', slug: 'astro-divisions' },
  { url: 'http://localhost:4321/business-plan', slug: 'astro-business-plan' },
  { url: 'http://localhost:4321/contact', slug: 'astro-contact' },
  { url: 'http://localhost:4321/quantum-security', slug: 'astro-quantum-security' },
  { url: 'http://localhost:4321/technology/products', slug: 'astro-tech-products' },
  { url: 'http://localhost:4321/technology/products/zipminator', slug: 'astro-tech-zipminator' },
  { url: 'http://localhost:4321/auth/login', slug: 'astro-auth-login' },
  { url: 'http://localhost:4321/signup', slug: 'astro-signup' },
];

for (const r of ASTRO_ROUTES) {
  test(`@astro-shot ${r.slug}`, async ({ page }) => {
    await page.goto(r.url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(1500);
    await page.screenshot({
      path: `/Users/mom5/dev/qdaria/apps/zipminator/core/_archive/audit-2026-04-28/web-landing/screenshots/${r.slug}.png`,
      fullPage: true,
    });
  });
}
