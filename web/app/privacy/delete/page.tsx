import type { Metadata } from 'next'
import Link from 'next/link'
import { DeleteAccountForm } from './DeleteAccountForm'

export const metadata: Metadata = {
  title: 'Account Deletion | Zipminator',
  description:
    'Request permanent deletion of your Zipminator account and associated data. We process requests within 30 days per GDPR Article 17.',
}

export default function PrivacyDeletePage() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-300">
      <div className="container mx-auto max-w-3xl px-6 py-20">
        <h1 className="text-4xl font-bold text-white mb-2">
          Account Deletion Request
        </h1>
        <p className="text-sm text-gray-500 mb-12">Last updated: April 29, 2026</p>

        <div className="space-y-10 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              What this form does
            </h2>
            <p className="mb-3">
              Submitting this form files a request to delete your Zipminator
              account and the data we hold about you. We process verified
              requests within 30 days, in line with GDPR Article 17 (Right to
              erasure) and the Norwegian Personal Data Act.
            </p>
            <p>
              For the full policy, see our{' '}
              <Link
                href="/privacy"
                className="text-cyan-400 hover:underline"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              What gets deleted
            </h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Your account record (email, display name, OAuth links)</li>
              <li>Server-side metadata and analytics tied to your account</li>
              <li>OAuth refresh tokens for GitHub, Google, and LinkedIn</li>
              <li>Waitlist entries and support correspondence</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              What we cannot delete
            </h2>
            <p className="mb-3">
              Zipminator encrypts your files and messages with post-quantum
              cryptography (NIST FIPS 203 ML-KEM-768). Encryption keys live on
              your devices; we never see the plaintext. To remove encrypted
              content, uninstall the app on each device or wipe its local
              storage.
            </p>
            <p>
              We retain limited audit logs (DORA Article 7) for the period
              required by Norwegian law, with no personally identifying fields.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Submit a request</h2>
            <DeleteAccountForm />
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              Other ways to reach us
            </h2>
            <p>
              You can also email{' '}
              <a
                href="mailto:privacy@qdaria.com"
                className="text-cyan-400 hover:underline"
              >
                privacy@qdaria.com
              </a>{' '}
              from the address tied to your account. Include the words
              &quot;Account deletion request&quot; in the subject line.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
