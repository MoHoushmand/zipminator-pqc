'use client'

import { motion } from 'framer-motion'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import {
  GlowCard,
  DataTable,
  CalloutBlock,
  ProseBlock,
} from '@/components/blueprint/BlueprintSection'
import {
  CONDITIONER_EFFICIENCY,
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

interface PiePanelProps {
  title: string
  subtitle: string
  efficiency: number
  rest: number
  colorActive: string
  colorRest: string
  delay: number
}

const PiePanel = ({ title, subtitle, efficiency, rest, colorActive, colorRest, delay }: PiePanelProps) => {
  const data = [
    { name: 'Extracted', value: efficiency, color: colorActive },
    { name: 'Discarded', value: rest, color: colorRest },
  ]
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="rounded-xl p-6 relative"
      style={{
        background: 'rgba(15,23,42,0.55)',
        border: `1px solid ${colorActive}33`,
        boxShadow: `0 0 24px ${colorActive}10`,
      }}
    >
      <div className="text-center mb-2">
        <p
          className="text-xs uppercase tracking-wider text-slate-400"
          style={{ fontFamily: 'var(--font-jetbrains)' }}
        >
          {title}
        </p>
        <p className="text-[10px] text-slate-500" style={{ fontFamily: 'var(--font-dm-sans)' }}>
          {subtitle}
        </p>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            innerRadius={60}
            outerRadius={92}
            startAngle={90}
            endAngle={-270}
            paddingAngle={2}
            dataKey="value"
            isAnimationActive
            animationBegin={delay * 1000}
            animationDuration={900}
          >
            {data.map((d) => (
              <Cell key={d.name} fill={d.color} stroke="rgba(0,0,0,0)" />
            ))}
          </Pie>
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(value: number) => [`${value}%`, '']}
          />
        </PieChart>
      </ResponsiveContainer>

      <div className="text-center -mt-32 mb-20 pointer-events-none">
        <p
          className="text-4xl font-bold"
          style={{ color: colorActive, fontFamily: 'var(--font-jetbrains)' }}
        >
          {efficiency}%
        </p>
        <p className="text-[10px] uppercase tracking-wider text-slate-500 mt-1">
          extraction efficiency
        </p>
      </div>
    </motion.div>
  )
}

export const Section8ConditionerEfficiency = ({ scenario: _scenario }: Props) => {
  const { before, after } = CONDITIONER_EFFICIENCY
  const tableRows = [
    [
      'Von Neumann debiasing (baseline)',
      `${before.efficiency}%`,
      'LSB-only, single bit per subcarrier',
      before.notes,
    ],
    [
      'ARE conditioner',
      `${after.efficiency}%`,
      'All 8 quantized CSI bits via GF(2^8)',
      after.notes,
    ],
    [
      'Delta',
      `+${after.efficiency - before.efficiency} pp`,
      'Higher per-sample yield',
      'Triples extraction throughput at the source layer',
    ],
  ]

  return (
    <div className="space-y-10">
      <ProseBlock
        paragraphs={[
          'ARE replaces Von Neumann debiasing at the CSI source layer. Von Neumann throws away seven of every eight quantized bits per subcarrier; the ARE conditioner processes all eight bits through an algebraic program over GF(2^8), yielding roughly 3x the extraction rate at the same min-entropy lower bound.',
          'The conditioner is application Claim 17 of the Norwegian filing; it links Patent 3 to Patent 2 (CSI entropy harvesting) by making the CSI source viable at scale.',
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        <PiePanel
          title="Before · Von Neumann"
          subtitle="LSB-only debiasing"
          efficiency={before.efficiency}
          rest={before.rest}
          colorActive="#F59E0B"
          colorRest="rgba(245,158,11,0.10)"
          delay={0.0}
        />
        <PiePanel
          title="After · ARE Conditioner"
          subtitle="GF(2^8) algebraic extraction"
          efficiency={after.efficiency}
          rest={after.rest}
          colorActive="#34D399"
          colorRest="rgba(52,211,153,0.10)"
          delay={0.15}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, delay: 0.35 }}
        className="rounded-xl p-6 text-center"
        style={{
          background: 'linear-gradient(90deg, rgba(245,158,11,0.10), rgba(52,211,153,0.12))',
          border: '1px solid rgba(167,139,250,0.25)',
        }}
      >
        <p
          className="text-[10px] uppercase tracking-widest text-slate-400 mb-2"
          style={{ fontFamily: 'var(--font-jetbrains)' }}
        >
          Source-layer efficiency gain
        </p>
        <p
          className="text-3xl font-bold"
          style={{ color: '#A78BFA', fontFamily: 'var(--font-jetbrains)' }}
        >
          25% → 85%
        </p>
        <p className="text-xs text-slate-400 mt-2" style={{ fontFamily: 'var(--font-dm-sans)' }}>
          3.4x improvement on the CSI source under the same min-entropy floor.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <DataTable
          accent="#34D399"
          headers={['Conditioner', 'Efficiency', 'Mechanism', 'Notes']}
          rows={tableRows}
        />
        <p
          className="text-[10px] text-slate-500 mt-2"
          style={{ fontFamily: 'var(--font-jetbrains)' }}
        >
          Source: docs/ip/patent-3-che-are-provenance/beskrivelse.md · ARE conditioner Claim 17.
        </p>
      </motion.div>

      <CalloutBlock
        type="equation"
        title="Hardware acceleration"
        text="GF(2^8) and GF(2^128) implementations align with AES and AES-GCM, enabling PCLMULQDQ-class instructions on commodity x86. The conditioner is therefore a drop-in upgrade for any platform that already has AES-NI; no new silicon is required."
      />
    </div>
  )
}
