'use client'

import { motion } from 'framer-motion'
import { Fragment, useState } from 'react'
import { HEATMAP_RATES, HEATMAP_VOLUMES_M, type BpScenario } from '@/lib/patent-2-data'
import {
  GlowCard,
  DataTable,
  CalloutBlock,
  ProseBlock,
  Subsection,
} from '@/components/blueprint/BlueprintSection'

interface Props {
  scenario: BpScenario
}

// Scenario shifts the recommended (rate, volume) operating point
const RECOMMENDED_BY_SCENARIO: Record<BpScenario, { rate: number; volumeM: number }> = {
  conservative: { rate: 0.02, volumeM: 20 },
  moderate: { rate: 0.05, volumeM: 80 },
  optimistic: { rate: 0.10, volumeM: 300 },
}

// Map revenue ($M) to color intensity (oklch-style scale, emerald primary)
const revColor = (revUsdM: number, maxRev: number) => {
  const t = Math.min(1, revUsdM / maxRev)
  const power = Math.pow(t, 0.55)
  const alpha = 0.15 + 0.7 * power
  return `rgba(52, 211, 153, ${alpha.toFixed(3)})`
}

export const Section9RoyaltyHeatmap = ({ scenario }: Props) => {
  const [hover, setHover] = useState<{ rate: number; vol: number } | null>(null)
  const recommended = RECOMMENDED_BY_SCENARIO[scenario]

  // Compute the matrix
  const matrix = HEATMAP_RATES.map((rate) =>
    HEATMAP_VOLUMES_M.map((vol) => ({
      rate,
      vol,
      rev: rate * vol,  // USD * M = $M
    }))
  )
  const maxRev = Math.max(...matrix.flat().map((c) => c.rev))

  return (
    <div className="space-y-10">
      <ProseBlock
        paragraphs={[
          'Two levers fully determine annual royalty: per-device rate and licensed volume. The matrix below maps every (rate, volume) pair to annual revenue in millions of USD. Darker green = higher revenue. The starred cell highlights the recommended operating point under the current scenario.',
        ]}
      />

      <Subsection heading="Royalty Heatmap · Rate × Volume" accent="#34D399">
        <GlowCard accent="#34D399">
          <div className="overflow-x-auto">
            <div
              className="grid gap-1 min-w-[680px]"
              style={{ gridTemplateColumns: `120px repeat(${HEATMAP_VOLUMES_M.length}, 1fr)` }}
            >
              {/* Header row */}
              <div className="p-2 text-xs text-slate-500 uppercase tracking-wider self-end" style={{ fontFamily: 'var(--font-jetbrains)' }}>
                rate ↓ · volume →
              </div>
              {HEATMAP_VOLUMES_M.map((vol) => (
                <div
                  key={vol}
                  className="p-2 text-center text-[11px]"
                  style={{ fontFamily: 'var(--font-jetbrains)', color: '#94a3b8' }}
                >
                  {vol}M
                </div>
              ))}

              {/* Body */}
              {matrix.map((row, ri) => (
                <Fragment key={`row-${ri}`}>
                  <div
                    className="p-2 flex items-center justify-end text-[11px]"
                    style={{ fontFamily: 'var(--font-jetbrains)', color: '#94a3b8' }}
                  >
                    ${HEATMAP_RATES[ri].toFixed(2)}/device
                  </div>
                  {row.map((c, ci) => {
                    const isRecommended = c.rate === recommended.rate && c.vol === recommended.volumeM
                    const isHover = hover && hover.rate === c.rate && hover.vol === c.vol
                    return (
                      <motion.div
                        key={`cell-${ri}-${ci}`}
                        initial={{ opacity: 0, scale: 0.85 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.3, delay: 0.05 + (ri * HEATMAP_VOLUMES_M.length + ci) * 0.015 }}
                        className="aspect-square rounded-md flex flex-col items-center justify-center cursor-pointer relative"
                        style={{
                          background: revColor(c.rev, maxRev),
                          border: isRecommended ? '2px solid #FB7185' : isHover ? '1px solid rgba(255,255,255,0.45)' : '1px solid rgba(255,255,255,0.06)',
                          boxShadow: isRecommended ? '0 0 18px rgba(251,113,133,0.45)' : undefined,
                        }}
                        onMouseEnter={() => setHover({ rate: c.rate, vol: c.vol })}
                        onMouseLeave={() => setHover(null)}
                      >
                        <span
                          className="text-[11px] font-bold"
                          style={{ fontFamily: 'var(--font-jetbrains)', color: c.rev > maxRev * 0.45 ? '#0f172a' : '#f1f5f9' }}
                        >
                          ${c.rev.toFixed(1)}M
                        </span>
                        {isRecommended && (
                          <span
                            className="absolute -top-2 -right-2 text-[9px] px-1.5 rounded-full"
                            style={{
                              background: '#FB7185',
                              color: '#0f172a',
                              fontFamily: 'var(--font-jetbrains)',
                              fontWeight: 700,
                            }}
                          >
                            ★
                          </span>
                        )}
                      </motion.div>
                    )
                  })}
                </Fragment>
              ))}
            </div>
          </div>

          {/* Color legend */}
          <div className="mt-5 flex items-center gap-3">
            <span className="text-[10px] text-slate-500" style={{ fontFamily: 'var(--font-jetbrains)' }}>
              $0M
            </span>
            <div
              className="flex-1 h-2 rounded-full"
              style={{
                background: `linear-gradient(90deg, ${revColor(0, maxRev)}, ${revColor(maxRev / 4, maxRev)}, ${revColor(maxRev / 2, maxRev)}, ${revColor((3 * maxRev) / 4, maxRev)}, ${revColor(maxRev, maxRev)})`,
              }}
            />
            <span className="text-[10px] text-slate-500" style={{ fontFamily: 'var(--font-jetbrains)' }}>
              ${maxRev.toFixed(0)}M
            </span>
          </div>
        </GlowCard>
        <p className="text-[10px] mt-2 text-slate-500" style={{ fontFamily: 'var(--font-jetbrains)' }}>
          Source: per-device royalty calibration from PQShield silicon-IP comparables (USD 65M raised, 2023); volume bins per ESP32-class IoT chipset shipment data, order-of-magnitude.
        </p>
      </Subsection>

      <DataTable
        accent="#34D399"
        headers={['Rate ($/device)', '5M', '20M', '80M', '300M', '800M']}
        rows={HEATMAP_RATES.map((rate) => [
          `$${rate.toFixed(2)}`,
          ...HEATMAP_VOLUMES_M.map((v) => `$${(rate * v).toFixed(1)}M`),
        ])}
      />

      <CalloutBlock
        type="insight"
        title={`Scenario ${scenario} · recommended cell`}
        text={`$${recommended.rate.toFixed(2)} per device × ${recommended.volumeM}M devices = $${(recommended.rate * recommended.volumeM).toFixed(1)}M annual royalty. Marked with ★ in the matrix. Conservative rounds to chipmaker-tier volume at the floor rate; moderate moves to OEM endpoints; optimistic underwrites a defense-vertical anchor licensee at the $0.10 ceiling.`}
        accent="#FB7185"
      />
    </div>
  )
}
