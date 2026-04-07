'use client'

import { motion } from 'framer-motion'
import SlideWrapper from '../SlideWrapper'
import { PRICING_TIERS } from '@/lib/pitch-data'
import { Check, Star, Sparkles, Shield, Zap, Building2 } from 'lucide-react'

import { fadeUp } from '../slide-utils'

export default function PricingSlide() {
  return (
    <SlideWrapper>
      {/* Header */}
      <motion.div {...fadeUp()} className="text-center mb-6">
        <p className="text-xs font-mono uppercase tracking-widest text-quantum-400/80 mb-3">
          Plans &amp; Pricing
        </p>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-white mb-3">
          <span className="gradient-text">Pricing</span>
        </h2>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto">
          Early-adopter pricing available during beta. All plans include PQC encryption.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 w-full max-w-6xl mx-auto mb-6">
        {PRICING_TIERS.map((tier, i) => (
          <motion.div
            key={tier.name}
            {...fadeUp(0.05 + i * 0.06)}
            className={`relative rounded-xl border p-6 flex flex-col ${
              tier.highlighted
                ? 'border-quantum-500 bg-quantum-500/10 shadow-lg shadow-quantum-500/20'
                : 'border-white/10 bg-white/5'
            }`}
          >
            {/* Badges row at top */}
            {(tier.earlyAdopter || tier.highlighted) && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-2">
                {tier.earlyAdopter && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-medium whitespace-nowrap">
                    <Sparkles className="w-3 h-3" />
                    Early Adopter
                  </span>
                )}
                {tier.highlighted && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-quantum-500/30 border border-quantum-400/50 text-quantum-300 text-xs font-medium whitespace-nowrap">
                    <Star className="w-3 h-3" />
                    Most Popular
                  </span>
                )}
              </div>
            )}

            <div className="mb-4 mt-1">
              <h3 className="text-base font-semibold text-white">{tier.name}</h3>
              <p className="text-xs font-mono text-gray-500 uppercase tracking-widest mt-0.5">
                {tier.characterName} &middot; Levels {tier.levels}
              </p>
            </div>

            <div className="mb-4">
              {tier.earlyAdopter && tier.priceStandard !== tier.price ? (
                <>
                  <span className="text-sm text-gray-500 line-through font-mono mr-2">
                    {tier.priceStandard}
                  </span>
                  <span className="text-3xl font-bold gradient-text font-mono">{tier.price}</span>
                </>
              ) : (
                <span className="text-3xl font-bold gradient-text font-mono">{tier.price}</span>
              )}
            </div>

            <p className="text-sm text-gray-400 leading-relaxed mb-4">{tier.target}</p>

            <ul className="space-y-2 flex-1 mb-6">
              {tier.features.map((feature, j) => (
                <li key={j} className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-400 leading-relaxed">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors ${
                tier.highlighted
                  ? 'bg-quantum-600 hover:bg-quantum-500 text-white'
                  : 'bg-white/10 hover:bg-white/20 text-gray-200'
              }`}
            >
              {tier.cta}
            </button>
          </motion.div>
        ))}
      </div>

      <motion.div
        {...fadeUp(0.35)}
        className="flex items-center gap-3 px-5 py-3 rounded-xl bg-amber-900/20 border border-amber-500/20 mb-6"
      >
        <Star className="w-5 h-5 text-amber-400" />
        <p className="text-sm text-gray-400 leading-relaxed">
          <strong className="text-amber-200">Star us on GitHub</strong> to unlock Developer features (levels 1-5) for free!
        </p>
      </motion.div>

      {/* ── NEW: Tier Comparison Matrix ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="card-quantum-gold mb-6"
      >
        <h3 className="text-base font-semibold gradient-text-gold mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-amber-400" />
          Feature Comparison by Tier
        </h3>
        <div className="overflow-x-auto">
          <table className="table-quantum">
            <thead>
              <tr>
                <th>Feature / Pillar</th>
                <th className="text-center">Free</th>
                <th className="text-center">Pro ($9.99/mo)</th>
                <th className="text-center">Enterprise (Custom)</th>
              </tr>
            </thead>
            <tbody>
              {[
                { feature: 'Pillar 1: PQC Core (ML-KEM-768)', free: true, pro: true, ent: true },
                { feature: 'Pillar 2: Quantum VPN', free: 'Limited', pro: true, ent: true },
                { feature: 'Pillar 3: PQC Browser', free: true, pro: true, ent: true },
                { feature: 'Pillar 4: Secure Messenger', free: 'Basic', pro: true, ent: true },
                { feature: 'Pillar 5: Encrypted Email', free: false, pro: true, ent: true },
                { feature: 'Pillar 6: Credential Vault', free: 'Up to 25', pro: 'Unlimited', ent: 'Unlimited + SSO' },
                { feature: 'Pillar 7: Developer SDK/API', free: '1K calls/mo', pro: '100K calls/mo', ent: 'Unlimited' },
                { feature: 'Pillar 8: Entropy Pool (QRNG)', free: false, pro: true, ent: 'Dedicated' },
                { feature: 'Self-Destruct (DoD 5220.22-M)', free: false, pro: true, ent: true },
                { feature: 'PII Scanner', free: false, pro: true, ent: 'Custom rules' },
                { feature: 'Admin Console / SCIM', free: false, pro: false, ent: true },
                { feature: 'Audit Logs & Compliance', free: false, pro: 'Basic', ent: 'Full DORA' },
                { feature: 'SLA & Priority Support', free: false, pro: 'Email', ent: '24/7 + Dedicated CSM' },
              ].map((row) => (
                <tr key={row.feature}>
                  <td className="font-semibold text-white text-xs">{row.feature}</td>
                  {[row.free, row.pro, row.ent].map((val, idx) => (
                    <td key={idx} className="text-center">
                      {val === true ? (
                        <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                      ) : val === false ? (
                        <span className="text-gray-600 text-xs">-</span>
                      ) : (
                        <span className="text-xs font-mono text-gray-300">{val}</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* ── NEW: Value Proposition Gold Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.5 }}
        className="card-quantum-gold mb-6"
      >
        <h3 className="text-base font-semibold gradient-text-gold mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-400" />
          Value Proposition vs. Incumbents
        </h3>
        <table className="table-quantum">
          <thead>
            <tr>
              <th>Capability</th>
              <th>Incumbent Cost</th>
              <th>Zipminator Pro</th>
              <th>Savings</th>
            </tr>
          </thead>
          <tbody>
            {[
              { cap: 'VPN (NordVPN/Mullvad)', incumbent: '$5-12/mo', zip: 'Included', savings: '100%' },
              { cap: 'Password Manager (1Password)', incumbent: '$3-8/mo', zip: 'Included', savings: '100%' },
              { cap: 'Encrypted Email (ProtonMail)', incumbent: '$4-10/mo', zip: 'Included', savings: '100%' },
              { cap: 'Secure Messenger (Signal Pro)', incumbent: 'Free (no PQC)', zip: 'PQC E2E included', savings: 'PQC upgrade' },
              { cap: 'Privacy Browser (Brave)', incumbent: 'Free (no PQC)', zip: 'PQC proxy included', savings: 'PQC upgrade' },
              { cap: 'Combined stack (separate tools)', incumbent: '$15-40/mo', zip: '$9.99/mo', savings: '60-75%' },
            ].map((row) => (
              <tr key={row.cap}>
                <td className="font-semibold text-white text-xs">{row.cap}</td>
                <td className="font-mono text-xs text-gray-400">{row.incumbent}</td>
                <td className="font-mono text-xs text-emerald-400">{row.zip}</td>
                <td>
                  <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                    {row.savings}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-[10px] font-mono text-gray-500 mt-3 text-center">
          Zipminator replaces 5+ separate subscriptions with one quantum-secure super-app
        </p>
      </motion.div>

      {/* ── NEW: Enterprise Features ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="card-quantum-gold"
      >
        <h3 className="text-base font-semibold gradient-text-gold mb-4 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-amber-400" />
          Enterprise Features
        </h3>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { title: 'SSO & SCIM Provisioning', desc: 'SAML 2.0 / OIDC single sign-on with automated user provisioning and deprovisioning via SCIM.' },
            { title: 'Admin Console', desc: 'Centralized management for teams: user roles, device policies, encryption settings, and usage analytics.' },
            { title: 'DORA Compliance Dashboard', desc: 'Real-time compliance monitoring for DORA Art. 6/7 with exportable audit reports for regulators.' },
            { title: 'Custom Key Management', desc: 'Bring Your Own Key (BYOK), hardware-backed key storage, and configurable key rotation policies.' },
            { title: 'Dedicated Entropy Pool', desc: 'Isolated QRNG entropy source for enterprise customers with guaranteed entropy throughput SLA.' },
            { title: '24/7 Support + CSM', desc: 'Dedicated Customer Success Manager, priority SLA (99.99% uptime target), and incident response team.' },
          ].map((item) => (
            <div key={item.title} className="rounded-lg bg-amber-500/[0.04] border border-amber-500/10 px-4 py-3">
              <h4 className="text-sm font-semibold text-white mb-1">{item.title}</h4>
              <p className="text-xs text-gray-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </SlideWrapper>
  )
}
