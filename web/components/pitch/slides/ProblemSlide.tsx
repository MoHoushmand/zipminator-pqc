'use client'

import { motion } from 'framer-motion'
import SlideWrapper from '../SlideWrapper'
import { THREAT_DATA, THREAT_SEVERITY } from '@/lib/pitch-data'
import { AlertTriangle, Shield } from 'lucide-react'
import type { Scenario } from '@/lib/pitch-data'
import { MODULE_ICON_MAP, staggerItem } from '../slide-utils'
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
import { TOOLTIP_STYLE } from '../chart-config'

const EXTRA_THREAT = {
  title: '91% Unprotected',
  detail: '91% of businesses have no quantum-safe migration roadmap in place',
  source: 'Trusted Computing Group 2025',
  icon: 'AlertTriangle',
}

export default function ProblemSlide({ scenario: _scenario }: { scenario?: Scenario }) {
  return (
    <SlideWrapper>
      {/* Section header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-10"
      >
        <div className="flex items-center gap-3 mb-3">
          <AlertTriangle className="w-6 h-6 text-red-400" />
          <span className="text-xs font-mono uppercase tracking-widest text-red-400/80">
            Slide 3 / 22
          </span>
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-white mb-3">
          The Threat is Real{' '}
          <span className="text-red-400">&mdash; and Accelerating</span>
        </h2>
        <p className="text-lg text-gray-400 max-w-2xl">
          State-sponsored actors are already harvesting encrypted data today,
          betting on quantum computers to break it tomorrow.
        </p>
      </motion.div>

      {/* Threat Severity Radar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="card-quantum mb-8"
      >
        <h3 className="text-sm font-semibold text-white mb-4">Threat Severity Assessment</h3>
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={THREAT_SEVERITY}>
              <PolarGrid stroke="#374151" />
              <PolarAngleAxis
                dataKey="threat"
                tick={{ fill: '#9ca3af', fontSize: 11 }}
              />
              <PolarRadiusAxis
                angle={30}
                domain={[0, 100]}
                tick={{ fill: '#6b7280', fontSize: 10 }}
              />
              <Radar
                name="Severity"
                dataKey="severity"
                stroke="#ef4444"
                fill="rgba(239, 68, 68, 0.35)"
                fillOpacity={0.35}
                animationDuration={1200}
              />
              <Radar
                name="Urgency"
                dataKey="urgency"
                stroke="#f97316"
                fill="rgba(249, 115, 22, 0.25)"
                fillOpacity={0.25}
                animationDuration={1200}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE.contentStyle}
                labelStyle={TOOLTIP_STYLE.labelStyle}
                formatter={(value: number, name: string) => [`${value}%`, name]}
              />
              <Legend
                verticalAlign="bottom"
                wrapperStyle={{ fontSize: 12, color: '#9ca3af' }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Threat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {[...THREAT_DATA, EXTRA_THREAT].map((threat, index) => {
          const Icon = MODULE_ICON_MAP[threat.icon] || Shield
          return (
            <motion.div
              key={threat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.08 }}
              className="card-quantum group relative overflow-hidden"
            >
              {/* Red accent top border */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-red-500/60 via-orange-500/40 to-transparent" />

              <div className="flex items-start gap-3">
                <div className="shrink-0 w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-red-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-semibold text-white mb-1.5">
                    {threat.title}
                  </h3>
                  <p className="text-sm text-gray-400 leading-relaxed mb-2">
                    {threat.detail}
                  </p>
                  <p className="text-[10px] text-gray-600 font-mono">
                    Source: {threat.source}
                  </p>
                </div>
              </div>
            </motion.div>
          )
        })}

        {/* Key stat card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          className="card-quantum relative overflow-hidden border-orange-500/20 bg-orange-500/[0.03]"
        >
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-orange-500/60 via-yellow-500/40 to-transparent" />

          <div className="flex flex-col items-center justify-center h-full text-center py-2">
            <span className="text-2xl font-bold gradient-text font-mono mb-1">
              $7.1B
            </span>
            <span className="text-sm text-gray-400 leading-relaxed mb-1">
              US Government Migration Budget
            </span>
            <span className="text-[10px] text-gray-600 font-mono">
              Source: White House PQC Migration Estimate
            </span>
          </div>
        </motion.div>
      </div>

      {/* Floating stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
        {[
          { value: '2030-2035', label: 'Q-Day Estimate', color: 'text-red-400', border: 'border-red-500/20', bg: 'bg-red-500/[0.06]' },
          { value: 'Active NOW', label: 'HNDL Attacks', color: 'text-orange-400', border: 'border-orange-500/20', bg: 'bg-orange-500/[0.06]' },
          { value: '$4.88M', label: 'Avg Breach Cost', color: 'text-yellow-400', border: 'border-yellow-500/20', bg: 'bg-yellow-500/[0.06]' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            {...staggerItem(i, 0.75)}
            className={`rounded-xl border ${stat.border} ${stat.bg} px-4 py-3 text-center`}
          >
            <p className={`text-2xl font-bold gradient-text font-mono`}>{stat.value}</p>
            <p className="text-xs font-mono text-gray-500 uppercase tracking-widest mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Bottom urgency callout with pulsing red border */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="relative mb-4 rounded-xl overflow-hidden"
      >
        {/* Pulsing red border glow */}
        <div className="absolute inset-0 rounded-xl border border-red-500/30 animate-pulse" />
        <div className="absolute -inset-px rounded-xl bg-gradient-to-r from-red-500/20 via-transparent to-red-500/20 animate-pulse opacity-50" />

        <div className="relative flex items-center gap-3 px-5 py-3 rounded-xl bg-red-500/[0.08]">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400 animate-pulse shrink-0" />
          <p className="text-sm text-gray-300">
            <span className="text-red-400 font-semibold">CNSA 2.0 deadline: 2027.</span>{' '}
            Every day of delay increases exposure to harvest-now-decrypt-later attacks.
          </p>
        </div>
      </motion.div>

      {/* Cost of inaction footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.85 }}
        className="text-center mb-10"
      >
        <p className="text-[11px] text-gray-500 font-mono">
          Average data breach:{' '}
          <span className="text-orange-400 font-semibold">$4.88M</span>
          <span className="text-gray-600"> (IBM 2024)</span>
          {' '}&middot;{' '}
          Quantum decryption:{' '}
          <span className="text-red-400 font-semibold">Priceless</span>
        </p>
      </motion.div>

      {/* ─── Cost of Data Breaches ─── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="mb-8"
      >
        <div className="section-divider-gold mb-6" />
        <h3 className="gradient-text-gold text-lg font-semibold mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
          Cost of Data Breaches by Industry
        </h3>
        <div className="card-quantum-gold p-6">
          <table className="table-quantum w-full text-sm">
            <thead>
              <tr>
                <th className="text-left py-2 px-3 text-amber-400/80 font-mono text-xs uppercase tracking-wider">Industry</th>
                <th className="text-left py-2 px-3 text-amber-400/80 font-mono text-xs uppercase tracking-wider">Avg. Cost</th>
                <th className="text-left py-2 px-3 text-amber-400/80 font-mono text-xs uppercase tracking-wider">Records</th>
                <th className="text-left py-2 px-3 text-amber-400/80 font-mono text-xs uppercase tracking-wider">Days to Identify</th>
                <th className="text-left py-2 px-3 text-amber-400/80 font-mono text-xs uppercase tracking-wider">Quantum Risk</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Healthcare', '$10.93M', '33.4M avg', '231 days', 'Critical'],
                ['Financial Services', '$5.90M', '5.9M avg', '177 days', 'Critical'],
                ['Technology', '$4.97M', '8.5M avg', '185 days', 'High'],
                ['Energy / Utilities', '$4.72M', '2.8M avg', '254 days', 'Critical'],
                ['Government / Military', '$4.64M', 'Classified', '257 days', 'Maximum'],
                ['Pharmaceuticals', '$4.82M', '4.1M avg', '196 days', 'High'],
              ].map((row, i) => (
                <tr key={i} className="border-t border-white/5">
                  <td className="py-2 px-3 text-white font-medium">{row[0]}</td>
                  <td className="py-2 px-3 text-red-400 font-mono font-semibold">{row[1]}</td>
                  <td className="py-2 px-3 text-gray-400">{row[2]}</td>
                  <td className="py-2 px-3 text-orange-400 font-mono">{row[3]}</td>
                  <td className="py-2 px-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      row[4] === 'Maximum' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                      row[4] === 'Critical' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                      'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                    }`}>
                      {row[4]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-[10px] text-gray-600 mt-3 font-mono">
            Source: IBM Cost of a Data Breach Report 2024. Quantum risk assessment based on data sensitivity and shelf-life analysis.
          </p>
        </div>
      </motion.div>

      {/* ─── Quantum Risk Equation ─── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.95 }}
        className="mb-8"
      >
        <div className="card-equation p-6 text-center">
          <h4 className="text-xs font-mono uppercase tracking-widest text-amber-400/70 mb-4">
            Quantum Risk Assessment Model
          </h4>
          <div className="text-xl sm:text-2xl font-mono text-white mb-4">
            Risk = P(<span className="text-red-400">quantum_computer</span>)
            &times; V(<span className="text-orange-400">encrypted_data</span>)
            &times; T(<span className="text-yellow-400">time_to_decrypt</span>)
          </div>
          <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto mt-4">
            <div className="text-center">
              <p className="text-sm font-mono text-red-400 mb-1">P(quantum)</p>
              <p className="text-xs text-gray-400 leading-relaxed">
                Probability of cryptanalytically-relevant quantum computer. Estimated 50% by 2030, near-certain by 2035.
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm font-mono text-orange-400 mb-1">V(data)</p>
              <p className="text-xs text-gray-400 leading-relaxed">
                Value of encrypted data being harvested today. Financial records, health data, trade secrets, state intelligence.
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm font-mono text-yellow-400 mb-1">T(decrypt)</p>
              <p className="text-xs text-gray-400 leading-relaxed">
                Time window for decryption. RSA-2048 broken in hours on a fault-tolerant quantum machine. AES-128 weakened to 64-bit effective.
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4 font-mono">
            For any organization with data shelf-life &gt; 5 years, quantum risk is approaching 1.0
          </p>
        </div>
      </motion.div>

      {/* ─── Regulatory Pressure ─── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
        className="mb-8"
      >
        <h3 className="gradient-text-gold text-lg font-semibold mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-amber-400" />
          Regulatory Pressure: Three Converging Mandates
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              title: 'NIST PQC Standards',
              date: 'August 2024',
              body: 'FIPS 203 (ML-KEM), FIPS 204 (ML-DSA), FIPS 205 (SLH-DSA) finalized after 8 years of evaluation. Federal agencies required to inventory all cryptographic systems and begin migration planning immediately.',
              urgency: 'Active Now',
              color: 'bg-quantum-500/15 text-quantum-400 border-quantum-500/30',
            },
            {
              title: 'NSA CNSA 2.0',
              date: 'January 2027',
              body: 'All new National Security Systems must use CNSA 2.0-approved algorithms. Existing systems must migrate by 2033 (software) or 2035 (hardware). Covers every NATO ally by extension through interoperability requirements.',
              urgency: 'T-minus 9 months',
              color: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
            },
            {
              title: 'EU DORA',
              date: 'July 2025',
              body: 'Digital Operational Resilience Act requires all EU financial entities to document encryption policies (Art. 6), manage cryptographic key lifecycles (Art. 7), and maintain quantum-readiness. Non-compliance: up to 2% of global turnover.',
              urgency: 'Enforcing Now',
              color: 'bg-red-500/15 text-red-400 border-red-500/30',
            },
          ].map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.05 + i * 0.08 }}
              className="card-quantum-gold p-5"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-amber-400 font-mono text-xs">{card.date}</span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${card.color}`}>
                  {card.urgency}
                </span>
              </div>
              <h4 className="text-sm font-semibold text-white mb-2">{card.title}</h4>
              <p className="text-xs text-gray-400 leading-relaxed">{card.body}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ─── Harvest Now, Decrypt Later Deep-Dive ─── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.15 }}
        className="mb-4"
      >
        <h3 className="gradient-text-gold text-lg font-semibold mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          Harvest Now, Decrypt Later: The Silent Threat
        </h3>
        <div className="card-quantum-gold p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Attack Timeline</h4>
              <div className="space-y-3">
                {[
                  { step: '1', label: 'Intercept', desc: 'State-sponsored actors tap undersea cables, compromise ISPs, and MITM satellite links to capture encrypted traffic in bulk.', time: 'Happening Now' },
                  { step: '2', label: 'Store', desc: 'Exabytes of encrypted data warehoused in government data centers. Storage is cheap; patience is a strategic asset.', time: 'Happening Now' },
                  { step: '3', label: 'Wait', desc: 'Quantum computing matures. Error correction improves. Qubit counts scale. The cryptanalytic threshold approaches.', time: '2025-2030' },
                  { step: '4', label: 'Decrypt', desc: 'Shor\'s algorithm breaks RSA/ECC in hours. Decades of harvested diplomatic, financial, and medical data become readable.', time: '2030-2035' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="shrink-0 w-6 h-6 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center text-xs font-mono text-red-400">
                      {item.step}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">{item.label}</span>
                        <span className="text-[10px] font-mono text-red-400/70">{item.time}</span>
                      </div>
                      <p className="text-xs text-gray-400 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Who Is Harvesting?</h4>
              <table className="table-quantum w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left py-2 px-3 text-amber-400/80 font-mono text-xs uppercase">Actor</th>
                    <th className="text-left py-2 px-3 text-amber-400/80 font-mono text-xs uppercase">Targets</th>
                    <th className="text-left py-2 px-3 text-amber-400/80 font-mono text-xs uppercase">Scale</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['China (APT groups)', 'Government, Defense, Tech IP', 'Massive'],
                    ['Russia (SVR/GRU)', 'NATO, Energy, Financial', 'Extensive'],
                    ['Iran (APT33/34)', 'Oil & Gas, Aviation', 'Growing'],
                    ['North Korea (Lazarus)', 'Crypto, Banking, Defense', 'Targeted'],
                    ['Unknown State Actors', 'Undersea cables, ISPs', 'Unknown'],
                  ].map((row, i) => (
                    <tr key={i} className="border-t border-white/5">
                      <td className="py-2 px-3 text-white text-xs font-medium">{row[0]}</td>
                      <td className="py-2 px-3 text-gray-400 text-xs">{row[1]}</td>
                      <td className="py-2 px-3">
                        <span className={`text-[10px] font-mono ${
                          row[2] === 'Massive' ? 'text-red-400' :
                          row[2] === 'Extensive' ? 'text-orange-400' :
                          row[2] === 'Growing' ? 'text-yellow-400' :
                          'text-gray-400'
                        }`}>{row[2]}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-[10px] text-gray-600 mt-3 font-mono">
                Sources: CISA, NSA, ENISA threat landscape reports (2024-2025)
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </SlideWrapper>
  )
}
