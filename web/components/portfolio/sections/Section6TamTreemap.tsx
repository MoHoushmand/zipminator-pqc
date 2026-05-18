'use client'

import { motion } from 'framer-motion'
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts'
import { DataTable, CalloutBlock } from '@/components/blueprint/BlueprintSection'
import { TAM_TREEMAP, type BpScenario } from '@/lib/portfolio-data'

interface Props {
  scenario: BpScenario
}

const TAM_MULT: Record<BpScenario, number> = {
  conservative: 0.65, // 2030 lower-band, MarketsandMarkets
  moderate: 1.0,      // 2030 midpoint
  optimistic: 2.8,    // 2034 upper Precedence Research
}

const TOOLTIP_STYLE = {
  backgroundColor: 'rgba(17,24,39,0.95)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px',
  color: '#e2e8f0',
  fontSize: 12,
  fontFamily: 'var(--font-dm-sans), sans-serif',
}

interface TreemapNodeProps {
  x?: number
  y?: number
  width?: number
  height?: number
  index?: number
  name?: string
  color?: string
  amount?: number
  share?: string
}

const TreemapNode = (props: TreemapNodeProps) => {
  const { x = 0, y = 0, width = 0, height = 0, name = '', color = '#22D3EE', amount = 0, share = '' } = props
  const showLabel = width > 90 && height > 55
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={8}
        fill={color}
        fillOpacity={0.28}
        stroke={color}
        strokeOpacity={0.55}
        strokeWidth={1.5}
      />
      {showLabel && (
        <>
          <text
            x={x + 14}
            y={y + 24}
            fill="#e2e8f0"
            fontSize={12}
            fontFamily="var(--font-dm-sans)"
            fontWeight={500}
          >
            {name}
          </text>
          <text
            x={x + 14}
            y={y + 46}
            fill={color}
            fontSize={20}
            fontWeight={700}
            fontFamily="var(--font-jetbrains)"
          >
            ${amount}M
          </text>
          <text
            x={x + 14}
            y={y + 64}
            fill="#94a3b8"
            fontSize={10}
            fontFamily="var(--font-jetbrains)"
          >
            {share} of PQC TAM
          </text>
        </>
      )}
    </g>
  )
}

export const Section6TamTreemap = ({ scenario }: Props) => {
  const mult = TAM_MULT[scenario]
  const data = TAM_TREEMAP.map((d) => ({
    name: d.name,
    size: Math.round(d.size * mult),
    color: d.color,
    amount: Math.round(d.size * mult),
    share: d.share,
    source: d.source,
  }))
  const total = data.reduce((acc, d) => acc + d.size, 0)
  const scenarioLabel = scenario === 'conservative' ? '2030 lower band' : scenario === 'moderate' ? '2030 midpoint' : '2034 upper bound'

  return (
    <div className="space-y-10">
      <p
        className="text-[15px] leading-relaxed text-slate-300"
        style={{ fontFamily: 'var(--font-dm-sans)' }}
      >
        The PQC submarket reaches USD 2.84B by 2030 (MarketsandMarkets) and USD 29.95B by 2034
        (Precedence Research). The treemap below shows which segments QDaria&apos;s portfolio is
        positioned to address. Financial Services PQC is the largest individual segment because
        DORA Articles 6.4 and 7 force the procurement timeline.
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
          <h3
            className="text-lg font-semibold text-slate-100"
            style={{ fontFamily: 'var(--font-fraunces), Georgia, serif' }}
          >
            PQC TAM by Segment
          </h3>
          <p className="text-[11px] font-mono uppercase tracking-widest" style={{ color: '#22D3EE' }}>
            {scenarioLabel}  ·  ${total}M total
          </p>
        </div>

        <ResponsiveContainer width="100%" height={420}>
          <Treemap
            data={data}
            dataKey="size"
            aspectRatio={4 / 3}
            content={<TreemapNode />}
          >
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              formatter={(value: number, _name: string, item: { payload?: { source?: string } }) => [
                `$${value}M (${item.payload?.source ?? ''})`,
                'Segment size',
              ]}
            />
          </Treemap>
        </ResponsiveContainer>

        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2">
          {data.map((d) => (
            <div key={d.name} className="flex items-center gap-2 text-xs text-slate-400">
              <span className="w-3 h-3 rounded-sm flex-none" style={{ background: d.color, opacity: 0.65 }} />
              <span style={{ fontFamily: 'var(--font-dm-sans)' }}>
                {d.name}: <span style={{ fontFamily: 'var(--font-jetbrains)', color: d.color }}>${d.amount}M</span>
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      <CalloutBlock
        type="citation"
        title="Capture-rate reasoning"
        text="The SB1 brief projects defensive financial-services PQC spend at USD 7M (2022) to USD 3.7B (2032) per Deloitte. A 0.5 to 2% capture rate on the EU subset alone yields USD 5 to 37M annual revenue at 2032, against which the bundled portfolio valuation is the discounted-cash-flow capitalization, not a parallel TAM share."
      />

      <DataTable
        headers={['Segment', 'Size (USDm)', 'Share', 'Source']}
        rows={data.map((d) => [d.name, `$${d.amount}M`, d.share, d.source])}
        accent="#22D3EE"
      />

      <p
        className="text-[10px] text-gray-500"
        style={{ fontFamily: 'var(--font-jetbrains)' }}
      >
        Source: MarketsandMarkets 2030 PQC projection (46.2% CAGR); Precedence Research 2034 upper case (USD 29.95B); segment shares per SB1 banking intelligence brief.
      </p>
    </div>
  )
}
