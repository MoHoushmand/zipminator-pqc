'use client'

import {
  Sankey,
  Tooltip,
  ResponsiveContainer,
  Layer,
  Rectangle,
} from 'recharts'
import {
  TIER_VOLUMES_M,
  TIER_RATES_USD,
  tierRevenueUsdM,
  type BpScenario,
} from '@/lib/patent-2-data'
import {
  GlowCard,
  DataTable,
  CalloutBlock,
  ProseBlock,
  Subsection,
  MetricCard,
} from '@/components/blueprint/BlueprintSection'

interface Props {
  scenario: BpScenario
}

const TIER_COLORS: Record<string, string> = {
  'Tier 1: Chipmaker silicon': '#22D3EE',
  'Tier 2: OEM endpoints': '#34D399',
  'Tier 3: Defense / regulated': '#FB7185',
}

const RATE_COLORS: Record<number, string> = {
  0.02: '#22D3EE',
  0.05: '#34D399',
  0.10: '#FB7185',
}

const TOOLTIP_STYLE = {
  backgroundColor: 'rgba(17,24,39,0.95)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px',
  color: '#e2e8f0',
  fontSize: 12,
  fontFamily: 'var(--font-dm-sans), sans-serif',
}

interface NodeProps {
  x?: number
  y?: number
  width?: number
  height?: number
  index?: number
  payload?: { name: string; value: number; color?: string }
  containerWidth?: number
}

const SankeyNode = (props: NodeProps) => {
  const { x = 0, y = 0, width = 0, height = 0, index = 0, payload, containerWidth = 0 } = props
  if (!payload) return null
  const isOut = x + width + 8 > containerWidth - 220
  const color = payload.color ?? '#22D3EE'
  return (
    <Layer key={`node-${index}`}>
      <Rectangle
        x={x}
        y={y}
        width={width}
        height={height}
        fill={color}
        fillOpacity={0.85}
        stroke={color}
        strokeOpacity={0.95}
        radius={[4, 4, 4, 4]}
      />
      <text
        x={isOut ? x - 8 : x + width + 8}
        y={y + height / 2}
        textAnchor={isOut ? 'end' : 'start'}
        dominantBaseline="middle"
        fill="#e2e8f0"
        fontSize={11}
        fontFamily="var(--font-dm-sans)"
      >
        {payload.name}
      </text>
      <text
        x={isOut ? x - 8 : x + width + 8}
        y={y + height / 2 + 14}
        textAnchor={isOut ? 'end' : 'start'}
        dominantBaseline="middle"
        fill={color}
        fontSize={10}
        fontFamily="var(--font-jetbrains)"
      >
        ${payload.value}M
      </text>
    </Layer>
  )
}

export const Section8LicenseFlow = ({ scenario }: Props) => {
  // Build Sankey nodes / links
  const tiers = Object.keys(TIER_VOLUMES_M) as (keyof typeof TIER_VOLUMES_M)[]
  const rates = Array.from(new Set(Object.values(TIER_RATES_USD))) as number[]

  const nodes = [
    ...tiers.map((t) => ({ name: t.replace(/^Tier \d: /, ''), color: TIER_COLORS[t], value: 0 })),
    ...rates.map((r) => ({ name: `$${r.toFixed(2)}/device`, color: RATE_COLORS[r], value: 0 })),
    { name: 'Annual revenue', color: '#A78BFA', value: 0 },
  ]

  const tierIdx = (t: string) => tiers.indexOf(t as keyof typeof TIER_VOLUMES_M)
  const rateIdx = (r: number) => tiers.length + rates.indexOf(r)
  const revenueIdx = tiers.length + rates.length

  const links: { source: number; target: number; value: number }[] = []

  tiers.forEach((t) => {
    const rate = TIER_RATES_USD[t]
    const rev = tierRevenueUsdM(t, scenario)
    // tier -> rate
    links.push({ source: tierIdx(t), target: rateIdx(rate), value: Math.max(rev, 1) })
    // rate -> revenue (sum aggregated downstream)
    nodes[tierIdx(t)].value += rev
    nodes[rateIdx(rate)].value += rev
  })

  rates.forEach((r) => {
    // For each rate, accumulate revenue from all tiers that share it (here 1:1)
    const totalForRate = tiers
      .filter((t) => TIER_RATES_USD[t] === r)
      .reduce((acc, t) => acc + tierRevenueUsdM(t, scenario), 0)
    links.push({ source: rateIdx(r), target: revenueIdx, value: Math.max(totalForRate, 1) })
  })

  const totalRev = tiers.reduce((acc, t) => acc + tierRevenueUsdM(t, scenario), 0)
  nodes[revenueIdx].value = totalRev

  // Round node values for display
  nodes.forEach((n) => (n.value = Math.round(n.value * 100) / 100))

  return (
    <div className="space-y-10">
      <ProseBlock
        paragraphs={[
          'Three licensee tiers fan into three per-device rate cards, then into one annual revenue line. Tier 1 chipmakers (Qualcomm, Broadcom, MediaTek, Realtek, Espressif) license at $0.02/device on commodity volume. Tier 2 OEMs license endpoint integrations at $0.05/device. Tier 3 defense and regulated verticals license at $0.10/device with built-in audit trail (Claim 13 provenance-preserving pool).',
          'The Sankey below redraws as the scenario toggles. Annual revenue is the rightmost node.',
        ]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          label="Tier 1 annual"
          value={`$${tierRevenueUsdM('Tier 1: Chipmaker silicon', scenario).toFixed(1)}M`}
          sub={`${TIER_VOLUMES_M['Tier 1: Chipmaker silicon'][scenario]}M devices × $0.02`}
          accent={TIER_COLORS['Tier 1: Chipmaker silicon']}
        />
        <MetricCard
          label="Tier 2 annual"
          value={`$${tierRevenueUsdM('Tier 2: OEM endpoints', scenario).toFixed(1)}M`}
          sub={`${TIER_VOLUMES_M['Tier 2: OEM endpoints'][scenario]}M devices × $0.05`}
          accent={TIER_COLORS['Tier 2: OEM endpoints']}
        />
        <MetricCard
          label="Tier 3 annual"
          value={`$${tierRevenueUsdM('Tier 3: Defense / regulated', scenario).toFixed(1)}M`}
          sub={`${TIER_VOLUMES_M['Tier 3: Defense / regulated'][scenario]}M devices × $0.10`}
          accent={TIER_COLORS['Tier 3: Defense / regulated']}
        />
      </div>

      <Subsection heading="Tier → Rate → Annual Revenue" accent="#34D399">
        <GlowCard accent="#34D399">
          <ResponsiveContainer width="100%" height={420}>
            <Sankey
              data={{ nodes, links }}
              nodePadding={28}
              nodeWidth={14}
              margin={{ top: 12, right: 200, bottom: 12, left: 8 }}
              link={{ stroke: '#22D3EE', strokeOpacity: 0.35 }}
              node={(nodeProps: NodeProps) => <SankeyNode {...nodeProps} />}
            >
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={(v: number) => [`$${v.toFixed(1)}M`, 'flow']}
              />
            </Sankey>
          </ResponsiveContainer>

          <div
            className="mt-4 rounded-lg p-4 text-center"
            style={{
              background: 'linear-gradient(135deg, rgba(167,139,250,0.10), rgba(15,23,42,0.5))',
              border: '1px solid rgba(167,139,250,0.35)',
            }}
          >
            <p className="text-[10px] uppercase tracking-wider text-slate-400" style={{ fontFamily: 'var(--font-jetbrains)' }}>
              {scenario} total annual license revenue
            </p>
            <p
              className="text-3xl font-bold mt-1"
              style={{ color: '#A78BFA', fontFamily: 'var(--font-jetbrains)' }}
            >
              ${totalRev.toFixed(1)}M
            </p>
          </div>
        </GlowCard>
        <p className="text-[10px] mt-2 text-slate-500" style={{ fontFamily: 'var(--font-jetbrains)' }}>
          Source: per-device rate card derived from prior PQC silicon-IP licensing benchmarks (PQShield comparable); tier volumes order-of-magnitude per chipmaker installed-base data.
        </p>
      </Subsection>

      <DataTable
        accent="#34D399"
        headers={['Tier', 'License Rate', `${scenario} Volume (M devices)`, `${scenario} Annual ($M)`, 'Anchor Claim']}
        rows={[
          ['Tier 1: Chipmaker silicon', '$0.02 / device', String(TIER_VOLUMES_M['Tier 1: Chipmaker silicon'][scenario]), `$${tierRevenueUsdM('Tier 1: Chipmaker silicon', scenario).toFixed(1)}M`, 'Claim 1, 14'],
          ['Tier 2: OEM endpoints', '$0.05 / device', String(TIER_VOLUMES_M['Tier 2: OEM endpoints'][scenario]), `$${tierRevenueUsdM('Tier 2: OEM endpoints', scenario).toFixed(1)}M`, 'Claim 1, 8 (Standard/Elevated)'],
          ['Tier 3: Defense / regulated', '$0.10 / device', String(TIER_VOLUMES_M['Tier 3: Defense / regulated'][scenario]), `$${tierRevenueUsdM('Tier 3: Defense / regulated', scenario).toFixed(1)}M`, 'Claim 2 (PUEK Military), 13 (provenance)'],
        ]}
      />

      <CalloutBlock
        type="citation"
        title="Why rate stratification works"
        text="Tier 1 sells volume at thin per-unit margin and absorbs the largest installed base. Tier 2 carries integration cost on the OEM side and pays for the on-ramp tooling. Tier 3 buys the provenance-preserving pool (Claim 13) and the Military τ=0.98 profile (Claim 8) as compliance instruments, not as commodity primitives. The Sankey holds the rate card constant; only the volume column shifts with scenario."
        accent="#A78BFA"
      />
    </div>
  )
}
