'use client'

import { motion } from 'framer-motion'
import SlideWrapper from '../SlideWrapper'
import type { Scenario } from '@/lib/pitch-data'
import { SDG_MAPPING, ENERGY_COMPARISON, CARBON_METRICS } from '@/lib/pitch-data'
import {
  Leaf,
  Globe,
  Zap,
  Shield,
  Users,
  Heart,
  BookOpen,
  Briefcase,
  Handshake,
  Thermometer,
  Scale,
  TreePine,
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'

import { fadeUp } from '../slide-utils'
import { TOOLTIP_STYLE } from '../chart-config'

const SDG_ICONS: Record<number, typeof Leaf> = {
  4: BookOpen,
  8: Briefcase,
  9: Zap,
  11: Globe,
  16: Shield,
  17: Handshake,
}

const SDG_COLORS: Record<number, string> = {
  4: 'text-red-400 bg-red-500/10 border-red-500/20',
  8: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  9: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  11: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  16: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  17: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
}

const SOCIAL_ITEMS = [
  {
    Icon: Scale,
    title: 'Norwegian Labor Standards',
    detail: 'Strongest worker protections in the world. Mandatory pension, 5-week vacation, parental leave.',
  },
  {
    Icon: Shield,
    title: 'GDPR++ Privacy',
    detail: 'Norwegian data protection exceeds EU minimum. EEA member with no Five Eyes jurisdiction exposure.',
  },
  {
    Icon: TreePine,
    title: 'Open Source Core',
    detail: 'Cryptographic primitives are MIT licensed, enabling community audit and shared security.',
  },
  {
    Icon: Heart,
    title: 'Privacy as Human Right',
    detail: 'Freemium tier ensures quantum-safe privacy for all users, not just enterprises that can pay.',
  },
]

export default function ESGSlide({ scenario: _scenario }: { scenario?: Scenario }) {
  return (
    <SlideWrapper>
      {/* Section header */}
      <motion.div {...fadeUp(0.1)} className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <Leaf className="w-5 h-5 text-emerald-400" />
          <span className="text-xs font-mono uppercase tracking-widest text-emerald-400/80">
            Slide 20 / 22
          </span>
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-white mb-3">
          ESG &amp; <span className="gradient-text">Sustainability</span>
        </h2>
        <p className="text-lg text-gray-400 max-w-2xl">
          Built green from day one. Norwegian hydropower, world-class labor standards,
          and privacy as a fundamental right.
        </p>
      </motion.div>

      {/* UN SDG Mapping */}
      <motion.div {...fadeUp(0.15)} className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-white">UN Sustainable Development Goals</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {SDG_MAPPING.map((sdg, i) => {
            const SdgIcon = SDG_ICONS[sdg.number] || Globe
            const colorClasses = SDG_COLORS[sdg.number] || 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
            return (
              <motion.div
                key={sdg.number}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + i * 0.06 }}
                className={`rounded-xl border px-4 py-3 ${colorClasses}`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <SdgIcon className="w-4 h-4" />
                  <span className="text-xs font-mono font-bold">SDG {sdg.number}</span>
                </div>
                <p className="text-sm font-semibold text-white mb-0.5">{sdg.name}</p>
                <p className="text-xs text-gray-400 leading-relaxed">{sdg.relevance}</p>
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* Green Energy Comparison Chart */}
      <motion.div {...fadeUp(0.3)} className="card-quantum mb-8 relative">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4 text-emerald-400" />
          Renewable Energy: Zipminator vs Industry
        </h3>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8, duration: 0.4 }}
          className="absolute top-3 right-4 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-semibold"
        >
          98% Renewable
        </motion.div>

        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={ENERGY_COMPARISON}
            layout="vertical"
            margin={{ left: 10, right: 30, top: 5, bottom: 5 }}
          >
            <defs>
              <linearGradient id="gradEnergy" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#22c55e" stopOpacity={0.7} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
            <XAxis
              type="number"
              stroke="#6b7280"
              fontSize={11}
              domain={[0, 100]}
              tickFormatter={(v: number) => `${v}%`}
            />
            <YAxis
              type="category"
              dataKey="name"
              stroke="#6b7280"
              fontSize={11}
              width={140}
              tick={{ fill: '#d1d5db' }}
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE.contentStyle}
              labelStyle={TOOLTIP_STYLE.labelStyle}
              formatter={(value: number) => [`${value}%`, 'Renewable Energy']}
            />
            <Bar
              dataKey="renewable"
              fill="url(#gradEnergy)"
              radius={[0, 4, 4, 0]}
              animationDuration={1200}
            />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Carbon Footprint Metrics */}
      <motion.div {...fadeUp(0.4)} className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Thermometer className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-white">Carbon &amp; Efficiency Advantage</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {CARBON_METRICS.map((metric, i) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 + i * 0.06 }}
              className="rounded-xl bg-emerald-500/[0.05] border border-emerald-500/20 px-3 py-3 text-center"
            >
              <p className="text-2xl font-bold text-emerald-400 font-mono">{metric.value}</p>
              <p className="text-[11px] font-semibold text-white/80 mt-0.5">{metric.label}</p>
              <p className="text-[9px] text-gray-500 mt-1 leading-tight">{metric.detail}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Social Responsibility */}
      <motion.div {...fadeUp(0.55)} className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-white">Social Responsibility</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {SOCIAL_ITEMS.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + i * 0.06 }}
              className="flex items-start gap-3 rounded-xl bg-white/[0.03] border border-white/5 px-4 py-3"
            >
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <item.Icon className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{item.title}</p>
                <p className="text-xs text-gray-400 leading-relaxed mt-0.5">{item.detail}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Bottom callout */}
      <motion.div
        {...fadeUp(0.7)}
        className="flex items-start gap-3 px-5 py-4 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/20 mb-8"
      >
        <Leaf className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-white font-semibold text-sm mb-1">
            The Greenest PQC Platform on Earth
          </p>
          <p className="text-gray-400 text-xs leading-relaxed">
            Norwegian hydroelectric power, Arctic natural cooling, and lattice-based cryptography
            that uses ~1000x less energy than RSA. Security without compromise, sustainability without sacrifice.
          </p>
        </div>
      </motion.div>

      {/* Environmental Impact - Gold Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.75, duration: 0.5 }}
        className="card-quantum-gold mb-8"
      >
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-amber-400" />
          <h3 className="text-lg font-semibold gradient-text-gold">Environmental Impact</h3>
        </div>
        <p className="text-sm text-gray-300 mb-4">
          Lattice-based cryptography is fundamentally more energy-efficient than classical public-key algorithms.
          Kyber768 key encapsulation completes in microseconds compared to milliseconds for RSA-4096,
          translating directly to orders-of-magnitude energy savings at scale.
        </p>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 rounded-lg bg-amber-500/[0.06] border border-amber-500/20">
            <p className="text-2xl font-bold text-amber-400 font-mono">~1000x</p>
            <p className="text-[11px] text-gray-400 mt-1">Less energy per key exchange vs RSA-4096</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-amber-500/[0.06] border border-amber-500/20">
            <p className="text-2xl font-bold text-amber-400 font-mono">98%</p>
            <p className="text-[11px] text-gray-400 mt-1">Renewable energy (Norwegian hydropower)</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-amber-500/[0.06] border border-amber-500/20">
            <p className="text-2xl font-bold text-amber-400 font-mono">0 kg</p>
            <p className="text-[11px] text-gray-400 mt-1">Net carbon per operation (offset)</p>
          </div>
        </div>
      </motion.div>

      {/* Carbon Footprint Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="mb-8"
      >
        <div className="flex items-center gap-2 mb-4">
          <Thermometer className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-white">Energy Consumption: Kyber768 vs RSA-4096</h3>
        </div>
        <div className="table-quantum">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left py-2 px-3 text-gray-400 font-mono text-xs">Operation</th>
                <th className="text-right py-2 px-3 text-gray-400 font-mono text-xs">Kyber768</th>
                <th className="text-right py-2 px-3 text-gray-400 font-mono text-xs">RSA-4096</th>
                <th className="text-right py-2 px-3 text-gray-400 font-mono text-xs">Savings</th>
              </tr>
            </thead>
            <tbody>
              {[
                { op: 'Key Generation', kyber: '0.07 mJ', rsa: '68.4 mJ', savings: '~977x' },
                { op: 'Encapsulation / Encrypt', kyber: '0.09 mJ', rsa: '0.42 mJ', savings: '~4.7x' },
                { op: 'Decapsulation / Decrypt', kyber: '0.10 mJ', rsa: '51.3 mJ', savings: '~513x' },
                { op: '1M Key Exchanges', kyber: '0.07 kWh', rsa: '68.4 kWh', savings: '~977x' },
                { op: 'Annual Server Load (est.)', kyber: '~12 kWh', rsa: '~11,800 kWh', savings: '~983x' },
              ].map((row, i) => (
                <tr key={i} className="border-t border-white/5">
                  <td className="py-2 px-3 text-gray-300">{row.op}</td>
                  <td className="py-2 px-3 text-right text-emerald-400 font-mono">{row.kyber}</td>
                  <td className="py-2 px-3 text-right text-red-400 font-mono">{row.rsa}</td>
                  <td className="py-2 px-3 text-right text-amber-400 font-mono font-bold">{row.savings}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[10px] text-gray-600 mt-2 italic">
          Energy estimates based on ARM Cortex-A72 benchmarks. Actual values vary by hardware. Labeled &quot;Projected&quot; where applicable.
        </p>
      </motion.div>

      {/* Social Impact - Gold Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.85, duration: 0.5 }}
        className="card-quantum-gold mb-8"
      >
        <div className="flex items-center gap-2 mb-4">
          <Heart className="w-5 h-5 text-amber-400" />
          <h3 className="text-lg font-semibold gradient-text-gold">Social Impact</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-white/[0.03] border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="w-4 h-4 text-rose-400" />
              <p className="text-sm font-semibold text-white">Digital Privacy as Human Right</p>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Every person deserves quantum-safe privacy regardless of income. Our freemium tier provides
              baseline post-quantum encryption to all users at zero cost, ensuring the quantum divide
              does not become the next digital divide.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-white/[0.03] border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-blue-400" />
              <p className="text-sm font-semibold text-white">Healthcare Priority</p>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Patient data is a prime target for harvest-now-decrypt-later attacks. Our healthcare
              tier prioritizes hospitals and clinics with subsidized enterprise access,
              protecting medical records before quantum computers arrive.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-white/[0.03] border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-emerald-400" />
              <p className="text-sm font-semibold text-white">Education Access</p>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Free access for universities and research institutions. Open-source MIT-licensed
              cryptographic core enables academic collaboration and independent security audits,
              strengthening the entire ecosystem.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Governance Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.5 }}
        className="mb-8"
      >
        <div className="flex items-center gap-2 mb-4">
          <Scale className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-white">Governance Framework</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="table-quantum">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left py-2 px-3 text-gray-400 font-mono text-xs">Regulation</th>
                  <th className="text-left py-2 px-3 text-gray-400 font-mono text-xs">Status</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { reg: 'GDPR (EU/EEA)', status: 'Native compliance, Norwegian jurisdiction' },
                  { reg: 'DORA (Art. 6, 7, 50)', status: 'Crypto lifecycle management built-in' },
                  { reg: 'NIST FIPS 203 (ML-KEM)', status: 'Implemented, KAT verified' },
                  { reg: 'Five Eyes Jurisdiction', status: 'Zero exposure (Norway = EEA, not FVEY)' },
                  { reg: 'Schrems II', status: 'No US data transfer risk' },
                ].map((row, i) => (
                  <tr key={i} className="border-t border-white/5">
                    <td className="py-2 px-3 text-gray-300">{row.reg}</td>
                    <td className="py-2 px-3 text-emerald-400 text-xs">{row.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col gap-3">
            <div className="p-4 rounded-lg bg-white/[0.03] border border-white/5 flex-1">
              <p className="text-sm font-semibold text-white mb-2">Norwegian Regulatory Advantage</p>
              <p className="text-xs text-gray-400 leading-relaxed">
                Norway offers one of the world&apos;s strongest data protection regimes through EEA membership.
                Combined with no Five Eyes intelligence-sharing obligations, this creates a unique trust
                jurisdiction for sensitive encryption infrastructure. DORA Article 6.4 explicitly requires
                quantum-readiness planning, and our platform is built to satisfy that clause from day one.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-amber-500/[0.06] border border-amber-500/20">
              <p className="text-xs text-amber-400 font-mono">
                DORA non-compliance fines: up to 2% of global annual turnover
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* UN SDG Alignment - Gold Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.95, duration: 0.5 }}
        className="card-quantum-gold"
      >
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-5 h-5 text-amber-400" />
          <h3 className="text-lg font-semibold gradient-text-gold">UN SDG Alignment: Priority Goals</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-amber-500/[0.04] border border-amber-500/15">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-orange-400" />
              <span className="text-xs font-mono font-bold text-orange-400">SDG 9</span>
            </div>
            <p className="text-sm font-semibold text-white mb-1">Industry, Innovation &amp; Infrastructure</p>
            <p className="text-xs text-gray-400 leading-relaxed">
              Building quantum-safe encryption infrastructure for the post-quantum era.
              Our open-source Kyber768 core and 8-pillar super-app represent foundational
              innovation in cybersecurity infrastructure that protects all digital systems.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-amber-500/[0.04] border border-amber-500/15">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-5 h-5 text-blue-400" />
              <span className="text-xs font-mono font-bold text-blue-400">SDG 16</span>
            </div>
            <p className="text-sm font-semibold text-white mb-1">Peace, Justice &amp; Strong Institutions</p>
            <p className="text-xs text-gray-400 leading-relaxed">
              Protecting institutional data integrity against quantum threats. Government agencies,
              courts, and financial institutions need quantum-safe encryption to maintain public trust.
              Our platform ensures institutional communications remain confidential for decades.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-amber-500/[0.04] border border-amber-500/15">
            <div className="flex items-center gap-2 mb-2">
              <Handshake className="w-5 h-5 text-indigo-400" />
              <span className="text-xs font-mono font-bold text-indigo-400">SDG 17</span>
            </div>
            <p className="text-sm font-semibold text-white mb-1">Partnerships for the Goals</p>
            <p className="text-xs text-gray-400 leading-relaxed">
              Open-source MIT-licensed cryptographic core enables global collaboration.
              Partnerships with quantum hardware providers (IBM, Rigetti, QBraid) and alignment
              with Norway&apos;s NOK 1.75B Quantum Initiative create a multilateral approach to quantum safety.
            </p>
          </div>
        </div>
      </motion.div>
    </SlideWrapper>
  )
}
