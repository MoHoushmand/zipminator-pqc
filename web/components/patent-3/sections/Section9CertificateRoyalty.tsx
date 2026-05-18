'use client'

import { motion } from 'framer-motion'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Area,
  ResponsiveContainer,
  ComposedChart,
} from 'recharts'
import {
  GlowCard,
  DataTable,
  CalloutBlock,
  ProseBlock,
  MetricCard,
} from '@/components/blueprint/BlueprintSection'
import {
  ROYALTY_BASE_RATE_USD,
  ROYALTY_EVENT_BASE,
  royaltyProjection,
  type BpScenario,
} from '@/lib/patent-3-data'

interface Props {
  scenario: BpScenario
}

const TOOLTIP_STYLE = {
  backgroundColor: 'rgba(17,24,39,0.95)',
  border: '1px solid rgba(167,139,250,0.3)',
  borderRadius: '8px',
  color: '#e2e8f0',
  fontSize: 12,
  fontFamily: 'var(--font-dm-sans), sans-serif',
}

export const Section9CertificateRoyalty = ({ scenario }: Props) => {
  const accent = scenario === 'optimistic' ? '#34D399' : scenario === 'moderate' ? '#F59E0B' : '#22D3EE'

  const conservative = royaltyProjection('conservative')
  const moderate = royaltyProjection('moderate')
  const optimistic = royaltyProjection('optimistic')

  // Merge into one dataset
  const chartData = ROYALTY_EVENT_BASE.map((r, i) => ({
    year: r.year,
    events: r.events,
    conservative: conservative[i].revenueUSDm,
    moderate: moderate[i].revenueUSDm,
    optimistic: optimistic[i].revenueUSDm,
  }))

  const projection = royaltyProjection(scenario)
  const peak = projection[projection.length - 1].revenueUSDm
  const royaltyRate = ROYALTY_BASE_RATE_USD[scenario]

  const tableRows = chartData.map((d, i) => [
    `${d.year}`,
    `${d.events}B`,
    `$${d.conservative}M`,
    `$${d.moderate}M`,
    `$${d.optimistic}M`,
    ROYALTY_EVENT_BASE[i].label.replace(`${d.events}B `, '').replace(`${d.events}B`, ''),
  ])

  return (
    <div className="space-y-10">
      <ProseBlock
        paragraphs={[
          'A per-key certificate-emission royalty of EUR 0.001 to EUR 0.01 against an addressable base of EU regulated key-derivation events (banks, insurers, telcos, government cloud) implies seven-to-eight-figure annual royalty potential at maturity.',
          `Scenario currently selected: ${scenario}. Per-event royalty: $${royaltyRate.toFixed(4)} USD. Comparable patent pools in TLS extension primitives historically settle in this range.`,
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          label="Royalty per event"
          value={`$${royaltyRate.toFixed(4)}`}
          sub={`${scenario} scenario · USD per certificate`}
          accent={accent}
        />
        <MetricCard
          label="Peak annual revenue"
          value={`$${peak}M`}
          sub="2032 projection (USD M)"
          accent={accent}
        />
        <MetricCard
          label="Event base 2032"
          value="340B"
          sub="EU regulated key-derivation events"
          accent="#A78BFA"
        />
      </div>

      <GlowCard accent={accent}>
        <h3
          className="text-lg font-semibold text-slate-100 mb-1"
          style={{ fontFamily: 'var(--font-fraunces)' }}
        >
          Per-Key Certificate Royalty Trajectory
        </h3>
        <p className="text-xs text-slate-500 mb-6" style={{ fontFamily: 'var(--font-dm-sans)' }}>
          Annual licensing revenue in USD millions, derived from $0.001 to $0.01 per certificate against the EU regulated key-derivation event base.
        </p>

        <ResponsiveContainer width="100%" height={360}>
          <ComposedChart data={chartData} margin={{ top: 10, right: 24, left: 0, bottom: 10 }}>
            <defs>
              <linearGradient id="p3-active-area" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={accent} stopOpacity={0.4} />
                <stop offset="100%" stopColor={accent} stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="year"
              tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'var(--font-jetbrains)' }}
            />
            <YAxis
              tick={{ fill: '#64748b', fontSize: 10 }}
              tickFormatter={(v: number) => `$${v}M`}
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              formatter={(value: number, name: string) => [`$${value}M`, name]}
            />
            <Legend
              wrapperStyle={{ fontFamily: 'var(--font-jetbrains)', fontSize: 11 }}
              formatter={(v: string) => <span className="text-slate-300">{v}</span>}
            />
            <Area
              type="monotone"
              dataKey={scenario}
              name={`${scenario} (active)`}
              stroke={accent}
              fill="url(#p3-active-area)"
              strokeWidth={2.5}
              isAnimationActive
              animationDuration={1000}
            />
            <Line
              type="monotone"
              dataKey="conservative"
              name="conservative"
              stroke="#22D3EE"
              strokeWidth={1.4}
              strokeOpacity={scenario === 'conservative' ? 0 : 0.55}
              strokeDasharray="4 3"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="moderate"
              name="moderate"
              stroke="#F59E0B"
              strokeWidth={1.4}
              strokeOpacity={scenario === 'moderate' ? 0 : 0.55}
              strokeDasharray="4 3"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="optimistic"
              name="optimistic"
              stroke="#34D399"
              strokeWidth={1.4}
              strokeOpacity={scenario === 'optimistic' ? 0 : 0.55}
              strokeDasharray="4 3"
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>

        <p
          className="text-[10px] text-slate-500 mt-2"
          style={{ fontFamily: 'var(--font-jetbrains)' }}
        >
          Source: docs/ip/_significance/patent-3-significance.md · Market sizing · MarketsandMarkets PQC 46.2% CAGR.
        </p>
      </GlowCard>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <DataTable
          accent={accent}
          headers={['Year', 'Events', 'Conservative', 'Moderate', 'Optimistic', 'Driver']}
          rows={tableRows}
        />
        <p
          className="text-[10px] text-slate-500 mt-2"
          style={{ fontFamily: 'var(--font-jetbrains)' }}
        >
          Source: Event base [unverified, founder estimate] anchored to EU regulated finance + telco + government cloud.
        </p>
      </motion.div>

      <CalloutBlock
        type="citation"
        title="Bundle multiplier"
        text="Patents 1, 2, and 3 together cover the data-protection chain end-to-end: source (Patent 2) to composition with audit trail (Patent 3) to application to anonymization (Patent 1). Cross-licensing value rises 3-5x relative to single-patent value when sold as a portfolio; the Merkle-certificate primitive is the keystone."
      />
    </div>
  )
}
