import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import ComposePage from '../page'

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('framer-motion', () => {
  const passthroughTag = (Tag: keyof JSX.IntrinsicElements) =>
    ({ children, ...props }: React.HTMLAttributes<HTMLElement>) =>
      React.createElement(Tag, props, children)
  return {
    motion: {
      div: passthroughTag('div'),
      span: passthroughTag('span'),
      button: passthroughTag('button'),
      section: passthroughTag('section'),
      header: passthroughTag('header'),
      p: passthroughTag('p'),
      ul: passthroughTag('ul'),
      li: passthroughTag('li'),
      a: passthroughTag('a'),
      img: passthroughTag('img'),
      form: passthroughTag('form'),
      h1: passthroughTag('h1'),
      h2: passthroughTag('h2'),
      h3: passthroughTag('h3'),
      h4: passthroughTag('h4'),
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  }
})

vi.mock('lucide-react', () => {
  const Icon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} data-testid="lucide-icon" />
  )
  // Vitest module mocks need the exported names enumerated. List every
  // icon ComposePage references plus a few more to be safe.
  const names = [
    'Send', 'Lock', 'Unlock', 'Clock', 'Shield', 'ChevronDown',
    'Eye', 'AlertTriangle', 'Key', 'Paperclip', 'X', 'ShieldAlert',
  ]
  const mod: Record<string, unknown> = { __esModule: true, default: Icon }
  for (const n of names) mod[n] = Icon
  return mod
})

vi.mock('@/components/mail/EncryptionBadge', () => ({
  __esModule: true,
  default: () => <div data-testid="encryption-badge" />,
}))

vi.mock('@/components/mail/AnonymizationPanel', () => ({
  __esModule: true,
  default: () => <div data-testid="anonymization-panel" />,
}))

vi.mock('@/components/mail/PiiOverlay', () => {
  const PATTERNS = [
    {
      patternId: 'us_ssn',
      patternName: 'US SSN',
      severity: 'CRITICAL' as const,
      regex: /\b\d{3}-\d{2}-\d{4}\b/g,
    },
    {
      patternId: 'email',
      patternName: 'Email Address',
      severity: 'MEDIUM' as const,
      regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
    },
  ]
  return {
    scanForPii: (text: string) => {
      const out: Array<{
        patternId: string
        patternName: string
        severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
        text: string
        start: number
        end: number
      }> = []
      for (const p of PATTERNS) {
        const r = new RegExp(p.regex.source, p.regex.flags)
        let m: RegExpExecArray | null
        while ((m = r.exec(text)) !== null) {
          out.push({
            patternId: p.patternId,
            patternName: p.patternName,
            severity: p.severity,
            text: m[0],
            start: m.index,
            end: m.index + m[0].length,
          })
        }
      }
      return out.sort((a, b) => a.start - b.start)
    },
    PiiHighlightedText: ({ text }: { text: string }) => <span>{text}</span>,
    PiiWarningBanner: ({
      onRedact,
      onSendAnyway,
    }: {
      onRedact: () => void
      onSendAnyway: () => void
    }) => (
      <div data-testid="pii-warning-banner">
        <button onClick={onRedact}>Redact &amp; Send</button>
        <button onClick={onSendAnyway}>Send Anyway</button>
      </div>
    ),
  }
})

// ── Helpers ───────────────────────────────────────────────────────────────────

async function fillRequiredFields() {
  const user = userEvent.setup()
  await user.type(
    screen.getByPlaceholderText('recipient@example.com'),
    'bob@qdaria.com',
  )
  await user.type(
    screen.getByPlaceholderText('Message subject'),
    'Quarterly review',
  )
  return user
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Compose pre-send PII gate', () => {
  it('renders the compose form without PII gate by default', () => {
    render(<ComposePage />)
    expect(screen.queryByTestId('pii-gate')).not.toBeInTheDocument()
    expect(screen.getByTestId('compose-send')).toBeInTheDocument()
  })

  it('does not show the gate while the body has no PII', async () => {
    render(<ComposePage />)
    const user = await fillRequiredFields()
    const body = screen.getByPlaceholderText(/Write your message/i)
    await user.type(body, 'Hello team -- routine update.')
    expect(screen.queryByTestId('pii-gate')).not.toBeInTheDocument()
  })

  it('shows the PII gate when the user clicks Send with PII in the body', async () => {
    render(<ComposePage />)
    const user = await fillRequiredFields()

    const body = screen.getByPlaceholderText(/Write your message/i)
    await user.type(body, 'My SSN is 123-45-6789, please process.')

    const send = screen.getByTestId('compose-send')
    await user.click(send)

    const gate = await screen.findByTestId('pii-gate')
    expect(gate).toBeInTheDocument()
    expect(gate).toHaveTextContent(/Pre-send check/i)
    expect(screen.getByTestId('pii-gate-anonymize')).toBeInTheDocument()
    expect(screen.getByTestId('pii-gate-acknowledge')).toBeInTheDocument()
  })

  it('blocks send while gate is active and not acknowledged', async () => {
    render(<ComposePage />)
    const user = await fillRequiredFields()
    const body = screen.getByPlaceholderText(/Write your message/i)
    await user.type(body, 'Email me at alice@example.com today')

    await user.click(screen.getByTestId('compose-send'))
    expect(await screen.findByTestId('pii-gate')).toBeInTheDocument()

    await user.click(screen.getByTestId('compose-send'))
    expect(screen.queryByText(/Message Sent Securely/i)).not.toBeInTheDocument()
    expect(screen.getByTestId('pii-gate')).toBeInTheDocument()
  })

  it('Anonymize replaces PII with [REDACTED] and dismisses the gate', async () => {
    render(<ComposePage />)
    const user = await fillRequiredFields()
    const body = screen.getByPlaceholderText(/Write your message/i) as HTMLTextAreaElement
    await user.type(body, 'My SSN is 123-45-6789!')

    await user.click(screen.getByTestId('compose-send'))
    const anon = await screen.findByTestId('pii-gate-anonymize')
    await user.click(anon)

    expect(body.value).toContain('[REDACTED]')
    expect(body.value).not.toContain('123-45-6789')
    expect(screen.queryByTestId('pii-gate')).not.toBeInTheDocument()
  })

  it('Acknowledge and Send transitions to the sent confirmation surface', async () => {
    render(<ComposePage />)
    const user = await fillRequiredFields()
    const body = screen.getByPlaceholderText(/Write your message/i)
    await user.type(body, 'Send to alice@example.com please')

    await user.click(screen.getByTestId('compose-send'))
    const ack = await screen.findByTestId('pii-gate-acknowledge')
    await user.click(ack)

    expect(await screen.findByText(/Message Sent Securely/i)).toBeInTheDocument()
  })

  it('Cancel keeps the body and dismisses the gate without sending', async () => {
    render(<ComposePage />)
    const user = await fillRequiredFields()
    const body = screen.getByPlaceholderText(/Write your message/i) as HTMLTextAreaElement
    await user.type(body, 'SSN: 123-45-6789')

    await user.click(screen.getByTestId('compose-send'))
    const cancel = await screen.findByTestId('pii-gate-cancel')
    await user.click(cancel)

    expect(screen.queryByTestId('pii-gate')).not.toBeInTheDocument()
    expect(body.value).toContain('123-45-6789')
    expect(screen.queryByText(/Message Sent Securely/i)).not.toBeInTheDocument()
  })
})
