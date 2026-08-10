/**
 * route-db.test.ts
 *
 * Tests for the waitlist route when Supabase IS configured.
 * Kept in a separate file from route.test.ts because vitest module mocking
 * is module-level: the top-level vi.mock in route.test.ts pins supabase to
 * null for that entire module, so these tests need their own isolation scope.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// A mutable reference to the Supabase mock so individual tests can control
// what the DB returns without re-importing the route.
const mockSingle = vi.fn()

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({
      insert: () => ({
        select: () => ({
          single: mockSingle,
        }),
      }),
    }),
  },
}))

// Import AFTER the mock is in place.
const { POST } = await import('../route')

function makeRequest(body: Record<string, unknown>, ip = '10.9.0.1') {
  return new Request('http://localhost:3099/api/waitlist', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': ip,
    },
    body: JSON.stringify(body),
  }) as any
}

const validPayload = {
  fullName: 'Jane Smith',
  companyName: 'Acme Corp',
  email: 'jane@acme.com',
  industry: 'banking',
  expectedVolume: '10k-100k',
  ndaConsent: true,
}

describe('POST /api/waitlist — with Supabase configured', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    mockSingle.mockReset()
  })

  it('returns 409 on duplicate email (Postgres error code 23505)', async () => {
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { code: '23505', message: 'duplicate key value violates unique constraint' },
    })

    const res = await POST(makeRequest({ ...validPayload, email: 'dup@acme.com' }, '10.9.1.1'))
    const data = await res.json()
    expect(res.status).toBe(409)
    expect(data.code).toBe('DUPLICATE_EMAIL')
  })

  it('returns 500 on unexpected DB error', async () => {
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { code: '42P01', message: 'relation "waitlist" does not exist' },
    })

    const res = await POST(makeRequest({ ...validPayload, email: 'err@acme.com' }, '10.9.1.2'))
    const data = await res.json()
    expect(res.status).toBe(500)
    expect(data.code).toBe('DATABASE_ERROR')
  })

  it('returns 200 with submission id on successful insert', async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: 'uuid-success', email: 'new@acme.com' },
      error: null,
    })

    const res = await POST(makeRequest({ ...validPayload, email: 'new@acme.com' }, '10.9.1.3'))
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.submissionId).toBe('uuid-success')
  })

  it('succeeds without userId (anonymous visitor path)', async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: 'uuid-anon', email: 'anon@acme.com' },
      error: null,
    })

    // No userId field — anonymous visitor.
    const anonPayload = { ...validPayload, email: 'anon@acme.com' }
    const res = await POST(makeRequest(anonPayload, '10.9.1.4'))
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
  })
})
