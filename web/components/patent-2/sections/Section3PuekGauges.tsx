'use client'

import { motion } from 'framer-motion'
import {
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { PUEK_PROFILES, type BpScenario } from '@/lib/patent-2-data'
import {
  GlowCard,
  DataTable,
  CalloutBlock,
  ProseBlock,
  Subsection,
  EquationCard,
} from '@/components/blueprint/BlueprintSection'

interface Props {
  scenario: BpScenario
}

// Scenario adjusts which profile is the recommended deployment default
const RECOMMENDED_BY_SCENARIO: Record<BpScenario, { name: string; rationale: string }> = {
  conservative: {
    name: 'Standard',
    rationale: 'Default tier for consumer endpoints; broad licensee compatibility.',
  },
  moderate: {
    name: 'High',
    rationale: 'Financial-services baseline; aligns with DORA Article 6.4 cryptographic-update audit trail.',
  },
  optimistic: {
    name: 'Military',
    rationale: 'Classified comms; geofenced PUEK gates by physical RF environment, not by device.',
  },
}

export const Section3PuekGauges = ({ scenario }: Props) => {
  const recommended = RECOMMENDED_BY_SCENARIO[scenario]

  return (
    <div className="space-y-10">
      <ProseBlock
        paragraphs={[
          'The Physical Unclonable Environment Key (PUEK) derives 32-byte AES-class keys from the right singular vectors of the CSI matrix C in C^{M × K}. SVD enrollment captures the top-d eigenvectors as a fingerprint; at re-derive time, subspace similarity s is compared against a threshold τ. If s ≥ τ, HKDF-SHA256 emits the key; otherwise it refuses.',
          'Four security profiles are codified in dependent Claim 8 of the patent. Each profile is a configurable τ from 0.75 to 0.98, with monotonic security versus environmental tolerance. The key is bound to the room, not to the chip.',
        ]}
      />

      <EquationCard
        label="PUEK Subspace Similarity"
        equation="s = (1 / d) · Σᵢ |⟨v_ref,i , v_new,i⟩|²"
        description="Average squared overlap between enrolled and re-derived right singular vectors. Threshold τ ∈ {0.75, 0.85, 0.95, 0.98} per security profile."
        accent="#A78BFA"
      />

      <Subsection heading="Security Profile Gauges" accent="#34D399">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {PUEK_PROFILES.map((p, i) => {
            const data = [{ name: p.name, value: p.percent, fill: p.color }]
            const isRecommended = p.name === recommended.name
            return (
              <motion.div
                key={p.name}
                initial={{ opacity: 0, scale: 0.92 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 + i * 0.12 }}
                className="rounded-2xl p-5 relative"
                style={{
                  background: `linear-gradient(135deg, ${p.color}10, rgba(15,23,42,0.6))`,
                  border: `1px solid ${p.color}40`,
                  boxShadow: isRecommended
                    ? `0 0 32px ${p.color}28, 0 4px 24px rgba(0,0,0,0.4)`
                    : `0 0 12px ${p.color}12, 0 4px 16px rgba(0,0,0,0.25)`,
                }}
              >
                {isRecommended && (
                  <span
                    className="absolute top-3 right-3 px-2 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider"
                    style={{
                      background: `${p.color}28`,
                      color: p.color,
                      border: `1px solid ${p.color}55`,
                    }}
                  >
                    {scenario} pick
                  </span>
                )}

                <div className="h-44 -mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart
                      cx="50%"
                      cy="50%"
                      innerRadius="62%"
                      outerRadius="92%"
                      data={data}
                      startAngle={90}
                      endAngle={-270}
                    >
                      <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                      <RadialBar
                        background={{ fill: 'rgba(255,255,255,0.04)' }}
                        dataKey="value"
                        cornerRadius={6}
                        animationDuration={900}
                        animationBegin={i * 120}
                      >
                        <Cell fill={p.color} />
                      </RadialBar>
                      <text
                        x="50%"
                        y="48%"
                        textAnchor="middle"
                        fill="#f1f5f9"
                        fontFamily="var(--font-jetbrains)"
                        fontSize={26}
                        fontWeight={700}
                      >
                        {p.threshold.toFixed(2)}
                      </text>
                      <text
                        x="50%"
                        y="60%"
                        textAnchor="middle"
                        fill={p.color}
                        fontFamily="var(--font-jetbrains)"
                        fontSize={10}
                      >
                        τ threshold
                      </text>
                    </RadialBarChart>
                  </ResponsiveContainer>
                </div>

                <div className="text-center mt-1">
                  <p
                    className="text-base font-semibold text-slate-100"
                    style={{ fontFamily: 'var(--font-fraunces)' }}
                  >
                    {p.name}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                    {p.use}
                  </p>
                  <p
                    className="text-[10px] text-slate-500 mt-2"
                    style={{ fontFamily: 'var(--font-jetbrains)' }}
                  >
                    P(false-accept) ≈ {p.falseAccept}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>
        <p className="text-[10px] mt-3 text-slate-500" style={{ fontFamily: 'var(--font-jetbrains)' }}>
          Source: docs/ip/patent-2-csi-entropy-puek/patentkrav.md Claim 8; crates/zipminator-mesh/src/puek.rs (393 lines, 11 tests).
        </p>
      </Subsection>

      <CalloutBlock
        type="insight"
        title={`${scenario} scenario · recommended default`}
        text={`${recommended.name} (τ = ${PUEK_PROFILES.find((p) => p.name === recommended.name)?.threshold.toFixed(2)}). ${recommended.rationale}`}
        accent="#34D399"
      />

      <DataTable
        accent="#34D399"
        headers={['Profile', 'τ Threshold', 'False-Accept (target)', 'Typical Deployment']}
        rows={PUEK_PROFILES.map((p) => [p.name, p.threshold.toFixed(2), p.falseAccept, p.use])}
      />

      <Subsection heading="Why PUEK ≠ PUF" accent="#A78BFA">
        <GlowCard accent="#A78BFA">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p
                className="text-xs font-mono uppercase tracking-wider mb-2"
                style={{ color: '#FB7185', fontFamily: 'var(--font-jetbrains)' }}
              >
                Hardware PUF
              </p>
              <ul className="text-sm text-slate-300 space-y-2" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                <li>Key bound to silicon manufacturing variation</li>
                <li>Requires silicon support; new chip = new fab</li>
                <li>Weakens with aging, voltage drift, temperature</li>
                <li>Per-design NIST SP 800-90B certification burden</li>
              </ul>
            </div>
            <div>
              <p
                className="text-xs font-mono uppercase tracking-wider mb-2"
                style={{ color: '#34D399', fontFamily: 'var(--font-jetbrains)' }}
              >
                PUEK
              </p>
              <ul className="text-sm text-slate-300 space-y-2" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                <li>Key bound to the physical RF environment</li>
                <li>Deploys on any 802.11n/ac/ax chip already in the field</li>
                <li>Key rotates when room changes; geofenced by physics</li>
                <li>Single SP 800-90B extraction pipeline across all chipsets</li>
              </ul>
            </div>
          </div>
        </GlowCard>
      </Subsection>
    </div>
  )
}
