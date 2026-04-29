'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

type FormState = 'idle' | 'submitting' | 'success' | 'error'

export function DeleteAccountForm() {
  const { data: session, status: authStatus } = useSession()
  const [email, setEmail] = useState('')
  const [reason, setReason] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [formState, setFormState] = useState<FormState>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [submittedAt, setSubmittedAt] = useState<string | null>(null)

  useEffect(() => {
    if (session?.user?.email && !email) {
      setEmail(session.user.email)
    }
  }, [session, email])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrorMessage(null)

    if (!confirmed) {
      setErrorMessage('You must confirm that you understand this is permanent.')
      return
    }

    setFormState('submitting')

    try {
      const response = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          reason: reason.trim() ? reason.trim() : undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok || data.status !== 'received') {
        setFormState('error')
        setErrorMessage(
          data?.error === 'rate_limited'
            ? 'Too many requests. Please try again in a minute.'
            : 'Submission failed. Please email privacy@qdaria.com directly.'
        )
        return
      }

      setSubmittedAt(data.timestamp ?? new Date().toISOString())
      setFormState('success')
    } catch {
      setFormState('error')
      setErrorMessage(
        'Network error. Please try again, or email privacy@qdaria.com directly.'
      )
    }
  }

  if (formState === 'success') {
    return (
      <div className="rounded-md border border-emerald-700/40 bg-emerald-900/20 p-6">
        <h2 className="text-lg font-semibold text-white mb-2">
          Request received
        </h2>
        <p className="mb-3">
          We will process your deletion request within 30 days per GDPR Article 17.
        </p>
        <p className="text-sm text-gray-400">
          Reference timestamp:{' '}
          <span className="font-mono text-gray-300">{submittedAt}</span>
        </p>
        <p className="text-sm text-gray-400 mt-2">
          A confirmation will be sent to{' '}
          <span className="font-mono text-gray-300">{email}</span>. If you do not
          receive one within 7 days, contact{' '}
          <a
            href="mailto:privacy@qdaria.com"
            className="text-cyan-400 hover:underline"
          >
            privacy@qdaria.com
          </a>
          .
        </p>
      </div>
    )
  }

  const isAuthLoading = authStatus === 'loading'
  const submitting = formState === 'submitting'

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-white mb-2"
        >
          Email associated with your account
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={submitting || isAuthLoading}
          className="w-full rounded-md border border-gray-800 bg-gray-900 px-3 py-2 text-gray-200 placeholder-gray-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 disabled:opacity-60"
          placeholder="you@example.com"
        />
        {session?.user?.email && (
          <p className="mt-2 text-xs text-gray-500">
            Auto-filled from your signed-in account. You can edit it if needed.
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="reason"
          className="block text-sm font-medium text-white mb-2"
        >
          Reason (optional)
        </label>
        <textarea
          id="reason"
          name="reason"
          rows={4}
          maxLength={2000}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          disabled={submitting}
          className="w-full rounded-md border border-gray-800 bg-gray-900 px-3 py-2 text-gray-200 placeholder-gray-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 disabled:opacity-60"
          placeholder="Optional. Helps us improve the product."
        />
        <p className="mt-1 text-xs text-gray-500">{reason.length}/2000</p>
      </div>

      <div className="flex items-start gap-3">
        <input
          id="confirm"
          name="confirm"
          type="checkbox"
          required
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          disabled={submitting}
          className="mt-1 h-4 w-4 rounded border-gray-700 bg-gray-900 text-cyan-500 focus:ring-cyan-400"
        />
        <label htmlFor="confirm" className="text-sm text-gray-300">
          I understand this is permanent and irreversible. My account, profile
          data, and any cloud-stored metadata will be deleted. Locally encrypted
          content remains on devices I control until I remove it.
        </label>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="rounded-md border border-rose-700/40 bg-rose-900/20 p-3 text-sm text-rose-200"
        >
          {errorMessage}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting || !email || !confirmed}
        className="inline-flex items-center justify-center rounded-md bg-rose-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:ring-offset-2 focus:ring-offset-gray-950 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? 'Submitting...' : 'Submit deletion request'}
      </button>
    </form>
  )
}
