'use client'

import { motion } from 'framer-motion'
import {
  GlowCard,
  DataTable,
  CalloutBlock,
  ProseBlock,
} from '@/components/blueprint/BlueprintSection'
import {
  PRECEDENT_TIMELINE,
  type BpScenario,
} from '@/lib/patent-3-data'

interface Props {
  scenario: BpScenario
}

export const Section10PrecedentTimeline = ({ scenario }: Props) => {
  const items = [...PRECEDENT_TIMELINE].sort((a, b) => a.sortKey - b.sortKey)
  const minKey = items[0].sortKey
  const maxKey = items[items.length - 1].sortKey
  const span = maxKey - minKey || 1

  const W = 760
  const H = 380
  const padLeft = 60
  const padRight = 30
  const trackY = 200
  const trackW = W - padLeft - padRight

  // T1 closure flag affects whether 2026-Q3 ePrint glows
  const eprintClosed = scenario === 'optimistic' || scenario === 'moderate'

  const tableRows = items.map((p) => [p.date, p.actor, p.label, p.detail])

  return (
    <div className="space-y-10">
      <ProseBlock
        paragraphs={[
          'Patent 3 sits at the inflection point between the JPMorgan single-vendor certified randomness publication (March 2025) and the post-DORA enforcement era. To our knowledge, it is the first construction that produces multi-source certified entropy with end-to-end Merkle audit chains; JPMorgan published 71,313 certified bits via Quantinuum 56-qubit but did not address composition across multiple providers.',
          `Scenario currently selected: ${scenario}. Under optimistic and moderate scenarios the 2026-Q3 IACR ePrint milestone closes (T1 + M1 land in time). Under conservative it slips beyond the 12-month PCT window.`,
        ]}
      />

      <GlowCard accent="#A78BFA">
        <h3
          className="text-lg font-semibold text-slate-100 mb-1"
          style={{ fontFamily: 'var(--font-fraunces)' }}
        >
          Industry vs QDaria Precedent Timeline
        </h3>
        <p className="text-xs text-slate-500 mb-6" style={{ fontFamily: 'var(--font-dm-sans)' }}>
          Industry events above the axis; QDaria events below. Filing date 2026-04-05 anchored at center.
        </p>

        <div className="w-full overflow-x-auto">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 720 }}>
            <defs>
              <linearGradient id="p3-track" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%" stopColor="#22D3EE" stopOpacity={0.6} />
                <stop offset="50%" stopColor="#A78BFA" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#34D399" stopOpacity={0.6} />
              </linearGradient>
            </defs>

            {/* Axis line */}
            <motion.line
              x1={padLeft}
              y1={trackY}
              x2={W - padRight}
              y2={trackY}
              stroke="url(#p3-track)"
              strokeWidth={3}
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.0 }}
            />

            {/* Year ticks */}
            {[2025, 2026, 2027].map((y) => {
              const x = padLeft + ((y - minKey) / span) * trackW
              return (
                <g key={`tick-${y}`}>
                  <line x1={x} x2={x} y1={trackY - 6} y2={trackY + 6} stroke="rgba(255,255,255,0.25)" />
                  <text
                    x={x}
                    y={trackY + 22}
                    textAnchor="middle"
                    fill="#64748b"
                    fontSize={10}
                    fontFamily="var(--font-jetbrains)"
                  >
                    {y}
                  </text>
                </g>
              )
            })}

            {/* Events */}
            {items.map((event, i) => {
              const x = padLeft + ((event.sortKey - minKey) / span) * trackW
              const above = event.actor === 'Industry'
              const eprintEvent = event.label.startsWith('QDaria IACR ePrint')
              const fade = eprintEvent && !eprintClosed
              const y0 = trackY + (above ? -28 : 28)
              const y1 = trackY + (above ? -90 : 90)
              const cardY = above ? y1 - 50 : y1 - 8

              return (
                <motion.g
                  key={`evt-${i}`}
                  initial={{ opacity: 0, y: 6 }}
                  whileInView={{ opacity: fade ? 0.35 : 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: 0.2 + i * 0.08 }}
                >
                  {/* Connector */}
                  <line
                    x1={x}
                    y1={trackY}
                    x2={x}
                    y2={y1}
                    stroke={event.color}
                    strokeOpacity={0.55}
                    strokeWidth={1.4}
                  />
                  {/* Dot */}
                  <circle
                    cx={x}
                    cy={trackY}
                    r={5.5}
                    fill={event.color}
                    stroke="#020817"
                    strokeWidth={2}
                  />
                  {/* Card */}
                  <rect
                    x={x - 88}
                    y={cardY}
                    width={176}
                    height={56}
                    rx={6}
                    fill={event.color}
                    fillOpacity={0.10}
                    stroke={event.color}
                    strokeWidth={1}
                    strokeOpacity={0.5}
                  />
                  <text
                    x={x}
                    y={cardY + 16}
                    textAnchor="middle"
                    fill={event.color}
                    fontSize={9.5}
                    fontWeight={700}
                    fontFamily="var(--font-jetbrains)"
                  >
                    {event.date}
                  </text>
                  <text
                    x={x}
                    y={cardY + 30}
                    textAnchor="middle"
                    fill="#f1f5f9"
                    fontSize={10.5}
                    fontWeight={600}
                    fontFamily="var(--font-dm-sans)"
                  >
                    {event.label.length > 28 ? event.label.slice(0, 26) + '…' : event.label}
                  </text>
                  <text
                    x={x}
                    y={cardY + 44}
                    textAnchor="middle"
                    fill="#94a3b8"
                    fontSize={9}
                    fontFamily="var(--font-dm-sans)"
                  >
                    {event.detail.length > 36 ? event.detail.slice(0, 34) + '…' : event.detail}
                  </text>
                </motion.g>
              )
            })}

            {/* Legend */}
            <g transform={`translate(${padLeft}, 14)`}>
              <rect x={0} y={0} width={12} height={12} rx={2} fill="#22D3EE" fillOpacity={0.6} />
              <text x={18} y={10} fill="#cbd5e1" fontSize={10} fontFamily="var(--font-jetbrains)">
                Industry
              </text>
              <rect x={90} y={0} width={12} height={12} rx={2} fill="#A78BFA" fillOpacity={0.8} />
              <text x={108} y={10} fill="#cbd5e1" fontSize={10} fontFamily="var(--font-jetbrains)">
                QDaria
              </text>
            </g>

            <g transform={`translate(${W - 200}, 14)`}>
              <text x={0} y={10} fill="#64748b" fontSize={10} fontFamily="var(--font-jetbrains)">
                T1 closure under {scenario}: {scenario === 'conservative' ? 'no' : 'yes'}
              </text>
            </g>
          </svg>
        </div>

        <p
          className="text-[10px] text-slate-500 mt-2"
          style={{ fontFamily: 'var(--font-jetbrains)' }}
        >
          Source: Nature (March 2025) JPMorgan-Quantinuum 71,313 bits · docs/research/eprint/SHIP_READINESS.md · DORA enforcement 2025-07-01.
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
          headers={['Date', 'Actor', 'Event', 'Detail']}
          rows={tableRows}
        />
        <p
          className="text-[10px] text-slate-500 mt-2"
          style={{ fontFamily: 'var(--font-jetbrains)' }}
        >
          Source: docs/ip/_significance/patent-3-significance.md · Companion paper · PCT deadline 2027-04-05.
        </p>
      </motion.div>

      <CalloutBlock
        type="insight"
        title="Comparable benchmarks"
        text="SandboxAQ at approximately USD 5.6B valuation with USD 950M raised; PQShield USD 65M raised as co-author of all four NIST PQC standards. Patent 3 captures the regulatory-audit niche neither company holds as a core licensable primitive."
      />
    </div>
  )
}
