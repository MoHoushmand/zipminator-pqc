'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DEVICE_FAMILIES, type BpScenario } from '@/lib/patent-2-data'
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

// Scenario shifts the addressable share we expect to license-touch
const ADDRESSABLE_PCT: Record<BpScenario, number> = {
  conservative: 1.0,
  moderate: 3.0,
  optimistic: 7.5,
}

// Convert polar -> Cartesian
const polar = (cx: number, cy: number, r: number, deg: number) => {
  const rad = ((deg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

const arcPath = (cx: number, cy: number, rInner: number, rOuter: number, startDeg: number, endDeg: number) => {
  const startOuter = polar(cx, cy, rOuter, endDeg)
  const endOuter = polar(cx, cy, rOuter, startDeg)
  const startInner = polar(cx, cy, rInner, startDeg)
  const endInner = polar(cx, cy, rInner, endDeg)
  const large = endDeg - startDeg > 180 ? 1 : 0
  return [
    `M ${startOuter.x} ${startOuter.y}`,
    `A ${rOuter} ${rOuter} 0 ${large} 0 ${endOuter.x} ${endOuter.y}`,
    `L ${startInner.x} ${startInner.y}`,
    `A ${rInner} ${rInner} 0 ${large} 1 ${endInner.x} ${endInner.y}`,
    'Z',
  ].join(' ')
}

export const Section4DeviceSunburst = ({ scenario }: Props) => {
  const [activeFamily, setActiveFamily] = useState<string | null>(null)

  const totalInstalledM = useMemo(
    () => DEVICE_FAMILIES.reduce((acc, f) => acc + f.installedBaseM, 0),
    []
  )

  const SIZE = 520
  const cx = SIZE / 2
  const cy = SIZE / 2
  const rCenter = 70
  const rInnerEdge = 165
  const rOuterEdge = 235

  // Compute angle slices weighted by installedBase for inner ring
  let cursor = 0
  const familySlices = DEVICE_FAMILIES.map((f) => {
    const sweep = (f.installedBaseM / totalInstalledM) * 360
    const slice = { family: f, start: cursor, end: cursor + sweep, sweep }
    cursor += sweep
    return slice
  })

  // Reset cursor for outer
  const outerSlices = familySlices.flatMap((fs) => {
    const subTotal = fs.family.children.reduce((acc, c) => acc + c.share, 0)
    let local = fs.start
    return fs.family.children.map((c) => {
      const sweep = (c.share / subTotal) * fs.sweep
      const out = { family: fs.family, child: c, start: local, end: local + sweep }
      local += sweep
      return out
    })
  })

  const addressablePct = ADDRESSABLE_PCT[scenario]
  const addressableM = (totalInstalledM * addressablePct) / 100

  return (
    <div className="space-y-10">
      <ProseBlock
        paragraphs={[
          'Every 802.11-capable chipset shipped since 2009 exposes per-subcarrier complex CSI. The horizontal scope of the patent is exactly that population. The sunburst below partitions the active installed base across 802.11n / ac / ax / be and the major device classes inside each generation.',
          'Click a ring slice to see the device sub-types inside that family. The center reads out the addressable share at the current scenario.',
        ]}
      />

      <Subsection heading="802.11 Installed Base · Sunburst" accent="#34D399">
        <GlowCard accent="#34D399">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-center">
            <div className="flex justify-center">
              <svg viewBox={`0 0 ${SIZE} ${SIZE}`} width="100%" style={{ maxWidth: 520 }}>
                <defs>
                  {DEVICE_FAMILIES.map((f) => (
                    <radialGradient key={f.family} id={`p2-fam-${f.family}`} cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor={f.color} stopOpacity="0.6" />
                      <stop offset="100%" stopColor={f.color} stopOpacity="0.25" />
                    </radialGradient>
                  ))}
                </defs>

                {/* Outer ring */}
                {outerSlices.map((s, i) => {
                  const isActive = activeFamily === s.family.family
                  const isInactive = activeFamily && activeFamily !== s.family.family
                  return (
                    <motion.path
                      key={`outer-${i}`}
                      d={arcPath(cx, cy, rInnerEdge + 6, rOuterEdge, s.start, s.end)}
                      fill={s.family.color}
                      fillOpacity={isInactive ? 0.15 : isActive ? 0.85 : 0.55}
                      stroke="#020817"
                      strokeWidth={1.5}
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: 0.12 + i * 0.04 }}
                      style={{ cursor: 'pointer', transition: 'fill-opacity 200ms' }}
                      onClick={() => setActiveFamily(activeFamily === s.family.family ? null : s.family.family)}
                    />
                  )
                })}

                {/* Inner ring */}
                {familySlices.map((s, i) => {
                  const isActive = activeFamily === s.family.family
                  return (
                    <motion.path
                      key={`inner-${i}`}
                      d={arcPath(cx, cy, rCenter, rInnerEdge, s.start, s.end)}
                      fill={`url(#p2-fam-${s.family.family})`}
                      stroke={s.family.color}
                      strokeOpacity={isActive ? 0.95 : 0.5}
                      strokeWidth={isActive ? 2 : 1.2}
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: 0.05 + i * 0.08 }}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setActiveFamily(activeFamily === s.family.family ? null : s.family.family)}
                    />
                  )
                })}

                {/* Family labels on inner ring */}
                {familySlices.map((s, i) => {
                  const mid = (s.start + s.end) / 2
                  const labelR = (rCenter + rInnerEdge) / 2
                  const p = polar(cx, cy, labelR, mid)
                  return (
                    <text
                      key={`label-${i}`}
                      x={p.x}
                      y={p.y}
                      textAnchor="middle"
                      fill="#f1f5f9"
                      fontFamily="var(--font-jetbrains)"
                      fontSize={11}
                      fontWeight={600}
                      pointerEvents="none"
                    >
                      {s.family.family}
                    </text>
                  )
                })}

                {/* Center disc */}
                <circle cx={cx} cy={cy} r={rCenter - 6} fill="rgba(2,8,23,0.95)" stroke="rgba(52,211,153,0.35)" strokeWidth={1.2} />
                <text x={cx} y={cy - 8} textAnchor="middle" fill="#34D399" fontFamily="var(--font-jetbrains)" fontSize={11}>
                  {addressablePct.toFixed(1)}%
                </text>
                <text x={cx} y={cy + 8} textAnchor="middle" fill="#f1f5f9" fontFamily="var(--font-jetbrains)" fontSize={15} fontWeight={700}>
                  {(addressableM / 1000).toFixed(2)}B
                </text>
                <text x={cx} y={cy + 24} textAnchor="middle" fill="#94a3b8" fontFamily="var(--font-dm-sans)" fontSize={9}>
                  addressable
                </text>
              </svg>
            </div>

            <div className="space-y-3">
              <p
                className="text-xs uppercase tracking-wider"
                style={{ color: '#34D399', fontFamily: 'var(--font-jetbrains)' }}
              >
                Click a family to drill in
              </p>
              <AnimatePresence mode="wait">
                {activeFamily ? (
                  <motion.div
                    key={activeFamily}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                  >
                    {(() => {
                      const f = DEVICE_FAMILIES.find((x) => x.family === activeFamily)!
                      return (
                        <div
                          className="rounded-xl p-4"
                          style={{
                            background: `linear-gradient(135deg, ${f.color}10, rgba(15,23,42,0.5))`,
                            border: `1px solid ${f.color}40`,
                          }}
                        >
                          <p
                            className="text-base font-semibold mb-1"
                            style={{ color: f.color, fontFamily: 'var(--font-fraunces)' }}
                          >
                            {f.family}
                          </p>
                          <p className="text-xs text-slate-400 mb-3" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                            {f.description}
                          </p>
                          <ul className="space-y-2 text-xs">
                            {f.children.map((c) => (
                              <li key={c.name} className="flex justify-between gap-3">
                                <span className="text-slate-300" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                                  {c.name}
                                </span>
                                <span style={{ fontFamily: 'var(--font-jetbrains)', color: f.color }}>
                                  {c.share}M
                                </span>
                              </li>
                            ))}
                          </ul>
                          <p
                            className="text-[10px] text-slate-500 mt-3"
                            style={{ fontFamily: 'var(--font-jetbrains)' }}
                          >
                            Family installed base: {f.installedBaseM.toLocaleString()}M devices
                          </p>
                        </div>
                      )
                    })()}
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <ul className="space-y-1.5 text-xs">
                      {DEVICE_FAMILIES.map((f) => (
                        <li
                          key={f.family}
                          className="flex items-center justify-between rounded-md px-2 py-1.5"
                          style={{ background: 'rgba(255,255,255,0.025)' }}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="inline-block w-2.5 h-2.5 rounded-sm"
                              style={{ background: f.color, opacity: 0.85 }}
                            />
                            <span className="text-slate-300" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                              {f.family}
                            </span>
                          </div>
                          <span style={{ fontFamily: 'var(--font-jetbrains)', color: f.color }}>
                            {f.installedBaseM.toLocaleString()}M
                          </span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </GlowCard>
        <p className="text-[10px] mt-2 text-slate-500" style={{ fontFamily: 'var(--font-jetbrains)' }}>
          Source: docs/ip/_significance/patent-2-significance.md § Market Impact; IEEE 802.11 generation share estimates ordered-of-magnitude; addressable% per scenario.
        </p>
      </Subsection>

      <DataTable
        accent="#34D399"
        headers={['Standard', 'Generation', 'Installed Base (M)', 'Released', 'Status for Claim 14']}
        rows={DEVICE_FAMILIES.map((f) => [
          f.family,
          f.description.split(' · ')[0],
          f.installedBaseM.toLocaleString(),
          f.description.split(' · ').slice(-1)[0],
          'reads on; covered by independent claims 1-3',
        ])}
      />

      <CalloutBlock
        type="insight"
        title="Horizontal scope = license multiplier"
        text={`The patent reads on every per-subcarrier complex CSI surface across 802.11n/ac/ax/be. At the ${scenario} addressable share (${addressablePct.toFixed(1)}%), the license-touch base is ~${(addressableM / 1000).toFixed(2)}B devices. That is the lens that turns a per-device license rate into a stack-of-zeros annual revenue line.`}
        accent="#34D399"
      />
    </div>
  )
}
