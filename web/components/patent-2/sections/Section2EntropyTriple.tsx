'use client'

import { motion } from 'framer-motion'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts'
import { ENTROPY_TRIPLE, ENTROPY_DELTAS, type BpScenario } from '@/lib/patent-2-data'
import {
  GlowCard,
  DataTable,
  CalloutBlock,
  ProseBlock,
  Subsection,
  MetricCard,
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

// Scenario shifts the confidence-interval framing of the same 5.50 bpb invariant.
// The triple itself is paper-internal; do not change.
const CI_BY_SCENARIO: Record<BpScenario, { ci: string; sample: string; note: string }> = {
  conservative: { ci: '99%', sample: '343 frames · 2,690 B', note: 'Paper anchor; what NIST SP 800-90B currently endorses.' },
  moderate: { ci: '99.5%', sample: '4,096 frames · 32,154 B', note: 'Demo-kit recapture run on ESP32-S3 reference platform.' },
  optimistic: { ci: '99.9%', sample: '131,072 frames · 1.03 MB', note: 'Above 1M sample threshold for production-track certification.' },
}

export const Section2EntropyTriple = ({ scenario }: Props) => {
  const ciCtx = CI_BY_SCENARIO[scenario]

  const chartData = ENTROPY_TRIPLE.map((d) => ({
    source: d.source,
    bpb: d.bpb,
    color: d.color,
    note: d.note,
  }))

  return (
    <div className="space-y-10">
      <ProseBlock
        paragraphs={[
          'The 5.50 / 6.35 / 6.36 bits-per-byte triple is the empirical spine of the patent. CSI-derived entropy sits within 13.4% bpb of best-in-class quantum hardware and within 13.5% bpb of the Linux kernel CSPRNG, on a 5 USD ambient-RF substrate that ships on every 802.11 device on Earth.',
          'The numbers themselves are paper-internal invariants. The triple does not change with scenario; the supporting confidence interval and sample size do, which is what reviewers and licensees test.',
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {ENTROPY_TRIPLE.map((d) => (
          <MetricCard
            key={d.source}
            label={d.source}
            value={`${d.bpb} bpb`}
            sub={d.sample}
            accent={d.color}
          />
        ))}
      </div>

      <Subsection heading="Min-Entropy Comparison" accent="#34D399">
        <GlowCard accent="#34D399">
          <ResponsiveContainer width="100%" height={360}>
            <BarChart data={chartData} margin={{ top: 32, right: 32, left: 16, bottom: 16 }} layout="vertical">
              <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis
                type="number"
                domain={[0, 7]}
                tickFormatter={(v: number) => `${v.toFixed(1)}`}
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                label={{ value: 'min-entropy (bits per byte)', position: 'insideBottom', offset: -4, fill: '#64748b', fontSize: 11 }}
              />
              <YAxis
                type="category"
                dataKey="source"
                tick={{ fill: '#e2e8f0', fontSize: 12, fontFamily: 'var(--font-dm-sans)' }}
                width={180}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={(value: number) => [`${value.toFixed(2)} bpb`, 'Min-entropy']}
              />
              <Bar dataKey="bpb" radius={[0, 8, 8, 0]} barSize={42}>
                {chartData.map((entry, i) => (
                  <Cell key={`c-${i}`} fill={entry.color} fillOpacity={0.85} />
                ))}
                <LabelList
                  dataKey="bpb"
                  position="right"
                  fill="#f1f5f9"
                  style={{ fontFamily: 'var(--font-jetbrains)', fontSize: 12, fontWeight: 600 }}
                  formatter={(v: number) => `${v.toFixed(2)} bpb`}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Animated delta annotations */}
          <div className="mt-4 flex flex-wrap gap-3">
            {ENTROPY_DELTAS.map((delta, i) => (
              <motion.div
                key={`${delta.from}-${delta.to}`}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: 0.35 + i * 0.18 }}
                className="rounded-lg px-3 py-2 text-xs"
                style={{
                  background: 'rgba(167,139,250,0.08)',
                  border: '1px solid rgba(167,139,250,0.22)',
                  fontFamily: 'var(--font-jetbrains)',
                  color: '#cbd5e1',
                }}
              >
                <span className="text-[#A78BFA] font-semibold">Δ</span> {delta.from} → {delta.to}:{' '}
                <span className="text-slate-100">{delta.delta.toFixed(2)} bpb</span>{' '}
                <span className="text-slate-500">({delta.ratio})</span>
              </motion.div>
            ))}
          </div>
        </GlowCard>
        <p className="text-[10px] mt-2 text-slate-500" style={{ fontFamily: 'var(--font-jetbrains)' }}>
          Source: docs/research/paper-2-csi-entropy-puek/main.tex § Empirical Evaluation; NIST SP 800-90B `ea_non_iid` MCV at 99% confidence; IBM Quantum (ibm_kingston, 156 qubits); Linux `os.urandom`.
        </p>
      </Subsection>

      <DataTable
        accent="#34D399"
        headers={['Source', 'Min-Entropy (bpb)', 'Sample', 'Method']}
        rows={ENTROPY_TRIPLE.map((d) => [d.source, d.bpb.toFixed(2), d.sample, d.note])}
      />

      <CalloutBlock
        type="citation"
        title={`Scenario ${scenario} · sample context`}
        text={`Triple is fixed (5.50 / 6.35 / 6.36 bpb). Under the ${scenario} scenario, the supporting capture is ${ciCtx.sample} with ${ciCtx.ci} confidence under NIST SP 800-90B IID assessment. ${ciCtx.note}`}
        accent="#34D399"
      />

      <Subsection heading="What the gap actually buys" accent="#A78BFA">
        <ProseBlock
          paragraphs={[
            'A 0.85 bpb gap to IBM Quantum sounds large until you cross-multiply by unit cost. IBM access runs USD 1.60 per second; the ESP32-S3 ships 45-90 MB of entropy per month at $5 BOM and zero marginal cost. The cost asymmetry between substrates is four to six orders of magnitude. For IoT, automotive, smart-grid, and any endpoint that cannot phone home to a cloud QRNG, the bpb gap is recovered by hybrid XOR composition under Claim 3.',
          ]}
        />
      </Subsection>
    </div>
  )
}
