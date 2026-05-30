-- =============================================================================
-- Migration: 0001_waitlist.sql
-- Description: Creates the waitlist table for the Zipminator Enterprise Beta
--              Programme. Mirrors the WaitlistSubmission interface in
--              web/lib/supabase.ts exactly.
--
-- RLS RATIONALE:
--   INSERT is granted to the `anon` role because the route handler
--   (web/app/api/waitlist/route.ts) uses the Supabase *anon* client to insert
--   records on behalf of visitors who have not authenticated via Supabase Auth.
--   Visitors may be:
--     (a) completely unauthenticated, or
--     (b) authenticated via NextAuth OAuth but not Supabase Auth.
--   In both cases the server-side route runs with the anon key.
--
--   READ and UPDATE are intentionally NOT granted to anon — only service-role
--   (used in admin scripts / dashboards) may read or mutate existing rows.
--   This satisfies the principle of least privilege: a public form can INSERT
--   its own lead without being able to enumerate or overwrite other leads.
--
--   The UNIQUE constraint on `email` enables the route to detect duplicate
--   submissions via Postgres error code 23505 and return HTTP 409 to the
--   client, which the form surfaces as "already on the waitlist".
-- =============================================================================

create table if not exists public.waitlist (
  id              uuid        primary key default gen_random_uuid(),

  -- Personal / company identity
  full_name       text        not null check (char_length(full_name) between 2 and 100),
  company_name    text        not null check (char_length(company_name) between 2 and 100),
  email           text        not null check (char_length(email) <= 255),

  -- Qualification fields
  industry        text        not null,
  expected_volume text        not null,
  use_case        text        check (char_length(use_case) <= 500),

  -- Campaign / referral
  coupon_code     text        check (char_length(coupon_code) <= 50),
  utm_source      text,
  utm_medium      text,
  utm_campaign    text,

  -- Legal / consent
  nda_consent     boolean     not null default false,

  -- Workflow status
  status          text        not null default 'pending',

  -- Request metadata (logged for abuse prevention; nullable for privacy)
  ip_address      text,
  user_agent      text,
  referrer        text,

  -- Optional link to a NextAuth / Supabase Auth user
  user_id         text,

  created_at      timestamptz not null default now()
);

-- Enforce uniqueness at the database level so the route's 23505 duplicate path
-- is always reliable regardless of application-layer de-duplication.
alter table public.waitlist
  add constraint waitlist_email_unique unique (email);

-- Normalise email to lower-case so that Jane@Acme.com and jane@acme.com are
-- treated as the same address. The route already calls .toLowerCase() but this
-- index makes the constraint case-insensitive even for direct inserts.
create unique index if not exists waitlist_email_lower_idx
  on public.waitlist (lower(email));

-- Drop the plain unique constraint in favour of the lower-case index so both
-- constraints are not redundant (Postgres will use the index for enforcement).
alter table public.waitlist
  drop constraint if exists waitlist_email_unique;

-- =============================================================================
-- Row Level Security
-- =============================================================================

alter table public.waitlist enable row level security;

-- Allow the anon role (used by the route handler via the anon key) to INSERT
-- new waitlist entries. No SELECT / UPDATE / DELETE for anon.
create policy "anon can insert waitlist"
  on public.waitlist
  for insert
  to anon
  with check (true);

-- Service-role bypasses RLS by default; no explicit policy needed for admin access.
