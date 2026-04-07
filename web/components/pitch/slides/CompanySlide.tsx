'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import SlideWrapper from '../SlideWrapper'
import type { Scenario } from '@/lib/pitch-data'
import { GREEN_CREDENTIALS, COST_COMPARISON_NUMERIC } from '@/lib/pitch-data'
import {
  Building2,
  MapPin,
  ShieldCheck,
  Cpu,
  Layers,
  Rocket,
  Calendar,
  Package,
  Code2,
  Wrench,
  Leaf,
  Heart,
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts'

import { fadeUp } from '../slide-utils'
import { TOOLTIP_STYLE } from '../chart-config'

const DIFFERENTIATORS = [
  {
    Icon: ShieldCheck,
    title: 'Norwegian Trust',
    description:
      'Built in one of the world\'s most trusted regulatory environments. Full GDPR compliance, strong data sovereignty laws, and a government actively investing in quantum security.',
  },
  {
    Icon: Cpu,
    title: 'Real Quantum Hardware',
    description:
      'Entropy harvested from 156-qubit IBM quantum processors (Marrakesh/Fez) via qBraid API, with OS entropy fallback for availability.',
  },
  {
    Icon: Layers,
    title: 'Full-Stack Security',
    description:
      'From the math (Rust constant-time crypto core) to the app (9 integrated security modules). One team owns the entire stack, top to bottom.',
  },
]

const STAT_BADGES = [
  { Icon: Calendar, label: 'Founded 2024', color: 'text-quantum-400' },
  { Icon: Package, label: '9 Products', color: 'text-purple-400' },
  { Icon: Code2, label: '300K+ LOC', color: 'text-cyan-400' },
  { Icon: Wrench, label: '26 Technologies', color: 'text-emerald-400' },
]

const PRODUCT_ROADMAP = [
  {
    name: 'Zipminator-PQC',
    status: 'Flagship',
    detail: 'World\'s first PQC super-app with 9 integrated security modules',
    statusColor: 'bg-green-500/20 text-green-400 border-green-500/30',
  },
  {
    name: 'QDaria Quantum Cloud',
    status: 'Planned',
    detail: 'PQC-as-a-Service API platform for developers and enterprises',
    statusColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  },
  {
    name: 'QDaria Enterprise Suite',
    status: 'Planned',
    detail: 'On-premise quantum security for government, military, and banking',
    statusColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  },
]

export default function CompanySlide({ scenario: _scenario }: { scenario?: Scenario }) {
  return (
    <SlideWrapper>
      {/* Section header */}
      <motion.div {...fadeUp(0.1)} className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <Building2 className="w-5 h-5 text-quantum-400" />
          <span className="text-xs font-mono uppercase tracking-widest text-quantum-400/80">
            Slide 2 / 22
          </span>
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-white mb-3">
          <span className="gradient-text"><Image src="/logos/QDwordmark2.svg" alt="QDaria" width={160} height={40} className="inline-block align-baseline" /></span>
        </h2>
        <p className="text-lg text-gray-400 max-w-2xl">
          A Norwegian quantum security company on a mission to make quantum-secure
          communication accessible to everyone.
        </p>
      </motion.div>

      {/* Build Cost Comparison Chart */}
      <motion.div {...fadeUp(0.15)} className="card-quantum mb-8 relative">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-emerald-400" />
          Build Cost: Norway vs Silicon Valley
        </h3>

        {/* Floating badge annotation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8, duration: 0.4 }}
          className="absolute top-3 right-4 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-semibold"
        >
          40-60% Lower
        </motion.div>

        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={COST_COMPARISON_NUMERIC} margin={{ left: 10, right: 10, top: 10 }}>
            <defs>
              <linearGradient id="gradNorway" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0.5} />
              </linearGradient>
              <linearGradient id="gradValley" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.7} />
                <stop offset="100%" stopColor="#f87171" stopOpacity={0.3} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="category" stroke="#6b7280" fontSize={11} />
            <YAxis stroke="#6b7280" fontSize={12} tickFormatter={(v: number) => `$${v}K`} />
            <Tooltip
              contentStyle={TOOLTIP_STYLE.contentStyle}
              labelStyle={TOOLTIP_STYLE.labelStyle}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any, name: any) => [`$${value ?? 0}K`, name === 'norway' ? '🇳🇴 Norway' : '🇺🇸 Silicon Valley']}
            />
            <ReferenceLine
              y={COST_COMPARISON_NUMERIC.reduce((s, d) => s + ((d.norway + d.valley) / 2), 0) / COST_COMPARISON_NUMERIC.length}
              stroke="#9ca3af"
              strokeDasharray="4 4"
              strokeOpacity={0.5}
              label={{ value: 'Avg', position: 'right', fill: '#9ca3af', fontSize: 10 }}
            />
            <Legend formatter={(value: string) => (value === 'norway' ? '🇳🇴 Norway' : '🇺🇸 Silicon Valley')} />
            <Bar dataKey="norway" fill="url(#gradNorway)" radius={[4, 4, 0, 0]} animationDuration={1200} />
            <Bar dataKey="valley" fill="url(#gradValley)" radius={[4, 4, 0, 0]} animationDuration={1200} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Floating stat badges */}
      <motion.div
        {...fadeUp(0.3)}
        className="flex flex-wrap gap-3 mb-8"
      >
        {STAT_BADGES.map((badge, i) => (
          <motion.div
            key={badge.label}
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: [0, -4, 0],
            }}
            transition={{
              opacity: { delay: 0.35 + i * 0.1, duration: 0.4 },
              scale: { delay: 0.35 + i * 0.1, duration: 0.4 },
              y: { delay: 1.2 + i * 0.15, duration: 3, repeat: Infinity, ease: 'easeInOut' },
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/[0.04] backdrop-blur-sm"
          >
            <badge.Icon className={`w-4 h-4 ${badge.color}`} />
            <span className="text-sm font-mono text-white/90">{badge.label}</span>
          </motion.div>
        ))}
      </motion.div>

      {/* Location + founder callout with Norwegian flag */}
      <motion.div
        {...fadeUp(0.35)}
        className="flex items-start gap-3 mb-8 px-5 py-4 rounded-xl bg-quantum-500/[0.06] border border-quantum-500/15"
      >
        <MapPin className="w-5 h-5 text-quantum-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-white font-semibold text-sm flex items-center gap-2">
            <span className="inline-block text-base leading-none" aria-label="Norwegian flag">&#127475;&#127476;</span>
            Built in Norway &mdash; NATO, EU, and Arctic infrastructure hub
          </p>
          <p className="text-sm text-gray-400 leading-relaxed mt-1">
            Founder-led company with deep cryptographic engineering expertise.
            &ldquo;AS&rdquo; (Aksjeselskap) is the Norwegian equivalent of Inc.
            Positioned at the intersection of European data sovereignty and transatlantic defense.
          </p>
        </div>
      </motion.div>

      {/* 3-column differentiators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {DIFFERENTIATORS.map((diff, i) => (
          <motion.div
            key={diff.title}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 + i * 0.08 }}
            className="card-quantum group hover:border-quantum-500/50"
          >
            <div className="w-11 h-11 rounded-xl bg-quantum-500/10 border border-quantum-500/20 flex items-center justify-center mb-4 group-hover:bg-quantum-500/20 transition-colors">
              <diff.Icon className="w-5 h-5 text-quantum-400" />
            </div>
            <h3 className="text-base font-semibold text-white mb-2">{diff.title}</h3>
            <p className="text-sm text-gray-400 leading-relaxed">{diff.description}</p>
          </motion.div>
        ))}
      </div>

      {/* Product roadmap */}
      <motion.div {...fadeUp(0.5)} className="space-y-2 mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Rocket className="w-4 h-4 text-quantum-400" />
          <h3 className="text-sm font-semibold text-white">Product Portfolio</h3>
        </div>
        {PRODUCT_ROADMAP.map((product, i) => (
          <motion.div
            key={product.name}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.55 + i * 0.06 }}
            className="flex items-center gap-3 rounded-lg bg-white/[0.03] border border-white/5 px-4 py-3"
          >
            <div className="min-w-0 flex-1">
              <p className="text-base font-semibold text-white">{product.name}</p>
              <p className="text-sm text-gray-400 leading-relaxed">{product.detail}</p>
            </div>
            <span
              className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full border shrink-0 uppercase ${product.statusColor}`}
            >
              {product.status}
            </span>
          </motion.div>
        ))}
      </motion.div>

      {/* Green Credentials */}
      <motion.div {...fadeUp(0.65)} className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Leaf className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-white">{GREEN_CREDENTIALS.headline}</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {GREEN_CREDENTIALS.stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + i * 0.06 }}
              className="rounded-xl bg-emerald-500/[0.05] border border-emerald-500/20 px-3 py-3 text-center"
            >
              <p className="text-lg font-bold text-emerald-400 font-mono">{stat.value}</p>
              <p className="text-[11px] font-semibold text-white/80 mt-0.5">{stat.label}</p>
              <p className="text-[9px] text-gray-500 mt-1 leading-tight">{stat.detail}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Social Impact callout */}
      <motion.div
        {...fadeUp(0.8)}
        className="flex items-start gap-3 px-5 py-4 rounded-xl bg-purple-500/[0.06] border border-purple-500/20 mb-8"
      >
        <Heart className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-white font-semibold text-sm mb-1">
            Security as a Human Right
          </p>
          <p className="text-gray-400 text-xs leading-relaxed">
            Freemium tier ensures quantum-safe privacy for all users regardless of ability to pay.
            Healthcare and social services sectors receive priority pricing and onboarding support.
          </p>
        </div>
      </motion.div>

      {/* ─── Corporate Structure ─── */}
      <motion.div {...fadeUp(0.85)} className="mb-8">
        <div className="section-divider-gold mb-6" />
        <h3 className="gradient-text-gold text-lg font-semibold mb-4 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-amber-400" />
          Corporate Structure
        </h3>
        <div className="card-quantum-gold p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Legal Entity</h4>
              <table className="table-quantum w-full text-sm">
                <tbody>
                  {[
                    ['Company Name', 'QDaria AS'],
                    ['Type', 'Aksjeselskap (Norwegian LLC)'],
                    ['Jurisdiction', 'Norway (Br\u00f8nn\u00f8ysund Register)'],
                    ['Founded', '2024'],
                    ['HQ', 'Oslo, Norway'],
                    ['Sector', 'Cybersecurity / Quantum Computing'],
                  ].map((row, i) => (
                    <tr key={i} className="border-t border-white/5">
                      <td className="py-2 px-3 text-gray-400 text-xs font-mono">{row[0]}</td>
                      <td className="py-2 px-3 text-white font-medium text-sm">{row[1]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Regulatory Compliance</h4>
              <div className="space-y-3">
                {[
                  { label: 'GDPR', detail: 'Full compliance under Norwegian Data Protection Authority (Datatilsynet)' },
                  { label: 'DORA', detail: 'Art. 6 encryption documentation, Art. 7 key lifecycle management' },
                  { label: 'NIS2', detail: 'Network and Information Security Directive readiness' },
                  { label: 'Schrems II', detail: 'European data sovereignty, no US data transfer required' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-mono text-amber-300">{item.label}</span>
                      <p className="text-xs text-gray-500 leading-relaxed">{item.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ─── IP Portfolio ─── */}
      <motion.div {...fadeUp(0.9)} className="mb-8">
        <h3 className="gradient-text-gold text-lg font-semibold mb-4 flex items-center gap-2">
          <Layers className="w-5 h-5 text-amber-400" />
          Intellectual Property Portfolio
        </h3>
        <div className="card-quantum-gold p-6">
          <table className="table-quantum w-full text-sm">
            <thead>
              <tr>
                <th className="text-left py-2 px-3 text-amber-400/80 font-mono text-xs uppercase tracking-wider">Asset</th>
                <th className="text-left py-2 px-3 text-amber-400/80 font-mono text-xs uppercase tracking-wider">Type</th>
                <th className="text-left py-2 px-3 text-amber-400/80 font-mono text-xs uppercase tracking-wider">Status</th>
                <th className="text-left py-2 px-3 text-amber-400/80 font-mono text-xs uppercase tracking-wider">Description</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['PQC Entropy Pool Architecture', 'Patent (Provisional)', 'Filed 2025', 'Hybrid QRNG + OS entropy aggregation with health monitoring and automatic failover'],
                ['Zipminator Super-App Framework', 'Trade Secret', 'Active', 'Unified 9-module PQC security platform architecture with shared crypto core'],
                ['Constant-Time Kyber768 Rust Core', 'Copyright + Trade Secret', 'Active', 'Zero-dependency ML-KEM-768 implementation verified against NIST KAT vectors'],
              ].map((row, i) => (
                <tr key={i} className="border-t border-white/5">
                  <td className="py-2 px-3 text-white font-medium">{row[0]}</td>
                  <td className="py-2 px-3 text-amber-300 font-mono text-xs">{row[1]}</td>
                  <td className="py-2 px-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/15 text-amber-400 border border-amber-500/25">
                      {row[2]}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-gray-400 text-xs leading-relaxed">{row[3]}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-[10px] text-gray-600 mt-3 font-mono">
            Additional IP: 300K+ LOC proprietary codebase, 26 integrated technology stacks, domain portfolio (zipminator.zip, qdaria.com)
          </p>
        </div>
      </motion.div>

      {/* ─── Advisory Network ─── */}
      <motion.div {...fadeUp(0.95)} className="mb-4">
        <h3 className="gradient-text-gold text-lg font-semibold mb-4 flex items-center gap-2">
          <Rocket className="w-5 h-5 text-amber-400" />
          Advisory Network &amp; Strategic Partnerships
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              title: 'Quantum Research',
              detail: 'Partnerships with IBM Quantum Network and qBraid for hardware access. Targeting collaboration with Norwegian University of Science and Technology (NTNU) quantum computing group.',
              status: 'Active',
            },
            {
              title: 'Defense & Government',
              detail: 'Positioned for NATO DIANA accelerator program. Norwegian Defence Research Establishment (FFI) engagement planned. Arctic data sovereignty alignment with Nordic defense priorities.',
              status: 'Pipeline',
            },
            {
              title: 'Financial Sector',
              detail: 'DORA compliance creates mandatory PQC adoption timeline for all EU financial institutions by 2027. Early conversations with Nordic banking consortium for pilot programs.',
              status: 'Pipeline',
            },
          ].map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 + i * 0.08 }}
              className="card-quantum-gold p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-white">{card.title}</h4>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/25">
                  {card.status}
                </span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">{card.detail}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </SlideWrapper>
  )
}
