'use client'

import { motion } from 'framer-motion'
import {
  GlowCard,
  DataTable,
  CalloutBlock,
  ProseBlock,
} from '@/components/blueprint/BlueprintSection'
import {
  QUANTUM_SOURCES,
  ARE_FUSION,
  SOURCE_HEALTH_ROWS,
  type BpScenario,
} from '@/lib/patent-3-data'

interface Props {
  scenario: BpScenario
}

export const Section1HeterogeneousMixing = ({ scenario: _scenario }: Props) => {
  const W = 720
  const H = 420

  return (
    <div className="space-y-10">
      <ProseBlock
        paragraphs={[
          'Patent 3 composes three independent quantum sources plus optional classical sources into a single certified entropy stream. To our knowledge, no other entropy framework binds three commercial quantum-cloud backends through one extractor with end-to-end audit records.',
          'The mixing topology defends against single-vendor quantum-cloud compromise. If any single provider is breached, the heterogeneous XOR composition preserves min-entropy from the contributing subset, with graceful degradation tracked in the Merkle certificate.',
        ]}
      />

      <GlowCard accent="#A78BFA">
        <h3
          className="text-lg font-semibold text-slate-100 mb-1"
          style={{ fontFamily: 'var(--font-fraunces)' }}
        >
          3-Source Mixing Topology
        </h3>
        <p className="text-xs text-slate-500 mb-6" style={{ fontFamily: 'var(--font-dm-sans)' }}>
          IBM Quantum + Rigetti + qBraid feed the ARE conditioner with continuous health monitoring.
        </p>

        <div className="w-full overflow-x-auto">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 640 }}>
            <defs>
              <radialGradient id="p3-node-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
              </radialGradient>
              <marker
                id="p3-arrow"
                markerWidth={10}
                markerHeight={10}
                refX={9}
                refY={5}
                orient="auto"
              >
                <path d="M0,0 L10,5 L0,10 z" fill="#A78BFA" fillOpacity={0.85} />
              </marker>
            </defs>

            {/* Background grid */}
            <g opacity={0.06}>
              {Array.from({ length: 8 }).map((_, i) => (
                <line
                  key={`gx-${i}`}
                  x1={(i + 1) * (W / 9)}
                  x2={(i + 1) * (W / 9)}
                  y1={0}
                  y2={H}
                  stroke="#ffffff"
                />
              ))}
              {Array.from({ length: 5 }).map((_, i) => (
                <line
                  key={`gy-${i}`}
                  y1={(i + 1) * (H / 6)}
                  y2={(i + 1) * (H / 6)}
                  x1={0}
                  x2={W}
                  stroke="#ffffff"
                />
              ))}
            </g>

            {/* Edges from sources to ARE fusion */}
            {QUANTUM_SOURCES.map((src, i) => {
              const dx = ARE_FUSION.x - src.x
              const dy = ARE_FUSION.y - src.y
              const len = Math.sqrt(dx * dx + dy * dy)
              const ux = dx / len
              const uy = dy / len
              const start = { x: src.x + ux * 42, y: src.y + uy * 42 }
              const end = { x: ARE_FUSION.x - ux * 60, y: ARE_FUSION.y - uy * 60 }
              return (
                <motion.line
                  key={`edge-${src.id}`}
                  x1={start.x}
                  y1={start.y}
                  x2={end.x}
                  y2={end.y}
                  stroke={src.color}
                  strokeWidth={2}
                  strokeOpacity={0.45}
                  markerEnd="url(#p3-arrow)"
                  initial={{ pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.2 + i * 0.15 }}
                />
              )
            })}

            {/* Source nodes */}
            {QUANTUM_SOURCES.map((src, i) => (
              <motion.g
                key={src.id}
                initial={{ opacity: 0, scale: 0.6 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: i * 0.12 }}
              >
                <motion.circle
                  cx={src.x}
                  cy={src.y}
                  r={42}
                  fill={src.color}
                  fillOpacity={0.12}
                  stroke={src.color}
                  strokeWidth={1.5}
                  animate={{ r: [42, 48, 42] }}
                  transition={{ duration: 2.6 + i * 0.4, repeat: Infinity, ease: 'easeInOut' }}
                />
                <circle cx={src.x} cy={src.y} r={42} fill="url(#p3-node-glow)" />
                <text
                  x={src.x}
                  y={src.y - 4}
                  textAnchor="middle"
                  fill="#e2e8f0"
                  fontSize={12}
                  fontWeight={600}
                  fontFamily="var(--font-dm-sans)"
                >
                  {src.name}
                </text>
                <text
                  x={src.x}
                  y={src.y + 11}
                  textAnchor="middle"
                  fill={src.color}
                  fontSize={9}
                  fontFamily="var(--font-jetbrains)"
                >
                  {src.detail}
                </text>
                <text
                  x={src.x}
                  y={src.y + 56}
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize={10}
                  fontFamily="var(--font-jetbrains)"
                >
                  {src.bytes}
                </text>
              </motion.g>
            ))}

            {/* ARE fusion node */}
            <motion.g
              initial={{ opacity: 0, scale: 0.6 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <motion.circle
                cx={ARE_FUSION.x}
                cy={ARE_FUSION.y}
                r={62}
                fill={ARE_FUSION.color}
                fillOpacity={0.18}
                stroke={ARE_FUSION.color}
                strokeWidth={2}
                animate={{ r: [62, 70, 62] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
              />
              <circle
                cx={ARE_FUSION.x}
                cy={ARE_FUSION.y}
                r={62}
                fill="url(#p3-node-glow)"
              />
              <text
                x={ARE_FUSION.x}
                y={ARE_FUSION.y - 6}
                textAnchor="middle"
                fill="#e2e8f0"
                fontSize={13}
                fontWeight={700}
                fontFamily="var(--font-dm-sans)"
              >
                ARE
              </text>
              <text
                x={ARE_FUSION.x}
                y={ARE_FUSION.y + 10}
                textAnchor="middle"
                fill={ARE_FUSION.color}
                fontSize={10}
                fontFamily="var(--font-jetbrains)"
              >
                XOR fusion
              </text>
              <text
                x={ARE_FUSION.x}
                y={ARE_FUSION.y + 24}
                textAnchor="middle"
                fill={ARE_FUSION.color}
                fontSize={9}
                fontFamily="var(--font-jetbrains)"
              >
                SP 800-90B
              </text>
            </motion.g>

            {/* Output arrow */}
            <motion.line
              x1={ARE_FUSION.x + 62}
              y1={ARE_FUSION.y}
              x2={W - 30}
              y2={ARE_FUSION.y}
              stroke="#34D399"
              strokeWidth={2.5}
              markerEnd="url(#p3-arrow)"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.9 }}
            />
            <text
              x={W - 50}
              y={ARE_FUSION.y - 12}
              textAnchor="end"
              fill="#34D399"
              fontSize={11}
              fontWeight={600}
              fontFamily="var(--font-jetbrains)"
            >
              Certified entropy + Merkle root
            </text>
          </svg>
        </div>

        <p
          className="text-[10px] text-slate-500 mt-4"
          style={{ fontFamily: 'var(--font-jetbrains)' }}
        >
          Source: docs/ip/_significance/patent-3-significance.md · 156 qubits ibm_kingston (user-confirmed).
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
          headers={['Source', 'Hardware', 'Bytes', 'Health', 'Failure rate']}
          rows={SOURCE_HEALTH_ROWS}
        />
        <p
          className="text-[10px] text-slate-500 mt-2"
          style={{ fontFamily: 'var(--font-jetbrains)' }}
        >
          Source: docs/research/eprint/SHIP_READINESS.md; CSI pool flagged DEGRADED pending M2 expansion to 1M samples.
        </p>
      </motion.div>

      <CalloutBlock
        type="insight"
        title="Why three sources matter"
        text="If any single quantum-cloud provider is breached, XOR composition over the surviving subset preserves min-entropy at log_2(p^n - 1) for the GF(p^n) subcase. The Merkle certificate records which sources contributed, so a downstream auditor can independently recompute the composite min-entropy bound from the leaves."
      />
    </div>
  )
}
