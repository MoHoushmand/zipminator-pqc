'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import SlideWrapper from '../SlideWrapper'
import { CONTACT_INFO } from '@/lib/pitch-data'
import type { Scenario } from '@/lib/pitch-data'
import {
  Mail,
  Globe,
  Github,
  Linkedin,
  ArrowUpRight,
  Leaf,
  Shield,
  PhoneCall,
  FileText,
  Handshake,
  Landmark,
} from 'lucide-react'

import { fadeUp } from '../slide-utils'

const SOCIAL_LINKS = [
  {
    icon: Mail,
    label: 'Email',
    href: `mailto:${CONTACT_INFO.email}`,
    value: CONTACT_INFO.email,
  },
  {
    icon: Globe,
    label: 'Website',
    href: CONTACT_INFO.website,
    value: 'zipminator.zip',
  },
  {
    icon: Github,
    label: 'GitHub',
    href: CONTACT_INFO.github,
    value: 'github.com/qdaria',
  },
  {
    icon: Linkedin,
    label: 'LinkedIn',
    href: CONTACT_INFO.linkedin,
    value: 'company/qdaria',
  },
]

const NEXT_STEPS = [
  { step: 1, icon: PhoneCall, label: 'Schedule a call', detail: '30-min intro with founding team' },
  { step: 2, icon: FileText, label: 'Technical deep-dive', detail: 'Live demo + architecture review' },
  { step: 3, icon: Handshake, label: 'Term sheet discussion', detail: 'Align on structure and timeline' },
]

export default function ContactSlide({ scenario: _scenario = 'base' }: { scenario?: Scenario }) {
  return (
    <SlideWrapper>
      <div className="flex flex-col items-center justify-center text-center py-8">
        {/* Animated "Z" Logo */}
        <motion.div {...fadeUp()} className="relative mb-10">
          {/* Glow rings */}
          <motion.div
            className="absolute inset-0 rounded-full bg-quantum-500/20 blur-3xl"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute inset-2 rounded-full bg-purple-500/15 blur-2xl"
            animate={{ scale: [1.1, 1, 1.1], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Z Logo */}
          <div className="relative w-40 h-24 rounded-2xl bg-gradient-to-br from-[#FF6600] to-[#CC5200] flex items-center justify-center shadow-2xl shadow-[#FF6600]/30">
            <Image
              src="/logos/Z-contact.svg"
              alt="Z"
              width={200}
              height={120}
              className="w-32 h-auto select-none"
            />
          </div>
        </motion.div>

        {/* Heading */}
        <motion.div {...fadeUp(0.1)}>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-white mb-4">
            Let&apos;s Build the Future
            <br />
            <span className="gradient-text">of Security</span>
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-4">
            Quantum threats are not theoretical. The migration deadline is real.
            We are building the tools the world needs.
          </p>

          {/* Trust line */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <Shield className="w-4 h-4 text-quantum-400" />
            <p className="text-sm text-quantum-400 font-mono">
              Norwegian-built &middot; GDPR-native &middot; Five Eyes-free
            </p>
          </div>
        </motion.div>

        {/* CTA Button */}
        <motion.div {...fadeUp(0.15)} className="mb-10">
          <a
            href={`mailto:${CONTACT_INFO.email}?subject=Zipminator%20Investment%20Inquiry`}
            className="btn-primary text-lg px-10 py-4 gap-2"
          >
            Schedule a Meeting
            <ArrowUpRight className="w-5 h-5" />
          </a>
        </motion.div>

        {/* Next Steps */}
        <motion.div {...fadeUp(0.17)} className="w-full max-w-2xl mb-10">
          <h3 className="text-sm font-semibold text-white mb-4">Next Steps</h3>
          <div className="grid sm:grid-cols-3 gap-4">
            {NEXT_STEPS.map((s) => (
              <div key={s.step} className="card-quantum flex flex-col items-center gap-2 py-4 relative">
                <span className="absolute top-2 left-3 text-[11px] font-mono text-gray-600">
                  {s.step}
                </span>
                <s.icon className="w-6 h-6 text-quantum-400" />
                <p className="text-sm font-semibold text-white">{s.label}</p>
                <p className="text-xs text-gray-500">{s.detail}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Contact Links */}
        <motion.div
          {...fadeUp(0.2)}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-2xl mb-10"
        >
          {SOCIAL_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target={link.label === 'Email' ? undefined : '_blank'}
              rel={link.label === 'Email' ? undefined : 'noopener noreferrer'}
              className="card-quantum flex flex-col items-center gap-2 py-4 group"
            >
              <link.icon className="w-5 h-5 text-quantum-400 group-hover:text-quantum-300 transition-colors" />
              <span className="text-xs text-gray-400 font-mono">{link.label}</span>
              <span className="text-xs text-gray-500 truncate max-w-full px-2">
                {link.value}
              </span>
            </a>
          ))}
        </motion.div>

        {/* ESG & Sustainability Badge */}
        <motion.div {...fadeUp(0.22)} className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-green-500/10 border border-green-500/20 px-4 py-2">
            <Leaf className="w-4 h-4 text-green-400" />
            <span className="text-xs text-green-400 font-mono">
              ESG Committed: 98% Renewable Energy &middot; Carbon-Neutral Data Centers &middot; PQC ~1000x More Efficient
            </span>
          </div>
        </motion.div>

        {/* Next Steps - Gold Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="card-quantum-gold w-full max-w-2xl mb-8"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Handshake className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-semibold gradient-text-gold">Ready to Move Forward?</h3>
          </div>
          <p className="text-sm text-gray-300 mb-4 text-center">
            The quantum migration deadline is 2030. Early movers capture the market.
            Here is how we can start working together today.
          </p>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-amber-500/[0.04] border border-amber-500/15 text-center">
              <span className="text-lg font-bold text-amber-400 font-mono">1</span>
              <p className="text-sm font-semibold text-white mt-1">Schedule Call</p>
              <p className="text-[10px] text-gray-400 mt-1">30-min intro with CEO</p>
            </div>
            <div className="p-3 rounded-lg bg-amber-500/[0.04] border border-amber-500/15 text-center">
              <span className="text-lg font-bold text-amber-400 font-mono">2</span>
              <p className="text-sm font-semibold text-white mt-1">Live Demo</p>
              <p className="text-[10px] text-gray-400 mt-1">Hands-on platform walkthrough</p>
            </div>
            <div className="p-3 rounded-lg bg-amber-500/[0.04] border border-amber-500/15 text-center">
              <span className="text-lg font-bold text-amber-400 font-mono">3</span>
              <p className="text-sm font-semibold text-white mt-1">Term Sheet</p>
              <p className="text-[10px] text-gray-400 mt-1">Align on structure and close</p>
            </div>
          </div>
        </motion.div>

        {/* Resources Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="w-full max-w-2xl mb-8"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <FileText className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold gradient-text-gold">Resources &amp; Materials</h3>
          </div>
          <div className="table-quantum">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left py-2 px-3 text-gray-400 font-mono text-xs">Resource</th>
                  <th className="text-left py-2 px-3 text-gray-400 font-mono text-xs">Description</th>
                  <th className="text-right py-2 px-3 text-gray-400 font-mono text-xs">Access</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { resource: 'GitHub Repository', desc: 'Open-source Kyber768 Rust core + full platform', access: 'github.com/qdaria' },
                  { resource: 'Technical Documentation', desc: 'Architecture guides, API reference, crypto specs', access: 'docs.zipminator.zip' },
                  { resource: 'Live Demo', desc: 'Interactive platform demo with all 8 modules', access: 'demo.zipminator.zip' },
                  { resource: 'Jupyter Book', desc: 'PQC education, benchmarks, NIST KAT verification', access: 'book.zipminator.zip' },
                  { resource: 'Investor Data Room', desc: 'Financials, cap table, grant applications', access: 'Available on request' },
                  { resource: 'Security Audit Reports', desc: 'Third-party pen test results, KAT verification', access: 'Available on NDA' },
                ].map((row, i) => (
                  <tr key={i} className="border-t border-white/5">
                    <td className="py-2 px-3 text-white font-semibold">{row.resource}</td>
                    <td className="py-2 px-3 text-gray-400 text-xs">{row.desc}</td>
                    <td className="py-2 px-3 text-right text-quantum-400 font-mono text-xs">{row.access}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Appendix Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="w-full max-w-2xl mb-8"
        >
          <div className="section-divider-gold mb-4" />
          <div className="card-quantum-gold">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Landmark className="w-5 h-5 text-amber-400" />
              <h3 className="text-lg font-semibold gradient-text-gold">Appendix</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
              {[
                { label: 'NIST FIPS 203', detail: 'ML-KEM specification' },
                { label: 'DORA Regulation', detail: 'EU digital resilience act' },
                { label: 'Rust Crypto Core', detail: '268 tests passing' },
                { label: 'Grant Pipeline', detail: '10 institutions targeted' },
              ].map((item, i) => (
                <div key={i} className="p-3 rounded-lg bg-amber-500/[0.04] border border-amber-500/15">
                  <p className="text-sm font-semibold text-amber-400">{item.label}</p>
                  <p className="text-[10px] text-gray-500 mt-1">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Thank You + Branding */}
        <motion.div {...fadeUp(0.45)} className="space-y-3">
          <p className="text-lg text-gray-300 font-display">Thank you.</p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <span className="w-1.5 h-1.5 rounded-full bg-quantum-500" />
            <span className="inline-flex items-center gap-1.5">
              A <Image src="/logos/QDwordmark2.svg" alt="QDaria" width={160} height={40} className="inline-block align-baseline" /> Company
            </span>
          </div>
        </motion.div>

        {/* Norway Quantum Initiative Footer Badge */}
        <motion.div {...fadeUp(0.48)} className="mt-6">
          <div className="inline-flex items-center gap-2 text-xs text-gray-500 font-mono">
            <Landmark className="w-3.5 h-3.5 text-gray-500" />
            Backed by Norway&apos;s NOK 1.75B Quantum Initiative
          </div>
        </motion.div>

        {/* Subtle animated particles -- quantum blue + sustainability green */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <motion.div
              key={`particle-${i}`}
              className="absolute w-1 h-1 rounded-full bg-quantum-500/30"
              style={{
                left: `${15 + i * 14}%`,
                top: `${20 + (i % 3) * 25}%`,
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0.2, 0.6, 0.2],
              }}
              transition={{
                duration: 3 + i * 0.5,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: i * 0.4,
              }}
            />
          ))}
          {/* Green sustainability particles */}
          {Array.from({ length: 4 }).map((_, i) => (
            <motion.div
              key={`green-${i}`}
              className="absolute w-1.5 h-1.5 rounded-full bg-green-500/25"
              style={{
                left: `${25 + i * 18}%`,
                top: `${35 + (i % 2) * 30}%`,
              }}
              animate={{
                y: [0, -20, 0],
                opacity: [0.15, 0.4, 0.15],
              }}
              transition={{
                duration: 4 + i * 0.7,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 0.5 + i * 0.6,
              }}
            />
          ))}
        </div>
      </div>
    </SlideWrapper>
  )
}
