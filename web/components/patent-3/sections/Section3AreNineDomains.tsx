'use client'

import { motion } from 'framer-motion'
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts'
import {
  GlowCard,
  DataTable,
  CalloutBlock,
  ProseBlock,
} from '@/components/blueprint/BlueprintSection'
import {
  NUMBER_DOMAINS,
  EXCLUDED_DOMAIN,
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

export const Section3AreNineDomains = ({ scenario: _scenario }: Props) => {
  const accent = '#A78BFA'

  const radarData = NUMBER_DOMAINS.map((d) => ({
    domain: d.symbol,
    'Formal closure': d.formal,
    'Structural diversity': d.structural,
  }))

  const tableRows = NUMBER_DOMAINS.map((d) => [
    `${d.domain} (${d.symbol})`,
    `${d.formal}%`,
    `${d.structural}%`,
    d.notes,
  ])

  return (
    <div className="space-y-10">
      <ProseBlock
        paragraphs={[
          'ARE is parameterised by algebraic programs across nine bounded number domains. The extractor program is deterministically generated from a SHAKE-256 seed and operates uniformly over the chosen domain.',
          `GF(p^n) is the only domain where the extraction reduction is formally closed today; a bijection on the multiplicative group yields a min-entropy preservation bound of log_2(p^n - 1) bits per step. The remaining eight domains contribute structural diversity. ${EXCLUDED_DOMAIN.name}s are explicitly excluded because ${EXCLUDED_DOMAIN.reason}.`,
        ]}
      />

      <GlowCard accent={accent}>
        <h3
          className="text-lg font-semibold text-slate-100 mb-1"
          style={{ fontFamily: 'var(--font-fraunces)' }}
        >
          Nine-Axis Domain Radar
        </h3>
        <p className="text-xs text-slate-500 mb-6" style={{ fontFamily: 'var(--font-dm-sans)' }}>
          Formal closure vs structural diversity across N, Z, Q, R, C, H, O, GF(p^n), Q_p.
        </p>

        <ResponsiveContainer width="100%" height={420}>
          <RadarChart data={radarData} outerRadius="78%">
            <PolarGrid stroke="rgba(255,255,255,0.10)" />
            <PolarAngleAxis
              dataKey="domain"
              tick={{ fill: '#cbd5e1', fontSize: 13, fontFamily: 'var(--font-jetbrains)' }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fill: '#64748b', fontSize: 9 }}
              stroke="rgba(255,255,255,0.06)"
            />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Legend
              wrapperStyle={{ fontFamily: 'var(--font-jetbrains)', fontSize: 11 }}
              formatter={(v: string) => <span className="text-slate-300">{v}</span>}
            />
            <Radar
              name="Formal closure"
              dataKey="Formal closure"
              stroke="#34D399"
              fill="#34D399"
              fillOpacity={0.18}
              strokeWidth={2}
            />
            <Radar
              name="Structural diversity"
              dataKey="Structural diversity"
              stroke="#A78BFA"
              fill="#A78BFA"
              fillOpacity={0.18}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>

        <p
          className="text-[10px] text-slate-500 mt-2"
          style={{ fontFamily: 'var(--font-jetbrains)' }}
        >
          Source: docs/research/paper-3-che-are-provenance/main-draft.tex · Section on ARE program space.
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
          headers={['Domain', 'Formal closure', 'Structural diversity', 'Notes']}
          rows={tableRows}
        />
        <p
          className="text-[10px] text-slate-500 mt-2"
          style={{ fontFamily: 'var(--font-jetbrains)' }}
        >
          Source: docs/research/paper-3-che-are-provenance/zenodo-paper3-option-b-gaps.md · T1-T4 gap matrix.
        </p>
      </motion.div>

      <CalloutBlock
        type="equation"
        title="GF(p^n) min-entropy preservation"
        text="For the GF(p^n) subcase, a bijection on the multiplicative group of GF(p^n) gives H_min preservation of log_2(p^n - 1) bits per ARE step. To our knowledge, ARE is the first non-hash extractor family since Trevisan (2001); GF(2^8) and GF(2^128) implementations align with AES and AES-GCM, enabling PCLMULQDQ-class hardware acceleration."
      />
    </div>
  )
}
