import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const deleteRequestSchema = z.object({
  email: z.string().email().max(255),
  reason: z.string().max(2000).optional(),
})

const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(ip)
  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 })
    return true
  }
  if (record.count >= 3) return false
  record.count++
  return true
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'account-delete-api',
    note: 'Submit POST with {email, reason?} to file a GDPR Article 17 deletion request.',
  })
}

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { status: 'error', error: 'rate_limited' },
      { status: 429 }
    )
  }

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json(
      { status: 'error', error: 'invalid_json' },
      { status: 400 }
    )
  }

  const parsed = deleteRequestSchema.safeParse(payload)
  if (!parsed.success) {
    return NextResponse.json(
      { status: 'error', error: 'validation_failed', issues: parsed.error.issues },
      { status: 400 }
    )
  }

  const timestamp = new Date().toISOString()
  const { email, reason } = parsed.data

  console.log('[account-delete-request]', JSON.stringify({
    timestamp,
    email,
    reason: reason ?? null,
    ip,
  }))

  return NextResponse.json({
    status: 'received',
    timestamp,
    message:
      'Deletion request received. We will process it within 30 days per GDPR Article 17.',
  })
}
