'use client'

import { motion } from 'framer-motion'
import {
  Treemap,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import {
  GlowCard,
  DataTable,
  CalloutBlock,
  ProseBlock,
} from '@/components/blueprint/BlueprintSection'
import {
  BUYER_HIERARCHY,
  type BpScenario,
} from '@/lib/patent-3-data'

interface Props {
  scenario: BpScenario
}

interface CellProps {
  x?: number
  y?: number
  width?: number
  height?: number
  name?: string
  color?: string
  urgency?: number
  reg?: string
  size?: number
  depth?: number
  root?: { children?: unknown[] }
}

const SunburstCell = (props: CellProps) => {
  const { x = 0, y = 0, width = 0, height = 0, name = '', color = '#A78BFA', urgency = 0, reg = '', size = 0, depth = 0 } = props
  if (depth === 0 || width < 4 || height < 4) {
    return <g />
  }
  const showLabel = width > 80 && height > 50
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={6}
        fill={color}
        fillOpacity={Math.min(0.15 + (urgency / 100) * 0.45, 0.7)}
        stroke={color}
        strokeWidth={1.4}
        strokeOpacity={0.6}
      />
      {showLabel && (
        <>
          <text
            x={x + 10}
            y={y + 18}
            fill="#f1f5f9"
            fontSize={11}
            fontWeight={600}
            fontFamily="var(--font-dm-sans)"
          >
            {name}
          </text>
          <text
            x={x + 10}
            y={y + 32}
            fill={color}
            fontSize={9}
            fontFamily="var(--font-jetbrains)"
          >
            urgency {urgency}
          </text>
          {height > 70 && (
            <text
              x={x + 10}
              y={y + 46}
              fill="#94a3b8"
              fontSize={8.5}
              fontFamily="var(--font-jetbrains)"
            >
              {reg}
            </text>
          )}
          {height > 90 && (
            <text
              x={x + 10}
              y={y + 60}
              fill="#64748b"
              fontSize={8.5}
              fontFamily="var(--font-jetbrains)"
            >
              size {size}
            </text>
          )}
        </>
      )}
    </g>
  )
}

const TOOLTIP_STYLE = {
  backgroundColor: 'rgba(17,24,39,0.95)',
  border: '1px solid rgba(167,139,250,0.3)',
  borderRadius: '8px',
  color: '#e2e8f0',
  fontSize: 12,
  fontFamily: 'var(--font-dm-sans), sans-serif',
}

export const Section7RegulatedBuyerSunburst = ({ scenario: _scenario }: Props) => {
  // Build hierarchical Treemap data (renders sunburst-style nested partition)
  const treemapData = BUYER_HIERARCHY.map((group) => ({
    name: group.name,
    children: group.children.map((c) => ({
      name: c.name,
      size: c.size,
      color: c.color,
      urgency: c.urgency,
      reg: c.reg,
    })),
  }))

  const tableRows = BUYER_HIERARCHY.flatMap((g) =>
    g.children.map((c) => [
      g.name.split(' (')[0],
      c.name,
      `${c.urgency}`,
      `${c.size}`,
      c.reg,
    ]),
  )

  return (
    <div className="space-y-10">
      <ProseBlock
        paragraphs={[
          'Patent 3 is the procurement-pull patent of the QDaria family. Its value rises with DORA enforcement intensity under Finanstilsynet and the equivalent EU supervisors. The buyer base spans banks under DORA, insurers under Solvency II ICT, telcos under NIS2 Art. 21, and government bodies under the EU AI Act and ENISA CSA.',
          'Color encodes urgency on a 0-100 scale; size encodes [unverified] relative procurement appetite based on the SB1 banking-intelligence brief and the patent-3 dossier.',
        ]}
      />

      <GlowCard accent="#A78BFA">
        <h3
          className="text-lg font-semibold text-slate-100 mb-1"
          style={{ fontFamily: 'var(--font-fraunces)' }}
        >
          Regulated Buyer Sunburst
        </h3>
        <p className="text-xs text-slate-500 mb-6" style={{ fontFamily: 'var(--font-dm-sans)' }}>
          Banks · Insurers · Telcos · Government — color intensity = procurement urgency.
        </p>

        <ResponsiveContainer width="100%" height={460}>
          <Treemap
            data={treemapData}
            dataKey="size"
            aspectRatio={4 / 3}
            stroke="#020817"
            content={<SunburstCell />}
          >
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              formatter={(_value: number, _name: string, item: { payload?: CellProps }) => {
                const p = item?.payload
                if (!p) return ''
                return [`urgency ${p.urgency} · ${p.reg}`, p.name ?? '']
              }}
            />
          </Treemap>
        </ResponsiveContainer>

        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
          {BUYER_HIERARCHY.map((g) => (
            <div key={g.name} className="flex items-center gap-2 text-xs text-slate-400">
              <span
                className="w-3 h-3 rounded-sm flex-none"
                style={{ background: g.color, opacity: 0.7 }}
              />
              <span style={{ fontFamily: 'var(--font-dm-sans)' }}>
                {g.name} · urgency {g.urgency}
              </span>
            </div>
          ))}
        </div>

        <p
          className="text-[10px] text-slate-500 mt-3"
          style={{ fontFamily: 'var(--font-jetbrains)' }}
        >
          Source: docs/ip/_significance/patent-3-significance.md · docs/research/quantum-safe-banking-sb1-intelligence-brief.md.
        </p>
      </GlowCard>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <DataTable
          accent="#A78BFA"
          headers={['Group', 'Buyer', 'Urgency', 'Size', 'Regulation']}
          rows={tableRows}
        />
        <p
          className="text-[10px] text-slate-500 mt-2"
          style={{ fontFamily: 'var(--font-jetbrains)' }}
        >
          Source: DORA · Solvency II ICT · NIS2 Art. 21 · EU AI Act · ENISA CSA.
        </p>
      </motion.div>

      <CalloutBlock
        type="citation"
        title="DORA Art. 7 fines"
        text="DORA is in force in Norway since 1 July 2025; non-compliance can reach 2% of global turnover. Patent 3 is the only construction in the QDaria portfolio that produces the per-key, per-derivation, per-source verifiable lineage that DORA Art. 7 alignment requires."
      />
    </div>
  )
}
