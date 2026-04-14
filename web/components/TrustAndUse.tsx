'use client'

import { motion } from 'framer-motion'
import { Building2, HeartPulse, Landmark, Scale, Banknote, Factory } from 'lucide-react'

interface Mandate {
  source: string
  requirement: string
  deadline: string
}

const MANDATES: readonly Mandate[] = [
  {
    source: 'NSA CNSA 2.0',
    requirement: 'ML-KEM and ML-DSA required for national security systems',
    deadline: '2035',
  },
  {
    source: 'NIST PQC migration',
    requirement: 'RSA and ECC deprecated across federal systems',
    deadline: '2030',
  },
  {
    source: 'White House OMB M-23-02',
    requirement: 'Agency-wide PQC inventory and transition plan',
    deadline: '2024 filed, ongoing',
  },
] as const

interface Vertical {
  name: string
  icon: typeof Building2
  use: string
}

const VERTICALS: readonly Vertical[] = [
  {
    name: 'Defense and government',
    icon: Landmark,
    use: 'CNSA 2.0 compliance for classified traffic, personnel tracking via Q-Mesh.',
  },
  {
    name: 'Healthcare',
    icon: HeartPulse,
    use: 'HIPAA with PQC envelope on PHI; vital-sign monitoring through WiFi CSI.',
  },
  {
    name: 'Financial services',
    icon: Banknote,
    use: 'DORA Art. 6.4 quantum-readiness, auditable crypto lifecycle.',
  },
  {
    name: 'Legal',
    icon: Scale,
    use: 'Attorney-client privilege preserved under harvest-now-decrypt-later.',
  },
  {
    name: 'Enterprise',
    icon: Building2,
    use: 'One SDK secures messaging, voice, VPN, email, storage, and browsing.',
  },
  {
    name: 'Industrial and IoT',
    icon: Factory,
    use: 'ESP32-S3 mesh with HMAC-SHA256 beacons for unmanned edge deployments.',
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

export const TrustAndUse = () => (
  <section id="compliance" className="section-padding relative">
    <div className="container-custom">
      <div className="max-w-3xl mx-auto text-center mb-14">
        <p className="text-sm font-semibold tracking-widest uppercase text-quantum-400 mb-4">
          Compliance and industries
        </p>
        <h2 className="text-4xl md:text-5xl font-bold mb-6 gradient-text">
          Mandates already in force
        </h2>
        <p className="text-lg text-gray-400 leading-relaxed">
          Quantum-resistant cryptography is no longer optional for regulated industries.
          These are the rules you can cite to procurement today.
        </p>
      </div>

      {/* Mandates band */}
      <div className="grid md:grid-cols-3 gap-4 mb-20">
        {MANDATES.map((m, i) => (
          <motion.div
            key={m.source}
            custom={i}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={cardVariants}
            className="rounded-2xl border border-quantum-500/30 bg-quantum-500/5 p-6"
          >
            <div className="text-xs font-mono uppercase tracking-widest text-quantum-400 mb-2">
              {m.source}
            </div>
            <p className="text-base text-white font-medium leading-snug mb-3">{m.requirement}</p>
            <div className="text-sm text-gray-500">
              <span className="text-gray-400">Deadline:</span> {m.deadline}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Verticals grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {VERTICALS.map((v, i) => {
          const Icon = v.icon
          return (
            <motion.div
              key={v.name}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              variants={cardVariants}
              className="card-quantum"
            >
              <div className="w-11 h-11 rounded-xl bg-quantum-500/10 border border-quantum-500/30 flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-quantum-400" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{v.name}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{v.use}</p>
            </motion.div>
          )
        })}
      </div>
    </div>
  </section>
)
