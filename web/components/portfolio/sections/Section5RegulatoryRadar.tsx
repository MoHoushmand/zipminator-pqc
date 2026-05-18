'use client'

import { motion } from 'framer-motion'
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { DataTable, CalloutBlock } from '@/components/blueprint/BlueprintSection'
import { REGULATORY_RADAR, REGULATORY_TABLE, type BpScenario } from '@/lib/portfolio-data'

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

// Scenario adjusts portfolio enforcement-strength coverage on each axis
const ENFORCEMENT: Record<BpScenario, number> = {
  conservative: 0.82,
  moderate: 1.0,
  optimistic: 1.15,
}

export const Section5RegulatoryRadar = ({ scenario }: Props) => {
  const mult = ENFORCEMENT[scenario]
  const data = REGULATORY_RADAR.map((r) => ({
    axis: r.axis,
    P1: r.P1,
    P2: r.P2,
    P3: r.P3,
    portfolio: Math.min(100, Math.round(r.portfolio * mult)),
  }))

  const meanPortfolio = Math.round(data.reduce((acc, d) => acc + d.portfolio, 0) / data.length)

  return (
    <div className="space-y-10">
      <p
        className="text-[15px] leading-relaxed text-slate-300"
        style={{ fontFamily: 'var(--font-dm-sans)' }}
      >
        Ten regulatory instruments map cleanly onto one or more of the three filings.
        Per-patent fit is plotted alongside the portfolio aggregate; the bundle outperforms
        every individual filing on every axis because at least one of the three patents
        addresses each instrument&apos;s primary mechanism.
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
              Regulatory Coverage Radar
            </h3>
            <p className="text-sm text-slate-500 mt-1" style={{ fontFamily: 'var(--font-dm-sans)' }}>
              Coverage score per axis, 0-100. Portfolio aggregate scales with enforcement intensity.
            </p>
          </div>
          <p className="text-[11px] font-mono uppercase tracking-widest" style={{ color: '#34D399' }}>
            Mean: {meanPortfolio}/100
          </p>
        </div>

        <ResponsiveContainer width="100%" height={460}>
          <RadarChart data={data} outerRadius={170}>
            <PolarGrid stroke="rgba(255,255,255,0.08)" />
            <PolarAngleAxis
              dataKey="axis"
              tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'var(--font-dm-sans)' }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fill: '#475569', fontSize: 9 }}
            />
            <Radar name="P1 Anonymization" dataKey="P1" stroke="#22D3EE" fill="#22D3EE" fillOpacity={0.12} strokeWidth={1.5} />
            <Radar name="P2 CSI + PUEK" dataKey="P2" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.12} strokeWidth={1.5} />
            <Radar name="P3 CHE + ARE" dataKey="P3" stroke="#34D399" fill="#34D399" fillOpacity={0.12} strokeWidth={1.5} />
            <Radar name="Portfolio" dataKey="portfolio" stroke="#FB7185" fill="#FB7185" fillOpacity={0.25} strokeWidth={2.5} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Legend
              wrapperStyle={{ fontFamily: 'var(--font-jetbrains), monospace', fontSize: 11 }}
              formatter={(value: string) => <span className="text-slate-300">{value}</span>}
            />
          </RadarChart>
        </ResponsiveContainer>
      </motion.div>

      <CalloutBlock
        type="insight"
        title="Why bundling matters here"
        text="Pick any single filing and there are at least three regulatory axes where the coverage score is below 40. Pick the portfolio and every axis is above 85 under the moderate scenario. This is the structural argument for licensing the bundle rather than a single claim family."
      />

      <DataTable
        headers={REGULATORY_TABLE.headers}
        rows={REGULATORY_TABLE.rows}
        accent="#34D399"
      />

      <p
        className="text-[10px] text-gray-500"
        style={{ fontFamily: 'var(--font-jetbrains)' }}
      >
        Source: PORTFOLIO_SIGNIFICANCE.md Section 7 regulatory alignment matrix. FIPS-safe language: Implements NIST FIPS 203 (ML-KEM-768); verified against NIST KAT test vectors.
      </p>
    </div>
  )
}
