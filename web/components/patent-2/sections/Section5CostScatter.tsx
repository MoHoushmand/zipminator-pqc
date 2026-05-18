'use client'

import { motion } from 'framer-motion'
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts'
import { COST_SCATTER, type BpScenario } from '@/lib/patent-2-data'
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

const TOOLTIP_STYLE = {
  backgroundColor: 'rgba(17,24,39,0.95)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px',
  color: '#e2e8f0',
  fontSize: 12,
  fontFamily: 'var(--font-dm-sans), sans-serif',
}

// Scenario nudges the licensing breakeven line
const BREAKEVEN_USD_PER_BYTE: Record<BpScenario, number> = {
  conservative: 1e-5,
  moderate: 1e-6,
  optimistic: 1e-7,
}

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload: { name: string; costUsdPerByte: number; bpb: number; note: string; color: string } }>
}) => {
  if (!active || !payload?.length) return null
  const p = payload[0].payload
  return (
    <div className="rounded-lg px-4 py-3 text-sm shadow-xl" style={{ ...TOOLTIP_STYLE, fontFamily: 'var(--font-dm-sans), sans-serif' }}>
      <p className="font-semibold mb-1" style={{ color: p.color }}>{p.name}</p>
      <p style={{ fontFamily: 'var(--font-jetbrains)' }}>
        <span className="text-slate-400">cost:</span> {p.costUsdPerByte.toExponential(2)} USD/byte
      </p>
      <p style={{ fontFamily: 'var(--font-jetbrains)' }}>
        <span className="text-slate-400">entropy:</span> {p.bpb.toFixed(2)} bpb
      </p>
      <p className="text-xs text-slate-400 mt-1 max-w-[260px]">{p.note}</p>
    </div>
  )
}

export const Section5CostScatter = ({ scenario }: Props) => {
  const breakeven = BREAKEVEN_USD_PER_BYTE[scenario]

  // Recharts ScatterChart expects positive numbers for log scale
  const data = COST_SCATTER.map((p) => ({
    ...p,
    x: p.costUsdPerByte,
    y: p.bpb,
    size: p.category === 'csi' ? 320 : 180,
  }))

  return (
    <div className="space-y-10">
      <ProseBlock
        paragraphs={[
          'On a log-log map of cost-per-byte versus min-entropy, the CSI ESP32-S3 sits four to six orders of magnitude below every alternative substrate at within-13% bpb of IBM Quantum. The dot in the bottom-right is the patent. Everything else is the substrate field the patent walks past.',
          'A licensee\'s break-even line shifts with deployment scale; the dashed reference at $1e-' + Math.abs(Math.log10(breakeven)) + '/byte is the indicative threshold below which an embedded entropy primitive is cheaper than a per-device discrete TRNG IC under the ' + scenario + ' scenario.',
        ]}
      />

      <Subsection heading="Cost vs Entropy · log-log" accent="#34D399">
        <GlowCard accent="#34D399">
          <ResponsiveContainer width="100%" height={420}>
            <ScatterChart margin={{ top: 24, right: 32, bottom: 60, left: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis
                type="number"
                dataKey="x"
                name="Cost"
                scale="log"
                domain={[1e-10, 10]}
                tickFormatter={(v: number) => `${v.toExponential(0)}`}
                tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'var(--font-jetbrains)' }}
                label={{ value: 'cost (USD per byte, log10)', position: 'insideBottom', offset: -14, fill: '#64748b', fontSize: 11 }}
              />
              <YAxis
                type="number"
                dataKey="y"
                name="Entropy"
                domain={[4, 7]}
                tickFormatter={(v: number) => `${v.toFixed(1)}`}
                tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'var(--font-jetbrains)' }}
                label={{ value: 'min-entropy (bpb)', angle: -90, position: 'insideLeft', offset: -10, fill: '#64748b', fontSize: 11 }}
              />
              <ZAxis dataKey="size" range={[80, 600]} />
              <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.15)' }} />

              <ReferenceLine
                x={breakeven}
                stroke="#F59E0B"
                strokeDasharray="6 4"
                strokeOpacity={0.7}
                label={{
                  value: `${scenario} break-even`,
                  position: 'top',
                  fill: '#F59E0B',
                  fontSize: 10,
                  fontFamily: 'var(--font-jetbrains)',
                }}
              />

              <Scatter data={data} fill="#34D399">
                {data.map((p, i) => (
                  <Cell key={i} fill={p.color} fillOpacity={0.9} stroke="#020817" strokeWidth={1.5} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>

          {/* Custom annotation labels for each point */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {data.map((p, i) => (
              <motion.div
                key={p.name}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: 0.1 + i * 0.08 }}
                className="rounded-md px-2.5 py-1.5 text-[11px] flex items-center gap-2"
                style={{
                  background: `${p.color}10`,
                  border: `1px solid ${p.color}33`,
                }}
              >
                <span className="w-2 h-2 rounded-full flex-none" style={{ background: p.color }} />
                <span className="text-slate-200" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                  {p.name}
                </span>
              </motion.div>
            ))}
          </div>
        </GlowCard>
        <p className="text-[10px] mt-2 text-slate-500" style={{ fontFamily: 'var(--font-jetbrains)' }}>
          Source: docs/research/paper-2-csi-entropy-puek/demo-kit.md BOM table; ID Quantique Quantis USB-4M catalog; IBM Quantum Premium service rate card; RF-PUF reference (Chatterjee 2018); ring-oscillator TRNG estimate from open silicon IP catalogs.
        </p>
      </Subsection>

      <DataTable
        accent="#34D399"
        headers={['Substrate', 'Category', 'Cost (USD/byte)', 'Min-Entropy (bpb)', 'Notes']}
        rows={COST_SCATTER.map((p) => [
          p.name,
          p.category.toUpperCase(),
          p.costUsdPerByte.toExponential(2),
          p.bpb.toFixed(2),
          p.note,
        ])}
      />

      <CalloutBlock
        type="insight"
        title="Why the asymmetry is structural"
        text="Discrete TRNG IC, photonic QRNG USB, and cloud QRNG all pay a hardware tax to produce entropy. The CSI primitive uses bits that the radio is already computing for normal operation. The marginal cost per extracted byte is the cost of a few SIMD multiplications. No new silicon, no characterization run, no per-design SP 800-90B certification."
        accent="#34D399"
      />
    </div>
  )
}
