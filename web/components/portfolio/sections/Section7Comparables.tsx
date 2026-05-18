'use client'

import { motion } from 'framer-motion'
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
  ReferenceArea,
} from 'recharts'
import { DataTable, CalloutBlock } from '@/components/blueprint/BlueprintSection'
import { COMPARABLES_PORTFOLIO, type BpScenario, fmtUSD } from '@/lib/portfolio-data'

interface Props {
  scenario: BpScenario
}

// Scenario maps to which QDaria entry is highlighted
const SCENARIO_TARGET: Record<BpScenario, number> = {
  conservative: 120,
  moderate: 282,
  optimistic: 935,
}

const TOOLTIP_STYLE = {
  backgroundColor: 'rgba(17,24,39,0.95)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px',
  color: '#e2e8f0',
  fontSize: 12,
  fontFamily: 'var(--font-dm-sans), sans-serif',
}

export const Section7Comparables = ({ scenario }: Props) => {
  // Scale QDaria's two entries to the scenario
  const data = COMPARABLES_PORTFOLIO.map((c) => {
    if (c.company === 'QDaria portfolio') return { ...c, valuationUSDm: SCENARIO_TARGET[scenario] }
    if (c.company === 'QDaria ceiling') return { ...c, valuationUSDm: SCENARIO_TARGET[scenario] * 3.3 }
    return c
  }).filter((c) => c.valuationUSDm > 0)

  return (
    <div className="space-y-10">
      <p
        className="text-[15px] leading-relaxed text-slate-300"
        style={{ fontFamily: 'var(--font-dm-sans)' }}
      >
        QDaria&apos;s three filings, fully prosecuted and bundled, sit in the SandboxAQ + PQShield
        comparable band on patent-density grounds and above on regulatory-fit grounds, because
        no competitor in the band today owns the source-audit-application triad in a single
        licensable pack. JPMorgan&apos;s 71,313-bit certified-randomness publication in Nature
        and HSBC&apos;s PQC-VPN deployment validate the procurement appetite for the layer P3 occupies.
      </p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="rounded-xl p-6"
        style={{ background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <h3
          className="text-lg font-semibold text-slate-100 mb-1"
          style={{ fontFamily: 'var(--font-fraunces), Georgia, serif' }}
        >
          Comparable PQC Plays
        </h3>
        <p className="text-sm text-slate-500 mb-6" style={{ fontFamily: 'var(--font-dm-sans)' }}>
          Bubble size = strategic relevance to QDaria portfolio thesis. Y-axis log-scale.
        </p>

        <ResponsiveContainer width="100%" height={460}>
          <ScatterChart margin={{ top: 20, right: 30, left: 10, bottom: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              type="number"
              dataKey="year"
              domain={[2022, 2031]}
              tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'var(--font-jetbrains)' }}
              tickFormatter={(v: number) => String(v)}
              label={{
                value: 'Transaction / publication year',
                position: 'insideBottom',
                offset: -8,
                style: { fontSize: 11, fill: '#94a3b8', fontFamily: 'var(--font-jetbrains)' },
              }}
            />
            <YAxis
              type="number"
              dataKey="valuationUSDm"
              scale="log"
              domain={[100, 10000]}
              tick={{ fill: '#64748b', fontSize: 10 }}
              tickFormatter={(v: number) => v >= 1000 ? `$${v / 1000}B` : `$${v}M`}
              label={{
                value: 'Valuation (USDm, log)',
                angle: -90,
                position: 'insideLeft',
                offset: 8,
                style: { fontSize: 11, fill: '#94a3b8', fontFamily: 'var(--font-jetbrains)' },
              }}
            />
            <ZAxis type="number" dataKey="relevance" range={[80, 480]} />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              cursor={{ strokeDasharray: '3 3' }}
              formatter={(value: number | string, name: string) => {
                if (name === 'valuationUSDm') return [`$${value}M`, 'Valuation']
                if (name === 'relevance') return [`${value}/100`, 'Relevance']
                return [value, name]
              }}
              labelFormatter={(_, payload: ReadonlyArray<{ payload?: { company?: string; thesis?: string } }>) => {
                const p = payload?.[0]?.payload
                return p ? `${p.company}: ${p.thesis}` : ''
              }}
            />
            <ReferenceArea
              y1={150}
              y2={1500}
              fill="#34D399"
              fillOpacity={0.05}
              stroke="#34D399"
              strokeOpacity={0.2}
              strokeDasharray="4 4"
              label={{ value: 'QDaria comparable band', position: 'insideTopLeft', fontSize: 9, fill: '#34D399' }}
            />
            <Scatter data={data} fill="#22D3EE">
              {data.map((c, i) => (
                <Cell key={i} fill={c.color} fillOpacity={0.65} stroke={c.color} strokeWidth={1.5} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>

        {/* In-chart labels list */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
          {data.map((c) => (
            <div key={c.company} className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full flex-none" style={{ background: c.color, opacity: 0.7 }} />
              <span className="text-slate-400" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                {c.company}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      <CalloutBlock
        type="insight"
        title="Position in the band"
        text="SandboxAQ at USD 5.6B sits above QDaria's bundled range; its IP estate is broader but covers cryptographic discovery, not the source layer. PQShield at USD 320M sits below; its IP covers NIST PQC primitives only. QDaria sits between the two on valuation grounds and ahead of both on regulatory-fit grounds, because the source-audit-application triad is unmatched in either comparable."
      />

      <DataTable
        headers={['Company', 'Year', 'Valuation', 'Thesis']}
        rows={data.map((c) => [c.company, String(c.year), fmtUSD(c.valuationUSDm), c.thesis])}
        accent="#A78BFA"
      />

      <p
        className="text-[10px] text-gray-500"
        style={{ fontFamily: 'var(--font-jetbrains)' }}
      >
        Source: PORTFOLIO_SIGNIFICANCE.md Section 9 competitive landscape. SandboxAQ Apr 2024 round; Quantinuum 2023 valuation; PQShield Series B 2023; IDQ private 2024 estimate; JPMorgan / Quantinuum Nature March 2025.
      </p>
    </div>
  )
}
