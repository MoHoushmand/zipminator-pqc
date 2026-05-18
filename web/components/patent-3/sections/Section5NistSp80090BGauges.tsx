'use client'

import { motion } from 'framer-motion'
import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  PolarAngleAxis,
} from 'recharts'
import {
  GlowCard,
  DataTable,
  CalloutBlock,
  ProseBlock,
} from '@/components/blueprint/BlueprintSection'
import {
  HEALTH_GAUGES,
  type BpScenario,
} from '@/lib/patent-3-data'

interface Props {
  scenario: BpScenario
}

interface GaugeProps {
  id: string
  name: string
  value: number
  threshold: number
  unit: string
  color: string
  desc: string
  delay: number
}

const Gauge = ({ name, value, threshold, unit, color, desc, delay }: GaugeProps) => {
  // For first two gauges, value < threshold = PASS (failure-rate based).
  // For the third (MCV), value > threshold = PASS.
  const isMCV = unit.startsWith('bits')
  const pass = isMCV ? value >= threshold : value <= threshold
  const displayPct = isMCV
    ? Math.min(100, (value / 1) * 100)
    : Math.min(100, (value / (threshold * 2)) * 100)
  const data = [{ name, value: displayPct, fill: color }]

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="rounded-xl p-4 relative"
      style={{
        background: 'rgba(15,23,42,0.65)',
        border: `1px solid ${color}33`,
        boxShadow: `0 0 24px ${color}10`,
      }}
    >
      <div className="text-center mb-2">
        <p
          className="text-xs uppercase tracking-wider text-slate-400"
          style={{ fontFamily: 'var(--font-jetbrains)' }}
        >
          {name}
        </p>
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <RadialBarChart
          innerRadius="65%"
          outerRadius="100%"
          startAngle={210}
          endAngle={-30}
          data={data}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar dataKey="value" cornerRadius={8} background={{ fill: 'rgba(255,255,255,0.04)' }} />
        </RadialBarChart>
      </ResponsiveContainer>

      <div className="text-center -mt-24 mb-12 relative" style={{ zIndex: 10 }}>
        <p
          className="text-3xl font-bold"
          style={{ color, fontFamily: 'var(--font-jetbrains)' }}
        >
          {isMCV ? value.toFixed(4) : value.toFixed(2) + '%'}
        </p>
        <p className="text-[10px] text-slate-500 mt-1">{unit}</p>
      </div>

      <div
        className="text-center mt-2 px-3 py-1.5 rounded-md inline-flex items-center justify-center w-full"
        style={{
          background: pass ? 'rgba(52,211,153,0.10)' : 'rgba(251,113,133,0.10)',
          border: `1px solid ${pass ? '#34D399' : '#FB7185'}33`,
        }}
      >
        <span
          className="text-[10px] uppercase tracking-wider"
          style={{
            color: pass ? '#34D399' : '#FB7185',
            fontFamily: 'var(--font-jetbrains)',
          }}
        >
          {pass ? 'PASS' : 'FAIL'} · threshold {isMCV ? '≥ ' + threshold : '< ' + threshold + '%'}
        </span>
      </div>

      <p
        className="text-[10px] text-slate-500 mt-3 text-center leading-snug"
        style={{ fontFamily: 'var(--font-dm-sans)' }}
      >
        {desc}
      </p>
    </motion.div>
  )
}

export const Section5NistSp80090BGauges = ({ scenario: _scenario }: Props) => {
  const tableRows = HEALTH_GAUGES.map((g) => [
    g.name,
    g.unit.startsWith('bits') ? g.value.toFixed(4) : `${g.value.toFixed(2)}%`,
    g.unit.startsWith('bits') ? `≥ ${g.threshold}` : `< ${g.threshold}%`,
    g.unit.startsWith('bits') ? (g.value >= g.threshold ? 'PASS' : 'FAIL') : (g.value <= g.threshold ? 'PASS' : 'FAIL'),
    g.desc,
  ])

  return (
    <div className="space-y-10">
      <ProseBlock
        paragraphs={[
          'Per-source health monitoring follows NIST SP 800-90B §4.4 patterns: Repetition Count Test (§4.4.1), Adaptive Proportion Test (§4.4.2), and a Most-Common-Value min-entropy estimator. The protocol is aligned with NIST SP 800-90B health monitoring patterns and is queued for an official ea_non_iid run on the 6.8 MB IBM Quantum trace as gap M1.',
          'A test failure above 1.0% flips the source to DEGRADED; the MCV gauge below the 0.95 floor flips it directly to FAILED. All three gauges feed the per-source ProvenanceRecord and Merkle root.',
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {HEALTH_GAUGES.map((g, i) => (
          <Gauge key={g.id} {...g} delay={i * 0.1} />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <DataTable
          accent="#34D399"
          headers={['Test', 'Value', 'Threshold', 'Verdict', 'Reference']}
          rows={tableRows}
        />
        <p
          className="text-[10px] text-slate-500 mt-2"
          style={{ fontFamily: 'var(--font-jetbrains)' }}
        >
          Source: NIST SP 800-90B §4.4; docs/research/eprint/SHIP_READINESS.md M1 deliverable.
        </p>
      </motion.div>

      <CalloutBlock
        type="insight"
        title="SP 800-90B alignment"
        text="The patent makes no FIPS 140-3 claim. The construction implements NIST FIPS 203 (ML-KEM-768) for downstream key agreement and aligns with NIST SP 800-90B health-monitoring patterns; official tooling outputs are queued for inclusion before any IACR ePrint resubmission, per gap M1."
      />
    </div>
  )
}
