import { createClient } from '@supabase/supabase-js'

// Support both the new Supabase publishable/secret key naming convention and
// the legacy NEXT_PUBLIC_SUPABASE_* names. The new names take precedence when
// both are present so that rotating to the new format is a single env change.
//
// New names (Supabase dashboard ≥ 2025):
//   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY  (replaces ANON key in browser)
//   SUPABASE_SECRET_KEY                   (replaces service_role key in server)
//
// Legacy names (kept for backward-compat):
//   NEXT_PUBLIC_SUPABASE_URL
//   NEXT_PUBLIC_SUPABASE_ANON_KEY
//
// The client exported here is the anon client used by the waitlist route.
// It intentionally does NOT use the secret key — secret-key usage belongs in
// separate admin utilities that never ship to the browser bundle.

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || ''

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  ''

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

export const isSupabaseConfigured = () => supabase !== null

export interface WaitlistSubmission {
  id?: string
  full_name: string
  company_name: string
  email: string
  industry: string
  use_case?: string
  expected_volume: string
  coupon_code?: string
  nda_consent: boolean
  status?: string
  ip_address?: string
  user_agent?: string
  referrer?: string
  user_id?: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
}
