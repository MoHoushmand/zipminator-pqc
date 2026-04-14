'use client'

import { motion } from 'framer-motion'
import { CheckCircle2, GitBranch, FileText, Rocket } from 'lucide-react'

interface Stat {
  value: string
  label: string
  sub?: string
}

const HEADLINE_STATS: readonly Stat[] = [
  { value: '513', label: 'Workspace tests', sub: 'cargo test --workspace, all passing' },
  { value: '156', label: 'Qubits', sub: 'IBM Quantum hardware entropy (real jobs)' },
  { value: '0.034ms', label: 'Encrypt latency', sub: 'ML-KEM-768 keygen + AES-256-GCM seal' },
  { value: 'Level 3', label: 'NIST security', sub: 'FIPS 203 Category 3 equivalence' },
] as const

interface Milestone {
  date: string
  title: string
  detail: string
  icon: typeof Rocket
}

const MILESTONES: readonly Milestone[] = [
  {
    date: 'Apr 2026',
    title: 'Python SDK v0.5.0 on PyPI',
    detail: '429 tests, real KAT vectors, PyO3 bindings over Rust core',
    icon: Rocket,
  },
  {
    date: 'Apr 2026',
    title: 'Flutter super-app TestFlight Build 43',
    detail: '11 screens, 17 Riverpod providers, 9-pillar navigation',
    icon: GitBranch,
  },
  {
    date: 'Mar 2026',
    title: 'Physical Cryptography Wave 1',
    detail: '6 new mesh modules, 106 mesh tests, 513 total workspace tests',
    icon: CheckCircle2,
  },
  {
    date: 'Mar 2026',
    title: '50,000-word IP valuation',
    detail: '3 patents (46 claims filed), 3 matching research papers',
    icon: FileText,
  },
] as const

interface Trust {
  headline: string
  body: string
}

const TRUST: readonly Trust[] = [
  {
    headline: 'Implements NIST FIPS 203 (ML-KEM-768)',
    body: 'Verified against NIST KAT test vectors. Memory-safe Rust core, no unsafe blocks in crypto.',
  },
  {
    headline: 'IBM Quantum entropy, live jobs',
    body: '35 IBM jobs on 156-qubit hardware. 6.8 MB of harvested quantum entropy in the pool.',
  },
  {
    headline: '100% open source (MIT)',
    body: 'Rust core, Python SDK, FastAPI backend, Next.js web, Expo mobile, Tauri browser.',
  },
] as const

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] as const },
  }),
}

export const Proof = () => (
  <section id="proof" className="section-padding relative">
    <div className="container-custom">
      <div className="max-w-3xl mx-auto text-center mb-14">
        <p className="text-sm font-semibold tracking-widest uppercase text-quantum-400 mb-4">
          Proof, not projections
        </p>
        <h2 className="text-4xl md:text-5xl font-bold mb-6 gradient-text">
          Numbers you can reproduce
        </h2>
        <p className="text-lg text-gray-400 leading-relaxed">
          Every number below is verifiable from the open-source workspace. No estimates, no targets.
        </p>
      </div>

      {/* Headline stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-20">
        {HEADLINE_STATS.map((s, i) => (
          <motion.div
            key={s.label}
            custom={i}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={cardVariants}
            className="card-quantum text-center"
          >
            <div className="text-3xl md:text-4xl font-bold gradient-text mb-2">{s.value}</div>
            <div className="text-sm font-semibold text-white mb-1">{s.label}</div>
            {s.sub && <div className="text-xs text-gray-500 leading-snug">{s.sub}</div>}
          </motion.div>
        ))}
      </div>

      {/* Milestones */}
      <div className="grid md:grid-cols-2 gap-6 mb-20">
        {MILESTONES.map((m, i) => {
          const Icon = m.icon
          return (
            <motion.div
              key={m.title}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              variants={cardVariants}
              className="card-quantum flex items-start gap-4"
            >
              <div className="shrink-0 w-11 h-11 rounded-xl bg-quantum-500/10 border border-quantum-500/30 flex items-center justify-center">
                <Icon className="w-5 h-5 text-quantum-400" aria-hidden="true" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-xs font-mono uppercase tracking-wider text-quantum-400">
                    {m.date}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mb-1">{m.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{m.detail}</p>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Trust band */}
      <div className="grid md:grid-cols-3 gap-6">
        {TRUST.map((t, i) => (
          <motion.div
            key={t.headline}
            custom={i}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={cardVariants}
            className="rounded-2xl border border-quantum-500/20 bg-gradient-to-br from-quantum-900/20 to-transparent p-6"
          >
            <h3 className="text-base font-bold text-white mb-2">{t.headline}</h3>
            <p className="text-sm text-gray-400 leading-relaxed">{t.body}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
)
