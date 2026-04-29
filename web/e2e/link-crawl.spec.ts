import { test } from '@playwright/test';
import { writeFileSync } from 'node:fs';

const OUT = '/Users/mom5/dev/qdaria/apps/zipminator/core/_archive/audit-2026-04-28/web-landing/broken-links.md';

const STARTS = [
  { app: 'web', base: 'http://localhost:3099', paths: [
    '/', '/features', '/technology', '/demo', '/docs', '/invest', '/invest/blueprint',
    '/invest/sparebank1', '/invest/zipminator', '/impact', '/privacy', '/proposals',
    '/terms', '/auth/login', '/auth/error', '/auth/verify-request',
  ] },
  { app: 'astro', base: 'http://localhost:4321', paths: [
    '/', '/products', '/features', '/solutions', '/divisions', '/contact',
    '/business-plan', '/quantum-security', '/technology/products',
    '/technology/products/zipminator', '/auth/login', '/signup', '/thank-you',
    '/invest/pitch', '/invest/business-plan', '/invest/whitepaper',
  ] },
];

interface Row { app: string; from: string; href: string; status: number | string; text: string }
const rows: Row[] = [];

for (const start of STARTS) {
  for (const p of start.paths) {
    test(`@links ${start.app} ${p}`, async ({ page, request }) => {
      const url = `${start.base}${p}`;
      const seen = new Set<string>();
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
        await page.waitForTimeout(800);
      } catch (err: any) {
        rows.push({ app: start.app, from: p, href: '(navigation failed)', status: String(err.message ?? err), text: '' });
        return;
      }
      const anchors = page.locator('a[href]');
      const count = await anchors.count();
      const links: { href: string; text: string }[] = [];
      for (let i = 0; i < count; i++) {
        const el = anchors.nth(i);
        const href = (await el.getAttribute('href')) || '';
        const text = ((await el.textContent()) || '').trim().slice(0, 60);
        links.push({ href, text });
      }
      for (const { href, text } of links) {
        if (!href) continue;
        if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) continue;
        if (href.startsWith('javascript:')) continue;
        let abs = href;
        try {
          abs = new URL(href, url).toString();
        } catch {
          rows.push({ app: start.app, from: p, href, status: 'INVALID_URL', text });
          continue;
        }
        if (seen.has(abs)) continue;
        seen.add(abs);
        if (!abs.startsWith(start.base)) continue;
        try {
          const r = await request.get(abs, { maxRedirects: 0, timeout: 15_000 });
          rows.push({ app: start.app, from: p, href, status: r.status(), text });
        } catch (err: any) {
          rows.push({ app: start.app, from: p, href, status: `ERR: ${err.message ?? err}`, text });
        }
      }
    });
  }
}

test.afterAll(() => {
  const broken = rows.filter((r) => {
    const s = typeof r.status === 'number' ? r.status : 0;
    return typeof r.status === 'string' || s >= 400;
  });
  const lines: string[] = [];
  lines.push(`# Broken Links Report`);
  lines.push(``);
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push(``);
  lines.push(`- Total internal links inspected: ${rows.length}`);
  lines.push(`- Broken (>=400 or error): ${broken.length}`);
  lines.push(``);
  if (broken.length > 0) {
    lines.push(`## Broken`);
    lines.push(``);
    lines.push(`| App | From | Href | Status | Text |`);
    lines.push(`|---|---|---|---|---|`);
    for (const r of broken) {
      lines.push(`| ${r.app} | ${r.from} | ${r.href} | ${r.status} | ${r.text.replace(/\|/g, '\\|')} |`);
    }
  } else {
    lines.push(`## Broken`);
    lines.push(``);
    lines.push(`None.`);
  }
  lines.push(``);
  lines.push(`## All inspected (sample first 50)`);
  lines.push(``);
  lines.push(`| App | From | Href | Status |`);
  lines.push(`|---|---|---|---|`);
  for (const r of rows.slice(0, 50)) {
    lines.push(`| ${r.app} | ${r.from} | ${r.href} | ${r.status} |`);
  }
  writeFileSync(OUT, lines.join('\n'));
  console.log(`Wrote ${OUT}: ${rows.length} links, ${broken.length} broken.`);
});
