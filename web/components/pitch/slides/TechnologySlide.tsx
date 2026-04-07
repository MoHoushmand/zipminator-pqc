'use client'

import { motion } from 'framer-motion'
import SlideWrapper from '../SlideWrapper'
import { TECHNOLOGY_STACK, GREEN_CREDENTIALS } from '@/lib/pitch-data'
import {
  Lock,
  Settings,
  Monitor,
  FileCheck,
  Cpu,
  CheckCircle2,
  Zap,
  Leaf,
  Calendar,
  Layers,
} from 'lucide-react'
import type { Scenario } from '@/lib/pitch-data'

const TECH_LAYERS = [
  { name: 'Hardware', items: ['156-qubit IBM Quantum', 'Marrakesh + Fez', 'OS Entropy'], color: 'orange' as const },
  { name: 'Cryptography', items: ['ML-KEM Kyber768', 'FIPS 203', 'Constant-time Rust'], color: 'quantum' as const },
  { name: 'Services', items: ['PyO3 Bridge', 'FastAPI', 'WireGuard', 'WebRTC'], color: 'cyan' as const },
  { name: 'Applications', items: ['Messenger', 'VoIP', 'VPN', 'Browser', 'Email'], color: 'green' as const },
]

const LAYER_STYLES: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  orange: { bg: 'bg-orange-500/[0.06]', border: 'border-orange-500/20', text: 'text-orange-400', badge: 'bg-orange-500/15 text-orange-300 border-orange-500/25' },
  quantum: { bg: 'bg-quantum-500/[0.06]', border: 'border-quantum-500/20', text: 'text-quantum-400', badge: 'bg-quantum-500/15 text-quantum-300 border-quantum-500/25' },
  cyan: { bg: 'bg-cyan-500/[0.06]', border: 'border-cyan-500/20', text: 'text-cyan-400', badge: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/25' },
  green: { bg: 'bg-green-500/[0.06]', border: 'border-green-500/20', text: 'text-green-400', badge: 'bg-green-500/15 text-green-300 border-green-500/25' },
}

const CATEGORY_ICONS: Record<string, typeof Lock> = {
  Cryptography: Lock,
  'Core Engine': Settings,
  Platforms: Monitor,
  Standards: FileCheck,
}

const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  Cryptography: {
    bg: 'bg-quantum-500/10',
    border: 'border-quantum-500/20',
    text: 'text-quantum-400',
  },
  'Core Engine': {
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
    text: 'text-orange-400',
  },
  Platforms: {
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
    text: 'text-cyan-400',
  },
  Standards: {
    bg: 'bg-green-500/10',
    border: 'border-green-500/20',
    text: 'text-green-400',
  },
}

const KEY_CALLOUTS = [
  { label: '156-qubit QRNG', detail: 'IBM Marrakesh' },
  { label: 'NIST FIPS 203', detail: 'ML-KEM Kyber768' },
  { label: '26 Technologies', detail: 'Integrated stack' },
  { label: '~1000x less energy', detail: 'Kyber vs RSA-4096' },
]

const STANDARDS_TIMELINE = [
  { year: '2024', label: 'NIST FIPS 203', detail: 'ML-KEM standardized', done: true },
  { year: '2025', label: 'NIST FIPS 204/205', detail: 'ML-DSA + SLH-DSA', done: true },
  { year: '2027', label: 'CNSA 2.0', detail: 'NSA mandate for all NSS', done: false },
  { year: '2035', label: 'Full PQC', detail: 'Complete classical phase-out', done: false },
]

export default function TechnologySlide({ scenario: _scenario }: { scenario?: Scenario }) {
  return (
    <SlideWrapper>
      {/* Section header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-3">
          <Cpu className="w-5 h-5 text-quantum-400" />
          <span className="text-xs font-mono uppercase tracking-widest text-quantum-400/80">
            Slide 8 / 22
          </span>
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-white mb-3">
          Built on{' '}
          <span className="gradient-text">Proven Standards</span>
        </h2>
        <p className="text-lg text-gray-400 max-w-2xl">
          Every layer of our stack is grounded in NIST-approved algorithms,
          battle-tested protocols, and constant-time implementations.
        </p>
      </motion.div>

      {/* Key callouts */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6"
      >
        {KEY_CALLOUTS.map((callout, i) => (
          <div
            key={i}
            className="flex flex-col items-center text-center py-3 px-2 rounded-xl bg-quantum-500/[0.04] border border-quantum-500/10"
          >
            <span className="text-sm font-mono font-semibold text-quantum-300">
              {callout.label}
            </span>
            <span className="text-[10px] text-gray-500 mt-0.5">
              {callout.detail}
            </span>
          </div>
        ))}
      </motion.div>

      {/* Layered Technology Stack */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.21 }}
        className="card-quantum chart-glow mb-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-quantum-500/10 border border-quantum-500/20 flex items-center justify-center">
            <Layers className="w-4 h-4 text-quantum-400" />
          </div>
          <h3 className="font-semibold text-white text-sm">Full-Stack Architecture</h3>
        </div>
        <div className="space-y-2" style={{ perspective: '800px' }}>
          {[...TECH_LAYERS].reverse().map((layer, i) => {
            const style = LAYER_STYLES[layer.color]
            const fromRight = i % 2 === 0
            return (
              <motion.div
                key={layer.name}
                initial={{ opacity: 0, x: fromRight ? 60 : -60 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 120,
                  damping: 18,
                  delay: 0.3 + i * 0.15,
                }}
                className={`flex items-center justify-between px-4 py-2.5 rounded-lg border ${style.bg} ${style.border}`}
                style={{ transform: 'rotateX(2deg)' }}
              >
                <span className={`text-xs font-semibold font-mono ${style.text} min-w-[90px]`}>
                  {layer.name}
                </span>
                <div className="flex flex-wrap gap-1.5 justify-end">
                  {layer.items.map((item) => (
                    <span
                      key={item}
                      className={`text-[10px] px-2 py-0.5 rounded-full border ${style.badge}`}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* Energy Efficiency section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22 }}
        className="card-quantum mb-6"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center">
            <Leaf className="w-4 h-4 text-green-400" />
          </div>
          <h3 className="font-semibold text-white text-sm">Energy Efficiency</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {GREEN_CREDENTIALS.stats.slice(0, 3).map((stat, i) => (
            <div key={i} className="flex flex-col items-center text-center py-2 px-3 rounded-lg bg-green-500/[0.04] border border-green-500/10">
              <span className="text-lg font-mono font-bold text-green-400">{stat.value}</span>
              <span className="text-[10px] text-gray-400 mt-0.5">{stat.label}</span>
              <span className="text-[9px] text-gray-600 mt-0.5 leading-tight">{stat.detail}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Standards Compliance Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.24 }}
        className="card-quantum mb-6"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center">
            <Calendar className="w-4 h-4 text-green-400" />
          </div>
          <h3 className="font-semibold text-white text-sm">Standards Compliance Timeline</h3>
        </div>
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {STANDARDS_TIMELINE.map((step, i) => (
            <div key={i} className="flex items-center shrink-0">
              <div className={`flex flex-col items-center px-3 py-2 rounded-lg border ${step.done ? 'bg-green-500/[0.06] border-green-500/20' : 'bg-white/[0.02] border-white/10'}`}>
                <div className="flex items-center gap-1.5 mb-1">
                  <CheckCircle2 className={`w-3.5 h-3.5 ${step.done ? 'text-green-400' : 'text-gray-600'}`} />
                  <span className={`text-xs font-mono font-semibold ${step.done ? 'text-green-400' : 'text-gray-400'}`}>{step.year}</span>
                </div>
                <span className={`text-[10px] font-medium ${step.done ? 'text-white' : 'text-gray-500'}`}>{step.label}</span>
                <span className="text-[9px] text-gray-600">{step.detail}</span>
              </div>
              {i < STANDARDS_TIMELINE.length - 1 && (
                <div className={`w-6 h-px mx-0.5 ${step.done ? 'bg-green-500/40' : 'bg-white/10'}`} />
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Technology stack cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        {TECHNOLOGY_STACK.map((category, index) => {
          const Icon = CATEGORY_ICONS[category.category] || Settings
          const colors = CATEGORY_COLORS[category.category] || CATEGORY_COLORS['Cryptography']

          return (
            <motion.div
              key={category.category}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.08 }}
              className="card-quantum"
            >
              {/* Category header */}
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`w-9 h-9 rounded-lg ${colors.bg} border ${colors.border} flex items-center justify-center`}
                >
                  <Icon className={`w-4 h-4 ${colors.text}`} />
                </div>
                <h3 className="font-semibold text-white text-sm">
                  {category.category}
                </h3>
              </div>

              {/* Items list */}
              <ul className="space-y-2">
                {category.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2
                      className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${colors.text}`}
                    />
                    <span className="text-xs text-gray-400 leading-relaxed">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </motion.div>
          )
        })}
      </div>

      {/* Gold divider */}
      <div className="section-divider-gold" />

      {/* Cryptographic Parameters Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="card-quantum-gold mb-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Lock className="w-4 h-4 text-amber-400" />
          </div>
          <h3 className="font-semibold text-white text-sm">Cryptographic Parameters</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="table-quantum">
            <thead>
              <tr>
                <th>Algorithm</th>
                <th>Public Key Size</th>
                <th>Security Level</th>
                <th>Performance</th>
                <th>Use Case</th>
              </tr>
            </thead>
            <tbody>
              {[
                { algo: 'ML-KEM-768 (Kyber)', pk: '2,400 bytes', level: 'NIST Level 3', perf: '0.05ms keygen', use: 'Key encapsulation' },
                { algo: 'ML-DSA-65 (Dilithium)', pk: '1,952 bytes', level: 'NIST Level 3', perf: '0.1ms sign', use: 'Digital signatures' },
                { algo: 'SLH-DSA-SHA2-128s', pk: '32 bytes', level: 'NIST Level 1', perf: '2ms sign', use: 'Hash-based signatures' },
                { algo: 'AES-256-GCM', pk: '32 bytes (symmetric)', level: 'NIST Level 5 equiv.', perf: '~3 GB/s', use: 'Data-at-rest encryption' },
                { algo: 'SHAKE-256', pk: 'N/A (hash)', level: 'NIST Level 5 equiv.', perf: '~1.5 GB/s', use: 'KDF / entropy extraction' },
              ].map((row, i) => (
                <tr key={i}>
                  <td className="font-mono text-amber-300/90 text-xs font-semibold">{row.algo}</td>
                  <td className="font-mono text-xs">{row.pk}</td>
                  <td>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      {row.level}
                    </span>
                  </td>
                  <td className="font-mono text-xs text-green-400">{row.perf}</td>
                  <td className="text-xs text-gray-400">{row.use}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* NIST Compliance Matrix */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="card-quantum-gold mb-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <FileCheck className="w-4 h-4 text-amber-400" />
          </div>
          <h3 className="font-semibold text-white text-sm">NIST Compliance Matrix</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { standard: 'FIPS 203', name: 'ML-KEM', status: 'Implemented', detail: 'Kyber768 key encapsulation verified against official KAT vectors', color: 'text-green-400 bg-green-500/10 border-green-500/20' },
            { standard: 'FIPS 204', name: 'ML-DSA', status: 'Implemented', detail: 'Dilithium digital signatures for code signing and auth tokens', color: 'text-green-400 bg-green-500/10 border-green-500/20' },
            { standard: 'FIPS 205', name: 'SLH-DSA', status: 'Integrated', detail: 'Stateless hash-based signatures as fallback signing mechanism', color: 'text-green-400 bg-green-500/10 border-green-500/20' },
          ].map((item) => (
            <div key={item.standard} className="rounded-xl bg-white/[0.02] border border-amber-500/10 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-mono font-bold text-amber-300">{item.standard}</span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${item.color}`}>
                  {item.status}
                </span>
              </div>
              <p className="text-xs font-semibold text-white mb-1">{item.name}</p>
              <p className="text-[11px] text-gray-400 leading-relaxed">{item.detail}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Equation Card: ML-KEM Security */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="card-equation mb-6"
      >
        <div className="flex items-center gap-3 mb-3">
          <Zap className="w-4 h-4 text-amber-400" />
          <h3 className="font-semibold text-white text-sm font-sans">ML-KEM Security Guarantee</h3>
        </div>
        <div className="text-center py-4">
          <p className="text-lg sm:text-xl text-amber-300 font-mono tracking-wide">
            ML-KEM-768: &nbsp; &#x2016;e&#x2016; &lt; q/2<sup>k</sup>, &nbsp; k = 768
          </p>
          <p className="text-xs text-gray-500 mt-3 max-w-lg mx-auto leading-relaxed">
            The Module Learning With Errors (MLWE) problem guarantees that recovering the secret key
            requires solving a lattice problem with dimension n=256 and module rank k=3, yielding
            estimated classical security of 2<sup>182</sup> operations and quantum security of 2<sup>164</sup>.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-4 border-t border-amber-500/10 pt-4">
          <div className="text-center">
            <p className="text-sm font-mono text-amber-300">2<sup>182</sup></p>
            <p className="text-[10px] text-gray-500 mt-1">Classical security</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-mono text-amber-300">2<sup>164</sup></p>
            <p className="text-[10px] text-gray-500 mt-1">Quantum security (Grover)</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-mono text-amber-300">3329</p>
            <p className="text-[10px] text-gray-500 mt-1">Modulus q</p>
          </div>
        </div>
      </motion.div>

      {/* Constant-Time Guarantees */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
        className="card-quantum-gold"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Settings className="w-4 h-4 text-amber-400" />
          </div>
          <h3 className="font-semibold text-white text-sm">Constant-Time Guarantees</h3>
        </div>
        <p className="text-sm text-gray-400 leading-relaxed mb-4">
          All cryptographic operations in Zipminator execute in constant time, eliminating timing
          side-channel attacks. This is verified via Dudect statistical analysis on every CI build.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { title: 'No secret-dependent branches', detail: 'All comparisons use bitwise OR accumulation, never early-exit' },
            { title: 'No secret-dependent memory access', detail: 'Lookup tables replaced with arithmetic to prevent cache-timing leaks' },
            { title: 'Dudect CI verification', detail: 'Statistical t-test on 10M samples per operation, p < 0.001 threshold' },
            { title: 'Zero unsafe Rust blocks', detail: 'Entire crypto core compiled with #[forbid(unsafe_code)], eliminating memory corruption vectors' },
          ].map((item) => (
            <div key={item.title} className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/[0.04] border border-amber-500/10">
              <CheckCircle2 className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-white">{item.title}</p>
                <p className="text-[10px] text-gray-400 mt-0.5 leading-relaxed">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </SlideWrapper>
  )
}
