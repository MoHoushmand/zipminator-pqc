import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const AXE_SRC = readFileSync(
  '/Users/mom5/dev/qdaria/apps/qdaria-astro-new/node_modules/axe-core/axe.min.js',
  'utf8'
);

const OUT = '/Users/mom5/dev/qdaria/apps/zipminator/core/_archive/audit-2026-04-28/web-landing/wcag-axe-report.json';

const TARGETS = [
  { app: 'web', name: 'landing', url: 'http://localhost:3099/' },
  { app: 'web', name: 'features', url: 'http://localhost:3099/features' },
  { app: 'web', name: 'technology', url: 'http://localhost:3099/technology' },
  { app: 'web', name: 'demo', url: 'http://localhost:3099/demo' },
  { app: 'web', name: 'docs', url: 'http://localhost:3099/docs' },
  { app: 'web', name: 'invest', url: 'http://localhost:3099/invest' },
  { app: 'web', name: 'invest-blueprint', url: 'http://localhost:3099/invest/blueprint' },
  { app: 'web', name: 'auth-login', url: 'http://localhost:3099/auth/login' },
  { app: 'web', name: 'auth-error', url: 'http://localhost:3099/auth/error?error=Default' },
  { app: 'web', name: 'privacy', url: 'http://localhost:3099/privacy' },
  { app: 'web', name: 'terms', url: 'http://localhost:3099/terms' },
  { app: 'astro', name: 'home', url: 'http://localhost:4321/' },
  { app: 'astro', name: 'products', url: 'http://localhost:4321/products' },
  { app: 'astro', name: 'business-plan', url: 'http://localhost:4321/business-plan' },
  { app: 'astro', name: 'features', url: 'http://localhost:4321/features' },
  { app: 'astro', name: 'contact', url: 'http://localhost:4321/contact' },
  { app: 'astro', name: 'quantum-security', url: 'http://localhost:4321/quantum-security' },
  { app: 'astro', name: 'solutions', url: 'http://localhost:4321/solutions' },
  { app: 'astro', name: 'divisions', url: 'http://localhost:4321/divisions' },
  { app: 'astro', name: 'tech-products', url: 'http://localhost:4321/technology/products' },
  { app: 'astro', name: 'auth-login', url: 'http://localhost:4321/auth/login' },
  { app: 'astro', name: 'signup', url: 'http://localhost:4321/signup' },
];

const results: any[] = [];

for (const t of TARGETS) {
  test(`@axe ${t.app}/${t.name}`, async ({ page }) => {
    const start = Date.now();
    let status = 0;
    try {
      const resp = await page.goto(t.url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      status = resp?.status() ?? 0;
      await page.waitForTimeout(1500);
      await page.addScriptTag({ content: AXE_SRC });
      const axe: any = await page.evaluate(async () => {
        // @ts-ignore
        return await (window as any).axe.run(document, {
          runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
          resultTypes: ['violations', 'incomplete'],
        });
      });
      const summary = {
        app: t.app,
        name: t.name,
        url: t.url,
        status,
        ms: Date.now() - start,
        violations: axe.violations.map((v: any) => ({
          id: v.id,
          impact: v.impact,
          help: v.help,
          tags: v.tags,
          nodes: v.nodes.length,
          targets: v.nodes.slice(0, 3).map((n: any) => n.target),
        })),
        incomplete: axe.incomplete.map((v: any) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length })),
        violationCount: axe.violations.length,
        criticalCount: axe.violations.filter((v: any) => v.impact === 'critical').length,
        seriousCount: axe.violations.filter((v: any) => v.impact === 'serious').length,
      };
      results.push(summary);
      console.log(`AXE ${t.app}/${t.name}: ${summary.violationCount} (crit=${summary.criticalCount} ser=${summary.seriousCount})`);
    } catch (e: any) {
      results.push({ app: t.app, name: t.name, url: t.url, error: String(e?.message ?? e) });
    }
  });
}

test.afterAll(() => {
  writeFileSync(OUT, JSON.stringify({ generated: new Date().toISOString(), targets: results }, null, 2));
  console.log(`Wrote ${OUT}`);
  const totalViol = results.reduce((s, r) => s + (r.violationCount || 0), 0);
  const totalCrit = results.reduce((s, r) => s + (r.criticalCount || 0), 0);
  const totalSer = results.reduce((s, r) => s + (r.seriousCount || 0), 0);
  console.log(`AXE_TOTAL viol=${totalViol} critical=${totalCrit} serious=${totalSer} pages=${results.length}`);
});
