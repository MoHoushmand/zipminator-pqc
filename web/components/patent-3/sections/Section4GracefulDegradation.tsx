'use client'

import { motion } from 'framer-motion'
import {
  GlowCard,
  DataTable,
  CalloutBlock,
  ProseBlock,
} from '@/components/blueprint/BlueprintSection'
import {
  HEALTH_STATES,
  HEALTH_TRANSITIONS,
  type BpScenario,
} from '@/lib/patent-3-data'

interface Props {
  scenario: BpScenario
}

export const Section4GracefulDegradation = ({ scenario: _scenario }: Props) => {
  const W = 760
  const H = 320

  const positions: Record<string, { x: number; y: number }> = {
    HEALTHY: { x: 130, y: 160 },
    DEGRADED: { x: 380, y: 160 },
    FAILED: { x: 630, y: 160 },
  }

  const stateColor = (id: string) => HEALTH_STATES.find((s) => s.id === id)!.color

  // Curved edges between states
  const edgePath = (from: string, to: string, dy: number) => {
    const a = positions[from]
    const b = positions[to]
    const mx = (a.x + b.x) / 2
    const my = (a.y + b.y) / 2 + dy
    return `M ${a.x + (a.x < b.x ? 64 : -64)} ${a.y + dy * 0.2} Q ${mx} ${my} ${b.x + (a.x < b.x ? -64 : 64)} ${b.y + dy * 0.2}`
  }

  const tableRows = HEALTH_STATES.map((s) => [
    s.label,
    s.id === 'HEALTHY' ? '3 of 3' : s.id === 'DEGRADED' ? '2 of 3 · 1 flagged' : '< min_sources',
    s.desc,
  ])

  return (
    <div className="space-y-10">
      <ProseBlock
        paragraphs={[
          'No silent fallback. Failed sources are excluded, degraded sources continue under a logged warning, and the reported conservative min-entropy bound is recomputed from the contributing subset. A configurable min_sources threshold halts composition below the safety floor.',
          'The 1% failure-rate threshold separates HEALTHY from DEGRADED at every health test (Repetition Count, Adaptive Proportion, MCV). The state machine is observable through Merkle leaves, so an auditor sees exactly which source was healthy at composition time.',
        ]}
      />

      <GlowCard accent="#F59E0B">
        <h3
          className="text-lg font-semibold text-slate-100 mb-1"
          style={{ fontFamily: 'var(--font-fraunces)' }}
        >
          Source Health State Machine
        </h3>
        <p className="text-xs text-slate-500 mb-6" style={{ fontFamily: 'var(--font-dm-sans)' }}>
          Per-source transitions; 1% failure-rate threshold annotated on the HEALTHY → DEGRADED edge.
        </p>

        <div className="w-full overflow-x-auto">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 700 }}>
            <defs>
              {HEALTH_STATES.map((s) => (
                <marker
                  key={`m-${s.id}`}
                  id={`p3-arrow-${s.id}`}
                  markerWidth={10}
                  markerHeight={10}
                  refX={9}
                  refY={5}
                  orient="auto"
                >
                  <path d="M0,0 L10,5 L0,10 z" fill={s.color} fillOpacity={0.85} />
                </marker>
              ))}
              <marker id="p3-arrow-recover" markerWidth={10} markerHeight={10} refX={9} refY={5} orient="auto">
                <path d="M0,0 L10,5 L0,10 z" fill="#34D399" fillOpacity={0.85} />
              </marker>
            </defs>

            {/* Transition edges */}
            {HEALTH_TRANSITIONS.map((t, i) => {
              const dy = i % 2 === 0 ? -54 : 54
              const a = positions[t.from]
              const b = positions[t.to]
              const mx = (a.x + b.x) / 2
              const my = a.y + dy
              const fromColor = stateColor(t.from)
              const toColor = stateColor(t.to)
              const markerColor =
                (t.from === 'DEGRADED' && t.to === 'HEALTHY') || (t.from === 'FAILED' && t.to === 'DEGRADED')
                  ? '#34D399'
                  : toColor
              const markerId =
                markerColor === '#34D399' ? 'p3-arrow-recover' : `p3-arrow-${t.to}`

              return (
                <g key={`t-${i}`}>
                  <motion.path
                    d={edgePath(t.from, t.to, dy * 0.5)}
                    stroke={markerColor}
                    strokeWidth={1.6}
                    strokeOpacity={0.6}
                    fill="none"
                    markerEnd={`url(#${markerId})`}
                    initial={{ pathLength: 0 }}
                    whileInView={{ pathLength: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.25 + i * 0.15 }}
                  />
                  <text
                    x={mx}
                    y={my}
                    textAnchor="middle"
                    fill={markerColor}
                    fontSize={9.5}
                    fontFamily="var(--font-jetbrains)"
                  >
                    {t.label}
                  </text>
                </g>
              )
            })}

            {/* State nodes */}
            {HEALTH_STATES.map((s, i) => {
              const p = positions[s.id]
              return (
                <motion.g
                  key={s.id}
                  initial={{ opacity: 0, scale: 0.7 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: i * 0.1 }}
                >
                  <motion.circle
                    cx={p.x}
                    cy={p.y}
                    r={62}
                    fill={s.color}
                    fillOpacity={0.16}
                    stroke={s.color}
                    strokeWidth={2}
                    animate={s.id === 'HEALTHY' ? { r: [62, 66, 62] } : {}}
                    transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  <text
                    x={p.x}
                    y={p.y - 4}
                    textAnchor="middle"
                    fill="#f1f5f9"
                    fontSize={13}
                    fontWeight={700}
                    fontFamily="var(--font-dm-sans)"
                  >
                    {s.label}
                  </text>
                  <text
                    x={p.x}
                    y={p.y + 14}
                    textAnchor="middle"
                    fill={s.color}
                    fontSize={9.5}
                    fontFamily="var(--font-jetbrains)"
                  >
                    {s.id === 'HEALTHY'
                      ? 'all sources online'
                      : s.id === 'DEGRADED'
                      ? '1+ source flagged'
                      : 'halt + Merkle entry'}
                  </text>
                </motion.g>
              )
            })}
          </svg>
        </div>

        <p
          className="text-[10px] text-slate-500 mt-2"
          style={{ fontFamily: 'var(--font-jetbrains)' }}
        >
          Source: docs/ip/patent-3-che-are-provenance/patentkrav.md Claim 3 · 1% failure-rate threshold.
        </p>
      </GlowCard>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <DataTable
          accent="#F59E0B"
          headers={['State', 'Source quorum', 'Behaviour']}
          rows={tableRows}
        />
        <p
          className="text-[10px] text-slate-500 mt-2"
          style={{ fontFamily: 'var(--font-jetbrains)' }}
        >
          Source: docs/ip/patent-3-che-are-provenance/beskrivelse.md · graceful-degradation algorithm.
        </p>
      </motion.div>

      <CalloutBlock
        type="warning"
        title="No silent fallback"
        text="FAILED status halts composition and writes the failure event to the Merkle certificate. The protocol cannot mask a source outage by quietly substituting weaker entropy; this is the property a DORA-aligned auditor relies on to trust the per-key min-entropy bound."
      />
    </div>
  )
}
