'use client'

import { motion } from 'framer-motion'
import { Atom, Lock, Network, Cpu, Key, Shield } from 'lucide-react'

interface Layer {
  icon: typeof Atom
  label: string
  primitive: string
  desc: string
}

const LAYERS: readonly Layer[] = [
  {
    icon: Atom,
    label: 'Entropy',
    primitive: '156-qubit QRNG',
    desc: 'IBM Quantum + Rigetti aggregated with OS fallback. Never stalls.',
  },
  {
    icon: Key,
    label: 'Key exchange',
    primitive: 'ML-KEM-768 (FIPS 203)',
    desc: 'NIST Level 3 post-quantum KEM. Hybrid composite with X25519 optional.',
  },
  {
    icon: Lock,
    label: 'Data encryption',
    primitive: 'AES-256-GCM',
    desc: 'Session keys via HKDF-SHA-256, constant-time ops, zeroize on drop.',
  },
  {
    icon: Shield,
    label: 'Signatures',
    primitive: 'ML-DSA (FIPS 204)',
    desc: 'Post-quantum digital signatures for provenance and integrity.',
  },
  {
    icon: Network,
    label: 'Transport',
    primitive: 'PQ-WireGuard, PQ-SRTP, PQC TLS',
    desc: 'Same PQC handshake across VPN, voice, video, web.',
  },
  {
    icon: Cpu,
    label: 'Runtime',
    primitive: 'Memory-safe Rust core',
    desc: 'No unsafe blocks in crypto. PyO3 bindings expose the core to Python.',
  },
] as const

const CODE_SAMPLE = `from zipminator import Vault

vault = Vault.from_entropy_pool("quantum_entropy_pool.bin")
sealed = vault.encrypt(b"quantum-safe payload")

# round-trip uses the same ML-KEM-768 session key
assert vault.decrypt(sealed) == b"quantum-safe payload"`

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] as const },
  }),
}

export const Architecture = () => (
  <section id="architecture" className="section-padding relative">
    <div className="container-custom">
      <div className="max-w-3xl mx-auto text-center mb-16">
        <p className="text-sm font-semibold tracking-widest uppercase text-quantum-400 mb-4">
          How it works
        </p>
        <h2 className="text-4xl md:text-5xl font-bold mb-6 gradient-text">
          One crypto core, six composable layers
        </h2>
        <p className="text-lg text-gray-400 leading-relaxed">
          Every pillar reuses the same primitives. Entropy flows up; encrypted bytes flow out. No
          algorithm negotiation footguns, no downgrade paths.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
        {LAYERS.map((layer, i) => {
          const Icon = layer.icon
          return (
            <motion.div
              key={layer.label}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              variants={cardVariants}
              className="card-quantum group"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-quantum-500/10 border border-quantum-500/30 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-quantum-400" aria-hidden="true" />
                </div>
                <span className="text-xs font-semibold tracking-widest uppercase text-gray-500">
                  {layer.label}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2 font-mono">{layer.primitive}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{layer.desc}</p>
            </motion.div>
          )
        })}
      </div>

      {/* Code sample */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.6 }}
        className="max-w-3xl mx-auto"
      >
        <div className="rounded-2xl border border-white/10 bg-gray-950/70 backdrop-blur-sm overflow-hidden shadow-2xl shadow-black/40">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-white/5 bg-white/[0.02]">
            <span className="w-3 h-3 rounded-full bg-rose-500/80" aria-hidden="true" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80" aria-hidden="true" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80" aria-hidden="true" />
            <span className="ml-3 text-xs font-mono text-gray-500">vault.py</span>
          </div>
          <pre className="px-6 py-5 text-sm font-mono text-gray-300 overflow-x-auto">
            <code>{CODE_SAMPLE}</code>
          </pre>
        </div>
      </motion.div>
    </div>
  </section>
)
