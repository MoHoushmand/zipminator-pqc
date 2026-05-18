'use client'

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { MOAT_RADAR, type BpScenario } from '@/lib/patent-2-data'
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

// Which competitor to highlight at this scenario as the most credible challenger
const TOP_CHALLENGER: Record<BpScenario, string> = {
  conservative: 'IDQ Quantis',
  moderate: 'Ring Oscillator TRNG',
  optimistic: 'Quantinuum / cloud QRNG',
}

const COMPETITORS = [
  { key: 'P2_CSI', label: 'Patent 2 · CSI + PUEK', color: '#34D399' },
  { key: 'RF_PUF', label: 'RF-PUF (Chatterjee 2018)', color: '#F59E0B' },
  { key: 'SRAM_PUF', label: 'SRAM PUF', color: '#FB7185' },
  { key: 'Ring_Osc', label: 'Ring-Oscillator TRNG', color: '#22D3EE' },
  { key: 'IDQ_Quantis', label: 'ID Quantique Quantis', color: '#A78BFA' },
  { key: 'Quantinuum', label: 'Quantinuum / cloud QRNG', color: '#6366f1' },
] as const

export const Section10MoatRadar = ({ scenario }: Props) => {
  const challenger = TOP_CHALLENGER[scenario]

  return (
    <div className="space-y-10">
      <ProseBlock
        paragraphs={[
          'Six dimensions matter for a sub-stack entropy primitive: unit cost, horizontal scope, NIST SP 800-90B validation, reach into already-shipping silicon, regulatory fit (DORA Article 6.4 / EU CRA), and openness of the on-ramp. The radar overlays Patent 2 against the five most credible alternative substrates.',
          'The CSI primitive dominates on horizontal scope and legacy-silicon reach by structure (the patent reads on every chip that exposes per-subcarrier complex CSI). It trails best-in-class on regulatory fit only against IDQ and Quantinuum, which are vendor-certified single-source devices, not patent-licensable primitives.',
        ]}
      />

      <Subsection heading="Competitive Moat · 6 Dimensions" accent="#34D399">
        <GlowCard accent="#34D399">
          <ResponsiveContainer width="100%" height={460}>
            <RadarChart data={MOAT_RADAR} outerRadius="78%">
              <PolarGrid stroke="rgba(255,255,255,0.10)" />
              <PolarAngleAxis
                dataKey="dimension"
                tick={{ fill: '#cbd5e1', fontSize: 11, fontFamily: 'var(--font-dm-sans)' }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                tick={{ fill: '#475569', fontSize: 9, fontFamily: 'var(--font-jetbrains)' }}
              />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#cbd5e1', fontFamily: 'var(--font-dm-sans)' }} />
              {COMPETITORS.map((c) => (
                <Radar
                  key={c.key}
                  name={c.label}
                  dataKey={c.key}
                  stroke={c.color}
                  strokeWidth={c.key === 'P2_CSI' ? 2.5 : 1.4}
                  fill={c.color}
                  fillOpacity={c.key === 'P2_CSI' ? 0.32 : 0.06}
                  animationDuration={1200}
                />
              ))}
            </RadarChart>
          </ResponsiveContainer>
        </GlowCard>
        <p className="text-[10px] mt-2 text-slate-500" style={{ fontFamily: 'var(--font-jetbrains)' }}>
          Source: docs/ip/_significance/patent-2-significance.md § Competitive Moat; ID Quantique catalog; Chatterjee et al. 2018 (RF-PUF); Quantinuum software QRNG datasheet; open-IP ring-oscillator TRNG cores.
        </p>
      </Subsection>

      <DataTable
        accent="#34D399"
        headers={['Dimension', 'P2 CSI+PUEK', 'RF-PUF', 'SRAM PUF', 'Ring Osc', 'IDQ Quantis', 'Quantinuum']}
        rows={MOAT_RADAR.map((d) => [
          d.dimension,
          String(d.P2_CSI),
          String(d.RF_PUF),
          String(d.SRAM_PUF),
          String(d.Ring_Osc),
          String(d.IDQ_Quantis),
          String(d.Quantinuum),
        ])}
      />

      <CalloutBlock
        type="warning"
        title={`Scenario ${scenario} · top challenger to watch`}
        text={`${challenger}. The challenger column is the substrate most likely to compete with Patent 2 for the same anchor licensee under this scenario's go-to-market mix. The defensive remedy is the XOR-composition claim (Claim 3): under the XOR lemma, hybrid CSI+QRNG inherits the security of the stronger source, so Patent 2 composes with the challenger rather than fighting it.`}
        accent="#FB7185"
      />

      <Subsection heading="Defensive position vs prior art" accent="#A78BFA">
        <GlowCard accent="#A78BFA">
          <ul className="text-sm text-slate-300 space-y-3" style={{ fontFamily: 'var(--font-dm-sans)' }}>
            <li>
              <span className="font-mono text-[#22D3EE]">WO2007124054A2 · US20210345102A1 · US10402172B1 · US8015224B1</span> — bilateral CSI key agreement. Two endpoints reconciling a shared secret. Structurally incompatible with the unilateral independent claim.
            </li>
            <li>
              <span className="font-mono text-[#F59E0B]">Mathur 2008 · Jana 2009 · Liu 2012 · Avrahami 2023</span> — bilateral CSI literature. Same incompatibility; reviewed in the companion paper related-work section.
            </li>
            <li>
              <span className="font-mono text-[#34D399]">Surveyed unilateral ambient-RF entropy patents</span> — zero published filings predating 2026-04-04 that combine per-subcarrier complex CSI, SP 800-90B-validated extraction, and PUEK-style RF-environment-bound key derivation.
            </li>
          </ul>
        </GlowCard>
      </Subsection>
    </div>
  )
}
