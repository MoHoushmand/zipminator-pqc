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
  MetricCard,
} from '@/components/blueprint/BlueprintSection'
import { VALUE_WATERFALL, TOOLTIP_STYLE, type BpScenario } from '@/lib/patent-1-data'

interface Props {
  scenario: BpScenario
}

export const Section9ValueWaterfall = ({ scenario }: Props) => {
  const rows = VALUE_WATERFALL[scenario]

  // Convert to floating-bar waterfall: each bar = [floor, top].
  // For the floor row, floor=0, top=delta. For deltas, floor=prevRunning, top=running.
  // For "ceiling" use running as the top (no delta = same as previous bar).
  let prev = 0
  const data = rows.map((r) => {
    const top = r.running
    const floor = r.stage === 'NO grant floor' ? 0 : Math.min(prev, top)
    const segment = top - floor
    prev = top
    return {
      name: r.stage,
      floor,
      segment: Math.max(0, segment),
      top,
      delta: r.delta,
      accent: r.accent,
      detail: r.detail,
    }
  })

  const ceiling = rows[rows.length - 1].running

  return (
    <div className="space-y-10">
      <ProseBlock
        paragraphs={[
          'The waterfall decomposes Patent 1\'s headline valuation range into stages: Norwegian-only grant floor, US continuation uplift, EPO grant uplift, bundled-portfolio multiplier across Patents 2 and 3, and the strategic ceiling that emerges if Patent 1 becomes the cited construction under DORA Article 6.4.',
          'Conservative tops out at NOK 240M (single-jurisdiction floor through bundled lower bound). Moderate reaches NOK 800M with a partial DORA reference. Optimistic peaks at NOK 2,200M, contingent on EU regulatory adoption.',
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          accent="#22D3EE"
          label="Floor (NO grant)"
          value={`NOK ${rows[0].delta}M`}
          sub="Norway-only, no US continuation"
        />
        <MetricCard
          accent="#F59E0B"
          label="Bundled subtotal"
          value={`NOK ${rows[3].running}M`}
          sub="NO + US + EPO + bundle multiplier"
        />
        <MetricCard
          accent="#FB7185"
          label="Strategic ceiling"
          value={`NOK ${ceiling}M`}
          sub="With DORA Art. 6.4 reference adoption [unverified]"
        />
      </div>

      <GlowCard accent="#A78BFA">
        <h3
          className="text-lg font-semibold text-slate-100 mb-1"
          style={{ fontFamily: 'var(--font-fraunces), Georgia, serif' }}
        >
          Value waterfall (NOK M)
        </h3>
        <p className="text-sm text-slate-500 mb-6" style={{ fontFamily: 'var(--font-dm-sans)' }}>
          Floating bars stack each uplift onto the previous total. Scenario = {scenario}.
        </p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <ResponsiveContainer width="100%" height={380}>
            <BarChart data={data} margin={{ top: 20, right: 20, left: 10, bottom: 30 }} stackOffset="sign">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="name"
                tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'var(--font-dm-sans)' }}
                interval={0}
                angle={-15}
                textAnchor="end"
                height={70}
              />
              <YAxis
                tick={{ fill: '#64748b', fontSize: 10 }}
                tickFormatter={(v: number) => `${v}M`}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null
                  const d = payload[0].payload as { name: string; top: number; delta: number; detail: string }
                  return (
                    <div style={TOOLTIP_STYLE}>
                      <p className="font-mono text-xs text-violet-300">{d.name}</p>
                      <p className="text-xs text-slate-300">Running total: NOK {d.top}M</p>
                      <p className="text-xs text-slate-400">+ NOK {d.delta}M</p>
                      <p className="text-[10px] text-slate-500 mt-1">{d.detail}</p>
                    </div>
                  )
                }}
              />
              <Bar dataKey="floor" stackId="w" fill="transparent" />
              <Bar dataKey="segment" stackId="w" radius={[6, 6, 0, 0]}>
                {data.map((d, i) => (
                  <Cell key={i} fill={d.accent} fillOpacity={0.65} stroke={d.accent} strokeWidth={1.2} />
                ))}
                <LabelList
                  dataKey="top"
                  position="top"
                  formatter={(v: number) => `${v}M`}
                  style={{ fill: '#e2e8f0', fontSize: 11, fontFamily: 'var(--font-jetbrains)' }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </GlowCard>

      <p
        className="text-[10px] text-slate-500"
        style={{ fontFamily: 'var(--font-jetbrains)' }}
      >
        Source: docs/ip/_significance/patent-1-significance.md (single-jurisdiction floor:
        NOK 80-220M; bundled NO+US+EP: NOK 240-1,100M; strategic ceiling 2-3x bundled
        [unverified]).
      </p>

      <Subsection heading="Waterfall detail" accent="#A78BFA">
        <DataTable
          accent="#A78BFA"
          headers={['Stage', 'Delta (NOK M)', 'Running (NOK M)', 'Driver']}
          rows={rows.map((r) => [
            r.stage,
            `+${r.delta}`,
            String(r.running),
            r.detail,
          ])}
        />
      </Subsection>

      <CalloutBlock
        type="insight"
        title="Bundle multiplier is where the math turns"
        text="The single-patent floor is grounded in license-revenue modelling. The 3-5x bundle multiplier reflects that licensees of QRNG-OTP-Destroy will also need certified entropy (Patent 3) and a defensible entropy harvest (Patent 2) from the same vendor; otherwise they reassemble the stack from competitors and lose the audit story. The bundle is the load-bearing valuation step."
      />
    </div>
  )
}
