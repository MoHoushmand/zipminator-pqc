'use client'

import { motion } from 'framer-motion'
import {
  GlowCard,
  DataTable,
  CalloutBlock,
  ProseBlock,
  Subsection,
} from '@/components/blueprint/BlueprintSection'
import { REGULATORY_GANTT, type BpScenario } from '@/lib/patent-1-data'

interface Props {
  scenario: BpScenario
}

// SVG coordinates
const SVG_WIDTH = 920
const SVG_HEIGHT = 360
const PAD_LEFT = 180
const PAD_RIGHT = 40
const PAD_TOP = 40
const ROW_HEIGHT = 38
const YEAR_MIN = 2018
const YEAR_MAX = 2035

const xForYear = (year: number) =>
  PAD_LEFT + ((year - YEAR_MIN) / (YEAR_MAX - YEAR_MIN)) * (SVG_WIDTH - PAD_LEFT - PAD_RIGHT)

export const Section7RegulatoryGantt = ({ scenario }: Props) => {
  const today = 2026.4 // May 2026 marker

  return (
    <div className="space-y-10">
      <ProseBlock
        paragraphs={[
          'The timeline aligns GDPR Recital 26 (in force 2018) and DORA Article 6.4 (enforced 1 July 2025) with the Patent 1 prosecution arc: Norwegian priority filed 2026-03-24, PCT international phase in 2027, with Norwegian, EPO, and USPTO grants landing between 2028 and 2033 depending on scenario.',
          'The shaded bars are scenario-driven. Optimistic compresses prosecution timelines; conservative extends them. Today sits at the May 2026 marker.',
        ]}
      />

      <GlowCard accent="#F59E0B">
        <h3
          className="text-lg font-semibold text-slate-100 mb-1"
          style={{ fontFamily: 'var(--font-fraunces), Georgia, serif' }}
        >
          Regulatory and prosecution timeline
        </h3>
        <p className="text-sm text-slate-500 mb-6" style={{ fontFamily: 'var(--font-dm-sans)' }}>
          Horizontal Gantt; scenario = {scenario}.
        </p>

        <svg viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} className="w-full h-auto">
          {/* Year ticks */}
          {Array.from({ length: (YEAR_MAX - YEAR_MIN) / 2 + 1 }, (_, i) => YEAR_MIN + i * 2).map(
            (yr) => (
              <g key={yr}>
                <line
                  x1={xForYear(yr)}
                  y1={PAD_TOP - 8}
                  x2={xForYear(yr)}
                  y2={SVG_HEIGHT - 20}
                  stroke="rgba(255,255,255,0.04)"
                  strokeWidth={1}
                />
                <text
                  x={xForYear(yr)}
                  y={PAD_TOP - 14}
                  textAnchor="middle"
                  fill="#64748b"
                  fontSize={10}
                  fontFamily="var(--font-jetbrains)"
                >
                  {yr}
                </text>
              </g>
            )
          )}

          {/* Today marker */}
          <line
            x1={xForYear(today)}
            y1={PAD_TOP - 10}
            x2={xForYear(today)}
            y2={SVG_HEIGHT - 20}
            stroke="#22D3EE"
            strokeWidth={1.5}
            strokeOpacity={0.5}
            strokeDasharray="4 3"
          />
          <text
            x={xForYear(today)}
            y={SVG_HEIGHT - 6}
            textAnchor="middle"
            fill="#22D3EE"
            fontSize={10}
            fontFamily="var(--font-jetbrains)"
          >
            now
          </text>

          {/* Rows */}
          {REGULATORY_GANTT.map((row, i) => {
            const y = PAD_TOP + 20 + i * ROW_HEIGHT
            const x1 = xForYear(row.startYear)
            const x2 = xForYear(row.endYear[scenario])
            const width = Math.max(8, x2 - x1)
            return (
              <motion.g
                key={row.id}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
              >
                <text
                  x={PAD_LEFT - 10}
                  y={y + 16}
                  textAnchor="end"
                  fill="#cbd5e1"
                  fontSize={11}
                  fontFamily="var(--font-dm-sans)"
                >
                  {row.label}
                </text>
                <rect
                  x={x1}
                  y={y + 4}
                  width={width}
                  height={22}
                  rx={5}
                  fill={`${row.accent}33`}
                  stroke={row.accent}
                  strokeWidth={1.3}
                />
                <text
                  x={x1 + 8}
                  y={y + 19}
                  fill={row.accent}
                  fontSize={10}
                  fontFamily="var(--font-jetbrains)"
                >
                  {row.category.toUpperCase()}
                </text>
                <text
                  x={x2 - 6}
                  y={y + 19}
                  textAnchor="end"
                  fill="#e2e8f0"
                  fontSize={10}
                  fontFamily="var(--font-jetbrains)"
                >
                  {row.endYear[scenario]}
                </text>
              </motion.g>
            )
          })}
        </svg>
      </GlowCard>

      <p
        className="text-[10px] text-slate-500"
        style={{ fontFamily: 'var(--font-jetbrains)' }}
      >
        Source: GDPR Recital 26 (2018); DORA 1 July 2025; Patentstyret application 20260384
        priority date 2026-03-24; PCT/EPO/USPTO timelines per WIPO and USPTO standard pendency.
      </p>

      <Subsection heading="Timeline detail" accent="#F59E0B">
        <DataTable
          accent="#F59E0B"
          headers={['Item', 'Category', 'Start', 'End (scenario)', 'Notes']}
          rows={REGULATORY_GANTT.map((r) => [
            r.label,
            r.category,
            String(r.startYear),
            String(r.endYear[scenario]),
            r.detail,
          ])}
        />
      </Subsection>

      <CalloutBlock
        type="warning"
        title="The DORA Article 6.4 alignment is load-bearing"
        text="DORA's quantum-readiness clause requires periodic crypto updates based on cryptanalysis developments. Patent 1's information-theoretic guarantee answers this clause structurally: no cryptanalysis development can defeat a destroyed mapping. If the EU adopts a quantum-certified anonymization reference architecture, Patent 1 is positioned to be the cited construction."
      />
    </div>
  )
}
