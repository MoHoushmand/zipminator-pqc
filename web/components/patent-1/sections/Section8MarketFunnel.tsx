'use client'

import { motion } from 'framer-motion'
import {
  FunnelChart,
  Funnel,
  Tooltip,
  LabelList,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import {
  GlowCard,
  DataTable,
  CalloutBlock,
  ProseBlock,
  Subsection,
  MetricCard,
} from '@/components/blueprint/BlueprintSection'
import { MARKET_FUNNEL, TOOLTIP_STYLE, type BpScenario } from '@/lib/patent-1-data'

interface Props {
  scenario: BpScenario
}

const STAGE_COLORS = ['#22D3EE', '#A78BFA', '#34D399', '#F59E0B']

export const Section8MarketFunnel = ({ scenario }: Props) => {
  const stages = MARKET_FUNNEL[scenario]

  // Recharts FunnelChart wants `value` per stage.
  const funnelData = stages.map((s, i) => ({
    name: s.stage,
    value: i === 3 ? s.value * 12 : s.value, // pad captured NOK so funnel is visible
    rawValue: s.value,
    unit: s.unit,
    fill: STAGE_COLORS[i],
  }))

  return (
    <div className="space-y-10">
      <ProseBlock
        paragraphs={[
          'The funnel narrows from the documented PQC submarket (USD 2.84B in 2030 per MarketsandMarkets) through the anonymization-adjacent slice (privacy-enhancing technologies plus structured-data PQC migration) to the reachable annual license revenue, and finally to the ten-year captured cumulative in NOK.',
          'Capture rates assume 0.5 to 1.5 percent share for a single defensible claim family with credible prosecution and a peer-reviewed companion paper. Numbers below flex with scenario.',
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stages.map((s, i) => (
          <MetricCard
            key={s.stage}
            accent={STAGE_COLORS[i]}
            label={s.stage}
            value={`${s.value.toLocaleString()} ${s.unit.replace(' USD', '').replace(' NOK', '')}`}
            sub={s.unit}
          />
        ))}
      </div>

      <GlowCard accent="#34D399">
        <h3
          className="text-lg font-semibold text-slate-100 mb-1"
          style={{ fontFamily: 'var(--font-fraunces), Georgia, serif' }}
        >
          TAM -&gt; SAM -&gt; SOM -&gt; captured
        </h3>
        <p className="text-sm text-slate-500 mb-6" style={{ fontFamily: 'var(--font-dm-sans)' }}>
          Scenario = {scenario}; funnel widths approximate; raw values shown in labels.
        </p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <ResponsiveContainer width="100%" height={380}>
            <FunnelChart margin={{ top: 20, bottom: 20, left: 20, right: 20 }}>
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null
                  const d = payload[0].payload as { name: string; rawValue: number; unit: string }
                  return (
                    <div style={TOOLTIP_STYLE}>
                      <p className="font-mono text-xs text-emerald-300">{d.name}</p>
                      <p className="text-xs text-slate-300">
                        {d.rawValue.toLocaleString()} {d.unit}
                      </p>
                    </div>
                  )
                }}
              />
              <Funnel dataKey="value" data={funnelData} isAnimationActive>
                {funnelData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} fillOpacity={0.65} stroke={entry.fill} strokeWidth={1.5} />
                ))}
                <LabelList
                  position="right"
                  fill="#e2e8f0"
                  stroke="none"
                  dataKey="name"
                  style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 12 }}
                />
                <LabelList
                  position="center"
                  fill="#020817"
                  stroke="none"
                  dataKey="rawValue"
                  formatter={(v: number) => v.toLocaleString()}
                  style={{ fontFamily: 'var(--font-jetbrains)', fontSize: 12, fontWeight: 700 }}
                />
              </Funnel>
            </FunnelChart>
          </ResponsiveContainer>
        </motion.div>
      </GlowCard>

      <p
        className="text-[10px] text-slate-500"
        style={{ fontFamily: 'var(--font-jetbrains)' }}
      >
        Source: MarketsandMarkets PQC submarket 2030; Precedence Research 2034 outlook;
        QDaria internal capture model in docs/ip/_significance/patent-1-significance.md.
      </p>

      <Subsection heading="Funnel detail" accent="#34D399">
        <DataTable
          accent="#34D399"
          headers={['Stage', 'Value', 'Unit', 'Detail']}
          rows={stages.map((s) => [
            s.stage,
            s.value.toLocaleString(),
            s.unit,
            s.detail,
          ])}
        />
      </Subsection>

      <CalloutBlock
        type="citation"
        title="Why the slice is anonymization-shaped"
        text="Patent 1 sits at the intersection of three submarkets: post-quantum cryptography (CAGR 46.2 percent through 2030), privacy-enhancing technologies, and certified randomness. The 6-10 percent slice estimate reflects the anonymization wedge inside PQC, not the full privacy market. As DORA Article 6.4 enforcement matures the slice grows."
      />
    </div>
  )
}
