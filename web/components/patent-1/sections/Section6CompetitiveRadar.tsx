'use client'

import { motion } from 'framer-motion'
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  GlowCard,
  DataTable,
  CalloutBlock,
  ProseBlock,
  Subsection,
} from '@/components/blueprint/BlueprintSection'
import {
  COMPETITIVE_RADAR,
  COMPETITORS_META,
  TOOLTIP_STYLE,
  type BpScenario,
} from '@/lib/patent-1-data'

interface Props {
  scenario: BpScenario
}

// Scenario tweaks how aggressively QDaria is plotted relative to peers (within the same axes).
const SCENARIO_QDARIA_SCALE: Record<BpScenario, number> = {
  conservative: 0.85,
  moderate: 1.0,
  optimistic: 1.05,
}

const PRIMARY = COMPETITORS_META.find((c) => c.key === 'QDaria')!
const PEERS = COMPETITORS_META.filter((c) => c.key !== 'QDaria')

export const Section6CompetitiveRadar = ({ scenario }: Props) => {
  const qdariaScale = SCENARIO_QDARIA_SCALE[scenario]

  const data = COMPETITIVE_RADAR.map((row) => ({
    ...row,
    QDaria: Math.min(100, Math.round(row.QDaria * qdariaScale)),
  }))

  return (
    <div className="space-y-10">
      <ProseBlock
        paragraphs={[
          'The radar plots Patent 1 against five widely-deployed anonymization tools across six dimensions: irreversibility, audit trail, performance, regulatory fit, openness, and hardware anchor. The axes are calibrated 0-100.',
          'QDaria leads on irreversibility, regulatory fit, audit trail, and hardware anchor. Performance is competitive but not dominant; openness sits mid-pack because Patent 1\'s implementation is Apache-2.0 while the patent itself is licensed. Apple LDP wins on performance; OpenDP wins on openness.',
        ]}
      />

      <GlowCard accent="#22D3EE">
        <h3
          className="text-lg font-semibold text-slate-100 mb-1"
          style={{ fontFamily: 'var(--font-fraunces), Georgia, serif' }}
        >
          QDaria vs ARX, sdcMicro, Privitar, OpenDP, Apple LDP
        </h3>
        <p className="text-sm text-slate-500 mb-6" style={{ fontFamily: 'var(--font-dm-sans)' }}>
          Six dimensions, 0-100 scale. QDaria plotted at scenario-dependent intensity.
        </p>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <ResponsiveContainer width="100%" height={440}>
            <RadarChart data={data} margin={{ top: 20, right: 40, left: 40, bottom: 20 }}>
              <PolarGrid stroke="rgba(255,255,255,0.08)" />
              <PolarAngleAxis
                dataKey="dimension"
                tick={{ fill: '#cbd5e1', fontSize: 11, fontFamily: 'var(--font-dm-sans)' }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                tick={{ fill: '#64748b', fontSize: 10 }}
              />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend
                wrapperStyle={{ fontFamily: 'var(--font-jetbrains)', fontSize: 11, color: '#cbd5e1' }}
              />
              <Radar
                name={PRIMARY.key}
                dataKey={PRIMARY.key}
                stroke={PRIMARY.color}
                fill={PRIMARY.color}
                fillOpacity={0.35}
                strokeWidth={2}
              />
              {PEERS.map((p) => (
                <Radar
                  key={p.key}
                  name={p.key}
                  dataKey={p.key}
                  stroke={p.color}
                  fill={p.color}
                  fillOpacity={0.08}
                  strokeWidth={1.2}
                />
              ))}
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>
      </GlowCard>

      <p
        className="text-[10px] text-slate-500"
        style={{ fontFamily: 'var(--font-jetbrains)' }}
      >
        Source: docs/research/quantum-anonymization-comparison.md; ARX (Prasser et al.),
        sdcMicro, Privitar (Informatica), OpenDP (Harvard/Microsoft), Apple LDP datasheet.
      </p>

      <Subsection heading="Score detail (6 dimensions x 6 systems)" accent="#22D3EE">
        <DataTable
          accent="#22D3EE"
          headers={['Dimension', 'QDaria', 'ARX', 'sdcMicro', 'Privitar', 'OpenDP', 'Apple LDP']}
          rows={data.map((r) => [
            r.dimension,
            String(r.QDaria),
            String(r.ARX),
            String(r.sdcMicro),
            String(r.Privitar),
            String(r.OpenDP),
            String(r.AppleLDP),
          ])}
        />
      </Subsection>

      <Subsection heading="System summaries" accent="#A78BFA">
        <DataTable
          accent="#A78BFA"
          headers={['System', 'Approach']}
          rows={COMPETITORS_META.map((m) => [m.key, m.kind])}
        />
      </Subsection>

      <CalloutBlock
        type="insight"
        title="Hardware anchor is the unique axis"
        text="No competitor scores above 5 on the hardware-anchor axis. ARX, sdcMicro, Privitar, and OpenDP are all software-only with software-PRNG entropy. Apple LDP runs on secure enclaves but does not anchor entropy in Born-rule physics. Patent 1 is the only construction in this comparison whose security argument rests on a physical source rather than on the secrecy of a software seed."
      />
    </div>
  )
}
