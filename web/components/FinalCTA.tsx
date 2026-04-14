'use client'

import { useState, useEffect, type FormEvent } from 'react'
import { useSession, signIn } from 'next-auth/react'
import { motion } from 'framer-motion'
import {
  Send,
  CheckCircle,
  AlertCircle,
  Loader2,
  Shield,
  Zap,
  Lock,
  Github,
  BookOpen,
  Star,
} from 'lucide-react'
import Link from 'next/link'

const INDUSTRIES = [
  { value: 'banking', label: 'Banking and Finance' },
  { value: 'defense', label: 'Defense and Government' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'telecom', label: 'Telecommunications' },
  { value: 'infrastructure', label: 'Critical Infrastructure' },
  { value: 'crypto', label: 'Crypto and Blockchain' },
  { value: 'gaming', label: 'Gaming' },
  { value: 'government', label: 'Government' },
  { value: 'other', label: 'Other' },
] as const

const VOLUMES = [
  { value: '<10k', label: 'Under 10K ops/month' },
  { value: '10k-100k', label: '10K to 100K ops/month' },
  { value: '100k-1m', label: '100K to 1M ops/month' },
  { value: '1m+', label: '1M+ ops/month' },
] as const

type Status = 'idle' | 'loading' | 'success' | 'error' | 'duplicate'

const OAUTH_PROVIDERS = [
  {
    id: 'google',
    name: 'Google',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11.96 11.96 0 0 0 0 12c0 1.94.46 3.77 1.28 5.4l3.56-2.77.01-.54z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
    ),
  },
  {
    id: 'github',
    name: 'GitHub',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
      </svg>
    ),
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
] as const

const TRUST_CHIPS = [
  { icon: Star, label: 'Open source', detail: 'MIT licensed core' },
  { icon: Shield, label: 'NIST FIPS 203', detail: 'Verified against KAT vectors' },
  { icon: Zap, label: '513 tests passing', detail: 'cargo test --workspace' },
] as const

export const FinalCTA = () => {
  const { data: session, status: authStatus } = useSession()
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')

  useEffect(() => {
    if (authStatus === 'authenticated' && session?.user) {
      if (session.user.name) setFullName(session.user.name)
      if (session.user.email) setEmail(session.user.email)
    }
  }, [authStatus, session])

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    const form = e.currentTarget
    const fd = new FormData(form)

    const payload = {
      fullName: fullName || (fd.get('fullName') as string),
      companyName: fd.get('companyName') as string,
      email: email || (fd.get('email') as string),
      industry: fd.get('industry') as string,
      expectedVolume: fd.get('expectedVolume') as string,
      useCase: (fd.get('useCase') as string) || undefined,
      couponCode: (fd.get('couponCode') as string) || undefined,
      ndaConsent: fd.get('ndaConsent') === 'on',
      userId: session?.user?.id || undefined,
    }

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()

      if (res.ok && data.success) {
        setStatus('success')
        form.reset()
      } else if (data.code === 'DUPLICATE_EMAIL') {
        setStatus('duplicate')
      } else {
        setErrorMsg(data.error || 'Something went wrong. Please try again.')
        setStatus('error')
      }
    } catch {
      setErrorMsg('Unable to connect. Email mo@qdaria.com if this persists.')
      setStatus('error')
    }
  }

  return (
    <section id="waitlist" className="section-padding relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-quantum-900/20 via-transparent to-transparent pointer-events-none" />
      <div className="container-custom relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-3xl mx-auto text-center mb-10"
        >
          <p className="text-sm font-semibold tracking-widest uppercase text-quantum-400 mb-4">
            Beta access, Q2 2026
          </p>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            Ship <span className="gradient-text">quantum-safe</span> today.
          </h2>
          <p className="text-lg text-gray-300 leading-relaxed">
            Priority onboarding, pricing locked for 12 months, direct engineering support.
            No credit card. Free for early adopters.
          </p>
        </motion.div>

        {/* Trust chips */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-wrap justify-center gap-3 mb-12"
        >
          {TRUST_CHIPS.map(({ icon: Icon, label, detail }) => (
            <div
              key={label}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 text-sm text-gray-300"
            >
              <Icon className="w-4 h-4 text-quantum-400" aria-hidden="true" />
              <span className="font-semibold text-white">{label}</span>
              <span className="text-gray-500">·</span>
              <span>{detail}</span>
            </div>
          ))}
        </motion.div>

        {/* Form card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="max-w-2xl mx-auto"
        >
          {status === 'success' ? (
            <div className="card-quantum p-12 text-center">
              <CheckCircle className="w-14 h-14 text-emerald-400 mx-auto mb-6" aria-hidden="true" />
              <h3 className="text-2xl font-bold text-white mb-3">You&apos;re on the list.</h3>
              <p className="text-gray-300">
                Confirmation sent. We&apos;ll follow up within 48 hours with onboarding steps.
              </p>
            </div>
          ) : authStatus === 'loading' ? (
            <div className="card-quantum p-12 text-center">
              <Loader2 className="w-8 h-8 text-quantum-400 mx-auto animate-spin" aria-hidden="true" />
            </div>
          ) : authStatus !== 'authenticated' ? (
            <div className="card-quantum p-8 text-center">
              <Shield className="w-10 h-10 text-quantum-400 mx-auto mb-4" aria-hidden="true" />
              <h3 className="text-xl font-bold text-white mb-2">Sign in to join</h3>
              <p className="text-gray-400 mb-6 text-sm">
                Your name and email are filled automatically.
              </p>
              <div className="space-y-3">
                {OAUTH_PROVIDERS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => signIn(p.id, { callbackUrl: '/#waitlist' })}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-white/10 rounded-lg text-gray-300 hover:bg-white/5 hover:text-white transition-all duration-200 font-medium"
                  >
                    {p.icon}
                    Continue with {p.name}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="card-quantum p-8 space-y-6">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-quantum-500/10 border border-quantum-500/30 text-quantum-300 text-sm">
                <CheckCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                Signed in as {session.user?.email}
              </div>

              {status === 'error' && (
                <div className="flex items-start gap-3 p-4 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
                  <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" aria-hidden="true" />
                  {errorMsg}
                </div>
              )}
              {status === 'duplicate' && (
                <div className="flex items-start gap-3 p-4 rounded-lg bg-quantum-500/10 border border-quantum-500/30 text-quantum-300 text-sm">
                  <CheckCircle className="w-5 h-5 mt-0.5 shrink-0" aria-hidden="true" />
                  You&apos;re already on the waitlist. We&apos;ll be in touch soon.
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-200 mb-2">
                    Full name <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      required
                      minLength={2}
                      maxLength={100}
                      placeholder="Jane Smith"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      readOnly={!!session?.user?.name}
                      className={`w-full px-4 py-3 bg-gray-900/50 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-quantum-500 focus:ring-2 focus:ring-quantum-500/20 transition ${session?.user?.name ? 'bg-gray-800/60 text-gray-300' : ''}`}
                    />
                    {session?.user?.name && (
                      <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" aria-hidden="true" />
                    )}
                  </div>
                </div>
                <div>
                  <label htmlFor="companyName" className="block text-sm font-medium text-gray-200 mb-2">
                    Company <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    id="companyName"
                    name="companyName"
                    required
                    minLength={2}
                    maxLength={100}
                    placeholder="Acme Corp"
                    className="w-full px-4 py-3 bg-gray-900/50 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-quantum-500 focus:ring-2 focus:ring-quantum-500/20 transition"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-200 mb-2">
                  Work email <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    maxLength={255}
                    placeholder="jane@acme.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    readOnly={!!session?.user?.email}
                    className={`w-full px-4 py-3 bg-gray-900/50 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-quantum-500 focus:ring-2 focus:ring-quantum-500/20 transition ${session?.user?.email ? 'bg-gray-800/60 text-gray-300' : ''}`}
                  />
                  {session?.user?.email && (
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" aria-hidden="true" />
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="industry" className="block text-sm font-medium text-gray-200 mb-2">
                    Industry <span className="text-rose-400">*</span>
                  </label>
                  <select
                    id="industry"
                    name="industry"
                    required
                    className="w-full px-4 py-3 bg-gray-900/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-quantum-500 focus:ring-2 focus:ring-quantum-500/20 transition"
                  >
                    <option value="">Select industry</option>
                    {INDUSTRIES.map((i) => (
                      <option key={i.value} value={i.value}>
                        {i.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="expectedVolume" className="block text-sm font-medium text-gray-200 mb-2">
                    Expected volume <span className="text-rose-400">*</span>
                  </label>
                  <select
                    id="expectedVolume"
                    name="expectedVolume"
                    required
                    className="w-full px-4 py-3 bg-gray-900/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-quantum-500 focus:ring-2 focus:ring-quantum-500/20 transition"
                  >
                    <option value="">Select volume</option>
                    {VOLUMES.map((v) => (
                      <option key={v.value} value={v.value}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="useCase" className="block text-sm font-medium text-gray-200 mb-2">
                  Use case <span className="text-gray-500">(optional)</span>
                </label>
                <textarea
                  id="useCase"
                  name="useCase"
                  rows={3}
                  maxLength={500}
                  placeholder="How do you plan to deploy quantum-safe encryption?"
                  className="w-full px-4 py-3 bg-gray-900/50 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-quantum-500 focus:ring-2 focus:ring-quantum-500/20 transition resize-none"
                />
              </div>

              <div>
                <label htmlFor="couponCode" className="block text-sm font-medium text-gray-200 mb-2">
                  Coupon code <span className="text-gray-500">(optional)</span>
                </label>
                <input
                  type="text"
                  id="couponCode"
                  name="couponCode"
                  maxLength={50}
                  placeholder="BETA2026"
                  className="w-full px-4 py-3 bg-gray-900/50 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-quantum-500 focus:ring-2 focus:ring-quantum-500/20 transition font-mono uppercase"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Follow QDaria on LinkedIn for early-access codes.
                </p>
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="ndaConsent"
                  required
                  className="mt-1 h-4 w-4 rounded border-white/20 bg-gray-900/50 text-quantum-500 focus:ring-quantum-500/20"
                />
                <span className="text-sm text-gray-300">
                  I agree to sign an NDA for beta testing and understand that early access is
                  subject to availability.
                  <span className="text-rose-400 ml-1">*</span>
                </span>
              </label>

              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full btn-primary py-4 text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {status === 'loading' ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                    Submitting
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" aria-hidden="true" />
                    Join the beta waitlist
                  </>
                )}
              </button>
            </form>
          )}
        </motion.div>

        {/* Footer links */}
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm">
          <Link
            href="https://github.com/qdaria/zipminator-pqc"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-gray-400 hover:text-quantum-400 transition-colors"
          >
            <Github className="w-4 h-4" aria-hidden="true" />
            <span>View on GitHub</span>
          </Link>
          <span className="hidden sm:block w-px h-5 bg-gray-700" aria-hidden="true" />
          <Link
            href="/docs"
            className="flex items-center gap-2 text-gray-400 hover:text-quantum-400 transition-colors"
          >
            <BookOpen className="w-4 h-4" aria-hidden="true" />
            <span>Read the documentation</span>
          </Link>
        </div>
      </div>
    </section>
  )
}
