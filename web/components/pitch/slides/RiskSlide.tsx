'use client'

import { motion } from 'framer-motion'
import SlideWrapper from '../SlideWrapper'
import { RISK_MATRIX } from '@/lib/pitch-data'
import type { Scenario } from '@/lib/pitch-data'
import { ShieldAlert, AlertTriangle, CheckCircle2, TrendingUp, Leaf } from 'lucide-react'

import { fadeUp } from '../slide-utils'

const LEVEL_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  high: { bg: 'bg-red-500/15', text: 'text-red-400', dot: 'bg-red-500' },
  medium: { bg: 'bg-yellow-500/15', text: 'text-yellow-400', dot: 'bg-yellow-500' },
  low: { bg: 'bg-green-500/15', text: 'text-green-400', dot: 'bg-green-500' },
}

function Badge({ level, label }: { level: string; label: string }) {
  const style = LEVEL_STYLES[level] ?? LEVEL_STYLES.low
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] font-mono px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {label}
    </span>
  )
}

function severityScore(impact: string, probability: string): { label: string; color: string } {
  const scores: Record<string, number> = { high: 3, medium: 2, low: 1 }
  const score = (scores[impact] ?? 1) * (scores[probability] ?? 1)
  if (score >= 6) return { label: 'Critical', color: 'text-red-400' }
  if (score >= 4) return { label: 'Elevated', color: 'text-yellow-400' }
  return { label: 'Manageable', color: 'text-green-400' }
}

// Opportunity reframing for each risk
const OPPORTUNITY_MAP: Record<string, string> = {
  'Quantum timeline accelerates faster than expected':
    'Validates our approach; increases urgency for customers to adopt PQC now',
  'Big tech enters PQC consumer market':
    'Market validation; expands total addressable market; we differentiate on super-app integration',
  'NIST algorithm vulnerabilities discovered':
    'Crypto-agile architecture becomes premium differentiator; competitors locked into single algorithms',
  'Key person dependency':
    'Forces documentation-first culture that scales better long-term',
  'Regulatory changes':
    'Compliance mandates accelerate enterprise adoption; NIST-native positioning is an advantage',
  'Open source sustainability':
    'Community contributions reduce engineering cost; builds trust and adoption',
  'User adoption challenges':
    'Freemium model builds network effects; each user strengthens the platform',
  'Climate & sustainability regulation tightens':
    'Norwegian 98% renewable infrastructure is a competitive moat; PQC is inherently energy-efficient',
}

// 8th risk added inline
const EXTRA_RISK = {
  risk: 'Climate & sustainability regulation tightens',
  impact: 'medium' as const,
  probability: 'high' as const,
  mitigation: 'Norwegian 98% renewable infrastructure; PQC inherently ~1000x more energy-efficient than RSA; carbon-neutral data centers (Green Mountain, Digiplex)',
}

const ALL_RISKS = [...RISK_MATRIX, EXTRA_RISK]

// ---------------------------------------------------------------------------
// Quadrant configuration
// ---------------------------------------------------------------------------
type Quadrant = 'green' | 'amber' | 'red' | 'blue'

const QUADRANT_CONFIG: Record<Quadrant, { label: string; bg: string; border: string; labelColor: string }> = {
  green: {
    label: 'Low Risk',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    labelColor: 'text-emerald-400/50',
  },
  amber: {
    label: 'Watch',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    labelColor: 'text-amber-400/50',
  },
  red: {
    label: 'Critical',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    labelColor: 'text-red-400/50',
  },
  blue: {
    label: 'Monitor',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    labelColor: 'text-blue-400/50',
  },
}

function getQuadrant(impact: string, probability: string): Quadrant {
  const isHighImpact = impact === 'high'
  const isHighProb = probability === 'high'
  if (isHighImpact && isHighProb) return 'red'
  if (isHighImpact && !isHighProb) return 'amber'
  if (!isHighImpact && isHighProb) return 'blue'
  return 'green'
}

function getRiskDotColor(impact: string): string {
  if (impact === 'high') return 'bg-red-500 border-red-400'
  if (impact === 'medium') return 'bg-yellow-500 border-yellow-400'
  return 'bg-emerald-500 border-emerald-400'
}

// Short labels for the quadrant dots
function shortLabel(risk: string): string {
  const map: Record<string, string> = {
    'Quantum timeline accelerates faster than expected': 'Quantum Timeline',
    'Big tech enters PQC consumer market': 'Big Tech Entry',
    'NIST algorithm vulnerabilities discovered': 'NIST Vuln.',
    'Key person dependency': 'Key Person',
    'Regulatory changes': 'Regulation',
    'Open source sustainability': 'Open Source',
    'User adoption challenges': 'User Adoption',
    'Climate & sustainability regulation tightens': 'Climate Reg.',
  }
  return map[risk] ?? risk.split(' ').slice(0, 2).join(' ')
}

export default function RiskSlide({ scenario: _scenario = 'base' }: { scenario?: Scenario }) {
  const highRisks = ALL_RISKS.filter((r) => r.impact === 'high').length
  const totalRisks = ALL_RISKS.length

  // Group risks by quadrant
  const quadrants: Record<Quadrant, typeof ALL_RISKS> = {
    green: [],
    amber: [],
    red: [],
    blue: [],
  }
  for (const r of ALL_RISKS) {
    quadrants[getQuadrant(r.impact, r.probability)].push(r)
  }

  return (
    <SlideWrapper>
      {/* Header */}
      <motion.div {...fadeUp()} className="text-center mb-6">
        <p className="text-xs font-mono uppercase tracking-widest text-quantum-400/80 mb-3">
          Risk Analysis
        </p>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-white mb-3">
          Risks, <span className="gradient-text">Mitigations &amp; Opportunities</span>
        </h2>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto">
          Every risk has a concrete mitigation plan and an opportunity reframing
        </p>
      </motion.div>

      {/* Colored Quadrant Grid */}
      <motion.div {...fadeUp(0.04)} className="card-quantum mb-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-white">Risk Matrix</h4>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono text-gray-500 uppercase">Impact &uarr;</span>
            <span className="text-[10px] font-mono text-gray-500 uppercase">Probability &rarr;</span>
          </div>
        </div>

        {/* Axis labels */}
        <div className="flex">
          {/* Y-axis label */}
          <div className="flex flex-col justify-between pr-2 py-1">
            <span className="text-[10px] font-mono text-gray-500 uppercase">High</span>
            <span className="text-[10px] font-mono text-gray-500 uppercase">Low</span>
          </div>

          {/* 2x2 grid */}
          <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-1.5 min-h-[260px]">
            {/* Top-left: High Impact / Low Prob = Amber (Watch) */}
            <QuadrantCell
              quadrant="amber"
              risks={quadrants.amber}
            />
            {/* Top-right: High Impact / High Prob = Red (Critical) */}
            <QuadrantCell
              quadrant="red"
              risks={quadrants.red}
            />
            {/* Bottom-left: Low Impact / Low Prob = Green (Low Risk) */}
            <QuadrantCell
              quadrant="green"
              risks={quadrants.green}
            />
            {/* Bottom-right: Low Impact / High Prob = Blue (Monitor) */}
            <QuadrantCell
              quadrant="blue"
              risks={quadrants.blue}
            />
          </div>
        </div>

        {/* X-axis labels */}
        <div className="flex mt-1.5 pl-10">
          <div className="flex-1 grid grid-cols-2 gap-1.5">
            <span className="text-center text-[10px] font-mono text-gray-500 uppercase">Low / Med Probability</span>
            <span className="text-center text-[10px] font-mono text-gray-500 uppercase">High Probability</span>
          </div>
        </div>
      </motion.div>

      {/* Summary Badges */}
      <motion.div {...fadeUp(0.08)} className="flex items-center justify-center gap-4 mb-6">
        <div className="card-quantum flex items-center gap-3 px-5 py-3">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <div>
            <p className="text-2xl font-bold gradient-text font-mono">{highRisks}</p>
            <p className="text-xs font-mono text-gray-500 uppercase tracking-widest">High-Impact</p>
          </div>
        </div>
        <div className="card-quantum flex items-center gap-3 px-5 py-3">
          <ShieldAlert className="w-5 h-5 text-yellow-400" />
          <div>
            <p className="text-2xl font-bold gradient-text font-mono">{totalRisks}</p>
            <p className="text-xs font-mono text-gray-500 uppercase tracking-widest">Risks Tracked</p>
          </div>
        </div>
        <div className="card-quantum flex items-center gap-3 px-5 py-3">
          <CheckCircle2 className="w-5 h-5 text-green-400" />
          <div>
            <p className="text-2xl font-bold gradient-text font-mono">{totalRisks}/{totalRisks}</p>
            <p className="text-xs font-mono text-gray-500 uppercase tracking-widest">Mitigated</p>
          </div>
        </div>
      </motion.div>

      {/* Risk Cards */}
      <div className="space-y-3">
        {ALL_RISKS.map((item, i) => {
          const severity = severityScore(item.impact, item.probability)
          const opportunity = OPPORTUNITY_MAP[item.risk]
          const isClimate = item.risk.includes('Climate')

          return (
            <motion.div
              key={item.risk}
              {...fadeUp(0.1 + i * 0.04)}
              className="card-quantum"
            >
              <div className="flex flex-col gap-3">
                {/* Top row: risk + badges */}
                <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <Badge level={item.impact} label={`Impact: ${item.impact}`} />
                      <Badge level={item.probability} label={`Prob: ${item.probability}`} />
                      <span className={`text-[11px] font-mono font-bold ${severity.color}`}>
                        {severity.label}
                      </span>
                      {isClimate && <Leaf className="w-3.5 h-3.5 text-green-400" />}
                    </div>
                    <h4 className="text-sm font-semibold text-white leading-snug">
                      {item.risk}
                    </h4>
                  </div>

                  {/* Mitigation */}
                  <div className="sm:w-[50%] shrink-0 rounded-lg bg-green-500/[0.06] border border-green-500/10 px-4 py-3">
                    <p className="text-xs font-mono text-green-400/80 uppercase tracking-wider mb-1">
                      Mitigation
                    </p>
                    <p className="text-sm text-gray-300 leading-relaxed">
                      {item.mitigation}
                    </p>
                  </div>
                </div>

                {/* Opportunity reframing */}
                {opportunity && (
                  <div className="rounded-lg bg-quantum-500/[0.04] border border-quantum-500/10 px-4 py-2.5 flex items-start gap-2">
                    <TrendingUp className="w-4 h-4 text-quantum-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[11px] font-mono text-quantum-400/80 uppercase tracking-wider mb-0.5">
                        Opportunity
                      </p>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        {opportunity}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Bottom Note */}
      <motion.p
        {...fadeUp(0.4)}
        className="text-center text-xs text-gray-500 mt-6 mb-6 font-mono"
      >
        Risk matrix reviewed quarterly. Crypto-agile architecture is the primary systemic hedge.
      </motion.p>

      {/* ── NEW: Risk Matrix Table ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.5 }}
        className="card-quantum-gold mb-6"
      >
        <h3 className="text-base font-semibold gradient-text-gold mb-4 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-amber-400" />
          Comprehensive Risk Matrix
        </h3>
        <div className="overflow-x-auto">
          <table className="table-quantum">
            <thead>
              <tr>
                <th>Risk Category</th>
                <th>Likelihood</th>
                <th>Impact</th>
                <th>Severity</th>
                <th>Primary Mitigation</th>
              </tr>
            </thead>
            <tbody>
              {[
                { cat: 'Technology Risk', like: 'Low', impact: 'High', sev: 'Elevated', mit: 'Crypto-agile architecture; swap algorithms without code changes' },
                { cat: 'Market Risk', like: 'Medium', impact: 'Medium', sev: 'Elevated', mit: 'NIST 2035 mandate creates guaranteed demand curve' },
                { cat: 'Regulatory Risk', like: 'Medium', impact: 'High', sev: 'Critical', mit: 'DORA-native design; FIPS 203 alignment from day one' },
                { cat: 'Competition Risk', like: 'High', impact: 'Medium', sev: 'Elevated', mit: 'Super-app moat; 8-pillar integration competitors cannot replicate quickly' },
                { cat: 'Funding Risk', like: 'Medium', impact: 'High', sev: 'Critical', mit: 'Grants-first strategy reduces equity dependency; 18mo runway target' },
                { cat: 'Team / Key Person Risk', like: 'Medium', impact: 'High', sev: 'Critical', mit: 'Documentation-first culture; bus factor improvements via hiring' },
              ].map((row) => (
                <tr key={row.cat}>
                  <td className="font-semibold text-white text-xs">{row.cat}</td>
                  <td>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                      row.like === 'High' ? 'bg-red-500/20 text-red-400' :
                      row.like === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-green-500/20 text-green-400'
                    }`}>{row.like}</span>
                  </td>
                  <td>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                      row.impact === 'High' ? 'bg-red-500/20 text-red-400' :
                      row.impact === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-green-500/20 text-green-400'
                    }`}>{row.impact}</span>
                  </td>
                  <td>
                    <span className={`text-[10px] font-mono font-bold ${
                      row.sev === 'Critical' ? 'text-red-400' : 'text-yellow-400'
                    }`}>{row.sev}</span>
                  </td>
                  <td className="text-xs">{row.mit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* ── NEW: Mitigation Strategies Gold Cards ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="grid sm:grid-cols-3 gap-4 mb-6"
      >
        <div className="card-quantum-gold">
          <ShieldAlert className="w-6 h-6 text-amber-400 mb-3" />
          <h4 className="text-sm font-semibold gradient-text-gold mb-2">Crypto Agility</h4>
          <p className="text-xs text-gray-400 leading-relaxed">
            Algorithm-agnostic core allows hot-swapping cryptographic primitives if NIST standards are updated or vulnerabilities are discovered. Zero downtime migration path.
          </p>
        </div>
        <div className="card-quantum-gold">
          <CheckCircle2 className="w-6 h-6 text-amber-400 mb-3" />
          <h4 className="text-sm font-semibold gradient-text-gold mb-2">Compliance by Design</h4>
          <p className="text-xs text-gray-400 leading-relaxed">
            DORA Art. 6/7 compliance built into architecture from inception. Audit trails, key lifecycle management, and cryptographic policy documentation are first-class features.
          </p>
        </div>
        <div className="card-quantum-gold">
          <TrendingUp className="w-6 h-6 text-amber-400 mb-3" />
          <h4 className="text-sm font-semibold gradient-text-gold mb-2">Market Timing Hedge</h4>
          <p className="text-xs text-gray-400 leading-relaxed">
            Grants-first strategy provides 18-24 months of runway independent of market conditions. Revenue validation before equity dilution ensures raise from strength.
          </p>
        </div>
      </motion.div>

      {/* ── NEW: DORA Compliance Section ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.5 }}
        className="card-quantum-gold"
      >
        <h3 className="text-base font-semibold gradient-text-gold mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
          DORA Compliance (Norwegian Law Since July 2025)
        </h3>
        <p className="text-xs text-gray-400 mb-4 leading-relaxed">
          The Digital Operational Resilience Act requires all financial entities in Norway/EU to implement
          documented cryptographic policies, key lifecycle management, and periodic updates based on
          cryptanalysis developments. Non-compliance carries fines up to 2% of global turnover.
        </p>
        <table className="table-quantum">
          <thead>
            <tr>
              <th>DORA Article</th>
              <th>Requirement</th>
              <th>Zipminator Response</th>
            </tr>
          </thead>
          <tbody>
            {[
              { art: 'Art. 6.1', req: 'Document encryption policies for data at rest, transit, and use', resp: 'Built-in policy engine with exportable compliance reports' },
              { art: 'Art. 6.4', req: 'Periodic cryptographic updates based on cryptanalysis', resp: 'Crypto-agile architecture; OTA algorithm updates without downtime' },
              { art: 'Art. 7', req: 'Full cryptographic key lifecycle management', resp: 'Automated key rotation, hardware-backed storage, audit trail' },
              { art: 'Art. 50', req: 'Enforcement and penalties', resp: 'Continuous compliance monitoring dashboard for enterprises' },
            ].map((row) => (
              <tr key={row.art}>
                <td className="font-mono font-bold text-amber-400 text-xs">{row.art}</td>
                <td className="text-xs">{row.req}</td>
                <td className="text-xs font-semibold text-white">{row.resp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </SlideWrapper>
  )
}

// ---------------------------------------------------------------------------
// Quadrant Cell component
// ---------------------------------------------------------------------------
function QuadrantCell({
  quadrant,
  risks,
}: {
  quadrant: Quadrant
  risks: typeof ALL_RISKS
}) {
  const cfg = QUADRANT_CONFIG[quadrant]

  return (
    <div className={`relative rounded-lg border ${cfg.bg} ${cfg.border} p-3 flex flex-col`}>
      {/* Zone label */}
      <span className={`text-lg font-display font-bold ${cfg.labelColor} mb-2`}>
        {cfg.label}
      </span>

      {/* Risk dots/badges */}
      <div className="flex flex-wrap gap-1.5 mt-auto">
        {risks.map((r) => (
          <span
            key={r.risk}
            className={`inline-flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-full border ${getRiskDotColor(r.impact)} bg-opacity-20 text-white`}
            title={r.risk}
          >
            <span className={`w-2 h-2 rounded-full ${r.impact === 'high' ? 'bg-red-300' : r.impact === 'medium' ? 'bg-yellow-300' : 'bg-emerald-300'}`} />
            {shortLabel(r.risk)}
          </span>
        ))}
        {risks.length === 0 && (
          <span className="text-xs font-mono text-gray-600 italic">No risks in this zone</span>
        )}
      </div>
    </div>
  )
}
