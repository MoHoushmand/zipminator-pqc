'use client'

import { motion } from 'framer-motion'
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import {
  GlowCard,
  DataTable,
  CalloutBlock,
  ProseBlock,
  Subsection,
  MetricCard,
} from '@/components/blueprint/BlueprintSection'
import { ENTROPY_TIMELINE, TOOLTIP_STYLE, type BpScenario } from '@/lib/patent-1-data'

interface Props {
  scenario: BpScenario
}

const SCENARIO_BOOST: Record<BpScenario, number> = {
  conservative: 0.85,
  moderate: 1.0,
  optimistic: 1.25,
}

export const Section5EntropyHarvest = ({ scenario }: Props) => {
  const boost = SCENARIO_BOOST[scenario]

  // Apply scenario factor to daily harvest only; cumulative remains anchored to actual data.
  const data = ENTROPY_TIMELINE.map((p) => ({
    ...p,
    dailyAdj: Number((p.daily * boost).toFixed(2)),
  }))

  const cumulativePeak = data[data.length - 1].cumulative
  const dailyAvg = (data.reduce((acc, p) => acc + p.dailyAdj, 0) / data.length).toFixed(2)
  const peakMonth = data.reduce((m, p) => (p.dailyAdj > m.dailyAdj ? p : m), data[0])

  return (
    <div className="space-y-10">
      <ProseBlock
        paragraphs={[
          'The Patent 1 entropy pool is anchored in production quantum hardware. Between January and October 2026 the inventor accumulated 6.8 MB of Born-rule random bytes from IBM Quantum ibm_kingston and ibm_fez, qBraid gateway, and Rigetti Ankaa.',
          'The graph below stacks two views: daily monthly harvest as bars, cumulative pool depth as a line. Daily rates flex with scenario; cumulative depth is grounded in deployed harvests.',
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          accent="#22D3EE"
          label="Cumulative pool"
          value={`${cumulativePeak} MB`}
          sub="Oct 2026, multi-provider"
        />
        <MetricCard
          accent="#F59E0B"
          label="Daily average"
          value={`${dailyAvg} MB`}
          sub={`Scenario boost x ${boost.toFixed(2)}`}
        />
        <MetricCard
          accent="#A78BFA"
          label="Peak month"
          value={`${peakMonth.dailyAdj} MB`}
          sub={peakMonth.label}
        />
      </div>

      <GlowCard accent="#34D399">
        <h3
          className="text-lg font-semibold text-slate-100 mb-1"
          style={{ fontFamily: 'var(--font-fraunces), Georgia, serif' }}
        >
          Entropy harvest, monthly daily and cumulative MB
        </h3>
        <p className="text-sm text-slate-500 mb-6" style={{ fontFamily: 'var(--font-dm-sans)' }}>
          Bars = monthly daily, line = cumulative pool. Cumulative anchors at 6.8 MB.
        </p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <ResponsiveContainer width="100%" height={360}>
            <ComposedChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="date"
                tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'var(--font-dm-sans)' }}
              />
              <YAxis
                yAxisId="left"
                tick={{ fill: '#64748b', fontSize: 10 }}
                tickFormatter={(v: number) => `${v} MB`}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fill: '#64748b', fontSize: 10 }}
                tickFormatter={(v: number) => `${v} MB`}
              />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend
                wrapperStyle={{ fontFamily: 'var(--font-jetbrains)', fontSize: 11, color: '#cbd5e1' }}
              />
              <Bar
                yAxisId="left"
                dataKey="dailyAdj"
                name="Daily (MB)"
                fill="#22D3EE"
                fillOpacity={0.55}
                radius={[4, 4, 0, 0]}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="cumulative"
                name="Cumulative (MB)"
                stroke="#F59E0B"
                strokeWidth={2.5}
                dot={{ fill: '#F59E0B', r: 3 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </motion.div>
      </GlowCard>

      <p
        className="text-[10px] text-slate-500"
        style={{ fontFamily: 'var(--font-jetbrains)' }}
      >
        Source: data/quantum-entropy/ (provenance logs); IBM Quantum jobs (ibm_kingston cycles
        1-3, ibm_fez d76hr068faus73f1ah20), qBraid gateway, Rigetti Ankaa.
      </p>

      <Subsection heading="Monthly entropy table" accent="#34D399">
        <DataTable
          accent="#34D399"
          headers={['Month', 'Daily (MB)', 'Cumulative (MB)', 'Harvest event']}
          rows={data.map((p) => [
            p.date,
            p.dailyAdj.toFixed(2),
            p.cumulative.toFixed(2),
            p.label,
          ])}
        />
      </Subsection>

      <CalloutBlock
        type="citation"
        title="Hardware grounding the patent moat"
        text="The 156-qubit ibm_kingston harvests are the load-bearing evidence that Patent 1 is not a paper-only construction. Claim 4's at-least-100-qubit threshold is met by production hardware, not a simulator. Multi-provider failover (Claim 10) is exercised across IBM, qBraid, and Rigetti."
      />
    </div>
  )
}
