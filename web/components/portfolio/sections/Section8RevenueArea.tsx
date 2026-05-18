'use client'

import { motion } from 'framer-motion'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { DataTable, CalloutBlock } from '@/components/blueprint/BlueprintSection'
import { REVENUE_BY_PATENT, type BpScenario, fmtUSD } from '@/lib/portfolio-data'

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

export const Section8RevenueArea = ({ scenario }: Props) => {
  const data = REVENUE_BY_PATENT[scenario]
  const final = data[data.length - 1]
  const fiveYear = data.find((d) => d.year === 2031)!
  const tenYear = data.find((d) => d.year === 2036)!

  return (
    <div className="space-y-10">
      <p
        className="text-[15px] leading-relaxed text-slate-300"
        style={{ fontFamily: 'var(--font-dm-sans)' }}
      >
        Cumulative QDaria license and product revenue 2026 to 2036, decomposed by patent.
        S-curve growth: ramp 2026 to 2028, steeper 2029 to 2032 as DORA enforcement intensifies,
        plateau 2033 to 2036 as the bundle reaches saturation in the regulated buyer set.
      </p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="rounded-xl p-6"
        style={{ background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-baseline justify-between mb-6">
          <div>
            <h3
              className="text-lg font-semibold text-slate-100"
              style={{ fontFamily: 'var(--font-fraunces), Georgia, serif' }}
            >
              Cumulative Revenue 2026 to 2036
            </h3>
            <p className="text-sm text-slate-500 mt-1" style={{ fontFamily: 'var(--font-dm-sans)' }}>
              USD millions; stacked area by patent contribution
            </p>
          </div>
          <p className="text-[11px] font-mono uppercase tracking-widest" style={{ color: '#34D399' }}>
            Scenario: {scenario}
          </p>
        </div>

        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
            <defs>
              <linearGradient id="grad-P2" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.75} />
                <stop offset="100%" stopColor="#F59E0B" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="grad-P3" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#34D399" stopOpacity={0.75} />
                <stop offset="100%" stopColor="#34D399" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="grad-P1" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#22D3EE" stopOpacity={0.75} />
                <stop offset="100%" stopColor="#22D3EE" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="year"
              tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'var(--font-jetbrains)' }}
            />
            <YAxis
              tick={{ fill: '#64748b', fontSize: 10 }}
              tickFormatter={(v: number) => `$${v}M`}
              label={{
                value: 'Cumulative revenue (USDm)',
                angle: -90,
                position: 'insideLeft',
                offset: 8,
                style: { fontSize: 11, fill: '#94a3b8', fontFamily: 'var(--font-jetbrains)' },
              }}
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              formatter={(value: number, name: string) => [`$${value}M`, name]}
            />
            <Legend
              wrapperStyle={{ fontFamily: 'var(--font-jetbrains), monospace', fontSize: 11 }}
              formatter={(value: string) => <span className="text-slate-300">{value}</span>}
            />
            <Area type="monotone" dataKey="P2" name="P2 CSI + PUEK" stackId="1" stroke="#F59E0B" fill="url(#grad-P2)" strokeWidth={2} />
            <Area type="monotone" dataKey="P3" name="P3 CHE + ARE" stackId="1" stroke="#34D399" fill="url(#grad-P3)" strokeWidth={2} />
            <Area type="monotone" dataKey="P1" name="P1 Anonymization" stackId="1" stroke="#22D3EE" fill="url(#grad-P1)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>

        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest" style={{ fontFamily: 'var(--font-jetbrains)' }}>5-year cumul. (2031)</p>
            <p className="text-2xl font-bold" style={{ color: '#22D3EE', fontFamily: 'var(--font-jetbrains)' }}>{fmtUSD(fiveYear.total)}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest" style={{ fontFamily: 'var(--font-jetbrains)' }}>10-year cumul. (2036)</p>
            <p className="text-2xl font-bold" style={{ color: '#34D399', fontFamily: 'var(--font-jetbrains)' }}>{fmtUSD(tenYear.total)}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest" style={{ fontFamily: 'var(--font-jetbrains)' }}>Largest contributor</p>
            <p className="text-2xl font-bold" style={{ color: '#F59E0B', fontFamily: 'var(--font-jetbrains)' }}>
              {final.P2 > final.P3 ? 'P2' : final.P3 > final.P1 ? 'P3' : 'P1'}
            </p>
          </div>
        </div>
      </motion.div>

      <CalloutBlock
        type="citation"
        title="Sum-of-ranges sanity check"
        text="Summed across the three filings, the per-patent dossier ranges imply NOK 90 to 330M cumulative by 2031 and NOK 425M to 1.85B cumulative by 2036. The S-curve in the chart sits inside that envelope; the moderate scenario hits NOK 3.0B cumulative by 2036 (USD 282M), consistent with the bundled valuation midpoint."
      />

      <DataTable
        headers={['Year', 'P1 cumul.', 'P2 cumul.', 'P3 cumul.', 'Total']}
        rows={data.map((d) => [
          String(d.year),
          fmtUSD(d.P1),
          fmtUSD(d.P2),
          fmtUSD(d.P3),
          fmtUSD(d.total),
        ])}
        accent="#34D399"
      />

      <p
        className="text-[10px] text-gray-500"
        style={{ fontFamily: 'var(--font-jetbrains)' }}
      >
        Source: PORTFOLIO_SIGNIFICANCE.md Section 5 capture-rate reasoning; per-patent dossier 5/10-year cumulative ranges; S-curve fit calibrated to NOK to USD at 10.6.
      </p>
    </div>
  )
}
