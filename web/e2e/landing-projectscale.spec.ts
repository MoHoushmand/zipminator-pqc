import { test, expect } from '@playwright/test'
import * as fs from 'node:fs'
import * as path from 'node:path'

/**
 * Verifies the refreshed ProjectScale "What It Would Take to Build This From
 * Scratch" comparison card on the landing page. Screenshots the card at
 * desktop width and asserts the new headline numbers are present.
 */
test('landing ProjectScale card shows 45-70 / 36-48 / $35-65M+', async ({ browser }) => {
  test.setTimeout(60_000)

  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()

  await page.goto('/', { waitUntil: 'domcontentloaded' })

  // Scroll the comparison heading into view, then settle framer-motion.
  const heading = page.getByRole('heading', {
    name: /What It Would Take to Build This From Scratch/i,
  })
  await heading.waitFor({ state: 'visible', timeout: 15_000 })
  await heading.scrollIntoViewIfNeeded()
  await page.waitForTimeout(1200)

  // Assert the three refreshed numbers are on the page.
  await expect(page.getByText('45-70', { exact: false })).toBeVisible()
  await expect(page.getByText('36-48', { exact: false })).toBeVisible()
  await expect(page.getByText('$35-65M+', { exact: false })).toBeVisible()
  // And the new comparables line.
  await expect(page.getByText(/PQShield raised/i)).toBeVisible()

  // Screenshot the comparison card region (heading + 3 stats + footer).
  const card = heading.locator('xpath=ancestor::div[contains(@class, "rounded-2xl")][1]')
  const dir = path.join(__dirname, 'screenshots', 'landing')
  fs.mkdirSync(dir, { recursive: true })
  await card.screenshot({ path: path.join(dir, 'project-scale-refreshed.png') })

  await ctx.close()
})
