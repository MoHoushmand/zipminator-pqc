'use client'

import { motion } from 'framer-motion'
import {
  GlowCard,
  DataTable,
  CalloutBlock,
  ProseBlock,
  Subsection,
} from '@/components/blueprint/BlueprintSection'
import { IRREVERSIBILITY_TIERS, type BpScenario } from '@/lib/patent-1-data'

interface Props {
  scenario: BpScenario
}

// Pyramid widths per tier (bottom = widest); slightly compressed in conservative mode.
const TIER_WIDTHS: Record<BpScenario, [number, number, number]> = {
  conservative: [70, 78, 86],
  moderate: [60, 80, 96],
  optimistic: [54, 82, 100],
}

export const Section1IrreversibilityPyramid = ({ scenario }: Props) => {
  const widths = TIER_WIDTHS[scenario]
  const tiers = [...IRREVERSIBILITY_TIERS].reverse() // top of pyramid first

  return (
    <div className="space-y-10">
      <ProseBlock
        paragraphs={[
          'Patent 1 defines a strict three-tier ordering of anonymization irreversibility. Classical tooling occupies tiers one and two; only QRNG-OTP-Destroy reaches tier three, where the irreversibility guarantee rests on physical law rather than on a hardness assumption.',
          'The pyramid below visualizes that hierarchy. The capstone is the patent claim surface. The base is industry-standard practice today.',
        ]}
      />

      {/* Pyramid SVG */}
      <GlowCard accent="#22D3EE">
        <svg viewBox="0 0 600 360" className="w-full h-auto">
          <defs>
            <linearGradient id="capstone" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#22D3EE" stopOpacity="0.15" />
            </linearGradient>
            <linearGradient id="middle" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.12" />
            </linearGradient>
            <linearGradient id="base" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FB7185" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#FB7185" stopOpacity="0.1" />
            </linearGradient>
          </defs>

          {tiers.map((tier, i) => {
            const widthPct = widths[i]
            const y = 30 + i * 100
            const tierWidth = (widthPct / 100) * 520
            const x = (600 - tierWidth) / 2
            const gradId = i === 0 ? 'capstone' : i === 1 ? 'middle' : 'base'
            return (
              <motion.g
                key={tier.tier}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.25 }}
              >
                <rect
                  x={x}
                  y={y}
                  width={tierWidth}
                  height={80}
                  fill={`url(#${gradId})`}
                  stroke={tier.accent}
                  strokeWidth={1.5}
                  strokeOpacity={0.7}
                  rx={8}
                />
                <text
                  x={300}
                  y={y + 32}
                  textAnchor="middle"
                  fill={tier.accent}
                  fontSize={15}
                  fontWeight={700}
                  fontFamily="var(--font-jetbrains)"
                >
                  {tier.tier}
                </text>
                <text
                  x={300}
                  y={y + 55}
                  textAnchor="middle"
                  fill="#e2e8f0"
                  fontSize={11}
                  fontFamily="var(--font-dm-sans)"
                >
                  {tier.examples.length > 60 ? tier.examples.slice(0, 58) + '...' : tier.examples}
                </text>
              </motion.g>
            )
          })}

          {/* Side annotation: Born rule capstone */}
          <motion.g
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.75 }}
          >
            <text
              x={560}
              y={70}
              textAnchor="end"
              fill="#22D3EE"
              fontSize={10}
              fontFamily="var(--font-jetbrains)"
            >
              Patent 1 capstone
            </text>
          </motion.g>
        </svg>
      </GlowCard>

      <p
        className="text-[10px] text-slate-500"
        style={{ fontFamily: 'var(--font-jetbrains)' }}
      >
        Source: docs/research/paper-1-quantum-anonymization/main.tex, Section 3 (Three-Tier
        Irreversibility Hierarchy); Patent 20260384 Claim 1.
      </p>

      <Subsection heading="What each tier guarantees" accent="#22D3EE">
        <DataTable
          accent="#22D3EE"
          headers={['Tier', 'Description', 'Survives if', 'Examples']}
          rows={IRREVERSIBILITY_TIERS.map((t) => [
            t.tier,
            t.description.length > 80 ? t.description.slice(0, 78) + '...' : t.description,
            t.survives,
            t.examples,
          ])}
        />
      </Subsection>

      <CalloutBlock
        type="insight"
        title="Why the third tier is unreachable for classical tooling"
        text="Reaching tier three requires four simultaneous architectural commitments: a Born-rule entropy source, one-time-pad mapping construction, mapping destruction via multi-pass overwrite, and a provenance certificate. No classical anonymization library composes those four pieces. A parameter swap on ARX or sdcMicro will not get there; only an architectural rebuild does."
      />
    </div>
  )
}
