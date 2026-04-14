'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { Shield } from 'lucide-react'

type Feature = {
  wordmark?: string
  wordmarkWidth: number
  wordmarkHeight: number
  title: string
  description: string
  gradient: string
  tag: string
}

const features: Feature[] = [
  {
    wordmark: '/qvault.svg',
    wordmarkWidth: 708,
    wordmarkHeight: 144,
    title: 'Quantum Vault',
    description: 'PQC-encrypted storage with DoD 5220.22-M 3-pass self-destruct',
    gradient: 'from-quantum-500 to-purple-600',
    tag: 'NIST FIPS 203',
  },
  {
    wordmark: '/qmessenger.svg',
    wordmarkWidth: 987,
    wordmarkHeight: 144,
    title: 'PQC Messenger',
    description: 'Post-quantum Double Ratchet for forward-secret, quantum-safe chat',
    gradient: 'from-blue-500 to-cyan-500',
    tag: 'E2E PQC',
  },
  {
    wordmark: '/qvoip.svg',
    wordmarkWidth: 577,
    wordmarkHeight: 144,
    title: 'Quantum VoIP & Video',
    description: 'Crystal-clear calls and video encrypted with post-quantum SRTP',
    gradient: 'from-green-500 to-emerald-500',
    tag: 'Real-time',
  },
  {
    wordmark: '/qvpn.svg',
    wordmarkWidth: 637,
    wordmarkHeight: 148,
    title: 'Q-VPN',
    description: 'PQ-WireGuard tunneling every device packet through quantum-safe channels',
    gradient: 'from-orange-500 to-red-500',
    tag: 'Always-on',
  },
  {
    wordmark: '/qanonymizer.svg',
    wordmarkWidth: 1050,
    wordmarkHeight: 144,
    title: '10-Level Anonymizer',
    description: 'Progressive anonymization from basic masking to NSA-grade stealth',
    gradient: 'from-pink-500 to-rose-500',
    tag: 'Multi-layer',
  },
  {
    wordmark: '/q-ai.svg',
    wordmarkWidth: 471,
    wordmarkHeight: 144,
    title: 'Q-AI PQC Assistant',
    description: 'On-device AI with PQC-sealed context and zero telemetry exfiltration',
    gradient: 'from-fuchsia-500 to-violet-600',
    tag: 'On-device',
  },
  {
    wordmarkWidth: 0,
    wordmarkHeight: 0,
    title: 'Quantum-Secure Email',
    description: 'PQC-encrypted email with key discovery and zero-knowledge headers',
    gradient: 'from-cyan-500 to-blue-500',
    tag: 'WKD + PQC',
  },
  {
    wordmark: '/qbrowser.svg',
    wordmarkWidth: 818,
    wordmarkHeight: 144,
    title: 'ZipBrowser',
    description: 'PQC TLS plus built-in Q-VPN and AI assistant, zero fingerprints',
    gradient: 'from-violet-500 to-purple-500',
    tag: 'AI-powered',
  },
  {
    wordmark: '/qmesh.svg',
    wordmarkWidth: 648,
    wordmarkHeight: 144,
    title: 'Q-Mesh',
    description: 'Quantum-secured WiFi sensing with presence detection and anomaly alerts',
    gradient: 'from-amber-500 to-orange-500',
    tag: 'Sensor fabric',
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
}

const SuperAppShowcase = () => {
  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      <div className="absolute inset-0 quantum-bg opacity-50" />
      <div className="absolute inset-0">
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-quantum-500/8 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] bg-purple-500/8 rounded-full blur-3xl" />
      </div>

      <div className="container-custom relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center space-x-2 bg-quantum-900/30 border border-quantum-500/30 rounded-full px-5 py-2.5 mb-8">
            <Shield className="w-4 h-4 text-quantum-400" />
            <span className="text-sm font-semibold text-quantum-300">
              9 Security Pillars. 1 Super-App.
            </span>
          </div>

          <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            <span className="gradient-text">Everything Quantum-Secure</span>
            <br />
            <span className="text-white">In Your Pocket</span>
          </h2>

          <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto">
            Messaging, calls, browsing, email, VPN, storage, AI, and mesh sensing.
            All wrapped in NIST-approved post-quantum cryptography.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              className="group relative"
            >
              <div className="relative h-full rounded-2xl border border-gray-800 hover:border-transparent transition-all duration-300 overflow-hidden">
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl`}
                />
                <div className="absolute inset-[1px] bg-gray-900 rounded-[15px]" />

                <div className="relative z-10 flex flex-col h-full">
                  <div
                    className={`relative bg-white px-6 py-7 min-h-[120px] flex items-center bg-gradient-to-br from-white to-gray-100 overflow-hidden`}
                  >
                    <div
                      className={`absolute top-4 right-4 inline-block px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full bg-gradient-to-r ${feature.gradient} text-white shadow-md`}
                    >
                      {feature.tag}
                    </div>

                    {feature.wordmark ? (
                      <Image
                        src={feature.wordmark}
                        alt={feature.title}
                        width={feature.wordmarkWidth}
                        height={feature.wordmarkHeight}
                        priority={false}
                        className="h-9 md:h-11 w-auto max-w-[85%] drop-shadow-sm transition-transform duration-300 group-hover:scale-[1.03] origin-left"
                      />
                    ) : (
                      <h3
                        className={`text-2xl md:text-3xl font-bold bg-gradient-to-r ${feature.gradient} bg-clip-text text-transparent`}
                      >
                        {feature.title}
                      </h3>
                    )}
                  </div>

                  <div className="px-6 py-6 bg-gray-900/80 backdrop-blur-sm flex-1">
                    <p className="text-sm text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">
                      {feature.description}
                    </p>
                  </div>
                </div>

                <div
                  className={`absolute -inset-1 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-15 blur-2xl transition-opacity duration-300 -z-10`}
                />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

export default SuperAppShowcase
