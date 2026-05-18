'use client'

import { motion } from 'framer-motion'
import { DataTable, GlowCard, CalloutBlock } from '@/components/blueprint/BlueprintSection'
import { STACK_LAYERS, type BpScenario } from '@/lib/portfolio-data'

interface Props {
  scenario: BpScenario
}

// Per-scenario claim defensibility uplift (visible scenario change)
const DEFENSIBILITY = {
  conservative: { P1: 78, P2: 82, P3: 75 },
  moderate: { P1: 88, P2: 92, P3: 86 },
  optimistic: { P1: 95, P2: 98, P3: 93 },
}

export const Section1Stack = ({ scenario }: Props) => {
  const def = DEFENSIBILITY[scenario]

  return (
    <div className="space-y-10">
      <p
        className="text-[15px] leading-relaxed text-slate-300"
        style={{ fontFamily: 'var(--font-dm-sans)' }}
      >
        QDaria&apos;s portfolio is not three loose inventions; it is a single vertically-integrated
        post-quantum data-protection stack with three claim families that interlock by design.
        P2 produces entropy, P3 certifies and audits it, P1 applies it to a regulated outcome.
        No competitor holds an analogous source-audit-application triad.
      </p>

      {/* Isometric SVG stack visualization */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="rounded-2xl p-8 flex justify-center"
        style={{ background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <svg viewBox="0 0 600 460" width="100%" style={{ maxWidth: 720 }}>
          <defs>
            <linearGradient id="grad-amber" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.18" />
            </linearGradient>
            <linearGradient id="grad-emerald" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#34D399" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#34D399" stopOpacity="0.18" />
            </linearGradient>
            <linearGradient id="grad-cyan" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#22D3EE" stopOpacity="0.18" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="6" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {STACK_LAYERS.map((layer, i) => {
            const yBase = 60 + i * 120
            const isoSkew = -22
            return (
              <motion.g
                key={layer.id}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 + i * 0.15 }}
              >
                {/* Side face */}
                <polygon
                  points={`60,${yBase + 90} 100,${yBase + 110} 100,${yBase + 25} 60,${yBase + 5}`}
                  fill={layer.color}
                  fillOpacity={0.18}
                  stroke={layer.color}
                  strokeOpacity={0.4}
                />
                {/* Top face (isometric) */}
                <polygon
                  points={`60,${yBase + 5} 100,${yBase + 25} 540,${yBase + 25} 500,${yBase + 5}`}
                  fill={layer.color}
                  fillOpacity={0.25}
                  stroke={layer.color}
                  strokeOpacity={0.5}
                />
                {/* Front face */}
                <rect
                  x={100}
                  y={yBase + 25}
                  width={440}
                  height={85}
                  rx={6}
                  fill={`url(#grad-${layer.color === '#F59E0B' ? 'amber' : layer.color === '#34D399' ? 'emerald' : 'cyan'})`}
                  stroke={layer.color}
                  strokeOpacity={0.55}
                  strokeWidth={1.5}
                  filter="url(#glow)"
                />
                <text
                  x={120}
                  y={yBase + 52}
                  fill={layer.color}
                  fontSize={11}
                  fontFamily="var(--font-jetbrains)"
                  fontWeight={700}
                  letterSpacing="0.18em"
                >
                  {layer.layer.toUpperCase()} LAYER  ·  {layer.id}  ·  {layer.claims} CLAIMS
                </text>
                <text
                  x={120}
                  y={yBase + 76}
                  fill="#e2e8f0"
                  fontSize={18}
                  fontFamily="var(--font-fraunces)"
                  fontWeight={600}
                >
                  {layer.title}
                </text>
                <text
                  x={120}
                  y={yBase + 98}
                  fill="#94a3b8"
                  fontSize={11}
                  fontFamily="var(--font-dm-sans)"
                >
                  {layer.role}
                </text>
                <text
                  x={520}
                  y={yBase + 52}
                  fill="#64748b"
                  fontSize={10}
                  fontFamily="var(--font-jetbrains)"
                  textAnchor="end"
                >
                  {layer.filingDate}
                </text>
                <text
                  x={520}
                  y={yBase + 98}
                  fill={layer.color}
                  fontSize={13}
                  fontFamily="var(--font-jetbrains)"
                  fontWeight={700}
                  textAnchor="end"
                >
                  {def[layer.id as 'P1' | 'P2' | 'P3']}% defensibility
                </text>
              </motion.g>
            )
          })}

          {/* Up arrows between layers */}
          {[0, 1].map((i) => {
            const y = 60 + i * 120 + 110
            return (
              <motion.g
                key={i}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.6 + i * 0.15 }}
              >
                <line x1={320} y1={y + 4} x2={320} y2={y + 16} stroke="#A78BFA" strokeWidth={2} />
                <polygon points={`315,${y + 14} 320,${y + 24} 325,${y + 14}`} fill="#A78BFA" />
              </motion.g>
            )
          })}
        </svg>
      </motion.div>

      <CalloutBlock
        type="insight"
        title="Stack order"
        text="P2 ambient WiFi-CSI extraction (SP 800-90B IID 5.50 bpb) feeds P3 heterogeneous mixing (IBM Quantum 156 qubits + Rigetti + qBraid) under Merkle audit; P3 emits a ProvenanceCertificate consumed by P1 to produce mapping-destroyed output with information-theoretic irreversibility."
      />

      {/* Per-layer detail cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {STACK_LAYERS.map((layer) => (
          <GlowCard key={layer.id} accent={layer.color}>
            <p
              className="text-[10px] font-mono uppercase tracking-widest mb-2"
              style={{ color: layer.color }}
            >
              {layer.id}  ·  {layer.layer}
            </p>
            <h3
              className="text-lg font-semibold text-slate-100 mb-3"
              style={{ fontFamily: 'var(--font-fraunces)' }}
            >
              {layer.title}
            </h3>
            <p className="text-xs text-slate-400 mb-2" style={{ fontFamily: 'var(--font-dm-sans)' }}>
              <strong className="text-slate-300">Proof.</strong> {layer.proof}
            </p>
            <p className="text-xs text-slate-400" style={{ fontFamily: 'var(--font-dm-sans)' }}>
              <strong className="text-slate-300">Surface.</strong> {layer.surface}
            </p>
          </GlowCard>
        ))}
      </div>

      <DataTable
        headers={['Patent', 'Layer', 'Claims', 'Filing date', 'Role']}
        rows={STACK_LAYERS.map((l) => [l.id, l.layer, String(l.claims), l.filingDate, l.role])}
        accent="#A78BFA"
      />

      <p
        className="text-[10px] text-gray-500"
        style={{ fontFamily: 'var(--font-jetbrains)' }}
      >
        Source: PORTFOLIO_SIGNIFICANCE.md Section 1; Patent applications 20260384 + filings of 2026-04-04 + 2026-04-05.
      </p>
    </div>
  )
}
