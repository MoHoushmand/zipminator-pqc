import pillarsJson from '@/pillars.json'
import type { PillarSlug } from '@/lib/blueprint-data'

interface PillarEntry {
  slug: string
  tests_pass_ratio: number
  features_shipped_ratio: number
  lighthouse_target_met: number
  a11y_violations_zero: number
  type_safety: number
  composite: number
}

interface PillarsFile {
  schema_version: number
  generated_at: string
  iter_dir: string
  weights: Record<string, number>
  composite_avg: number
  pillars: PillarEntry[]
}

const data = pillarsJson as PillarsFile

const bySlug = new Map<string, PillarEntry>(
  data.pillars.map((p) => [p.slug, p])
)

/**
 * Returns the live completion percentage (0-100) for a pillar, or null
 * when the live measurement has insufficient signal.
 *
 * "Insufficient signal" = every measured axis except `type_safety` is zero.
 * In that state the composite reflects the type-check passing and nothing
 * else, so the caller should fall back to the hand-authored baseline in
 * `blueprint-data.ts` instead of painting a misleadingly low number.
 */
export const getLiveCompletion = (slug: PillarSlug): number | null => {
  const entry = bySlug.get(slug)
  if (!entry) return null

  const measuredAxes = [
    entry.tests_pass_ratio,
    entry.features_shipped_ratio,
    entry.lighthouse_target_met,
    entry.a11y_violations_zero,
  ]
  const hasMeasuredSignal = measuredAxes.some((v) => v > 0)
  if (!hasMeasuredSignal) return null

  return Math.round(entry.composite * 100)
}
