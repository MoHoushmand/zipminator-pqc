'use client'

import {
  ComposedChart,
  Scatter,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ZAxis,
} from 'recharts'
import { IOT_BUBBLES, type BpScenario } from '@/lib/patent-2-data'
import {
  GlowCard,
  DataTable,
  CalloutBlock,
  ProseBlock,
  Subsection,
} from '@/components/blueprint/BlueprintSection'

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

// Scenario shifts the share of the eligible base we expect to license-touch
const SCENARIO_TOUCH: Record<BpScenario, number> = {
  conservative: 0.01,
  moderate: 0.03,
  optimistic: 0.075,
}

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload: { year: number; installedBaseB: number; entropyEligible: number; color: string; eligibleBaseB: number } }>
}) => {
  if (!active || !payload?.length) return null
  const p = payload[0].payload
  return (
    <div className="rounded-lg px-4 py-3" style={TOOLTIP_STYLE}>
      <p className="font-semibold mb-1" style={{ color: p.color, fontFamily: 'var(--font-fraunces)' }}>{p.year}</p>
      <p style={{ fontFamily: 'var(--font-jetbrains)' }}>
        <span className="text-slate-400">Installed base:</span> {p.installedBaseB.toFixed(1)}B
      </p>
      <p style={{ fontFamily: 'var(--font-jetbrains)' }}>
        <span className="text-slate-400">CSI-eligible:</span> {(p.entropyEligible * 100).toFixed(0)}%
      </p>
      <p style={{ fontFamily: 'var(--font-jetbrains)' }}>
        <span className="text-slate-400">Eligible base:</span> {p.eligibleBaseB.toFixed(2)}B
      </p>
    </div>
  )
}

export const Section7IoTBubbleTimeline = ({ scenario }: Props) => {
  const touch = SCENARIO_TOUCH[scenario]

  const data = IOT_BUBBLES.map((b) => {
    const eligibleBaseB = b.installedBaseB * b.entropyEligible
    return {
      ...b,
      eligibleBaseB,
      // bubble size proxy
      z: Math.round(eligibleBaseB * 60),
      // line: license-touch tier
      touchBaseB: eligibleBaseB * touch,
    }
  })

  const cumulativeTouch = data.reduce((acc, d) => acc + d.touchBaseB, 0)

  return (
    <div className="space-y-10">
      <ProseBlock
        paragraphs={[
          'The IoT installed base grows from 15.1B in 2024 to roughly 35B in 2034. The share of devices that ship with per-subcarrier complex CSI capability rises from 55% to 95% as 802.11ax / be adoption sweeps the inventory. Bubble size below is the eligible base for the entropy primitive.',
          'The overlay line is the share of that eligible base the patent realistically license-touches under the ' + scenario + ' scenario.',
        ]}
      />

      <Subsection heading="IoT Installed Base · 2024-2034" accent="#34D399">
        <GlowCard accent="#34D399">
          <ResponsiveContainer width="100%" height={420}>
            <ComposedChart data={data} margin={{ top: 20, right: 32, left: 12, bottom: 12 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis
                dataKey="year"
                type="number"
                domain={[2024, 2034]}
                tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'var(--font-jetbrains)' }}
                ticks={[2024, 2026, 2028, 2030, 2032, 2034]}
              />
              <YAxis
                yAxisId="left"
                tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'var(--font-jetbrains)' }}
                tickFormatter={(v: number) => `${v.toFixed(0)}B`}
                label={{ value: 'devices (B)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 11 }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fill: '#F59E0B', fontSize: 11, fontFamily: 'var(--font-jetbrains)' }}
                tickFormatter={(v: number) => `${v.toFixed(2)}B`}
                label={{ value: 'touch base (B)', angle: 90, position: 'insideRight', fill: '#F59E0B', fontSize: 11 }}
                domain={[0, (dMax: number) => Math.ceil(dMax * 1.4)]}
              />
              <ZAxis dataKey="z" range={[120, 2400]} />
              <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.1)' }} />

              <Scatter yAxisId="left" data={data} dataKey="installedBaseB">
                {data.map((d, i) => (
                  <Cell key={i} fill={d.color} fillOpacity={0.6} stroke={d.color} strokeWidth={1.2} />
                ))}
              </Scatter>

              <Line
                yAxisId="right"
                type="monotone"
                dataKey="touchBaseB"
                stroke="#F59E0B"
                strokeWidth={2.5}
                dot={{ fill: '#F59E0B', r: 4 }}
                activeDot={{ r: 6 }}
                name="License-touch base"
                animationDuration={1400}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </GlowCard>
        <p className="text-[10px] mt-2 text-slate-500" style={{ fontFamily: 'var(--font-jetbrains)' }}>
          Source: IoT installed-base figures order-of-magnitude per IoT Analytics and ABI Research; CSI-eligibility curve from 802.11n/ac/ax/be adoption trajectory. Eligible base = installed × CSI-eligibility%.
        </p>
      </Subsection>

      <DataTable
        accent="#34D399"
        headers={['Year', 'Installed (B)', 'CSI-Eligible %', 'Eligible Base (B)', `${scenario} touch (B)`]}
        rows={data.map((d) => [
          String(d.year),
          d.installedBaseB.toFixed(1),
          `${(d.entropyEligible * 100).toFixed(0)}%`,
          d.eligibleBaseB.toFixed(2),
          d.touchBaseB.toFixed(3),
        ])}
      />

      <CalloutBlock
        type="insight"
        title={`Cumulative license-touch · ${scenario}`}
        text={`Across 2024-2034 the patent's license-touch base sums to roughly ${cumulativeTouch.toFixed(2)}B device-years at the ${(touch * 100).toFixed(1)}% addressable share. Pair with the per-device rate card in the next section to recover annual license revenue.`}
        accent="#F59E0B"
      />
    </div>
  )
}
