'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, Shield, BookOpen } from 'lucide-react'
import Link from 'next/link'
import dynamic from 'next/dynamic'

const QuantumBackground = dynamic(
  () => import('./QuantumBackground'),
  {
    ssr: false,
    loading: () => (
      <div
        aria-hidden="true"
        className="absolute inset-0 quantum-bg opacity-90 pointer-events-none"
      />
    ),
  },
)

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.15 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
  },
}

export const Hero = () => {
  const prefersReducedMotion = useReducedMotion()
  const initial = prefersReducedMotion ? 'visible' : 'hidden'

  return (
    <section className="relative min-h-[88vh] flex items-center justify-center overflow-hidden pt-24 pb-20">
      {!prefersReducedMotion && <QuantumBackground />}
      {prefersReducedMotion && (
        <div aria-hidden="true" className="absolute inset-0 quantum-bg pointer-events-none" />
      )}
      <div className="absolute inset-0 bg-gradient-radial from-quantum-900/20 via-transparent to-transparent pointer-events-none z-[1]" />

      <div className="container-custom relative z-10">
        <motion.div
          variants={containerVariants}
          initial={initial}
          animate="visible"
          className="max-w-4xl mx-auto text-center"
        >
          {/* Eyebrow */}
          <motion.div variants={itemVariants} className="inline-block mb-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-quantum-500/30 bg-quantum-900/40 px-4 py-2 backdrop-blur-sm">
              <Shield className="w-4 h-4 text-quantum-400" aria-hidden="true" />
              <span className="text-xs sm:text-sm font-semibold tracking-wider uppercase text-quantum-400">
                NIST FIPS 203 post-quantum cryptography
              </span>
            </div>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={itemVariants}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold mb-6 leading-[1.05] tracking-tight"
          >
            <span className="block gradient-text drop-shadow-2xl">The quantum-secure</span>
            <span className="block text-white drop-shadow-lg mt-2">encryption platform.</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            variants={itemVariants}
            className="text-base sm:text-lg md:text-xl text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed"
          >
            Real quantum entropy from 156-qubit hardware, sealed with ML-KEM-768. One SDK
            protects messaging, voice, VPN, email, storage, and browsing.
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="#waitlist"
              className="btn-primary group flex items-center gap-2 px-8 py-4 text-base sm:text-lg shadow-xl shadow-quantum-500/30 hover:shadow-quantum-500/50 w-full sm:w-auto justify-center"
            >
              <span>Join the beta</span>
              <ArrowRight
                className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                aria-hidden="true"
              />
            </Link>
            <Link
              href="/docs"
              className="btn-secondary group flex items-center gap-2 px-8 py-4 text-base sm:text-lg w-full sm:w-auto justify-center"
            >
              <BookOpen
                className="w-5 h-5 group-hover:rotate-6 transition-transform"
                aria-hidden="true"
              />
              <span>Read the docs</span>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
