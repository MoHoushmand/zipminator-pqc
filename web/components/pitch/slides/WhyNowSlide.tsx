'use client'

import { motion } from 'framer-motion'
import SlideWrapper from '../SlideWrapper'
import type { Scenario } from '@/lib/pitch-data'
import {
  Clock,
  FileText,
  Skull,
  Atom,
  Landmark,
  ShieldAlert,
  Lock,
  AlertTriangle,
  TrendingUp,
  Building2,
  Users,
  DollarSign,
  Scale,
  Globe,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts'

import { fadeUp, chartEntrance } from '../slide-utils'
import { TOOLTIP_STYLE, AXIS_STYLE, CHART_ANIMATION_DURATION, GRADIENT_DEFS } from '../chart-config'

type TimelineEvent = {
  year: string
  label: string
  detail: string
  Icon: typeof Clock
  type: 'standard' | 'threat' | 'opportunity'
}

const TIMELINE: TimelineEvent[] = [
  {
    year: '2024',
    label: 'NIST publishes FIPS 203/204/205',
    detail: 'The official post-quantum cryptography standards are finalized after 8 years of evaluation.',
    Icon: FileText,
    type: 'standard',
  },
  {
    year: '2025',
    label: 'Salt Typhoon hits 200+ companies',
    detail: 'State-sponsored campaign compromises telecom and enterprise networks across 80 countries.',
    Icon: Skull,
    type: 'threat',
  },
  {
    year: '2025',
    label: 'Qubit requirements drop 95%',
    detail: 'Breaking RSA-2048 now estimated at <1M physical qubits, down from 20M. The timeline just accelerated.',
    Icon: Atom,
    type: 'threat',
  },
  {
    year: '2026',
    label: 'Norwegian Quantum Initiative',
    detail: 'NOK 1.75B ($175M) government program launches to build Norway\'s quantum industry.',
    Icon: Landmark,
    type: 'opportunity',
  },
  {
    year: '2027',
    label: 'NSA CNSA 2.0 deadline',
    detail: 'All new national security equipment must use post-quantum cryptography. No exceptions.',
    Icon: ShieldAlert,
    type: 'standard',
  },
  {
    year: '2029-30',
    label: 'Quantum cryptanalysis capability',
    detail: 'Multiple forecasts converge: fault-tolerant quantum computers capable of breaking RSA/ECC.',
    Icon: AlertTriangle,
    type: 'threat',
  },
  {
    year: '2035',
    label: 'Full NSA PQC mandate',
    detail: 'Complete transition to post-quantum cryptography across all US national security systems.',
    Icon: Lock,
    type: 'standard',
  },
]

const TYPE_STYLES: Record<TimelineEvent['type'], {
  dot: string
  border: string
  yearBg: string
  yearText: string
}> = {
  standard: {
    dot: 'bg-quantum-400',
    border: 'border-quantum-500/30',
    yearBg: 'bg-quantum-500/15',
    yearText: 'text-quantum-300',
  },
  threat: {
    dot: 'bg-red-400',
    border: 'border-red-500/30',
    yearBg: 'bg-red-500/15',
    yearText: 'text-red-300',
  },
  opportunity: {
    dot: 'bg-emerald-400',
    border: 'border-emerald-500/30',
    yearBg: 'bg-emerald-500/15',
    yearText: 'text-emerald-300',
  },
}

const REGULATORY_DEADLINES = [
  { date: 'Dec 2026', mandate: 'EU PQC Mandate', detail: 'European Cyber Resilience Act requires PQC readiness' },
  { date: 'Jan 2027', mandate: 'US CNSA 2.0', detail: 'All new NSS equipment must be CNSA 2.0-compliant' },
  { date: '2035', mandate: 'Full Migration', detail: 'Complete PQC transition across all US national security systems' },
]

const THREAT_TIMELINE = [
  { year: 2020, low: 8,  medium: 2,  high: 0,  label: 'HNDL begins' },
  { year: 2022, low: 10, medium: 4,  high: 1  },
  { year: 2024, low: 12, medium: 8,  high: 5,  label: 'NIST PQC' },
  { year: 2025, low: 14, medium: 12, high: 9,  label: 'Salt Typhoon' },
  { year: 2026, low: 15, medium: 15, high: 15, label: 'NOW' },
  { year: 2027, low: 16, medium: 20, high: 24, label: 'CNSA 2.0' },
  { year: 2029, low: 17, medium: 23, high: 35 },
  { year: 2030, low: 18, medium: 25, high: 42, label: 'Q-Day Window' },
  { year: 2033, low: 18, medium: 27, high: 47 },
  { year: 2035, low: 18, medium: 28, high: 52, label: 'Full Migration' },
]

const RISK_BANDS = {
  low:    { name: 'Low Risk',       color: '#22c55e', gradientId: GRADIENT_DEFS.green.id },
  medium: { name: 'Medium Risk',    color: '#f59e0b', gradientId: GRADIENT_DEFS.amber.id },
  high:   { name: 'High / Critical', color: '#ef4444', gradientId: GRADIENT_DEFS.red.id },
}

const BOTTOM_STATS = [
  { Icon: Building2, value: '40+', label: 'Countries with PQC mandates', color: 'text-quantum-400' },
  { Icon: Users, value: '67%', label: 'Enterprises unaware of PQC', color: 'text-quantum-400' },
  { Icon: DollarSign, value: '$2.8-4.6B', label: 'PQC market by 2030', color: 'text-emerald-400', isGreen: true },
]

export default function WhyNowSlide({ scenario: _scenario }: { scenario?: Scenario }) {
  return (
    <SlideWrapper>
      {/* Section header */}
      <motion.div {...fadeUp(0.1)} className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <Clock className="w-5 h-5 text-quantum-400" />
          <span className="text-xs font-mono uppercase tracking-widest text-quantum-400/80">
            Slide 4 / 22
          </span>
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-white mb-3">
          Why{' '}
          <span className="gradient-text">Now?</span>
        </h2>
        <p className="text-lg text-gray-400 max-w-2xl">
          Multiple converging deadlines are creating a narrow window of opportunity.
          The quantum threat is no longer theoretical.
        </p>
      </motion.div>

      {/* Quantum Threat Timeline Chart */}
      <motion.div {...chartEntrance(0.15)} className="card-quantum chart-glow mb-8">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-red-400" />
          <div>
            <h3 className="text-sm font-semibold text-white">Quantum Threat Level</h3>
            <p className="text-[11px] text-gray-500">Projected risk of quantum cryptanalysis (2020-2035)</p>
          </div>
        </div>
        <div style={{ height: 240 }} className="w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={THREAT_TIMELINE} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
              <defs>
                {Object.values(GRADIENT_DEFS).map((g) => (
                  <linearGradient key={g.id} id={g.id} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={g.color} stopOpacity={g.opacity[0]} />
                    <stop offset="100%" stopColor={g.color} stopOpacity={g.opacity[1]} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis
                dataKey="year"
                {...AXIS_STYLE}
                interval={0}
                tickFormatter={(v: number) => `'${String(v).slice(2)}`}
              />
              <YAxis
                {...AXIS_STYLE}
                domain={[0, 100]}
                tickFormatter={(v: number) => `${v}%`}
              />
              <Tooltip
                {...TOOLTIP_STYLE}
                formatter={(value: number, name: string) => {
                  const band = RISK_BANDS[name as keyof typeof RISK_BANDS]
                  return [`${value}%`, band?.name ?? name]
                }}
                labelFormatter={(label: number) => `Year ${label}`}
              />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 10, fontFamily: 'monospace', paddingBottom: 4 }}
                formatter={(value: string) => {
                  const band = RISK_BANDS[value as keyof typeof RISK_BANDS]
                  return band?.name ?? value
                }}
              />
              <ReferenceLine
                x={2024}
                stroke="#6366f1"
                strokeDasharray="4 4"
                strokeOpacity={0.6}
                label={{ value: 'NIST', fill: '#6366f1', fontSize: 9, position: 'top' }}
              />
              <ReferenceLine
                x={2027}
                stroke="#f59e0b"
                strokeDasharray="4 4"
                strokeOpacity={0.6}
                label={{ value: 'CNSA 2.0', fill: '#f59e0b', fontSize: 9, position: 'top' }}
              />
              <ReferenceLine
                x={2026}
                stroke="#f59e0b"
                strokeWidth={2}
                label={{ value: 'We Are Here', fill: '#f59e0b', fontSize: 10, position: 'insideTopRight', fontWeight: 700 }}
              />
              <Area
                type="monotone"
                dataKey="low"
                stackId="risk"
                stroke={RISK_BANDS.low.color}
                strokeWidth={1.5}
                fill={`url(#${RISK_BANDS.low.gradientId})`}
                animationDuration={CHART_ANIMATION_DURATION}
              />
              <Area
                type="monotone"
                dataKey="medium"
                stackId="risk"
                stroke={RISK_BANDS.medium.color}
                strokeWidth={1.5}
                fill={`url(#${RISK_BANDS.medium.gradientId})`}
                animationDuration={CHART_ANIMATION_DURATION}
              />
              <Area
                type="monotone"
                dataKey="high"
                stackId="risk"
                stroke={RISK_BANDS.high.color}
                strokeWidth={2}
                fill={`url(#${RISK_BANDS.high.gradientId})`}
                animationDuration={CHART_ANIMATION_DURATION}
                activeDot={{ r: 5, fill: '#ef4444', stroke: '#fff', strokeWidth: 1 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Timeline */}
      <div className="relative mb-8">
        {/* Vertical connector line */}
        <div className="absolute left-[23px] top-4 bottom-4 w-px bg-gradient-to-b from-quantum-500/40 via-red-500/30 to-emerald-500/40" />

        <div className="space-y-3">
          {TIMELINE.map((event, i) => {
            const styles = TYPE_STYLES[event.type]
            return (
              <motion.div
                key={`${event.year}-${event.label}`}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.08 }}
                className={`relative flex items-start gap-4 pl-12 pr-4 py-3 rounded-xl bg-white/[0.02] border ${styles.border}`}
              >
                {/* Timeline dot */}
                <div className="absolute left-[17px] top-[18px] w-3 h-3 rounded-full border-2 border-gray-900 z-10">
                  <div className={`w-full h-full rounded-full ${styles.dot}`} />
                </div>

                {/* Year badge */}
                <span
                  className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded ${styles.yearBg} ${styles.yearText} shrink-0 mt-0.5`}
                >
                  {event.year}
                </span>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <event.Icon className={`w-3.5 h-3.5 ${styles.yearText} shrink-0`} />
                    <p className="text-sm font-semibold text-white truncate">{event.label}</p>
                  </div>
                  <p className="text-[11px] text-gray-500 leading-relaxed">{event.detail}</p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Regulatory Tsunami callout */}
      <motion.div
        {...fadeUp(0.7)}
        className="mb-6 px-5 py-4 rounded-xl bg-orange-500/[0.05] border border-orange-500/20"
      >
        <div className="flex items-center gap-2 mb-3">
          <Scale className="w-4 h-4 text-orange-400" />
          <p className="text-white font-semibold text-sm">Regulatory Tsunami</p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {REGULATORY_DEADLINES.map((reg, i) => (
            <motion.div
              key={reg.mandate}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.75 + i * 0.06 }}
              className="text-center"
            >
              <p className="text-sm font-mono font-bold text-orange-400">{reg.date}</p>
              <p className="text-[11px] font-semibold text-white/90 mt-0.5">{reg.mandate}</p>
              <p className="text-[9px] text-gray-500 mt-0.5 leading-tight">{reg.detail}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Positive momentum: TLS hybrid PQC */}
      <motion.div
        {...fadeUp(0.8)}
        className="mb-6 flex items-start gap-3 px-5 py-3 rounded-xl bg-emerald-500/[0.05] border border-emerald-500/20"
      >
        <Globe className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-white font-semibold text-sm">
            <span className="text-emerald-400 font-mono">60%</span> of TLS traffic already using hybrid PQC
          </p>
          <p className="text-gray-400 text-xs">
            The migration is underway. Cloudflare reports majority of web traffic now uses post-quantum key exchange.
            <span className="text-gray-600 font-mono text-[10px] ml-1">Source: Cloudflare 2025</span>
          </p>
        </div>
      </motion.div>

      {/* Harvest Now, Decrypt Later box */}
      <motion.div
        {...fadeUp(0.85)}
        className="mb-6 px-5 py-4 rounded-xl bg-red-500/[0.06] border border-red-500/20"
      >
        <div className="flex items-start gap-3">
          <TrendingUp className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-white font-semibold text-sm mb-1">
              &ldquo;Harvest Now, Decrypt Later&rdquo;
            </p>
            <p className="text-gray-400 text-xs leading-relaxed">
              Adversaries are intercepting encrypted data TODAY and storing it for future
              quantum decryption. Any data with a confidentiality requirement beyond 5-10
              years is ALREADY at risk. Financial records, medical data, state secrets,
              intellectual property &mdash; all being collected now for decryption later.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Bottom stats with green opportunity card */}
      <motion.div
        {...fadeUp(0.9)}
        className="grid grid-cols-3 gap-3 mb-10"
      >
        {BOTTOM_STATS.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.95 + i * 0.08 }}
            className={`card-quantum text-center py-4 ${stat.isGreen ? 'border-emerald-500/25 bg-emerald-500/[0.04]' : ''}`}
          >
            <stat.Icon className={`w-5 h-5 ${stat.color} mx-auto mb-2`} />
            <p className="text-2xl font-bold gradient-text font-mono">
              {stat.value}
            </p>
            <p className="text-xs font-mono text-gray-500 uppercase tracking-widest mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* ─── Regulatory Deadlines Table ─── */}
      <motion.div {...fadeUp(0.95)} className="mb-8">
        <div className="section-divider-gold mb-6" />
        <h3 className="gradient-text-gold text-lg font-semibold mb-4 flex items-center gap-2">
          <Scale className="w-5 h-5 text-amber-400" />
          Regulatory Deadlines: Global PQC Mandates
        </h3>
        <div className="card-quantum-gold p-6">
          <table className="table-quantum w-full text-sm">
            <thead>
              <tr>
                <th className="text-left py-2 px-3 text-amber-400/80 font-mono text-xs uppercase tracking-wider">Deadline</th>
                <th className="text-left py-2 px-3 text-amber-400/80 font-mono text-xs uppercase tracking-wider">Authority</th>
                <th className="text-left py-2 px-3 text-amber-400/80 font-mono text-xs uppercase tracking-wider">Mandate</th>
                <th className="text-left py-2 px-3 text-amber-400/80 font-mono text-xs uppercase tracking-wider">Scope</th>
                <th className="text-left py-2 px-3 text-amber-400/80 font-mono text-xs uppercase tracking-wider">Penalty</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Jul 2025', 'EU', 'DORA Enforcement', 'All EU financial entities', 'Up to 2% global turnover'],
                ['Dec 2025', 'NIST', 'Deprecate RSA/ECDH in new systems', 'US federal agencies', 'Non-compliance audit findings'],
                ['2026', 'EU', 'Cyber Resilience Act', 'All connected products in EU', 'Up to \u20AC15M or 2.5% turnover'],
                ['Jan 2027', 'NSA', 'CNSA 2.0 for new NSS equipment', 'US national security systems + NATO allies', 'Procurement disqualification'],
                ['2030', 'NIST', 'Disallow RSA/ECC for new systems', 'All US federal systems', 'Full system replacement'],
                ['2033', 'NSA', 'CNSA 2.0 software migration', 'All NSS software', 'Operational shutdown risk'],
                ['2035', 'NSA/NIST', 'Complete PQC transition', 'All US national security + federal systems', 'System decommissioning'],
              ].map((row, i) => (
                <tr key={i} className="border-t border-white/5">
                  <td className="py-2 px-3 text-amber-300 font-mono font-semibold text-xs">{row[0]}</td>
                  <td className="py-2 px-3 text-white font-medium text-xs">{row[1]}</td>
                  <td className="py-2 px-3 text-white text-xs">{row[2]}</td>
                  <td className="py-2 px-3 text-gray-400 text-xs">{row[3]}</td>
                  <td className="py-2 px-3 text-red-400 text-xs font-mono">{row[4]}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-[10px] text-gray-600 mt-3 font-mono">
            Sources: NIST SP 800-227, NSA CNSA 2.0 Suite, EU DORA Regulation, EU Cyber Resilience Act
          </p>
        </div>
      </motion.div>

      {/* ─── Quantum Computing Progress ─── */}
      <motion.div {...fadeUp(1.0)} className="mb-8">
        <h3 className="gradient-text-gold text-lg font-semibold mb-4 flex items-center gap-2">
          <Atom className="w-5 h-5 text-amber-400" />
          Quantum Computing Progress: Approaching the Cryptographic Threshold
        </h3>
        <div className="card-quantum-gold p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Qubit Milestones</h4>
              <div className="space-y-2">
                {[
                  { year: '2019', qubits: '53', provider: 'Google (Sycamore)', event: 'Quantum supremacy claim' },
                  { year: '2022', qubits: '433', provider: 'IBM (Osprey)', event: 'Largest superconducting processor' },
                  { year: '2023', qubits: '1,121', provider: 'IBM (Condor)', event: '1000+ qubit milestone' },
                  { year: '2024', qubits: '1,180', provider: 'IBM (Flamingo)', event: 'Modular architecture' },
                  { year: '2025', qubits: '4,158', provider: 'IBM (Starling)', event: 'Error-corrected logical qubits' },
                  { year: '2029', qubits: '100K+', provider: 'IBM Roadmap', event: 'Projected fault-tolerant era' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 py-1.5 border-b border-white/5 last:border-0">
                    <span className="text-xs font-mono text-amber-400 w-10 shrink-0">{item.year}</span>
                    <span className="text-sm font-mono text-white w-14 shrink-0 text-right">{item.qubits}</span>
                    <span className="text-xs text-gray-400 flex-1">{item.provider}</span>
                    <span className="text-[10px] text-gray-600 font-mono">{item.event}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Breaking RSA: Shrinking Requirements</h4>
              <div className="space-y-3">
                {[
                  { year: '2012', estimate: '1 billion physical qubits', reduction: 'Baseline' },
                  { year: '2019', estimate: '20 million physical qubits', reduction: '50x reduction' },
                  { year: '2023', estimate: '<1 million physical qubits', reduction: '1000x reduction' },
                  { year: '2025', estimate: '<100K logical qubits', reduction: 'New error correction' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/5">
                    <span className="text-xs font-mono text-red-400 shrink-0">{item.year}</span>
                    <div className="flex-1">
                      <p className="text-xs text-white">{item.estimate}</p>
                      <p className="text-[10px] text-gray-500 font-mono">{item.reduction}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 leading-relaxed mt-3">
                Each generation of algorithmic improvements dramatically reduces the qubit
                count needed to break current cryptography. The goalposts are moving toward
                us, not away.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ─── Window of Opportunity ─── */}
      <motion.div {...fadeUp(1.1)} className="mb-4">
        <div className="card-quantum-gold p-6">
          <h3 className="gradient-text-gold text-lg font-semibold mb-4 text-center">
            Window of Opportunity: 2025-2027
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {[
              {
                title: 'First Mover Advantage',
                desc: 'NIST standards finalized in 2024. The market is nascent. 91% of businesses have no PQC migration plan. Early entrants will define the category and capture enterprise relationships before competition materializes.',
              },
              {
                title: 'Regulatory Tailwind',
                desc: 'DORA (Jul 2025), CNSA 2.0 (Jan 2027), and EU CRA (2026) create mandatory adoption timelines. Organizations must act, not evaluate. The question is not "if" but "who provides the solution."',
              },
              {
                title: 'Norwegian Quantum Initiative',
                desc: 'NOK 1.75B ($175M) government program launches in 2026. Grant funding, research partnerships, and sovereign cloud infrastructure create a unique ecosystem advantage for Norwegian-based PQC companies.',
              },
            ].map((card, i) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.15 + i * 0.08 }}
                className="p-4 rounded-xl bg-white/[0.03] border border-amber-500/15"
              >
                <h4 className="text-sm font-semibold text-amber-300 mb-2">{card.title}</h4>
                <p className="text-xs text-gray-400 leading-relaxed">{card.desc}</p>
              </motion.div>
            ))}
          </div>
          <div className="text-center">
            <p className="text-sm text-white font-medium">
              The window to establish market leadership in PQC is{' '}
              <span className="text-amber-400 font-semibold">18-24 months</span>.
              After that, enterprise procurement cycles lock in vendor relationships for 5-10 years.
            </p>
          </div>
        </div>
      </motion.div>
    </SlideWrapper>
  )
}
