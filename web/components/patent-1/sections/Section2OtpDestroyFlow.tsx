'use client'

import { motion } from 'framer-motion'
import {
  GlowCard,
  DataTable,
  CalloutBlock,
  ProseBlock,
  Subsection,
  EquationCard,
} from '@/components/blueprint/BlueprintSection'
import { FLOW_STAGES, type BpScenario } from '@/lib/patent-1-data'

interface Props {
  scenario: BpScenario
}

const SCENARIO_LATENCY: Record<BpScenario, { qrng: number; pool: number; otp: number; apply: number; destroy: number; certificate: number }> = {
  conservative: { qrng: 320, pool: 18, otp: 42, apply: 210, destroy: 95, certificate: 12 },
  moderate: { qrng: 180, pool: 12, otp: 28, apply: 160, destroy: 65, certificate: 8 },
  optimistic: { qrng: 95, pool: 7, otp: 16, apply: 110, destroy: 38, certificate: 4 },
}

export const Section2OtpDestroyFlow = ({ scenario }: Props) => {
  const latency = SCENARIO_LATENCY[scenario]
  const lookup: Record<string, number> = latency as unknown as Record<string, number>

  // Flow positions on the SVG (6 stages, evenly spaced).
  const stageX = (i: number) => 60 + i * 100

  return (
    <div className="space-y-10">
      <ProseBlock
        paragraphs={[
          'Claim 1 reads on a six-stage pipeline: harvest Born-rule entropy from a quantum source, accumulate it in a thread-safe pool, build a one-time-pad mapping per unique PII value, apply the mapping across the dataset, destroy the mapping with a multi-pass overwrite, and emit a certificate that records what was consumed.',
          'No deterministic seed exists at any point; irreversibility is asserted regardless of computational resources, including in a scenario where P equals NP.',
        ]}
      />

      {/* Flow SVG */}
      <GlowCard accent="#A78BFA">
        <svg viewBox="0 0 640 220" className="w-full h-auto">
          <defs>
            <marker
              id="arrowhead-flow"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 10 3, 0 6" fill="#A78BFA" fillOpacity="0.7" />
            </marker>
          </defs>

          {/* Arrows */}
          {FLOW_STAGES.slice(0, -1).map((_, i) => (
            <motion.path
              key={i}
              d={`M ${stageX(i) + 36} 110 L ${stageX(i + 1) - 36} 110`}
              stroke="#A78BFA"
              strokeWidth={1.5}
              strokeOpacity={0.55}
              fill="none"
              markerEnd="url(#arrowhead-flow)"
              initial={{ pathLength: 0, opacity: 0 }}
              whileInView={{ pathLength: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.15 * (i + 1) }}
            />
          ))}

          {FLOW_STAGES.map((stage, i) => (
            <motion.g
              key={stage.id}
              initial={{ opacity: 0, scale: 0.85 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.12 * i }}
            >
              <circle
                cx={stageX(i)}
                cy={110}
                r={32}
                fill={`${stage.accent}1f`}
                stroke={stage.accent}
                strokeWidth={1.5}
              />
              <text
                x={stageX(i)}
                y={114}
                textAnchor="middle"
                fill={stage.accent}
                fontSize={10}
                fontWeight={700}
                fontFamily="var(--font-jetbrains)"
              >
                {String(i + 1).padStart(2, '0')}
              </text>
              <text
                x={stageX(i)}
                y={68}
                textAnchor="middle"
                fill="#e2e8f0"
                fontSize={11}
                fontFamily="var(--font-dm-sans)"
              >
                {stage.label}
              </text>
              <text
                x={stageX(i)}
                y={172}
                textAnchor="middle"
                fill="#94a3b8"
                fontSize={10}
                fontFamily="var(--font-jetbrains)"
              >
                {lookup[stage.id]} ms
              </text>
            </motion.g>
          ))}
        </svg>
      </GlowCard>

      <p
        className="text-[10px] text-slate-500"
        style={{ fontFamily: 'var(--font-jetbrains)' }}
      >
        Source: Patent 20260384 Claims 1, 2, 5, 9, 13, 15; latency from
        crates/zipminator-core benchmarks (scenario={scenario}).
      </p>

      <Subsection heading="Stage detail and claim coverage" accent="#A78BFA">
        <DataTable
          accent="#A78BFA"
          headers={['Stage', 'Label', 'What it does', 'Latency (ms)']}
          rows={FLOW_STAGES.map((s, i) => [
            String(i + 1).padStart(2, '0'),
            s.label,
            s.detail,
            `${lookup[s.id]}`,
          ])}
        />
      </Subsection>

      <EquationCard
        label="Patent Claim 1 (skeleton)"
        equation="anonymize(D) = apply(D, OTP(QRNG)) ; destroy(OTP) ; certify(D, hash)"
        description="No persistent mapping. Output cannot be inverted without the destroyed OTP, which never existed deterministically."
      />

      <CalloutBlock
        type="insight"
        title="Mapping destruction is the load-bearing step"
        text="Tier-two information-theoretic OTP relies on the secrecy of the key. Patent 1 escalates to tier three by physically destroying the key after a single use, using DoD 5220.22-M three-pass overwrite (Claim 5) and optionally an SGX or TrustZone enclave (Claim 8). Without the destroy step, the patent collapses to a Vernam cipher; with it, the patent becomes a new class of anonymizer."
      />
    </div>
  )
}
