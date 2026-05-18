'use client'

import { motion } from 'framer-motion'
import {
  ResponsiveContainer,
  Treemap,
  Tooltip,
} from 'recharts'
import {
  GlowCard,
  DataTable,
  CalloutBlock,
  ProseBlock,
  Subsection,
} from '@/components/blueprint/BlueprintSection'
import {
  CLAIMS_HEATMAP,
  EMBODIMENTS,
  TOOLTIP_STYLE,
  type BpScenario,
} from '@/lib/patent-1-data'

interface Props {
  scenario: BpScenario
}

const STRENGTH_COLOR = (s: number) => {
  if (s >= 4) return '#22D3EE'
  if (s === 3) return '#34D399'
  if (s === 2) return '#A78BFA'
  if (s === 1) return '#F59E0B'
  return '#475569'
}

const STRENGTH_LABEL: Record<number, string> = {
  4: 'Independent / load-bearing',
  3: 'Strong dependent coverage',
  2: 'Supporting coverage',
  1: 'Indirect coverage',
  0: 'Not covered',
}

const SCENARIO_DECAY: Record<BpScenario, number> = {
  conservative: 0.75,
  moderate: 0.9,
  optimistic: 1.0,
}

interface CellProps {
  x: number
  y: number
  width: number
  height: number
  name: string
  strength: number
}

const HeatmapCell = ({ x, y, width, height, name, strength }: CellProps) => {
  const color = STRENGTH_COLOR(strength)
  const showLabel = width > 56 && height > 36
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={4}
        fill={color}
        fillOpacity={0.15 + strength * 0.18}
        stroke={color}
        strokeWidth={1}
        strokeOpacity={0.6}
      />
      {showLabel && (
        <>
          <text
            x={x + width / 2}
            y={y + height / 2 - 4}
            textAnchor="middle"
            fill="#e2e8f0"
            fontSize={10}
            fontFamily="var(--font-jetbrains)"
          >
            {name}
          </text>
          <text
            x={x + width / 2}
            y={y + height / 2 + 10}
            textAnchor="middle"
            fill={color}
            fontSize={10}
            fontFamily="var(--font-jetbrains)"
            fontWeight={700}
          >
            {strength}
          </text>
        </>
      )}
    </g>
  )
}

export const Section4ClaimHeatmap = ({ scenario }: Props) => {
  const decay = SCENARIO_DECAY[scenario]

  // Aggregate to a treemap: each leaf is a Claim x Embodiment cell.
  const data = CLAIMS_HEATMAP.map((c) => ({
    name: `C${c.claim}-${c.embodiment.slice(0, 3)}`,
    strength: Math.max(0, Math.round(c.strength * decay)),
    size: Math.max(1, Math.round(c.strength * decay * 4 + 1)),
    note: c.note,
    claim: c.claim,
    embodiment: c.embodiment,
  }))

  // Aggregate per-claim totals for the table.
  const perClaim = Array.from({ length: 15 }, (_, i) => {
    const cn = i + 1
    const cells = CLAIMS_HEATMAP.filter((c) => c.claim === cn)
    const total = cells.reduce((acc, c) => acc + Math.round(c.strength * decay), 0)
    const strongest = cells.reduce((m, c) => (c.strength > m.strength ? c : m), cells[0])
    return {
      claim: cn,
      total,
      strongest: `${strongest.embodiment} (${Math.round(strongest.strength * decay)})`,
      note: strongest.note,
    }
  })

  return (
    <div className="space-y-10">
      <ProseBlock
        paragraphs={[
          'The claim heatmap shows how the fifteen claims of Norwegian application 20260384 distribute across six embodiment surfaces: method, system, computer-readable medium, hardware, audit, and composition.',
          'Claims 1, 2, and 3 anchor the three independent surfaces. Claims 4 through 15 broaden the moat by reading on hardware (Claims 4, 8, 10), audit (Claims 9, 12, 15), and composition (Claims 6, 7, 11, 13, 14). The pattern is intentional: a competitor who designs around any single embodiment still infringes another.',
        ]}
      />

      <GlowCard accent="#22D3EE">
        <h3
          className="text-lg font-semibold text-slate-100 mb-1"
          style={{ fontFamily: 'var(--font-fraunces), Georgia, serif' }}
        >
          Claim x Embodiment coverage (90 cells)
        </h3>
        <p className="text-sm text-slate-500 mb-6" style={{ fontFamily: 'var(--font-dm-sans)' }}>
          Color and tile size encode strength on a 0-4 scale.
        </p>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <ResponsiveContainer width="100%" height={420}>
            <Treemap
              data={data}
              dataKey="size"
              aspectRatio={4 / 3}
              content={<HeatmapCell x={0} y={0} width={0} height={0} name="" strength={0} />}
            >
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null
                  const p = payload[0].payload as { claim: number; embodiment: string; strength: number; note: string }
                  return (
                    <div style={TOOLTIP_STYLE}>
                      <p className="font-mono text-xs text-cyan-300">
                        Claim {p.claim} / {p.embodiment}
                      </p>
                      <p className="text-xs text-slate-300">Strength: {p.strength} / 4</p>
                      {p.note && <p className="text-xs text-slate-400 mt-1">{p.note}</p>}
                    </div>
                  )
                }}
              />
            </Treemap>
          </ResponsiveContainer>
        </motion.div>

        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
          {[4, 3, 2, 1].map((s) => (
            <div key={s} className="flex items-center gap-2 text-xs text-slate-400">
              <span
                className="w-3 h-3 rounded-sm flex-none"
                style={{ background: STRENGTH_COLOR(s), opacity: 0.4 + s * 0.15 }}
              />
              <span style={{ fontFamily: 'var(--font-dm-sans)' }}>
                {s} - {STRENGTH_LABEL[s]}
              </span>
            </div>
          ))}
        </div>
      </GlowCard>

      <p
        className="text-[10px] text-slate-500"
        style={{ fontFamily: 'var(--font-jetbrains)' }}
      >
        Source: Patent 20260384 patentkrav.md (15 claims); embodiment mapping by inventor;
        scenario decay = {decay.toFixed(2)}.
      </p>

      <Subsection heading={`Per-claim coverage summary (${EMBODIMENTS.length} embodiments)`} accent="#22D3EE">
        <DataTable
          accent="#22D3EE"
          headers={['Claim', 'Total strength (0-24)', 'Strongest embodiment', 'Note']}
          rows={perClaim.map((p) => [
            `${String(p.claim).padStart(2, '0')}`,
            `${p.total}`,
            p.strongest,
            p.note || '-',
          ])}
        />
      </Subsection>

      <CalloutBlock
        type="insight"
        title="Designing around the heatmap is structurally hard"
        text="A would-be competitor who builds an OTP-style anonymizer must avoid all four load-bearing claim families simultaneously: Claim 1 (the four-step pipeline), Claim 4 (at-least-100-qubit QRNG), Claim 5 (DoD 5220.22-M three-pass), and Claim 15 (certificate with provider + bytes + dataset hash). Removing any one of those four leaves the result outside Recital 26's anonymous-information envelope."
      />
    </div>
  )
}
