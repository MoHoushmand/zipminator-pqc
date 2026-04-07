'use client'

import { motion } from 'framer-motion'
import SlideWrapper from '../SlideWrapper'
import { SUPER_APP_MODULES, ROADMAP_PHASES } from '@/lib/pitch-data'
import { Shield, Layers } from 'lucide-react'
import type { Scenario } from '@/lib/pitch-data'
import { MODULE_ICON_MAP, chartEntrance } from '../slide-utils'
import { TOOLTIP_STYLE, AXIS_STYLE, CHART_ANIMATION_DURATION, PHASE_COLORS } from '../chart-config'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts'

// Style presets for each roadmap status
const STATUS_STYLES: Record<string, { color: string; bgColor: string; borderColor: string }> = {
  done:     { color: 'text-green-400',  bgColor: 'bg-green-500/10',  borderColor: 'border-green-500/20' },
  progress: { color: 'text-yellow-400', bgColor: 'bg-yellow-500/10', borderColor: 'border-yellow-500/20' },
  planned:  { color: 'text-gray-500',   bgColor: 'bg-gray-500/10',   borderColor: 'border-gray-500/20' },
}

function statusLabel(phase: (typeof ROADMAP_PHASES)[number]): string {
  switch (phase.status) {
    case 'done':     return 'Shipped'
    case 'progress': return `${phase.progress ?? 50}% Built`
    default:         return 'Planned'
  }
}

// Map module names to ROADMAP_PHASES for status display
const MODULE_STATUS_MAP: Record<string, { status: string; label: string; color: string; bgColor: string; borderColor: string }> = (() => {
  const map: Record<string, { status: string; label: string; color: string; bgColor: string; borderColor: string }> = {}
  for (const phase of ROADMAP_PHASES) {
    const styles = STATUS_STYLES[phase.status] ?? STATUS_STYLES.planned
    map[phase.name] = { status: phase.status, label: statusLabel(phase), ...styles }
  }
  return map
})()

// Map SUPER_APP_MODULES names to ROADMAP_PHASES names
const MODULE_NAME_TO_ROADMAP: Record<string, string> = {
  'PQC Messenger': 'Secure Messenger',
  'Quantum VoIP': 'Quantum VoIP',
  'Q-VPN': 'Q-VPN',
  'ZipBrowser': 'ZipBrowser',
  'Quantum Mail': 'Quantum Email',
  'QRNG Engine': 'Quantum Vault',
  'PII Anonymizer': 'Anonymizer',
  'AI Assistant': 'AI Assistant',
  'Q-Sense Mesh': 'Q-Sense Mesh',
}

function getModuleStatus(moduleName: string) {
  const roadmapName = MODULE_NAME_TO_ROADMAP[moduleName]
  if (roadmapName && MODULE_STATUS_MAP[roadmapName]) {
    return MODULE_STATUS_MAP[roadmapName]
  }
  // Default to Quantum Vault (done) for unmatched
  return MODULE_STATUS_MAP['Quantum Vault'] || { status: 'done', label: 'Shipped', color: 'text-green-400', bgColor: 'bg-green-500/10', borderColor: 'border-green-500/20' }
}

export default function ProductSlide({ scenario: _scenario }: { scenario?: Scenario }) {
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
          <Layers className="w-5 h-5 text-quantum-400" />
          <span className="text-xs font-mono uppercase tracking-widest text-quantum-400/80">
            Slide 6 / 22
          </span>
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-white mb-3">
          Product{' '}
          <span className="gradient-text">Suite</span>
        </h2>
        <p className="text-lg text-gray-400 max-w-2xl">
          Nine deeply integrated modules, each built on NIST-approved
          post-quantum cryptography from the ground up.
        </p>
      </motion.div>

      {/* Progress Overview Chart */}
      <motion.div {...chartEntrance(0.15)} className="card-quantum chart-glow mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Layers className="w-4 h-4 text-quantum-400" />
          <h3 className="text-sm font-semibold text-white">Development Progress</h3>
        </div>
        <div style={{ height: 280 }} className="w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={ROADMAP_PHASES.map((p) => ({
                name: p.name,
                progress: p.status === 'done' ? 100 : (p.status === 'progress' ? (p.progress ?? 50) : 0),
                status: p.status,
              }))}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
            >
              <defs>
                <linearGradient id="gradDone" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity={0.5} />
                </linearGradient>
                <linearGradient id="gradProgress" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0.5} />
                </linearGradient>
                <linearGradient id="gradPlanned" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#6b7280" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#6b7280" stopOpacity={0.2} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
              <XAxis
                type="number"
                domain={[0, 100]}
                {...AXIS_STYLE}
                tickFormatter={(v: number) => `${v}%`}
              />
              <YAxis
                type="category"
                dataKey="name"
                {...AXIS_STYLE}
                width={110}
                tick={{ fill: '#9ca3af', fontSize: 11, fontFamily: 'monospace' }}
              />
              <Tooltip
                {...TOOLTIP_STYLE}
                formatter={(value: number) => [`${value}%`, 'Progress']}
              />
              <Legend
                wrapperStyle={{ fontSize: 10, fontFamily: 'monospace' }}
                payload={[
                  { value: 'Shipped', type: 'rect', color: PHASE_COLORS.done },
                  { value: 'In Progress', type: 'rect', color: PHASE_COLORS.progress },
                  { value: 'Planned', type: 'rect', color: PHASE_COLORS.planned },
                ]}
              />
              <Bar
                dataKey="progress"
                animationDuration={CHART_ANIMATION_DURATION}
                radius={[0, 4, 4, 0]}
              >
                {ROADMAP_PHASES.map((p) => (
                  <Cell
                    key={p.name}
                    fill={
                      p.status === 'done'
                        ? 'url(#gradDone)'
                        : p.status === 'progress'
                          ? 'url(#gradProgress)'
                          : 'url(#gradPlanned)'
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Product cards: 2 columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-10">
        {SUPER_APP_MODULES.map((mod, index) => {
          const Icon = MODULE_ICON_MAP[mod.icon] || Shield
          return (
            <motion.div
              key={mod.name}
              initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.12 + index * 0.06 }}
              className="card-quantum group flex items-start gap-4 hover:border-quantum-500/40"
            >
              <div className="shrink-0 w-11 h-11 rounded-xl bg-quantum-500/10 border border-quantum-500/20 flex items-center justify-center group-hover:bg-quantum-500/20 transition-colors">
                <Icon className="w-5 h-5 text-quantum-400" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-white text-sm">
                    {mod.name}
                  </h3>
                  {(() => {
                    const st = getModuleStatus(mod.name)
                    return (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${st.color} ${st.bgColor} border ${st.borderColor}`}>
                        {st.status === 'done' ? '\u2713 ' : ''}{st.label}
                      </span>
                    )
                  })()}
                </div>
                <p className="text-gray-400 text-xs leading-relaxed mb-2">
                  {mod.description}
                </p>
                <div className="inline-flex items-center px-2.5 py-1 rounded-md bg-quantum-600/10 border border-quantum-600/15">
                  <code className="text-[10px] text-quantum-300 font-mono">
                    {mod.tech}
                  </code>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* ─── Module Specifications ─── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="mb-8"
      >
        <div className="section-divider-gold mb-6" />
        <h3 className="gradient-text-gold text-lg font-semibold mb-4 flex items-center gap-2">
          <Layers className="w-5 h-5 text-amber-400" />
          Detailed Module Specifications
        </h3>
        <div className="card-quantum-gold p-6">
          <table className="table-quantum w-full text-sm">
            <thead>
              <tr>
                <th className="text-left py-2 px-3 text-amber-400/80 font-mono text-xs uppercase tracking-wider">Module</th>
                <th className="text-left py-2 px-3 text-amber-400/80 font-mono text-xs uppercase tracking-wider">Encryption</th>
                <th className="text-left py-2 px-3 text-amber-400/80 font-mono text-xs uppercase tracking-wider">Protocol</th>
                <th className="text-left py-2 px-3 text-amber-400/80 font-mono text-xs uppercase tracking-wider">Platform</th>
                <th className="text-left py-2 px-3 text-amber-400/80 font-mono text-xs uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['PQC Messenger', 'ML-KEM-768 + AES-256-GCM', 'Double Ratchet (PQC)', 'iOS, Android, Desktop', 'In Progress'],
                ['Quantum VoIP', 'ML-KEM-768 + ChaCha20-Poly1305', 'SRTP with PQC key exchange', 'iOS, Android, Desktop', 'In Progress'],
                ['Q-VPN', 'ML-KEM-768 + WireGuard', 'Modified WireGuard with PQC handshake', 'All platforms', 'In Progress'],
                ['ZipBrowser', 'ML-KEM-768 + TLS 1.3', 'Hybrid PQC/classical TLS', 'macOS (Tauri 2.x)', 'Shipped'],
                ['Quantum Mail', 'ML-KEM-768 + S/MIME', 'PQC-encrypted SMTP/IMAP', 'Web, Desktop', 'Planned'],
                ['QRNG Engine', 'N/A (entropy source)', 'IBM Quantum 156-qubit', 'All platforms', 'Shipped'],
                ['PII Anonymizer', 'ML-KEM-768 (at rest)', 'NLP-based detection + PQC vault', 'All platforms', 'Shipped'],
                ['AI Assistant', 'ML-KEM-768 (context encryption)', 'On-device inference + PQC API', 'All platforms', 'In Progress'],
                ['Q-Sense Mesh', 'ML-KEM-768 + ML-DSA-65', 'Mesh networking with PQC signatures', 'IoT, Mobile', 'Planned'],
              ].map((row, i) => (
                <tr key={i} className="border-t border-white/5">
                  <td className="py-2 px-3 text-white font-medium">{row[0]}</td>
                  <td className="py-2 px-3 text-amber-300 font-mono text-xs">{row[1]}</td>
                  <td className="py-2 px-3 text-gray-400 text-xs">{row[2]}</td>
                  <td className="py-2 px-3 text-gray-500 text-xs">{row[3]}</td>
                  <td className="py-2 px-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      row[4] === 'Shipped' ? 'bg-green-500/15 text-green-400 border border-green-500/25' :
                      row[4] === 'In Progress' ? 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/25' :
                      'bg-gray-500/15 text-gray-400 border border-gray-500/25'
                    }`}>
                      {row[4]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* ─── Integration Architecture ─── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="mb-8"
      >
        <h3 className="gradient-text-gold text-lg font-semibold mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-amber-400" />
          Integration Architecture
        </h3>
        <div className="card-quantum-gold p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Developer Integration</h4>
              <div className="space-y-3">
                {[
                  { label: 'REST API', desc: 'Full PQC encryption, key management, and vault operations via authenticated REST endpoints. OpenAPI 3.1 spec included.' },
                  { label: 'SDK (Python)', desc: 'PyO3 bindings to Rust crypto core. pip install zipminator for direct ML-KEM-768 operations in Python applications.' },
                  { label: 'SDK (TypeScript)', desc: 'WASM-compiled crypto core for browser and Node.js environments. Tree-shakeable, zero native dependencies.' },
                  { label: 'CLI Tool', desc: 'zipminator-cli for CI/CD pipeline integration. Encrypt/decrypt, key rotation, and vault management from terminal.' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5" />
                    <div>
                      <span className="text-xs font-mono text-amber-300">{item.label}</span>
                      <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Enterprise Features</h4>
              <div className="space-y-3">
                {[
                  { label: 'SSO/SAML', desc: 'Enterprise single sign-on with PQC-signed assertion tokens. Okta, Azure AD, and LDAP integration.' },
                  { label: 'Audit Logging', desc: 'Every cryptographic operation logged with tamper-proof PQC signatures. DORA Art. 7 compliant key lifecycle tracking.' },
                  { label: 'Multi-tenant', desc: 'Isolated key namespaces per tenant. Hardware-backed key storage with automatic rotation policies.' },
                  { label: 'On-Premise', desc: 'Air-gapped deployment option for defense and government. Includes local QRNG hardware support.' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5" />
                    <div>
                      <span className="text-xs font-mono text-amber-300">{item.label}</span>
                      <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ─── Comparative Analysis ─── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="mb-4"
      >
        <h3 className="gradient-text-gold text-lg font-semibold mb-4 flex items-center gap-2">
          <Layers className="w-5 h-5 text-amber-400" />
          Competitive Comparison
        </h3>
        <div className="card-quantum-gold p-6">
          <table className="table-quantum w-full text-sm">
            <thead>
              <tr>
                <th className="text-left py-2 px-3 text-amber-400/80 font-mono text-xs uppercase tracking-wider">Feature</th>
                <th className="text-left py-2 px-3 text-amber-400/80 font-mono text-xs uppercase tracking-wider">Zipminator</th>
                <th className="text-left py-2 px-3 text-amber-400/80 font-mono text-xs uppercase tracking-wider">Signal + VPN + PGP</th>
                <th className="text-left py-2 px-3 text-amber-400/80 font-mono text-xs uppercase tracking-wider">Enterprise PQC SDK</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['PQC Messaging', '\u2713 Native ML-KEM', '\u2717 Classical only', '\u2717 No messaging'],
                ['PQC VPN', '\u2713 WireGuard + ML-KEM', '\u2717 Classical WireGuard', '\u2717 SDK only'],
                ['PQC Browser', '\u2713 Tauri 2.x + hybrid TLS', '\u2717 N/A', '\u2717 N/A'],
                ['QRNG Entropy', '\u2713 IBM 156-qubit', '\u2717 OS CSPRNG only', '\u2717 Optional add-on'],
                ['PII Detection', '\u2713 NLP-based auto-scan', '\u2717 N/A', '\u2717 N/A'],
                ['Unified Platform', '\u2713 Single app, 9 modules', '\u2717 3-5 separate tools', '\u2717 Library only'],
                ['European Data Sovereignty', '\u2713 Norwegian jurisdiction', 'Varies', '\u2717 Mostly US-based'],
                ['Price (Pro tier)', '$99/mo', '$200-500/mo combined', '$500-2000/mo'],
              ].map((row, i) => (
                <tr key={i} className="border-t border-white/5">
                  <td className="py-2 px-3 text-white font-medium">{row[0]}</td>
                  <td className="py-2 px-3 text-emerald-400 text-xs">{row[1]}</td>
                  <td className="py-2 px-3 text-gray-500 text-xs">{row[2]}</td>
                  <td className="py-2 px-3 text-gray-500 text-xs">{row[3]}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-[10px] text-gray-600 mt-3 font-mono">
            Comparison based on publicly available feature sets. &quot;Enterprise PQC SDK&quot; represents generic PQC library vendors (e.g., PQShield, SandboxAQ SDK offerings).
          </p>
        </div>
      </motion.div>
    </SlideWrapper>
  )
}
