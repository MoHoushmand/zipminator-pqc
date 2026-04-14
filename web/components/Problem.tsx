'use client'

import { motion } from 'framer-motion'
import { AlertTriangle, Ban, Clock, Radio } from 'lucide-react'

interface ThreatPair {
  attack: string
  defeat: string
}

const THREATS: readonly ThreatPair[] = [
  { attack: 'SS7 call interception', defeat: 'PQ-SRTP AES-256-GCM frames' },
  { attack: 'SMS hijacking', defeat: 'PQC Messenger Double Ratchet' },
  { attack: 'Stingray location tracking', defeat: 'PQ-WireGuard tunnel' },
  { attack: 'MFA / 2FA bypass', defeat: 'ML-KEM-768 session keys' },
] as const

export const Problem = () => (
  <section id="problem" className="section-padding relative">
    <div className="container-custom">
      <div className="grid lg:grid-cols-2 gap-16 items-center">
        {/* Left: the argument */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/10 px-4 py-1.5 mb-6">
            <AlertTriangle className="w-4 h-4 text-amber-400" aria-hidden="true" />
            <span className="text-xs font-semibold tracking-wider uppercase text-amber-300">
              Harvest now, decrypt later
            </span>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white leading-tight">
            Classical cryptography is on a{' '}
            <span className="gradient-text">countdown timer</span>.
          </h2>

          <p className="text-lg text-gray-300 leading-relaxed mb-6">
            Nation-state adversaries already store encrypted traffic today, waiting for fault-tolerant
            quantum hardware to retroactively decrypt it. NSA CNSA 2.0 mandates ML-KEM by 2035; federal
            systems must transition by 2030. The window for RSA and ECC is closed.
          </p>

          <p className="text-lg text-gray-300 leading-relaxed mb-8">
            At the same time, SS7 (designed in 1975) routes most cellular signaling. DHS has confirmed
            active exploitation. Every call, SMS, and MFA push over a legacy telco network is readable
            to anyone who rents time on an SS7 gateway.
          </p>

          <div className="flex flex-wrap gap-3 text-sm">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-gray-300">
              <Clock className="w-3.5 h-3.5 text-quantum-400" aria-hidden="true" />
              NIST deprecates RSA/ECC after 2030
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-gray-300">
              <Radio className="w-3.5 h-3.5 text-quantum-400" aria-hidden="true" />
              SS7 active since 1975
            </span>
          </div>
        </motion.div>

        {/* Right: attack -> defeat */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="glass-panel rounded-3xl p-8 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 via-transparent to-quantum-500/10 pointer-events-none" />
          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold tracking-widest uppercase text-gray-400">
                Known attack
              </h3>
              <h3 className="text-sm font-semibold tracking-widest uppercase text-quantum-400">
                Zipminator defense
              </h3>
            </div>
            {THREATS.map((t) => (
              <div
                key={t.attack}
                className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3"
              >
                <span className="flex items-center gap-2 text-sm text-gray-200">
                  <Ban className="w-4 h-4 text-rose-400 shrink-0" aria-hidden="true" />
                  {t.attack}
                </span>
                <span className="text-quantum-500 font-mono text-xs" aria-hidden="true">
                  &rarr;
                </span>
                <span className="text-sm text-gray-200 font-medium">{t.defeat}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  </section>
)
