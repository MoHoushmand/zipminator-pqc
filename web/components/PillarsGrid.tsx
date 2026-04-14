'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { Mail, type LucideIcon } from 'lucide-react'

interface Pillar {
  id: string
  name: string
  tagline: string
  status: number
  wordmark?: string
  fallbackIcon?: LucideIcon
  gradient: string
}

const PILLARS: readonly Pillar[] = [
  {
    id: 'vault',
    name: 'Quantum Vault',
    tagline: 'AES-256-GCM from ML-KEM-768 keys, DoD 5220.22-M self-destruct',
    status: 100,
    wordmark: '/qvault.svg',
    gradient: 'from-quantum-500/20 to-quantum-emerald-500/20',
  },
  {
    id: 'messenger',
    name: 'PQC Messenger',
    tagline: 'Post-Quantum Double Ratchet over WebRTC, forward secrecy',
    status: 85,
    wordmark: '/qmessenger.svg',
    gradient: 'from-quantum-violet-500/20 to-quantum-rose-500/20',
  },
  {
    id: 'voip',
    name: 'Quantum VoIP and Video',
    tagline: 'PQ-SRTP frames, encrypted voicemail, AES-256-GCM per session',
    status: 90,
    wordmark: '/qvoip.svg',
    gradient: 'from-quantum-emerald-500/20 to-quantum-500/20',
  },
  {
    id: 'vpn',
    name: 'Q-VPN (PQ-WireGuard)',
    tagline: 'WireGuard wrapped in ML-KEM-768, kill switch, state machine',
    status: 90,
    wordmark: '/qvpn.svg',
    gradient: 'from-quantum-500/20 to-quantum-violet-500/20',
  },
  {
    id: 'anon',
    name: '10-Level Anonymization',
    tagline: 'L1 regex to L10 quantum OTP, patent pending (Patentstyret)',
    status: 95,
    wordmark: '/qanonymizer.svg',
    gradient: 'from-quantum-amber-500/20 to-quantum-rose-500/20',
  },
  {
    id: 'qai',
    name: 'Q-AI Assistant',
    tagline: 'Ollama local-first, PII guard, PQC tunnel (18 tunnel tests)',
    status: 85,
    wordmark: '/q-ai.svg',
    gradient: 'from-quantum-rose-500/20 to-quantum-violet-500/20',
  },
  {
    id: 'mail',
    name: 'Quantum-Secure Email',
    tagline: 'ML-KEM-768 envelope on @zipminator.zip, server-side TTL',
    status: 75,
    fallbackIcon: Mail,
    gradient: 'from-quantum-violet-500/20 to-quantum-500/20',
  },
  {
    id: 'browser',
    name: 'ZipBrowser',
    tagline: 'Tauri 2.x, PQC proxy, fingerprint spoofing, AI sidebar',
    status: 85,
    wordmark: '/qbrowser.svg',
    gradient: 'from-quantum-500/20 to-quantum-violet-500/20',
  },
  {
    id: 'mesh',
    name: 'Q-Mesh (RuView)',
    tagline: 'ESP32-S3 WiFi CSI sensing, HMAC-SHA256 TDM, QRNG mesh keys',
    status: 90,
    wordmark: '/qmesh.svg',
    gradient: 'from-quantum-emerald-500/20 to-quantum-500/20',
  },
] as const

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] as const },
  }),
}

export const PillarsGrid = () => (
  <section id="pillars" className="section-padding relative">
    <div className="container-custom">
      <div className="max-w-3xl mx-auto text-center mb-16">
        <p className="text-sm font-semibold tracking-widest uppercase text-quantum-400 mb-4">
          The Super-App
        </p>
        <h2 className="text-4xl md:text-5xl font-bold mb-6 gradient-text">
          Nine pillars, one quantum-secure platform
        </h2>
        <p className="text-lg text-gray-400 leading-relaxed">
          Every pillar runs on the same ML-KEM-768 core and shares a 156-qubit quantum entropy pool.
          Status percentages are code-verified against the FEATURES matrix.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {PILLARS.map((p, i) => {
          const FallbackIcon = p.fallbackIcon
          return (
            <motion.article
              key={p.id}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              variants={cardVariants}
              className="card-quantum group relative overflow-hidden"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${p.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                aria-hidden="true"
              />
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-5">
                  <div className="h-10 flex items-center">
                    {p.wordmark ? (
                      <Image
                        src={p.wordmark}
                        alt={`${p.name} wordmark`}
                        width={140}
                        height={40}
                        className="h-8 w-auto opacity-90 group-hover:opacity-100 transition-opacity"
                      />
                    ) : FallbackIcon ? (
                      <FallbackIcon
                        className="w-8 h-8 text-quantum-400"
                        aria-label={`${p.name} icon`}
                      />
                    ) : null}
                  </div>
                  <span
                    className="text-xs font-semibold rounded-full border border-quantum-500/30 bg-quantum-500/10 px-2.5 py-1 text-quantum-300"
                    aria-label={`${p.status}% complete`}
                  >
                    {p.status}%
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{p.name}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{p.tagline}</p>
              </div>
            </motion.article>
          )
        })}
      </div>
    </div>
  </section>
)
