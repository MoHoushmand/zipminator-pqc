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
  LabelList,
} from 'recharts'
import {
  GlowCard,
  DataTable,
  CalloutBlock,
  ProseBlock,
  Subsection,
  EquationCard,
} from '@/components/blueprint/BlueprintSection'
import { SECURITY_BOUNDS, TOOLTIP_STYLE, type BpScenario } from '@/lib/patent-1-data'

interface Props {
  scenario: BpScenario
}

// Scenario tweaks the bar styling intensity but bound numbers are physics-fixed.
const SCENARIO_OPACITY: Record<BpScenario, number> = {
  conservative: 0.55,
  moderate: 0.75,
  optimistic: 0.95,
}

export const Section3SecurityBound = ({ scenario }: Props) => {
  const opacity = SCENARIO_OPACITY[scenario]

  // We plot the *exponent* (negated): higher bar = stronger guarantee.
  const chartData = SECURITY_BOUNDS.map((b) => ({
    name: b.name,
    label: b.label,
    exponent: b.exponent,
    accent: b.accent,
  }))

  return (
    <div className="space-y-10">
      <ProseBlock
        paragraphs={[
          'The revised security argument bounds the per-value mapping-recovery probability at 62 raised to the -16 power, derived from the actual rejection-sampled 16-character base-62 token construction.',
          'This is a tighter and more defensible number than the prior hand-waved 2 to the -128 estimate. It still vastly exceeds the industry baseline of roughly 2 to the -80 for AES-key-sized CSPRNG tokens.',
        ]}
      />

      <EquationCard
        label="Per-value mapping-recovery bound"
        equation="Pr[recover] <= 62^-16  ~=  2^-95.3  ~=  2.49 x 10^-29"
        description="Bound applies per unique PII value. Adversary must guess a 16-character base-62 token drawn from quantum measurement; rejection sampling removes hardware bias."
      />

      <GlowCard accent="#22D3EE">
        <h3
          className="text-lg font-semibold text-slate-100 mb-1"
          style={{ fontFamily: 'var(--font-fraunces), Georgia, serif' }}
        >
          Mapping-recovery security bound (log2 scale)
        </h3>
        <p className="text-sm text-slate-500 mb-6" style={{ fontFamily: 'var(--font-dm-sans)' }}>
          Higher exponent = stronger guarantee. Patent 1 sits 15 bits above industry baseline.
        </p>
        <ResponsiveContainer width="100%" height={340}>
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 20, left: 30, bottom: 20 }}
            layout="vertical"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              type="number"
              tick={{ fill: '#64748b', fontSize: 10 }}
              tickFormatter={(v: number) => `2^-${v}`}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'var(--font-dm-sans)' }}
              width={210}
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              formatter={(value: number) => [`2^-${value}`, 'Security bound']}
            />
            <motion.g initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
              <Bar dataKey="exponent" radius={[0, 6, 6, 0]} fillOpacity={opacity}>
                {chartData.map((c, i) => (
                  <Cell key={i} fill={c.accent} />
                ))}
                <LabelList
                  dataKey="label"
                  position="right"
                  style={{ fill: '#e2e8f0', fontSize: 12, fontFamily: 'var(--font-jetbrains)' }}
                />
              </Bar>
            </motion.g>
          </BarChart>
        </ResponsiveContainer>
      </GlowCard>

      <p
        className="text-[10px] text-slate-500"
        style={{ fontFamily: 'var(--font-jetbrains)' }}
      >
        Source: docs/research/paper-1-quantum-anonymization/main.tex Section 4.2; bound derived
        from rejection-sampled 16-character base-62 token construction.
      </p>

      <Subsection heading="Bound comparison" accent="#22D3EE">
        <DataTable
          accent="#22D3EE"
          headers={['Bound source', 'Exponent', 'Probability', 'Provenance']}
          rows={SECURITY_BOUNDS.map((b) => [
            b.name,
            `2^-${b.exponent}`,
            b.probability.toExponential(2),
            b.name.includes('Patent 1 (revised') ? 'Paper Section 4.2' : b.name.includes('prior') ? 'Pre-revision draft' : 'Industry CSPRNG baseline (NIST SP 800-90A)',
          ])}
        />
      </Subsection>

      <CalloutBlock
        type="equation"
        title="Why 62^-16 is the right bound"
        text="The deployed implementation samples 16 base-62 characters per token, rejecting biased draws. The bound 62^-16 is the per-value collision probability for a uniformly-random uniformly-rejected sample. Reporting 2 to the -128 conflated AES-256 strength with token strength; the revised bound matches the deployed implementation precisely."
      />
    </div>
  )
}
