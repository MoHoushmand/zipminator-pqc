'use client'

import { motion } from 'framer-motion'
import SlideWrapper from '../SlideWrapper'
import type { Scenario } from '@/lib/pitch-data'
import {
  Shield,
  Heart,
  Landmark,
  Zap,
  Scale,
  Server,
  GraduationCap,
  Target,
  Globe,
  CheckCircle2,
} from 'lucide-react'
import { chartEntrance } from '../slide-utils'
import { TOOLTIP_STYLE, AXIS_STYLE, CHART_ANIMATION_DURATION } from '../chart-config'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts'

const MARKET_BY_SECTOR = [
  { sector: 'Finance', value: 90, color: '#22c55e' },
  { sector: 'Government', value: 85, color: '#3b82f6' },
  { sector: 'Defense', value: 78, color: '#6366f1' },
  { sector: 'Healthcare', value: 72, color: '#ef4444' },
  { sector: 'Enterprise', value: 65, color: '#06b6d4' },
  { sector: 'Legal', value: 45, color: '#a855f7' },
  { sector: 'Education', value: 38, color: '#818cf8' },
]

interface IndustryCard {
  name: string
  icon: typeof Shield
  description: string
  badges: string[]
  accentColor: string
  accentBg: string
  accentBorder: string
  badgeBg: string
  badgeText: string
}

const INDUSTRIES: IndustryCard[] = [
  {
    name: 'Government & Defense',
    icon: Shield,
    description: 'Protect classified communications from harvest-now-decrypt-later attacks',
    badges: ['CNSA 2.0', 'FedRAMP'],
    accentColor: 'text-blue-400',
    accentBg: 'bg-blue-500/15',
    accentBorder: 'border-blue-500/25',
    badgeBg: 'bg-blue-500/10',
    badgeText: 'text-blue-400',
  },
  {
    name: 'Healthcare',
    icon: Heart,
    description: 'Patient records with 50+ year confidentiality. PQC ensures they stay private.',
    badges: ['HIPAA', 'GDPR', 'NorHealthData'],
    accentColor: 'text-red-400',
    accentBg: 'bg-red-500/15',
    accentBorder: 'border-red-500/25',
    badgeBg: 'bg-red-500/10',
    badgeText: 'text-red-400',
  },
  {
    name: 'Finance & Banking',
    icon: Landmark,
    description: 'Transaction data, trading algorithms, and client records quantum-proofed',
    badges: ['PCI-DSS', 'SOX', 'SWIFT PQC'],
    accentColor: 'text-green-400',
    accentBg: 'bg-green-500/15',
    accentBorder: 'border-green-500/25',
    badgeBg: 'bg-green-500/10',
    badgeText: 'text-green-400',
  },
  {
    name: 'Critical Infrastructure',
    icon: Zap,
    description: 'Power grids, water systems, telecom. SS7 attacks stop here.',
    badges: ['DHS Advisory', 'NERC CIP', 'ICS-CERT'],
    accentColor: 'text-orange-400',
    accentBg: 'bg-orange-500/15',
    accentBorder: 'border-orange-500/25',
    badgeBg: 'bg-orange-500/10',
    badgeText: 'text-orange-400',
  },
  {
    name: 'Legal & IP',
    icon: Scale,
    description: 'Attorney-client privilege and trade secrets protected for decades',
    badges: ['ABA Ethics', 'Trade Secret Act', '2050+ Safe'],
    accentColor: 'text-purple-400',
    accentBg: 'bg-purple-500/15',
    accentBorder: 'border-purple-500/25',
    badgeBg: 'bg-purple-500/10',
    badgeText: 'text-purple-400',
  },
  {
    name: 'Enterprise Tech',
    icon: Server,
    description: 'API security, code signing, and DevOps secrets with PQC',
    badges: ['NIST FIPS 203', 'PQC-Ready', '3-Line SDK'],
    accentColor: 'text-cyan-400',
    accentBg: 'bg-cyan-500/15',
    accentBorder: 'border-cyan-500/25',
    badgeBg: 'bg-cyan-500/10',
    badgeText: 'text-cyan-400',
  },
  {
    name: 'Education & Research',
    icon: GraduationCap,
    description: 'Universities, research institutions, and student data protected for the long term',
    badges: ['FERPA', 'GDPR', 'HECVAT'],
    accentColor: 'text-indigo-400',
    accentBg: 'bg-indigo-500/15',
    accentBorder: 'border-indigo-500/25',
    badgeBg: 'bg-indigo-500/10',
    badgeText: 'text-indigo-400',
  },
]

export default function UseCasesSlide({ scenario: _scenario }: { scenario?: Scenario }) {
  return (
    <SlideWrapper>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <div className="flex items-center gap-3 mb-3">
          <Target className="w-5 h-5 text-quantum-400" />
          <span className="text-xs font-mono uppercase tracking-widest text-quantum-400/80">
            Slide 9 / 22
          </span>
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-white mb-3">
          Who{' '}
          <span className="gradient-text">Needs</span>{' '}
          Zipminator
        </h2>
        <p className="text-lg text-gray-400 max-w-2xl">
          Any organization where data stolen today could be decrypted tomorrow.
          That means everyone handling sensitive information.
        </p>
      </motion.div>

      {/* Social Impact header callout */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className="mb-6 flex flex-wrap items-center justify-between gap-4 px-5 py-3 rounded-xl bg-white/[0.03] border border-white/10"
      >
        <div className="flex items-center gap-3">
          <Globe className="w-5 h-5 text-quantum-400 shrink-0" />
          <p className="text-sm font-semibold text-white">
            Protecting the data society depends on
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
          <span className="text-xs font-mono text-green-400">
            12+ compliance frameworks supported
          </span>
        </div>
      </motion.div>

      {/* Market Priority by Sector */}
      <motion.div {...chartEntrance(0.15)} className="card-quantum chart-glow mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Target className="w-4 h-4 text-quantum-400" />
          <div>
            <h3 className="text-sm font-semibold text-white">Market Priority by Sector</h3>
            <p className="text-[11px] text-gray-500">PQC adoption urgency score (0-100)</p>
          </div>
        </div>
        <div style={{ height: 260 }} className="w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={MARKET_BY_SECTOR}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
            >
              <defs>
                {MARKET_BY_SECTOR.map((s) => (
                  <linearGradient key={s.sector} id={`grad-${s.sector}`} x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={s.color} stopOpacity={0.85} />
                    <stop offset="100%" stopColor={s.color} stopOpacity={0.4} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
              <XAxis
                type="number"
                domain={[0, 100]}
                {...AXIS_STYLE}
                tickFormatter={(v: number) => `${v}`}
              />
              <YAxis
                type="category"
                dataKey="sector"
                {...AXIS_STYLE}
                width={85}
                tick={{ fill: '#9ca3af', fontSize: 11, fontFamily: 'monospace' }}
              />
              <Tooltip
                {...TOOLTIP_STYLE}
                formatter={(value: number) => [`${value}/100`, 'Priority Score']}
              />
              <Legend
                wrapperStyle={{ fontSize: 10, fontFamily: 'monospace' }}
                payload={[
                  { value: 'Primary Target (65+)', type: 'rect', color: '#22c55e' },
                  { value: 'Secondary Target (<65)', type: 'rect', color: '#818cf8' },
                ]}
              />
              <Bar
                dataKey="value"
                animationDuration={CHART_ANIMATION_DURATION}
                radius={[0, 4, 4, 0]}
              >
                {MARKET_BY_SECTOR.map((s) => (
                  <Cell key={s.sector} fill={`url(#grad-${s.sector})`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Industry grid: responsive with 7 cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {INDUSTRIES.map((industry, i) => {
          const Icon = industry.icon
          return (
            <motion.div
              key={industry.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.07 }}
              whileHover={{ scale: 1.02 }}
              className="card-quantum group hover:border-white/15 transition-all"
            >
              {/* Icon + Title */}
              <div className="flex items-start gap-3 mb-3">
                <div className={`shrink-0 w-10 h-10 rounded-xl ${industry.accentBg} border ${industry.accentBorder} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <Icon className={`w-5 h-5 ${industry.accentColor}`} />
                </div>
                <h3 className="text-base font-semibold text-white font-display pt-1.5">
                  {industry.name}
                </h3>
              </div>

              {/* Description */}
              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                {industry.description}
              </p>

              {/* Compliance badges */}
              <div className="flex flex-wrap gap-1.5">
                {industry.badges.map((badge) => (
                  <span
                    key={badge}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-medium ${industry.badgeBg} ${industry.badgeText} border ${industry.accentBorder}`}
                  >
                    {badge}
                  </span>
                ))}
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Bottom callout */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="mt-6 flex items-center gap-3 px-5 py-3 rounded-xl bg-quantum-500/[0.06] border border-quantum-500/15"
      >
        <Shield className="w-5 h-5 text-quantum-400 shrink-0" />
        <p className="text-sm text-gray-300">
          <span className="text-quantum-400 font-semibold">7.8B people. $3.2T in assets.</span>{' '}
          One platform to protect them all. Per NSA CNSA 2.0 mandate timelines, migration must begin now.
        </p>
      </motion.div>

      {/* Gold divider */}
      <div className="section-divider-gold" />

      {/* Industry Deep-Dives */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.75 }}
        className="mb-6"
      >
        <h3 className="text-xl font-display font-bold text-white mb-2">
          Industry <span className="gradient-text-gold">Deep-Dives</span>
        </h3>
        <p className="text-sm text-gray-400 mb-6">Sector-specific use cases, regulatory drivers, and market sizing</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              title: 'Banking & Finance',
              icon: Landmark,
              useCase: 'Quantum-proof transaction signing, trading algorithm protection, and client data vaults',
              regulation: 'PCI-DSS v4.0 mandates PQC readiness assessment by 2026. SWIFT exploring PQC for cross-border payments.',
              market: '$4.2B',
              marketLabel: 'PQC banking segment by 2032',
              color: 'text-green-400',
              bg: 'bg-green-500/10',
              border: 'border-green-500/20',
            },
            {
              title: 'Healthcare',
              icon: Heart,
              useCase: 'Patient records with 50+ year confidentiality windows. Genomic data protection against future decryption.',
              regulation: 'HIPAA requires "reasonable safeguards" evolving to include PQC. EU Health Data Space mandates encryption.',
              market: '$2.8B',
              marketLabel: 'Healthcare PQC by 2032',
              color: 'text-red-400',
              bg: 'bg-red-500/10',
              border: 'border-red-500/20',
            },
            {
              title: 'Government & Defense',
              icon: Shield,
              useCase: 'Classified communications, intelligence sharing, and diplomatic cables protected against nation-state quantum adversaries',
              regulation: 'NSA CNSA 2.0 mandates PQC for all National Security Systems by 2027. OMB M-23-02 requires inventory.',
              market: '$5.1B',
              marketLabel: 'Gov/defense PQC by 2032',
              color: 'text-blue-400',
              bg: 'bg-blue-500/10',
              border: 'border-blue-500/20',
            },
            {
              title: 'Critical Infrastructure',
              icon: Zap,
              useCase: 'SCADA/ICS protection for power grids, water systems, and telecom backbones. Prevent harvest-now attacks on 30+ year infrastructure.',
              regulation: 'DHS CISA advisory on PQC migration. NERC CIP-013 supply chain security. EU NIS2 Directive.',
              market: '$3.5B',
              marketLabel: 'Infrastructure PQC by 2032',
              color: 'text-orange-400',
              bg: 'bg-orange-500/10',
              border: 'border-orange-500/20',
            },
            {
              title: 'Legal & Professional Services',
              icon: Scale,
              useCase: 'Attorney-client privilege, M&A deal rooms, trade secret protection with decades-long confidentiality requirements',
              regulation: 'ABA Ethics Opinion on evolving tech competence. Trade Secrets Act requires "reasonable measures."',
              market: '$1.2B',
              marketLabel: 'Legal PQC by 2032',
              color: 'text-purple-400',
              bg: 'bg-purple-500/10',
              border: 'border-purple-500/20',
            },
          ].map((sector, i) => {
            const Icon = sector.icon
            return (
              <motion.div
                key={sector.title}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + i * 0.06 }}
                className="card-quantum-gold"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl ${sector.bg} border ${sector.border} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${sector.color}`} />
                  </div>
                  <h4 className="text-sm font-semibold text-white">{sector.title}</h4>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed mb-3">{sector.useCase}</p>
                <div className="rounded-lg bg-amber-500/[0.04] border border-amber-500/10 p-2.5 mb-3">
                  <p className="text-[10px] font-mono text-amber-400/80 uppercase tracking-wider mb-1">Regulatory Driver</p>
                  <p className="text-[11px] text-gray-400 leading-relaxed">{sector.regulation}</p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-500 font-mono uppercase">Est. Market</span>
                  <div className="text-right">
                    <span className="text-sm font-bold font-mono gradient-text-gold">{sector.market}</span>
                    <span className="text-[9px] text-gray-500 ml-1">{sector.marketLabel}</span>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* Customer Journey */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1 }}
        className="card-quantum-gold"
      >
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Target className="w-4 h-4 text-amber-400" />
          Customer Adoption Journey
        </h3>
        <div className="flex flex-col sm:flex-row items-stretch gap-2">
          {[
            { step: '1', title: 'Discover', detail: 'Free tier trial, PQC health check reveals exposure', color: 'border-amber-500/30 bg-amber-500/[0.06]' },
            { step: '2', title: 'Adopt', detail: 'Deploy messenger + VPN, first team protected in <1 hour', color: 'border-amber-500/30 bg-amber-500/[0.06]' },
            { step: '3', title: 'Expand', detail: 'Add browser, email, VoIP modules. Enterprise SSO integration.', color: 'border-amber-500/30 bg-amber-500/[0.06]' },
            { step: '4', title: 'Platform', detail: 'API/SDK access, build PQC into own products via QCaaP', color: 'border-amber-500/30 bg-amber-500/[0.06]' },
          ].map((phase, i) => (
            <div key={phase.step} className="flex-1 flex items-start gap-3">
              <div className={`flex flex-col items-center rounded-xl border px-4 py-3 flex-1 ${phase.color}`}>
                <span className="text-lg font-bold font-mono gradient-text-gold">{phase.step}</span>
                <p className="text-xs font-semibold text-white mt-1">{phase.title}</p>
                <p className="text-[10px] text-gray-400 mt-1 text-center leading-relaxed">{phase.detail}</p>
              </div>
              {i < 3 && (
                <span className="hidden sm:flex items-center text-amber-500/40 text-lg self-center">&rarr;</span>
              )}
            </div>
          ))}
        </div>
      </motion.div>
    </SlideWrapper>
  )
}
