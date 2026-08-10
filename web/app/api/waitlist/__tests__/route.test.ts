import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock supabase before importing the route.
// Each test suite section re-mocks as needed via vi.mock factory scoping.
vi.mock('@/lib/supabase', () => ({
  supabase: null,
}))

// Import after mocking.
const { POST, GET } = await import('../route')

function makeRequest(body: Record<string, unknown>, ip = '127.0.0.1') {
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

// ---------------------------------------------------------------------------
// GET health check
// ---------------------------------------------------------------------------
describe('GET /api/waitlist', () => {
  it('returns status ok', async () => {
    const res = await GET()
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.status).toBe('ok')
    expect(data.service).toBe('waitlist-api')
  })
})

// ---------------------------------------------------------------------------
// POST /api/waitlist — validation
// ---------------------------------------------------------------------------
describe('POST /api/waitlist — validation', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('validates required fields via Zod schema (400)', async () => {
    const res = await POST(makeRequest({}))
    const data = await res.json()
    expect(res.status).toBe(400)
    expect(data.code).toBe('VALIDATION_ERROR')
    expect(data.details).toBeDefined()
  })

  it('rejects invalid email (400)', async () => {
    const res = await POST(makeRequest({ ...validPayload, email: 'not-an-email' }))
    const data = await res.json()
    expect(res.status).toBe(400)
    expect(data.code).toBe('VALIDATION_ERROR')
  })

  it('rejects invalid industry enum value (400)', async () => {
    const res = await POST(makeRequest({ ...validPayload, industry: 'invalid' }))
    const data = await res.json()
    expect(res.status).toBe(400)
    expect(data.code).toBe('VALIDATION_ERROR')
  })

  it('rejects ndaConsent=false (400)', async () => {
    const res = await POST(makeRequest({ ...validPayload, ndaConsent: false }, '10.0.0.3'))
    const data = await res.json()
    expect(res.status).toBe(400)
    expect(data.code).toBe('VALIDATION_ERROR')
  })

  it('rejects malformed JSON (400)', async () => {
    const req = new Request('http://localhost:3099/api/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '10.0.0.9' },
      body: 'not-json',
    }) as any
    const res = await POST(req)
    const data = await res.json()
    expect(res.status).toBe(400)
    expect(data.code).toBe('INVALID_JSON')
  })
})

// ---------------------------------------------------------------------------
// POST /api/waitlist — anonymous submit (supabase null = demo mode)
// ---------------------------------------------------------------------------
describe('POST /api/waitlist — anonymous submit (demo mode)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('succeeds without userId (anonymous visitor)', async () => {
    // No userId field in payload — represents an unauthenticated visitor.
    const anonymousPayload = { ...validPayload }
    const res = await POST(makeRequest(anonymousPayload, '10.2.0.1'))
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.mode).toBe('demo')
    expect(data.submissionId).toBeDefined()
  })

  it('succeeds with optional userId from OAuth session', async () => {
    const res = await POST(makeRequest({ ...validPayload, userId: 'user-123' }, '10.0.0.1'))
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.mode).toBe('demo')
  })

  it('returns success in demo mode when supabase is not configured', async () => {
    const res = await POST(makeRequest(validPayload, '10.0.0.2'))
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.mode).toBe('demo')
    expect(data.submissionId).toBeDefined()
  })

  it('accepts all valid industry enum values', async () => {
    const industries = ['gaming', 'banking', 'defense', 'healthcare', 'infrastructure', 'crypto', 'telecom', 'government', 'other']
    for (const [i, industry] of industries.entries()) {
      const res = await POST(makeRequest({ ...validPayload, industry }, `10.1.0.${i}`))
      const data = await res.json()
      expect(data.success).toBe(true)
    }
  })
})

// ---------------------------------------------------------------------------
// POST /api/waitlist — rate limiting
// ---------------------------------------------------------------------------
describe('POST /api/waitlist — rate limiting', () => {
  it('returns 429 on the 4th request from the same IP within a minute', async () => {
    const ip = '192.168.100.1'
    // First 3 should succeed (demo mode, different IPs needed for prior tests not to bleed)
    await POST(makeRequest(validPayload, ip))
    await POST(makeRequest(validPayload, ip))
    await POST(makeRequest(validPayload, ip))
    // 4th is rate limited
    const res = await POST(makeRequest(validPayload, ip))
    const data = await res.json()
    expect(res.status).toBe(429)
    expect(data.code).toBe('RATE_LIMIT_EXCEEDED')
  })
})

// NOTE: Tests for the Supabase-configured paths (duplicate 409, DB error 500,
// successful insert) live in route-db.test.ts, which sets up a different
// module-level supabase mock independently of this file's null mock.
