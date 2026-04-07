'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import SlideWrapper from '../SlideWrapper'
import { Shield, Lock, Cpu, Leaf, MapPin } from 'lucide-react'
import type { Scenario } from '@/lib/pitch-data'

const QuantumParticleField = dynamic(() => import('../QuantumParticleField'), { ssr: false })

const floatingIcons = [
  { Icon: Shield, delay: 0, x: -120, y: -80 },
  { Icon: Lock, delay: 0.2, x: 140, y: -60 },
  { Icon: Cpu, delay: 0.4, x: -80, y: 100 },
]

export default function TitleSlide({ scenario: _scenario }: { scenario?: Scenario }) {
  return (
    <SlideWrapper className="items-center text-center relative">
      {/* Three.js quantum particle field */}
      <QuantumParticleField />

      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-quantum-500/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] bg-purple-600/8 rounded-full blur-[80px]" />
      </div>

      {/* Floating icons */}
      {floatingIcons.map(({ Icon, delay, x, y }, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 0.15, scale: 1, y: [y, y - 15, y] }}
          transition={{
            opacity: { delay: 0.5 + delay, duration: 0.6 },
            scale: { delay: 0.5 + delay, duration: 0.6 },
            y: { delay: 1 + delay, duration: 4, repeat: Infinity, ease: 'easeInOut' },
          }}
          className="absolute top-1/2 left-1/2 text-quantum-400"
          style={{ marginLeft: x, marginTop: y }}
        >
          <Icon className="w-10 h-10" strokeWidth={1} />
        </motion.div>
      ))}

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.6 }}
        className="relative z-10"
      >
        {/* QDaria badge + Norwegian trust */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="flex items-center justify-center gap-3 mb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-quantum-500/30 bg-quantum-500/10">
            <div className="w-2 h-2 rounded-full bg-quantum-400 animate-pulse" />
            <span className="text-xs font-medium text-quantum-300 tracking-wider uppercase">
              QDaria
            </span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.04]">
            <MapPin className="w-3 h-3 text-red-400" />
            <span className="text-[11px] font-medium text-gray-400 tracking-wide">
              Norwegian-Built
            </span>
          </div>
        </motion.div>

        {/* Title */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-display font-bold tracking-tight mb-6 flex items-end justify-center gap-1">
          <Image
            src="/logos/Zipminator_0_gradient.svg"
            alt="Zipminator"
            width={500}
            height={83}
            className="h-[0.75em] w-auto"
            priority
          />
          <span className="text-white/40 font-light leading-none">-PQC</span>
        </h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-lg sm:text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed mb-8"
        >
          World&apos;s First{' '}
          <span className="text-white font-medium">Post-Quantum Encryption</span>{' '}
          Super-App
        </motion.p>

        {/* Key stats row */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="flex flex-wrap items-center justify-center gap-6 md:gap-10 text-sm"
        >
          {[
            { label: 'NIST FIPS 203', desc: 'Kyber768' },
            { label: '156 Qubits', desc: 'QRNG' },
            { label: '300K+ LOC', desc: 'Production Code' },
            { label: '9 Modules', desc: 'Super-App' },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-white font-mono font-semibold text-sm">
                {stat.label}
              </div>
              <div className="text-gray-500 text-xs mt-0.5">{stat.desc}</div>
            </div>
          ))}
        </motion.div>

        {/* Green badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="mt-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/[0.07]"
        >
          <Leaf className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-xs font-medium text-emerald-300/90 tracking-wide">
            Powered by 98% Renewable Energy
          </span>
        </motion.div>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="mt-8 text-sm text-gray-500 font-mono tracking-wider"
        >
          SEED ROUND 2026 &middot; QUANTUM-SAFE FROM DAY ONE
        </motion.p>
      </motion.div>

      {/* ─── Key Differentiators ─── */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.85, duration: 0.6 }}
        className="relative z-10 w-full max-w-5xl mx-auto mt-16"
      >
        <h3 className="text-sm font-mono uppercase tracking-widest text-amber-400/80 mb-6 text-center">
          Key Differentiators
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              icon: Shield,
              title: 'NIST FIPS 203 Native',
              desc: 'ML-KEM-768 (Kyber768) implemented in constant-time Rust. Verified against all 100 NIST KAT test vectors. No wrappers, no liboqs dependency.',
            },
            {
              icon: Cpu,
              title: 'Quantum Entropy',
              desc: '156-qubit IBM Quantum processors (Marrakesh/Fez) supply true quantum randomness via qBraid API, with OS CSPRNG fallback for 100% uptime.',
            },
            {
              icon: Lock,
              title: 'Zero-Knowledge Architecture',
              desc: 'End-to-end encryption with no server-side key access. All cryptographic operations execute client-side in sandboxed Rust/WASM modules.',
            },
            {
              icon: Leaf,
              title: 'Green by Design',
              desc: 'Norwegian data centers run on 98% renewable hydroelectric power. Single-app consolidation reduces compute footprint by an estimated 60-75%.',
            },
          ].map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 + i * 0.08, duration: 0.5 }}
              className="card-quantum-gold p-5"
            >
              <card.icon className="w-6 h-6 text-amber-400 mb-3" />
              <h4 className="text-sm font-semibold text-white mb-2">{card.title}</h4>
              <p className="text-xs text-gray-400 leading-relaxed">{card.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ─── Platform Overview ─── */}
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.6 }}
        className="relative z-10 w-full max-w-4xl mx-auto mt-12"
      >
        <div className="card-quantum-gold p-6">
          <h3 className="gradient-text-gold text-lg font-semibold mb-4">Platform Overview</h3>
          <table className="table-quantum w-full text-sm">
            <thead>
              <tr>
                <th className="text-left py-2 px-3 text-amber-400/80 font-mono text-xs uppercase tracking-wider">Metric</th>
                <th className="text-left py-2 px-3 text-amber-400/80 font-mono text-xs uppercase tracking-wider">Value</th>
                <th className="text-left py-2 px-3 text-amber-400/80 font-mono text-xs uppercase tracking-wider">Context</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Crypto Standard', 'NIST FIPS 203 (ML-KEM-768)', 'Finalized August 2024'],
                ['Security Modules', '9 integrated pillars', 'Messenger, VoIP, VPN, Browser, Mail, QRNG, PII, AI, Mesh'],
                ['Codebase', '300K+ lines of code', 'Rust, TypeScript, Python, Swift, Kotlin'],
                ['Test Coverage', '268+ Rust tests passing', 'Includes fuzz testing and NIST KAT validation'],
                ['Quantum Hardware', '156-qubit IBM processors', 'qBraid API with OS entropy fallback'],
                ['Energy Source', '98% renewable', 'Norwegian hydroelectric data centers'],
                ['Target Market', '$2.8-4.6B by 2030', 'PQC market (projected)'],
              ].map((row, i) => (
                <tr key={i} className="border-t border-white/5">
                  <td className="py-2 px-3 text-white font-medium">{row[0]}</td>
                  <td className="py-2 px-3 text-amber-300 font-mono">{row[1]}</td>
                  <td className="py-2 px-3 text-gray-500 text-xs">{row[2]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* ─── Security Level Equation ─── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4, duration: 0.5 }}
        className="relative z-10 w-full max-w-3xl mx-auto mt-10 mb-4"
      >
        <div className="card-equation p-6 text-center">
          <h4 className="text-xs font-mono uppercase tracking-widest text-amber-400/70 mb-4">
            Kyber768 Security Level
          </h4>
          <div className="text-2xl sm:text-3xl font-mono text-white mb-3">
            Security Level = 2<sup className="text-amber-400">n</sup>{' '}
            <span className="text-gray-500 text-lg">where</span>{' '}
            <span className="text-amber-400">n = 768</span>
          </div>
          <p className="text-sm text-gray-400 leading-relaxed max-w-xl mx-auto mt-3">
            ML-KEM-768 provides NIST Category 3 security, equivalent to AES-192.
            This means 2<sup>192</sup> classical operations to break, making it resistant
            to both classical brute-force and Grover&apos;s quantum search algorithm
            (which only halves the effective key length).
          </p>
          <div className="flex items-center justify-center gap-6 mt-4 text-xs font-mono">
            <span className="text-gray-500">
              Classical: <span className="text-red-400">2^192 ops</span>
            </span>
            <span className="text-gray-600">|</span>
            <span className="text-gray-500">
              Quantum (Grover): <span className="text-amber-400">2^96 ops</span>
            </span>
            <span className="text-gray-600">|</span>
            <span className="text-gray-500">
              Category: <span className="text-emerald-400">NIST Level 3</span>
            </span>
          </div>
        </div>
      </motion.div>
    </SlideWrapper>
  )
}
