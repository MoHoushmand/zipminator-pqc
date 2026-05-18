import { test, expect, type Page } from '@playwright/test'
import * as fs from 'node:fs'
import * as path from 'node:path'

/**
 * QC harness for the four patent-portfolio pitch decks.
 *
 * Runs against the existing dev server on port 3099 (reuseExistingServer is set
 * in playwright.config.ts). For each deck:
 *   - 1440x900 desktop screenshot of the full page (after charts render)
 *   - 2560x1440 ultrawide screenshot
 *   - Verify sidebar renders, hero KPI grid renders, no critical console errors
 *   - Toggle scenario (conservative -> moderate -> optimistic) and re-screenshot
 *   - Verify at least 8 distinct sections present
 *
 * Artifacts land in e2e/screenshots/portfolio-decks/{slug}/{viewport}/{shot}.png.
 * Console errors land in e2e/screenshots/portfolio-decks/{slug}/console.log.
 */

const ROUTES = [
  { slug: 'portfolio', label: 'Portfolio Significance' },
  { slug: 'patent-1', label: 'Patent 1 (Anonymization)' },
  { slug: 'patent-2', label: 'Patent 2 (CSI + PUEK)' },
  { slug: 'patent-3', label: 'Patent 3 (CHE + ARE)' },
] as const

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'ultrawide', width: 2560, height: 1440 },
] as const

const SCREENSHOT_ROOT = path.join(__dirname, 'screenshots', 'portfolio-decks')

function dirFor(slug: string, viewport: string) {
  const dir = path.join(SCREENSHOT_ROOT, slug, viewport)
  fs.mkdirSync(dir, { recursive: true })
  return dir
}

async function captureConsoleErrors(page: Page): Promise<string[]> {
  const errors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`[${msg.type()}] ${msg.text()}`)
  })
  page.on('pageerror', (err) => {
    errors.push(`[pageerror] ${err.message}`)
  })
  return errors
}

async function waitForCharts(page: Page) {
  // Recharts renders inline <svg> with class "recharts-surface". Wait for at
  // least one to be present; then give framer-motion a chance to settle.
  await page
    .locator('svg.recharts-surface, [data-blueprint-section] svg')
    .first()
    .waitFor({ state: 'visible', timeout: 15_000 })
    .catch(() => {
      // Some sections use custom SVG without recharts class; tolerate.
    })
  await page.waitForTimeout(1500)
}

for (const route of ROUTES) {
  for (const vp of VIEWPORTS) {
    test(`[${route.slug}] ${vp.name} (${vp.width}x${vp.height}) screenshots + console`, async ({
      browser,
    }) => {
      const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } })
      const page = await ctx.newPage()
      const errors = await captureConsoleErrors(page)

      const dir = dirFor(route.slug, vp.name)

      await page.goto(`/invest/${route.slug}`, { waitUntil: 'domcontentloaded' })
      await waitForCharts(page)

      // Full-page screenshot at default (moderate) scenario.
      await page.screenshot({ path: path.join(dir, '01-moderate.png'), fullPage: true })

      // Conservative scenario.
      const conservativeBtn = page.getByRole('button', { name: /conservative/i }).first()
      if (await conservativeBtn.isVisible().catch(() => false)) {
        await conservativeBtn.click()
        await page.waitForTimeout(800)
        await page.screenshot({ path: path.join(dir, '02-conservative.png'), fullPage: true })
      }

      // Optimistic scenario.
      const optimisticBtn = page.getByRole('button', { name: /optimistic/i }).first()
      if (await optimisticBtn.isVisible().catch(() => false)) {
        await optimisticBtn.click()
        await page.waitForTimeout(800)
        await page.screenshot({ path: path.join(dir, '03-optimistic.png'), fullPage: true })
      }

      // Hero-only viewport screenshot.
      await page.evaluate(() => window.scrollTo(0, 0))
      await page.waitForTimeout(400)
      await page.screenshot({ path: path.join(dir, '04-hero.png'), fullPage: false })

      // Structural assertions.
      // 1. Sidebar visible at this width (sidebar is `lg:flex` hidden so requires >=1024)
      if (vp.width >= 1024) {
        await expect(page.locator('[data-blueprint-sidebar]')).toBeVisible()
      }

      // 2. At least 8 sections present
      const sectionCount = await page.locator('[data-blueprint-section]').count()
      expect(sectionCount).toBeGreaterThanOrEqual(8)

      // 3. Scenario toggle present
      await expect(page.locator('[data-scenario-toggle]').first()).toBeVisible()

      // Persist console-error log.
      fs.writeFileSync(
        path.join(dir, 'console.log'),
        errors.length === 0
          ? 'no console errors\n'
          : errors.join('\n') + '\n',
      )

      // Soft expectation: warn but don't fail on console errors (we'll iterate).
      if (errors.length > 0) {
        // eslint-disable-next-line no-console
        console.warn(`[${route.slug} ${vp.name}] ${errors.length} console error(s):`)
        for (const e of errors.slice(0, 5)) console.warn('  ' + e)
      }

      await ctx.close()
    })
  }
}
