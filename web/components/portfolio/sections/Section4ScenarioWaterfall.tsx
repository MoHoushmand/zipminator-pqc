'use client'

import { motion } from 'framer-motion'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { DataTable, CalloutBlock } from '@/components/blueprint/BlueprintSection'
import { WATERFALL, type BpScenario, fmtUSD } from '@/lib/portfolio-data'

interface Props {
  scenario: BpScenario
}

const TOOLTIP_STYLE = {
  backgroundColor: 'rgba(17,24,39,0.95)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px',
  color: '#e2e8f0',
  fontSize: 12,
  fontFamily: 'var(--font-dm-sans), sans-serif',
}

export const Section4ScenarioWaterfall = ({ scenario }: Props) => {
  const steps = WATERFALL[scenario]
  const data = steps.map((s) => ({
    label: s.label,
    base: s.base,
    delta: s.value,
    cumulative: s.cumulative,
    color: s.color,
    note: s.note,
  }))
  const ceiling = steps[steps.length - 1].cumulative

  return (
    <div className="space-y-10">
      <p
        className="text-[15px] leading-relaxed text-slate-300"
        style={{ fontFamily: 'var(--font-dm-sans)' }}
      >
        Floor to ceiling decomposition of the portfolio over a 10-year horizon, scenario-driven.
        Floor is single-jurisdiction prosecution with no bundle effect. Ceiling is regulatory
        reference status plus anchor licensees plus the T1 mixed-domain ARE reduction closure.
        Toggle the scenario in the sidebar to see the same five steps re-priced.
      </p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="rounded-xl p-6"
        style={{ background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-baseline justify-between mb-1">
          <h3
            className="text-lg font-semibold text-slate-100"
            style={{ fontFamily: 'var(--font-fraunces), Georgia, serif' }}
          >
            Portfolio Value Waterfall
          </h3>
          <p className="text-[11px] font-mono uppercase tracking-widest" style={{ color: '#A78BFA' }}>
            Scenario: {scenario}
          </p>
        </div>
        <p className="text-sm text-slate-500 mb-6" style={{ fontFamily: 'var(--font-dm-sans)' }}>
          Each bar shows the floor (stacked transparent) plus the value-add step (colored). USD millions, 10-yr cumulative.
        </p>

        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 10, bottom: 50 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="label"
              tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'var(--font-dm-sans)' }}
              interval={0}
              angle={-15}
              textAnchor="end"
              height={70}
            />
            <YAxis
              tick={{ fill: '#64748b', fontSize: 10 }}
              tickFormatter={(v: number) => v >= 1000 ? `$${(v / 1000).toFixed(1)}B` : `$${v}M`}
              label={{
                value: 'Cumulative value (USD)',
                angle: -90,
                position: 'insideLeft',
                offset: 8,
                style: { fontSize: 11, fill: '#94a3b8', fontFamily: 'var(--font-jetbrains)' },
              }}
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              formatter={(value: number, name: string) => {
                if (name === 'base') return [`$${value}M`, 'Floor carried forward']
                return [`+$${value}M`, 'Step uplift']
              }}
              labelFormatter={(l: string) => {
                const row = data.find((d) => d.label === l)
                return `${l}${row ? `: ${row.note}` : ''}`
              }}
            />
            {/* Invisible base bar (offset) */}
            <Bar dataKey="base" stackId="w" fill="transparent" />
            {/* Visible delta bar with per-step color */}
            <Bar dataKey="delta" stackId="w" radius={[6, 6, 0, 0]}>
              {data.map((d, i) => (
                <Cell key={i} fill={d.color} fillOpacity={0.75} stroke={d.color} strokeOpacity={0.9} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        <div className="mt-6 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest" style={{ fontFamily: 'var(--font-jetbrains)' }}>Floor</p>
            <p className="text-2xl font-bold" style={{ color: '#22D3EE', fontFamily: 'var(--font-jetbrains)' }}>{fmtUSD(steps[0].cumulative)}</p>
            <p className="text-[10px] text-slate-500 mt-1">NOK 410M-1.12B equiv.</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest" style={{ fontFamily: 'var(--font-jetbrains)' }}>Base (PCT)</p>
            <p className="text-2xl font-bold" style={{ color: '#A78BFA', fontFamily: 'var(--font-jetbrains)' }}>{fmtUSD(steps[1].cumulative)}</p>
            <p className="text-[10px] text-slate-500 mt-1">NOK 1.29-4.70B bundled</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest" style={{ fontFamily: 'var(--font-jetbrains)' }}>Ceiling [unverified]</p>
            <p className="text-2xl font-bold" style={{ color: '#FB7185', fontFamily: 'var(--font-jetbrains)' }}>{fmtUSD(ceiling)}</p>
            <p className="text-[10px] text-slate-500 mt-1">NOK 5-15B strategic</p>
          </div>
        </div>
      </motion.div>

      <CalloutBlock
        type="warning"
        title="Bundle execution risk"
        text="The 3 to 5x bundle multiplier baked into the per-patent ranges assumes all three filings prosecute. Failure on any one drops the bundled valuation toward the single-patent floor. The ceiling is explicitly labelled [unverified upper bound]; it requires (a) DORA enforcement intensity creating mandatory procurement, (b) at least one Tier-1 chipset vendor or HSM incumbent taking a paid license, (c) T1 mixed-domain ARE reduction closed in published form."
      />

      <DataTable
        headers={['Step', 'Cumulative', 'Delta', 'Trigger']}
        rows={data.map((d) => [d.label, fmtUSD(d.cumulative), `+${fmtUSD(d.delta)}`, d.note])}
        accent={steps[2].color}
      />

      <p
        className="text-[10px] text-gray-500"
        style={{ fontFamily: 'var(--font-jetbrains)' }}
      >
        Source: PORTFOLIO_SIGNIFICANCE.md Section 5 + Section 11 risk register. NOK to USD at 10.6.
      </p>
    </div>
  )
}
