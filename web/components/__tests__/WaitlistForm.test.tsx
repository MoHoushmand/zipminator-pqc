import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import WaitlistForm from '../WaitlistForm'

// Mock next-auth/react
const mockUseSession = vi.fn()
const mockSignIn = vi.fn()

vi.mock('next-auth/react', () => ({
  useSession: () => mockUseSession(),
  signIn: (...args: unknown[]) => mockSignIn(...args),
}))

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderAnonymous() {
  mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' })
  return render(<WaitlistForm />)
}

function renderAuthenticated(user = { id: 'user-1', name: 'Jane Smith', email: 'jane@acme.com' }) {
  mockUseSession.mockReturnValue({ data: { user }, status: 'authenticated' })
  return render(<WaitlistForm />)
}

async function fillCommonFields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/Company/i), 'Acme Corp')
  await user.selectOptions(screen.getByLabelText(/Industry/i), 'banking')
  await user.selectOptions(screen.getByLabelText(/Expected Volume/i), '10k-100k')
  await user.click(screen.getByRole('checkbox'))
}

// ---------------------------------------------------------------------------
// Auth state rendering
// ---------------------------------------------------------------------------
describe('WaitlistForm — auth state rendering', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockReset()
  })

  it('shows loading spinner while auth is resolving', () => {
    mockUseSession.mockReturnValue({ data: null, status: 'loading' })
    const { container } = render(<WaitlistForm />)
    expect(container.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('renders the form (not a sign-in-only card) when unauthenticated', () => {
    renderAnonymous()
    // The form itself must be present for anonymous visitors.
    expect(screen.getByRole('button', { name: /Join the Beta Waitlist/i })).toBeInTheDocument()
    // Email and full-name fields must be editable (no readOnly).
    const nameInput = screen.getByLabelText(/Full Name/i) as HTMLInputElement
    expect(nameInput.readOnly).toBe(false)
    const emailInput = screen.getByLabelText(/Work Email/i) as HTMLInputElement
    expect(emailInput.readOnly).toBe(false)
  })

  it('shows OAuth sign-in convenience buttons inline when unauthenticated', () => {
    renderAnonymous()
    // Providers are shown as compact buttons inside the form, not as the only content.
    expect(screen.getByText('Google')).toBeInTheDocument()
    expect(screen.getByText('GitHub')).toBeInTheDocument()
    expect(screen.getByText('LinkedIn')).toBeInTheDocument()
  })

  it('renders form with auto-filled and locked fields when authenticated', () => {
    renderAuthenticated()
    expect(screen.getByText(/Signed in as jane@acme.com/i)).toBeInTheDocument()

    const nameInput = screen.getByLabelText(/Full Name/i) as HTMLInputElement
    expect(nameInput.value).toBe('Jane Smith')
    expect(nameInput.readOnly).toBe(true)

    const emailInput = screen.getByLabelText(/Work Email/i) as HTMLInputElement
    expect(emailInput.value).toBe('jane@acme.com')
    expect(emailInput.readOnly).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Anonymous submit
// ---------------------------------------------------------------------------
describe('WaitlistForm — anonymous submit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockReset()
  })

  it('submits successfully without a session (anonymous visitor)', async () => {
    renderAnonymous()
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, submissionId: 'demo-1', mode: 'demo' }),
    })

    const user = userEvent.setup()
    await user.type(screen.getByLabelText(/Full Name/i), 'Bob Builder')
    await user.type(screen.getByLabelText(/Work Email/i), 'bob@build.com')
    await fillCommonFields(user)
    await user.click(screen.getByRole('button', { name: /Join the Beta Waitlist/i }))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/waitlist', expect.objectContaining({ method: 'POST' }))
    })

    const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(callBody.fullName).toBe('Bob Builder')
    expect(callBody.email).toBe('bob@build.com')
    // userId must be absent / undefined for anonymous submissions.
    expect(callBody.userId).toBeUndefined()
  })

  it('shows success state after anonymous submission', async () => {
    renderAnonymous()
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    })

    const user = userEvent.setup()
    await user.type(screen.getByLabelText(/Full Name/i), 'Alice Anon')
    await user.type(screen.getByLabelText(/Work Email/i), 'alice@anon.com')
    await fillCommonFields(user)
    await user.click(screen.getByRole('button', { name: /Join the Beta Waitlist/i }))

    await waitFor(() => {
      expect(screen.getByText(/You're on the list!/i)).toBeInTheDocument()
    })
  })

  it('calls signIn with provider and callbackUrl when OAuth button clicked', async () => {
    renderAnonymous()
    const user = userEvent.setup()
    await user.click(screen.getByText('Google'))
    expect(mockSignIn).toHaveBeenCalledWith('google', { callbackUrl: '/#waitlist' })
  })
})

// ---------------------------------------------------------------------------
// Authenticated submit
// ---------------------------------------------------------------------------
describe('WaitlistForm — authenticated submit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockReset()
  })

  it('submits form with userId from OAuth session', async () => {
    renderAuthenticated({ id: 'user-42', name: 'Jane Smith', email: 'jane@acme.com' })
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, submissionId: 'sub-1' }),
    })

    const user = userEvent.setup()
    await fillCommonFields(user)
    await user.click(screen.getByRole('button', { name: /Join the Beta Waitlist/i }))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/waitlist', expect.objectContaining({ method: 'POST' }))
    })

    const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(callBody.userId).toBe('user-42')
    expect(callBody.email).toBe('jane@acme.com')
    expect(callBody.fullName).toBe('Jane Smith')
  })

  it('shows success state after authenticated submission', async () => {
    renderAuthenticated()
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    })

    const user = userEvent.setup()
    await fillCommonFields(user)
    await user.click(screen.getByRole('button', { name: /Join the Beta Waitlist/i }))

    await waitFor(() => {
      expect(screen.getByText(/You're on the list!/i)).toBeInTheDocument()
    })
  })
})

// ---------------------------------------------------------------------------
// Error states (409 duplicate, validation, network)
// ---------------------------------------------------------------------------
describe('WaitlistForm — error states', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockReset()
  })

  it('shows duplicate message on 409 response', async () => {
    renderAuthenticated({ id: 'user-1', name: 'Jane', email: 'jane@acme.com' })
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Duplicate', code: 'DUPLICATE_EMAIL' }),
    })

    const user = userEvent.setup()
    await fillCommonFields(user)
    await user.click(screen.getByRole('button', { name: /Join the Beta Waitlist/i }))

    await waitFor(() => {
      expect(screen.getByText(/already on the waitlist/i)).toBeInTheDocument()
    })
  })

  it('shows error message on generic server error', async () => {
    renderAuthenticated()
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Server is on fire', code: 'DATABASE_ERROR' }),
    })

    const user = userEvent.setup()
    await fillCommonFields(user)
    await user.click(screen.getByRole('button', { name: /Join the Beta Waitlist/i }))

    await waitFor(() => {
      expect(screen.getByText(/Server is on fire/i)).toBeInTheDocument()
    })
  })

  it('shows connection error when fetch throws (network failure)', async () => {
    renderAuthenticated()
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    const user = userEvent.setup()
    await fillCommonFields(user)
    await user.click(screen.getByRole('button', { name: /Join the Beta Waitlist/i }))

    await waitFor(() => {
      expect(screen.getByText(/Unable to connect/i)).toBeInTheDocument()
    })
  })

  it('duplicate message is shown also for anonymous visitor', async () => {
    renderAnonymous()
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Duplicate', code: 'DUPLICATE_EMAIL' }),
    })

    const user = userEvent.setup()
    await user.type(screen.getByLabelText(/Full Name/i), 'Bob')
    await user.type(screen.getByLabelText(/Work Email/i), 'bob@dup.com')
    await fillCommonFields(user)
    await user.click(screen.getByRole('button', { name: /Join the Beta Waitlist/i }))

    await waitFor(() => {
      expect(screen.getByText(/already on the waitlist/i)).toBeInTheDocument()
    })
  })
})
