'use client'

import { motion } from 'framer-motion'
import { PIPELINE_STAGES, type BpScenario } from '@/lib/patent-2-data'
import {
  GlowCard,
  DataTable,
  CalloutBlock,
  ProseBlock,
  Subsection,
} from '@/components/blueprint/BlueprintSection'

interface Props {
  scenario: BpScenario
}

// Scenario-driven frame budget shows how the same pipeline scales
const SCENARIO_FRAMES: Record<BpScenario, { frames: number; bytes: number; ratio: number }> = {
  conservative: { frames: 343, bytes: 2690, ratio: 24.5 },
  moderate: { frames: 4_096, bytes: 32_154, ratio: 24.5 },
  optimistic: { frames: 131_072, bytes: 1_029_120, ratio: 24.5 },
}

export const Section1CsiPipeline = ({ scenario }: Props) => {
  const budget = SCENARIO_FRAMES[scenario]
  // Layout: 6 stages, computed positions inside a 1200x320 viewBox
  const STAGE_WIDTH = 1200
  const STAGE_HEIGHT = 320
  const NODE_W = 160
  const NODE_H = 96
  const PAD = 20
  const usable = STAGE_WIDTH - PAD * 2
  const slot = usable / PIPELINE_STAGES.length
  const cy = STAGE_HEIGHT / 2

  return (
    <div className="space-y-10">
      <ProseBlock
        paragraphs={[
          'The unilateral CSI primitive turns ambient WiFi reception into NIST-validated entropy in six bounded stages. Every chip already exposes the inputs; no silicon change, no cooperating endpoint, no reconciliation. The pipeline is what the independent claim covers, end to end.',
          'Empirical anchor: 343 Nexmon frames from the Broadcom BCM4339 baseline produced 2,690 bytes at a 24.5% extraction ratio. The 5.50 bpb result holds the paper-internal invariant under NIST SP 800-90B `ea_non_iid` MCV at 99% confidence.',
        ]}
      />

      <Subsection heading="Six-Stage Extraction" accent="#34D399">
        <GlowCard accent="#34D399" className="overflow-x-auto">
          <svg
            viewBox={`0 0 ${STAGE_WIDTH} ${STAGE_HEIGHT}`}
            width="100%"
            preserveAspectRatio="xMidYMid meet"
            style={{ minWidth: 760 }}
          >
            <defs>
              <marker
                id="p2-arrow"
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto"
              >
                <path d="M0,0 L10,5 L0,10 Z" fill="#34D399" />
              </marker>
              {PIPELINE_STAGES.map((s) => (
                <linearGradient key={s.id} id={`p2-grad-${s.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={s.accent} stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#020817" stopOpacity="0.7" />
                </linearGradient>
              ))}
            </defs>

            {/* Connector arrows (drawn first so nodes sit on top) */}
            {PIPELINE_STAGES.slice(0, -1).map((_, i) => {
              const x1 = PAD + slot * i + slot / 2 + NODE_W / 2
              const x2 = PAD + slot * (i + 1) + slot / 2 - NODE_W / 2 - 4
              return (
                <motion.line
                  key={`arrow-${i}`}
                  x1={x1}
                  y1={cy}
                  x2={x2}
                  y2={cy}
                  stroke="#34D399"
                  strokeWidth={2}
                  strokeOpacity={0.6}
                  markerEnd="url(#p2-arrow)"
                  initial={{ pathLength: 0, opacity: 0 }}
                  whileInView={{ pathLength: 1, opacity: 0.85 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.2 + i * 0.18 }}
                />
              )
            })}

            {PIPELINE_STAGES.map((s, i) => {
              const cx = PAD + slot * i + slot / 2
              return (
                <motion.g
                  key={s.id}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: 0.1 + i * 0.18 }}
                >
                  <rect
                    x={cx - NODE_W / 2}
                    y={cy - NODE_H / 2}
                    width={NODE_W}
                    height={NODE_H}
                    rx={14}
                    fill={`url(#p2-grad-${s.id})`}
                    stroke={s.accent}
                    strokeOpacity={0.55}
                    strokeWidth={1.4}
                  />
                  <text
                    x={cx}
                    y={cy - 10}
                    textAnchor="middle"
                    fill="#f1f5f9"
                    fontFamily="var(--font-fraunces)"
                    fontSize={15}
                    fontWeight={600}
                  >
                    {s.label}
                  </text>
                  <text
                    x={cx}
                    y={cy + 22}
                    textAnchor="middle"
                    fill={s.accent}
                    fontFamily="var(--font-jetbrains)"
                    fontSize={9}
                    opacity={0.95}
                  >
                    Stage {String(i + 1).padStart(2, '0')}
                  </text>

                  {/* Annotation below the node */}
                  <foreignObject x={cx - NODE_W / 2 - 8} y={cy + NODE_H / 2 + 8} width={NODE_W + 16} height={96}>
                    <div
                      style={{
                        fontFamily: 'var(--font-dm-sans)',
                        fontSize: 10.5,
                        color: '#94a3b8',
                        textAlign: 'center',
                        lineHeight: 1.35,
                      }}
                    >
                      {s.detail}
                    </div>
                  </foreignObject>
                </motion.g>
              )
            })}
          </svg>
        </GlowCard>
        <p
          className="text-[10px] mt-2 text-slate-500"
          style={{ fontFamily: 'var(--font-jetbrains)' }}
        >
          Source: docs/research/paper-2-csi-entropy-puek/body-ieee.tex § Extraction Pipeline; reference crates/zipminator-mesh/src/csi_entropy.rs (407 lines, 11 tests).
        </p>
      </Subsection>

      <DataTable
        accent="#34D399"
        headers={['Stage', 'Operation', 'Output', 'Reference']}
        rows={PIPELINE_STAGES.map((s, i) => [
          `${String(i + 1).padStart(2, '0')} · ${s.label}`,
          s.detail,
          i === PIPELINE_STAGES.length - 1 ? '2,690 bytes (anchor sample)' : 'forward signal',
          i === 0 ? 'BCM4339 / Gi-z corpus' : i === PIPELINE_STAGES.length - 1 ? 'csi_entropy.rs' : 'csi_entropy.rs',
        ])}
      />

      <CalloutBlock
        type="insight"
        title="Why unilateral matters"
        text="Fifteen years of CSI work assumed two endpoints reconciling a shared key. The structural break in Claim 1 is that one device reads its own channel and outputs entropy. No partner, no reconciliation protocol, no reciprocity assumption. The bilateral prior art (Mathur 2008, Jana 2009, Liu 2012, Avrahami 2023, plus four patent filings) does not read on a single-endpoint extractor."
        accent="#34D399"
      />

      <Subsection heading="Scenario-conditional throughput" accent="#F59E0B">
        <ProseBlock
          paragraphs={[
            `Scenario ${scenario}: a ${budget.frames.toLocaleString()}-frame capture yields ${budget.bytes.toLocaleString()} bytes at the same 24.5% extraction ratio. The 343-frame conservative anchor is what the paper actually measured. Moderate and optimistic columns show what the same pipeline produces under the demo-kit capture budget.`,
          ]}
        />
      </Subsection>

      <DataTable
        accent="#F59E0B"
        headers={['Quantity', 'Conservative (paper anchor)', 'Moderate (demo-kit)', 'Optimistic (extended capture)']}
        rows={[
          ['Frames captured', '343', '4,096', '131,072'],
          ['Bytes extracted', '2,690', '32,154', '1,029,120'],
          ['Extraction ratio', '24.5%', '24.5%', '24.5%'],
          ['Sample status vs NIST SP 800-90B', 'pilot · below 1M threshold', 'demo-kit · methodological', 'production-track · above 1M threshold'],
        ]}
      />
    </div>
  )
}
