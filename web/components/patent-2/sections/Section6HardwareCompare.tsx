'use client'

import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { HARDWARE_REFERENCE, type BpScenario } from '@/lib/patent-2-data'
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

// Scenario adjusts the monthly entropy yield ESP32-S3 can target
const ESP_YIELD_MB: Record<BpScenario, { low: number; high: number }> = {
  conservative: { low: 45, high: 60 },
  moderate: { low: 60, high: 90 },
  optimistic: { low: 90, high: 140 },
}

// Animated counter that ticks up on viewport entry
const MotionCounter = ({
  to,
  decimals = 0,
  prefix = '',
  suffix = '',
  color,
  duration = 1.4,
}: {
  to: number
  decimals?: number
  prefix?: string
  suffix?: string
  color: string
  duration?: number
}) => {
  const mv = useMotionValue(0)
  const rounded = useTransform(mv, (latest) => `${prefix}${latest.toFixed(decimals)}${suffix}`)
  const startedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current) return
    const t = setTimeout(() => {
      startedRef.current = true
      animate(mv, to, { duration, ease: 'easeOut' })
    }, 200)
    return () => clearTimeout(t)
  }, [mv, to, duration])

  return (
    <motion.span style={{ color, fontFamily: 'var(--font-jetbrains)' }}>
      {rounded}
    </motion.span>
  )
}

export const Section6HardwareCompare = ({ scenario }: Props) => {
  const yieldMb = ESP_YIELD_MB[scenario]

  return (
    <div className="space-y-10">
      <ProseBlock
        paragraphs={[
          'Two chips anchor the patent. The Broadcom BCM4339 supplied the empirical baseline through the open Gi-z corpus and Nexmon firmware; that is where the 5.50 bpb / 24.5% extraction-ratio number was measured. The Espressif ESP32-S3 is the current, shipping reference platform for licensee on-ramp.',
          'Side-by-side specs make the cost gap visible. Both chips expose 56 subcarriers and the same independent-claim signal chain.',
        ]}
      />

      <Subsection heading="Reference Hardware · Side-by-Side" accent="#34D399">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {HARDWARE_REFERENCE.map((hw, idx) => (
            <GlowCard key={hw.name} accent={hw.accent}>
              <div className="flex items-center justify-between mb-2">
                <p
                  className="text-xs uppercase tracking-wider"
                  style={{ color: hw.accent, fontFamily: 'var(--font-jetbrains)' }}
                >
                  {hw.role}
                </p>
                <span
                  className="px-2 py-0.5 rounded text-[9px] font-mono"
                  style={{
                    background: `${hw.accent}15`,
                    color: hw.accent,
                    border: `1px solid ${hw.accent}40`,
                  }}
                >
                  {hw.standard}
                </span>
              </div>
              <h3
                className="text-lg font-semibold text-slate-50"
                style={{ fontFamily: 'var(--font-fraunces)' }}
              >
                {hw.name}
              </h3>
              <p
                className="text-sm text-slate-400 mt-1 mb-5"
                style={{ fontFamily: 'var(--font-dm-sans)' }}
              >
                {hw.note}
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div
                  className="rounded-lg p-3"
                  style={{ background: `linear-gradient(135deg, ${hw.accent}08, rgba(15,23,42,0.5))`, border: `1px solid ${hw.accent}22` }}
                >
                  <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-1">BOM cost</p>
                  <p className="text-2xl font-bold" style={{ fontFamily: 'var(--font-jetbrains)' }}>
                    <MotionCounter to={hw.cost} decimals={0} prefix="$" color={hw.accent} duration={1 + idx * 0.2} />
                  </p>
                </div>
                <div
                  className="rounded-lg p-3"
                  style={{ background: `linear-gradient(135deg, ${hw.accent}08, rgba(15,23,42,0.5))`, border: `1px solid ${hw.accent}22` }}
                >
                  <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-1">Max min-entropy</p>
                  <p className="text-2xl font-bold" style={{ fontFamily: 'var(--font-jetbrains)' }}>
                    <MotionCounter to={hw.maxBpb} decimals={2} suffix=" bpb" color={hw.accent} duration={1.2 + idx * 0.2} />
                  </p>
                </div>
                <div
                  className="rounded-lg p-3"
                  style={{ background: `linear-gradient(135deg, ${hw.accent}08, rgba(15,23,42,0.5))`, border: `1px solid ${hw.accent}22` }}
                >
                  <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-1">Frame rate</p>
                  <p className="text-2xl font-bold" style={{ fontFamily: 'var(--font-jetbrains)' }}>
                    <MotionCounter to={hw.frameRateHz} decimals={0} suffix=" Hz" color={hw.accent} duration={1.4 + idx * 0.2} />
                  </p>
                </div>
                <div
                  className="rounded-lg p-3"
                  style={{ background: `linear-gradient(135deg, ${hw.accent}08, rgba(15,23,42,0.5))`, border: `1px solid ${hw.accent}22` }}
                >
                  <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-1">Power</p>
                  <p className="text-2xl font-bold" style={{ fontFamily: 'var(--font-jetbrains)' }}>
                    <MotionCounter to={hw.powerMw} decimals={0} suffix=" mW" color={hw.accent} duration={1.6 + idx * 0.2} />
                  </p>
                </div>
              </div>

              <div className="mt-4 text-[11px] text-slate-500 flex justify-between" style={{ fontFamily: 'var(--font-jetbrains)' }}>
                <span>{hw.subcarriers} subcarriers</span>
                <span>{hw.standard}</span>
              </div>
            </GlowCard>
          ))}
        </div>
        <p className="text-[10px] mt-3 text-slate-500" style={{ fontFamily: 'var(--font-jetbrains)' }}>
          Source: docs/research/paper-2-csi-entropy-puek/demo-kit.md BOM; Espressif ESP32-S3 datasheet; Broadcom BCM4339 (Nexmon-modded firmware); Gi-z corpus.
        </p>
      </Subsection>

      <DataTable
        accent="#34D399"
        headers={['Chip', 'Role', 'Cost', 'Max bpb', 'Frame Rate', 'Power', 'Standard', 'Subcarriers']}
        rows={HARDWARE_REFERENCE.map((hw) => [
          hw.name,
          hw.role,
          `$${hw.cost}`,
          `${hw.maxBpb.toFixed(2)} bpb`,
          `${hw.frameRateHz} Hz`,
          `${hw.powerMw} mW`,
          hw.standard,
          String(hw.subcarriers),
        ])}
      />

      <CalloutBlock
        type="insight"
        title={`Scenario ${scenario} · ESP32-S3 monthly entropy`}
        text={`At the ${scenario} duty-cycle target, the ESP32-S3 reference ships ${yieldMb.low}-${yieldMb.high} MB of NIST SP 800-90B-validated entropy per month at zero marginal cost. This is the number that lets an IoT OEM displace a discrete TRNG IC inside an existing BOM.`}
        accent="#34D399"
      />
    </div>
  )
}
