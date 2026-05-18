'use client'

import { motion } from 'framer-motion'
import {
  GlowCard,
  DataTable,
  CalloutBlock,
  ProseBlock,
} from '@/components/blueprint/BlueprintSection'
import {
  GAP_ITEMS,
  type BpScenario,
  type GapItem,
} from '@/lib/patent-3-data'

interface Props {
  scenario: BpScenario
}

const TRACK_ACCENT: Record<GapItem['track'], string> = {
  Theory: '#A78BFA',
  Measurement: '#34D399',
}

export const Section6T1GapRoadmap = ({ scenario }: Props) => {
  // Sort by start day, then duration
  const items = [...GAP_ITEMS].sort((a, b) => a.startDay - b.startDay || a.durationDay - b.durationDay)
  const maxDay = Math.max(...items.map((i) => i.startDay + i.durationDay))

  const W = 760
  const H = items.length * 44 + 60
  const labelW = 290
  const chartX = labelW + 16
  const chartW = W - chartX - 30

  const tableRows = items.map((g) => [
    g.id,
    g.track,
    `${g.effortMin}-${g.effortMax} h`,
    g.closesUnder.includes(scenario) ? 'CLOSES' : 'OPEN',
    g.desc,
  ])

  return (
    <div className="space-y-10">
      <ProseBlock
        paragraphs={[
          'Open gaps from SHIP_READINESS and Option B that block IACR ePrint and arXiv. T1 (mixed-domain ARE extraction reduction) is the binding constraint; closing it converts the patent from "applied auditability tool" into a foundational extractor patent and lifts the optimistic valuation.',
          `Scenario currently selected: ${scenario}. The optimistic scenario assumes T1 closes inside the 12-month PCT window; conservative assumes T1 remains open and only the GF(p^n) subcase is published.`,
        ]}
      />

      <GlowCard accent="#A78BFA">
        <h3
          className="text-lg font-semibold text-slate-100 mb-1"
          style={{ fontFamily: 'var(--font-fraunces)' }}
        >
          Publication Gap Gantt
        </h3>
        <p className="text-xs text-slate-500 mb-6" style={{ fontFamily: 'var(--font-dm-sans)' }}>
          Theory gaps T1-T5 in violet; measurement gaps M1-M3 in emerald. Bars closing under the current scenario are full opacity.
        </p>

        <div className="w-full overflow-x-auto">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 720 }}>
            <defs>
              <linearGradient id="p3-gantt-bar" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%" stopColor="#A78BFA" stopOpacity={0.6} />
                <stop offset="100%" stopColor="#A78BFA" stopOpacity={0.2} />
              </linearGradient>
            </defs>

            {/* Header axis */}
            <line x1={chartX} x2={chartX + chartW} y1={30} y2={30} stroke="rgba(255,255,255,0.18)" />
            {Array.from({ length: 4 }).map((_, i) => {
              const day = ((i + 1) / 4) * maxDay
              const x = chartX + (day / maxDay) * chartW
              return (
                <g key={`ax-${i}`}>
                  <line x1={x} x2={x} y1={30} y2={H - 20} stroke="rgba(255,255,255,0.05)" />
                  <text
                    x={x}
                    y={22}
                    textAnchor="middle"
                    fill="#64748b"
                    fontSize={10}
                    fontFamily="var(--font-jetbrains)"
                  >
                    +{Math.round(day)}d
                  </text>
                </g>
              )
            })}

            {items.map((it, i) => {
              const y = 50 + i * 44
              const x = chartX + (it.startDay / maxDay) * chartW
              const w = Math.max(20, (it.durationDay / maxDay) * chartW)
              const accent = TRACK_ACCENT[it.track]
              const closes = it.closesUnder.includes(scenario)
              return (
                <g key={it.id}>
                  {/* Row background */}
                  <rect
                    x={0}
                    y={y - 14}
                    width={W}
                    height={32}
                    fill={i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent'}
                  />

                  {/* Label */}
                  <text
                    x={16}
                    y={y + 5}
                    fill="#cbd5e1"
                    fontSize={12}
                    fontFamily="var(--font-dm-sans)"
                  >
                    {it.label}
                  </text>

                  {/* Effort badge */}
                  <text
                    x={labelW + 4}
                    y={y + 5}
                    textAnchor="end"
                    fill="#64748b"
                    fontSize={10}
                    fontFamily="var(--font-jetbrains)"
                  >
                    {it.effortMin}-{it.effortMax}h
                  </text>

                  {/* Gantt bar */}
                  <motion.rect
                    x={x}
                    y={y - 10}
                    width={w}
                    height={22}
                    rx={5}
                    fill={accent}
                    fillOpacity={closes ? 0.65 : 0.18}
                    stroke={accent}
                    strokeWidth={closes ? 1.6 : 1}
                    strokeOpacity={closes ? 0.95 : 0.5}
                    initial={{ scaleX: 0, transformOrigin: `${x}px center` }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.1 + i * 0.06 }}
                  />

                  {/* Status label inside bar */}
                  {w > 60 && (
                    <text
                      x={x + 8}
                      y={y + 5}
                      fill={accent}
                      fontSize={10}
                      fontWeight={600}
                      fontFamily="var(--font-jetbrains)"
                    >
                      {closes ? 'closes' : 'open'}
                    </text>
                  )}
                </g>
              )
            })}
          </svg>
        </div>

        <p
          className="text-[10px] text-slate-500 mt-2"
          style={{ fontFamily: 'var(--font-jetbrains)' }}
        >
          Source: docs/research/paper-3-che-are-provenance/zenodo-paper3-option-b-gaps.md · effort hours [unverified, founder estimate].
        </p>
      </GlowCard>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <DataTable
          accent="#A78BFA"
          headers={['Gap', 'Track', 'Effort', `Under ${scenario}`, 'Description']}
          rows={tableRows}
        />
        <p
          className="text-[10px] text-slate-500 mt-2"
          style={{ fontFamily: 'var(--font-jetbrains)' }}
        >
          Source: docs/research/eprint/SHIP_READINESS.md · Zenodo accepts today; ePrint waits on T1 + M1-M3.
        </p>
      </motion.div>

      <CalloutBlock
        type="insight"
        title="Asymmetric upside on T1"
        text="Probability of T1 closure in the 10-year horizon: 30-50% [unverified, founder estimate]. If T1 closes in published form, the ARE family becomes a foundational extractor patent licensable into any cryptographic library using seeded extractors. Optimistic-scenario valuation is conditional on this outcome."
      />
    </div>
  )
}
