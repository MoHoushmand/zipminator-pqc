'use client'

import { motion } from 'framer-motion'
import {
  AreaChart,
  Area,
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
import { REVENUE_AREA, TOOLTIP_STYLE, type BpScenario } from '@/lib/patent-1-data'

interface Props {
  scenario: BpScenario
}

export const Section10RevenueArea = ({ scenario }: Props) => {
  const data = REVENUE_AREA[scenario]
  const peak = data[data.length - 1]
  const total = peak.licensing + peak.saas + peak.defensive

  const fiveYear = data.slice(0, 6).reduce(
    (acc, p) => ({
      licensing: acc.licensing + p.licensing,
      saas: acc.saas + p.saas,
      defensive: acc.defensive + p.defensive,
    }),
    { licensing: 0, saas: 0, defensive: 0 }
  )
  const tenYear = data.reduce(
    (acc, p) => ({
      licensing: acc.licensing + p.licensing,
      saas: acc.saas + p.saas,
      defensive: acc.defensive + p.defensive,
    }),
    { licensing: 0, saas: 0, defensive: 0 }
  )

  return (
    <div className="space-y-10">
      <ProseBlock
        paragraphs={[
          'Patent 1\'s annual revenue contribution splits into three series: standards-essential and OEM licensing, GDPR-compliance SaaS attached to Zipminator, and defensive plus cross-license revenue. The chart stacks the three over a ten-year horizon.',
          'Five-year cumulative contribution (2026-2031) anchors the inventor\'s NOK 30-90M projection. Ten-year cumulative (2026-2036) anchors the NOK 150-450M projection, before EPO and USPTO bundling effects compound.',
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          accent="#22D3EE"
          label="5-yr cumulative"
          value={`USD ${(fiveYear.licensing + fiveYear.saas + fiveYear.defensive).toFixed(0)}M`}
          sub={`2026-2031 ${scenario}`}
        />
        <MetricCard
          accent="#F59E0B"
          label="10-yr cumulative"
          value={`USD ${(tenYear.licensing + tenYear.saas + tenYear.defensive).toFixed(0)}M`}
          sub={`2026-2035 ${scenario}`}
        />
        <MetricCard
          accent="#A78BFA"
          label="Year-10 annual"
          value={`USD ${total.toFixed(0)}M`}
          sub="Licensing + SaaS + defensive"
        />
      </div>

      <GlowCard accent="#22D3EE">
        <h3
          className="text-lg font-semibold text-slate-100 mb-1"
          style={{ fontFamily: 'var(--font-fraunces), Georgia, serif' }}
        >
          Annual revenue contribution by series (USD M)
        </h3>
        <p className="text-sm text-slate-500 mb-6" style={{ fontFamily: 'var(--font-dm-sans)' }}>
          Stacked area, scenario = {scenario}. Year 0 = 2026.
        </p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <ResponsiveContainer width="100%" height={380}>
            <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
              <defs>
                <linearGradient id="p1-licensing" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22D3EE" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#22D3EE" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="p1-saas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.55} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="p1-defensive" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#A78BFA" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#A78BFA" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="year"
                tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'var(--font-dm-sans)' }}
              />
              <YAxis
                tick={{ fill: '#64748b', fontSize: 10 }}
                tickFormatter={(v: number) => `$${v}M`}
              />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [`$${v}M`, '']} />
              <Legend
                wrapperStyle={{ fontFamily: 'var(--font-jetbrains)', fontSize: 11, color: '#cbd5e1' }}
              />
              <Area
                type="monotone"
                dataKey="licensing"
                stackId="rev"
                name="Standards / OEM licensing"
                stroke="#22D3EE"
                strokeWidth={1.6}
                fill="url(#p1-licensing)"
              />
              <Area
                type="monotone"
                dataKey="saas"
                stackId="rev"
                name="GDPR compliance SaaS"
                stroke="#F59E0B"
                strokeWidth={1.6}
                fill="url(#p1-saas)"
              />
              <Area
                type="monotone"
                dataKey="defensive"
                stackId="rev"
                name="Defensive / cross-license"
                stroke="#A78BFA"
                strokeWidth={1.6}
                fill="url(#p1-defensive)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </GlowCard>

      <p
        className="text-[10px] text-slate-500"
        style={{ fontFamily: 'var(--font-jetbrains)' }}
      >
        Source: docs/ip/_significance/patent-1-significance.md "Revenue contribution to
        QDaria" projections; scenario decomposition per inventor.
      </p>

      <Subsection heading="Annual contribution detail" accent="#22D3EE">
        <DataTable
          accent="#22D3EE"
          headers={['Year', 'Licensing (USD M)', 'SaaS (USD M)', 'Defensive (USD M)', 'Total (USD M)']}
          rows={data.map((p) => [
            String(p.year),
            String(p.licensing),
            String(p.saas),
            String(p.defensive),
            String(p.licensing + p.saas + p.defensive),
          ])}
        />
      </Subsection>

      <CalloutBlock
        type="insight"
        title="The licensing curve overtakes the SaaS curve"
        text="In the first three years, GDPR-compliance SaaS dominates because Zipminator carries the patent-protected anonymization features. Once the patent is granted in Norway plus the US continuation lands, the licensing curve takes over: it scales with chip volume and enterprise OEM deals, not with QDaria's direct sales motion. That is the structural reason the patent is worth more than the SaaS revenue stream alone."
      />
    </div>
  )
}
