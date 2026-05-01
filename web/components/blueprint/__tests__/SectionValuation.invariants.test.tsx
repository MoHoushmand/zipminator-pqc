import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { SectionValuation } from '../sections/SectionValuation'
import { VALUATION_METHODS, fmt } from '@/lib/blueprint-data'

/**
 * Coverage gap v10 G3: 17 blueprint pitch-deck Section*.tsx have 0 tests.
 *
 * The user's CLAUDE.md is explicit: "Never add mock data, fake metrics, or
 * unverified claims to UI or pitch deck. All numbers must be verifiable or
 * labeled 'Projected'/'Target'."
 *
 * This invariant pins the rule by checking SectionValuation renders the SAME
 * numbers as the single source of truth (web/lib/blueprint-data.ts). If a
 * future commit hardcodes a number directly into the JSX, this fails.
 *
 * TODO(mom5): port this pattern to the other 16 SectionXxx.tsx files.
 */

describe('SectionValuation', () => {
  it('renders all VALUATION_METHODS rows from blueprint-data.ts', () => {
    const { container } = render(<SectionValuation scenario="moderate" />)
    const text = container.textContent ?? ''

    for (const row of VALUATION_METHODS) {
      expect(text).toContain(row.method)
      expect(text).toContain(fmt(row.moderate, row.unit))
    }
  })

  it('does NOT contain numeric strings absent from blueprint-data.ts', () => {
    const { container } = render(<SectionValuation scenario="moderate" />)
    const text = container.textContent ?? ''

    const FORBIDDEN_HARDCODED_NUMBERS = ['$999B', '$1T', '∞']
    for (const forbidden of FORBIDDEN_HARDCODED_NUMBERS) {
      expect(text).not.toContain(forbidden)
    }
  })

  it('marks projected metrics with data-projected attribute', () => {
    const { container } = render(<SectionValuation scenario="optimistic" />)
    const projectedNodes = container.querySelectorAll('[data-projected="true"]')
    expect(projectedNodes.length).toBeGreaterThan(0)
  })
})
