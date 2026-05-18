'use client'

import { motion } from 'framer-motion'
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts'
import { DataTable, CalloutBlock } from '@/components/blueprint/BlueprintSection'
import { RISK_VS_CAPTURE, type BpScenario, fmtUSD } from '@/lib/portfolio-data'

interface Props {
  scenario: BpScenario
}

const CAPTURE_SCALE: Record<BpScenario, number> = {
  conservative: 0.43,  // ~120 base
  moderate: 1.0,       // ~282 base
  optimistic: 1.58,    // ~445 base
}

const TOOLTIP_STYLE = {
  backgroundColor: 'rgba(17,24,39,0.95)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px',
  color: '#e2e8f0',
  fontSize: 12,
  fontFamily: 'var(--font-dm-sans), sans-serif',
}

export const Section3RiskVsCapture = ({ scenario }: Props) => {
  const scale = CAPTURE_SCALE[scenario]
  const data = RISK_VS_CAPTURE.map((r) => ({
    label: r.label,
    'Risk surface (USD B)': r.riskUSDb,
    'QDaria capture (USD M)': r.captureUSDm > 0 ? Math.round(r.captureUSDm * scale) : null,
    source: r.source,
  }))

  const captureTotal = scenario === 'conservative' ? 120 : scenario === 'moderate' ? 282 : 445

  return (
    <div className="space-y-10">
      <p
        className="text-[15px] leading-relaxed text-slate-300"
        style={{ fontFamily: 'var(--font-dm-sans)' }}
      >
        Two stacked framings belong in every executive deck. Risk-mitigation framing
        (boardroom / CISO / regulator) is the trillion-scale story; value-capture framing
        (CFO / investor) is the licensable share. Conflating the two collapses immediately
        under banking scrutiny. The chart below shows them side by side at their actual scales.
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
          Risk Surface vs Capturable Share
        </h3>
        <p className="text-sm text-slate-500 mb-6" style={{ fontFamily: 'var(--font-dm-sans)' }}>
          Log-scale left axis for trillion-class risk; linear right axis for portfolio capture.
        </p>

        <ResponsiveContainer width="100%" height={420}>
          <ComposedChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 80 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis
              dataKey="label"
              tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'var(--font-dm-sans)' }}
              interval={0}
              angle={-22}
              textAnchor="end"
              height={100}
            />
            <YAxis
              yAxisId="left"
              orientation="left"
              scale="log"
              domain={[1, 20000]}
              tick={{ fill: '#FB7185', fontSize: 10 }}
              tickFormatter={(v: number) => v >= 1000 ? `$${v / 1000}T` : `$${v}B`}
              label={{
                value: 'Risk surface (log)',
                angle: -90,
                position: 'insideLeft',
                offset: 8,
                style: { fontSize: 11, fill: '#FB7185', fontFamily: 'var(--font-jetbrains)' },
              }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fill: '#34D399', fontSize: 10 }}
              tickFormatter={(v: number) => `$${v}M`}
              label={{
                value: 'QDaria capture (USDm)',
                angle: 90,
                position: 'insideRight',
                offset: 8,
                style: { fontSize: 11, fill: '#34D399', fontFamily: 'var(--font-jetbrains)' },
              }}
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              formatter={(value, name) => {
                if (value === null || value === undefined) return ['n/a', String(name)]
                if (name === 'Risk surface (USD B)') return [`$${value}B`, String(name)]
                return [`$${value}M`, String(name)]
              }}
            />
            <Legend
              wrapperStyle={{ fontFamily: 'var(--font-jetbrains), monospace', fontSize: 11, paddingBottom: 10 }}
              formatter={(value: string) => <span className="text-slate-300">{value}</span>}
            />
            <ReferenceLine y={6.08} yAxisId="left" stroke="#A78BFA" strokeDasharray="4 4" label={{ value: 'IBM 2024 mean breach $6.08M', fontSize: 9, fill: '#A78BFA' }} />
            <Bar yAxisId="left" dataKey="Risk surface (USD B)" fill="#FB7185" fillOpacity={0.6} radius={[4, 4, 0, 0]}>
              {data.map((_, i) => (
                <Cell key={i} fill={i < 2 ? '#FB7185' : i < 5 ? '#F59E0B' : '#A78BFA'} fillOpacity={0.55} />
              ))}
            </Bar>
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="QDaria capture (USD M)"
              stroke="#34D399"
              strokeWidth={3}
              dot={{ r: 5, fill: '#34D399', stroke: '#020817', strokeWidth: 2 }}
              activeDot={{ r: 7 }}
              connectNulls={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl p-5 text-center" style={{ background: 'rgba(251,113,133,0.08)', border: '1px solid rgba(251,113,133,0.25)' }}>
          <p className="text-[10px] uppercase tracking-widest text-rose-300 mb-1" style={{ fontFamily: 'var(--font-jetbrains)' }}>Risk surface midpoint</p>
          <p className="text-3xl font-bold text-rose-400" style={{ fontFamily: 'var(--font-jetbrains)' }}>$2.65T</p>
          <p className="text-[11px] text-slate-400 mt-1">Citi 2026 single Fedwire-bank scenario</p>
        </div>
        <div className="rounded-xl p-5 text-center" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
          <p className="text-[10px] uppercase tracking-widest text-amber-300 mb-1" style={{ fontFamily: 'var(--font-jetbrains)' }}>PQC submarket 2030</p>
          <p className="text-3xl font-bold text-amber-400" style={{ fontFamily: 'var(--font-jetbrains)' }}>$2.84B</p>
          <p className="text-[11px] text-slate-400 mt-1">MarketsandMarkets 46.2% CAGR baseline</p>
        </div>
        <div className="rounded-xl p-5 text-center" style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.25)' }}>
          <p className="text-[10px] uppercase tracking-widest text-emerald-300 mb-1" style={{ fontFamily: 'var(--font-jetbrains)' }}>QDaria capture, 10-yr</p>
          <p className="text-3xl font-bold text-emerald-400" style={{ fontFamily: 'var(--font-jetbrains)' }}>{fmtUSD(captureTotal)}</p>
          <p className="text-[11px] text-slate-400 mt-1">Bundled scenario midpoint</p>
        </div>
      </div>

      <CalloutBlock
        type="citation"
        title="One sentence that holds in either room"
        text="QDaria's three Norwegian filings cover the source, audit, and application layers of a post-quantum data-protection stack addressing a trillion-scale risk surface, inside a regulator-pulled PQC submarket projected at USD 2.84 to 29.95 billion by 2030 to 2034, with capturable license and product revenue modelled at NOK 1.29 to 4.70 billion over 10 years."
      />

      <DataTable
        headers={['Anchor', 'Magnitude', 'QDaria capture', 'Source']}
        rows={data.map((d) => [
          d.label,
          `$${d['Risk surface (USD B)']}B`,
          d['QDaria capture (USD M)'] !== null ? `$${d['QDaria capture (USD M)']}M` : 'n/a (risk-only)',
          d.source,
        ])}
        accent="#FB7185"
      />

      <p
        className="text-[10px] text-gray-500"
        style={{ fontFamily: 'var(--font-jetbrains)' }}
      >
        Source: PORTFOLIO_SIGNIFICANCE.md Section 6; Citi Institute Jan 2026; Cybersecurity Ventures 2025; McKinsey Quantum Tech Monitor Jun 2025; BCG; Deloitte; MarketsandMarkets; Precedence Research.
      </p>
    </div>
  )
}
