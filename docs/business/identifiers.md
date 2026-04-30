# QDaria AS — Business Identifiers (single source of truth)

> Use these in Apple Developer enrolment, Google Play Console signup, banking, procurement forms, and tax filings.
>
> **Public IDs only.** This file is committed to git. Secrets (`AUTH_*_SECRET`, `RESEND_API_KEY`, `STRIPE_SECRET_KEY`, OAuth client *secrets*, certificate private keys) live in `web/.env.local` (gitignored) and Vercel project environment variables. Never paste a secret here.

## Norwegian registry (verified 2026-04-30 via brreg.no API)

| Identifier | Value | Issuer | Notes |
|---|---|---|---|
| Organisasjonsnummer | **925030244** | Brønnøysund Register Centre | Verified at https://www.brreg.no/enhet/925030244 |
| Selskapsform | Aksjeselskap (AS) | Brønnøysund | Limited liability company |
| Stiftelsesdato | 2020-04-27 | Brønnøysund | Active, not in liquidation, not bankrupt |
| NACE-kode | 72.190 (Forskning og eksperimentell utvikling innenfor naturvitenskap og teknikk) | SSB | R&D in natural sciences and engineering |
| Forretningsadresse | Colletts gate 60F, 0456 Oslo | Brønnøysund | Registered business address |
| MVA / VAT | **925030244MVA** | Skatteetaten | VAT-registered (`registrertIMvaregisteret: true`) |

## International identifiers

| Identifier | Value | Issuer | Notes |
|---|---|---|---|
| **D-U-N-S Number** | **347103005** | Dun & Bradstreet (Bisnode Norway) | Required by Apple Developer Program; used by federal procurement, supplier diversity programs, most Fortune-500 vendor onboarding |
| LEI (Legal Entity Identifier) | _not yet issued_ | GLEIF (https://www.gleif.org) | Only needed if you transact in regulated financial markets (MiFID II, EMIR, SFTR). Skip for now. |
| EORI (EU customs) | _not yet issued_ | Tolletaten (https://www.toll.no) | Only needed if you ship physical goods across EU borders. Skip for SaaS. |

## Apple ecosystem

| Identifier | Value | Source / where to find after enrolment |
|---|---|---|
| Apple ID (Developer account) | _your existing Apple ID, e.g. `mo@qdaria.com`_ | https://appleid.apple.com → confirm which Apple ID you used to enrol; this is the email Apple sends notices to |
| **Team ID** | **5EK49H64WB** | https://developer.apple.com/account → Membership Details → "Team ID" (10-char alphanumeric) |
| App Store Connect Team ID | usually identical to Team ID **5EK49H64WB** | https://appstoreconnect.apple.com → Users and Access → top-right org switcher; will show same string in 99% of single-team setups |
| Bundle ID | `com.qdaria.zipminator` | Reserved in `app/android/app/build.gradle.kts` and `app/pubspec.yaml`; register at https://developer.apple.com/account/resources/identifiers/list |
| App Store Connect API Key ID | _create at enrolment_ | https://appstoreconnect.apple.com → Users and Access → Integrations → App Store Connect API → "+" generates a 10-char Key ID; download the `.p8` ONCE (single-download). Set as GitHub secret `APP_STORE_CONNECT_API_KEY_ID` |
| App Store Connect API Issuer ID | _shown next to Key_ | Same screen as above; UUID format (`abcd1234-...`). Set as `APP_STORE_CONNECT_API_ISSUER_ID` |
| Push Notification cert | _generate at enrolment_ | https://developer.apple.com/account/resources/certificates/list → "+" → Apple Push Notification service SSL |
| App-Specific Password (legacy fastlane) | _generate at appleid.apple.com_ | https://appleid.apple.com → Sign-In and Security → App-Specific Passwords. Only needed if Fastlane uses `FASTLANE_PASSWORD` instead of API key |

## Google ecosystem

| Identifier | Value | Source |
|---|---|---|
| Google account (Play Console) | `mo@qdaria.com` (recommended) | https://play.google.com/console — pick carefully; ownership is non-transferable later |
| Play Console developer account | _to fill at signup ($25)_ | https://play.google.com/console/signup |
| Play Console publisher ID | _to fill at signup_ | Shows on dashboard after signup; numeric (e.g. `8123456789012345678`) |
| Package name | `com.qdaria.zipminator` | Matches Apple bundle ID; immutable once published |
| Google Cloud project number | **893340162657** | Embedded in `AUTH_GOOGLE_ID` (`893340162657-...apps.googleusercontent.com`); see https://console.cloud.google.com/iam-admin/settings |
| Google Cloud project ID (slug) | _check console_ | https://console.cloud.google.com → top-left project picker; the human-readable string (e.g. `qdaria-zipminator-prod`) |
| OAuth consent screen status | _check console_ | https://console.cloud.google.com/apis/credentials/consent → Production vs Testing |

## OAuth client IDs (per environment)

> Client IDs are public. Client SECRETS are gitignored env vars; never paste here.

| Provider | Production client ID | Dev client ID | Source |
|---|---|---|---|
| Google | **893340162657-jltm272ilm6tevkd67cm61rg6q22fa8u.apps.googleusercontent.com** | _create separate dev client_ | https://console.cloud.google.com/apis/credentials. Authorised redirect: `https://zipminator.zip/api/auth/callback/google` (prod), `http://localhost:3099/api/auth/callback/google` (dev) |
| GitHub | **`Ov23liEcq5pE1Yq1ldPJ`** (GitHub App, not OAuth App) | same or separate App | https://github.com/settings/apps. Callback: `https://zipminator.zip/api/auth/callback/github` |
| LinkedIn | **`778vfms8u48jya`** | same or separate app | https://www.linkedin.com/developers/apps. Redirect: `https://zipminator.zip/api/auth/callback/linkedin` |
| Apple Sign-In (Flutter) | _create at enrolment_ | _same_ | https://developer.apple.com/account/resources/identifiers/list/serviceId → "+" → Services IDs |

## Supabase (Auth + DB)

| Identifier | Value | Notes |
|---|---|---|
| Project ref | **uogbylfpxvklfpkkstsf** | URL: https://uogbylfpxvklfpkkstsf.supabase.co |
| Project URL | https://uogbylfpxvklfpkkstsf.supabase.co | Used as `NEXT_PUBLIC_SUPABASE_URL` |
| Anon key | _public, in env_ | `NEXT_PUBLIC_SUPABASE_ANON_KEY` (safe to expose to browser) |
| Service-role key | _secret_ | `SUPABASE_SERVICE_ROLE_KEY`; never expose to browser, never commit |
| Dashboard | https://supabase.com/dashboard/project/uogbylfpxvklfpkkstsf | |

## Resend (transactional email)

| Identifier | Value | Notes |
|---|---|---|
| Resend account | bound to QDaria email | https://resend.com |
| API key | _secret in `RESEND_API_KEY`_ | Generated at https://resend.com/api-keys; rotate via dashboard if leaked |
| Sending domain | `zipminator.zip` | Verify SPF/DKIM/DMARC at https://resend.com/domains |
| Audience ID | _to fill_ | https://resend.com/audiences (for waitlist marketing list) |

## Stripe (when billing ships)

| Identifier | Value | Source / format |
|---|---|---|
| Stripe account ID | _to fill_ | https://dashboard.stripe.com/settings/account → "Account details" → format `acct_1Abc...` |
| Test publishable key | _to fill_ | https://dashboard.stripe.com/test/apikeys → format `pk_test_...` (safe to expose) |
| Live publishable key | _to fill_ | https://dashboard.stripe.com/apikeys → format `pk_live_...` (safe to expose) |
| Test secret key | _gitignored env_ | `sk_test_...` → `STRIPE_SECRET_KEY` in `.env.local` |
| Live secret key | _gitignored env_ | `sk_live_...` → `STRIPE_SECRET_KEY` in Vercel prod env |
| Webhook signing secret | _gitignored env_ | https://dashboard.stripe.com/webhooks → format `whsec_...` → `STRIPE_WEBHOOK_SECRET` |
| Product / Price IDs | _to fill_ | Create at https://dashboard.stripe.com/products for Developer / Pro / Enterprise tiers per FEATURES.md pricing |

## Sentry (error tracking)

| Identifier | Value | Source |
|---|---|---|
| Sentry org slug | _to fill at signup_ | https://sentry.io/signup → org slug like `qdaria` |
| Web project DSN | _to fill_ | https://sentry.io/settings/<org>/projects/<project>/keys/ → "DSN"; safe to expose as `NEXT_PUBLIC_SENTRY_DSN` |
| Flutter project DSN | _to fill_ | Separate project for mobile; same DSN format |
| Auth token (CI source maps) | _gitignored env_ | https://sentry.io/settings/account/api/auth-tokens/ → `SENTRY_AUTH_TOKEN` |

## Microsoft Partner Center (Windows MSIX, when ready)

| Identifier | Value | Source |
|---|---|---|
| Partner Center seller ID | _to fill at signup ($19 individual / $99 company)_ | https://partner.microsoft.com/dashboard → Account settings → Identity |
| Publisher display name | `QDaria AS` | Same form as above; immutable |
| Tenant ID (Azure AD) | _auto-created at signup_ | Azure portal → Tenant overview |
| App ID / Package family name | _to fill at first MSIX submit_ | Format `<RandomString>.QDaria.Zipminator` |

## Snap Store (Linux, when ready)

| Identifier | Value | Source |
|---|---|---|
| Ubuntu One account | bound to QDaria email | https://snapcraft.io |
| Snap name | _to register_ | https://snapcraft.io/register-snap → request `zipminator` (free) |

## Vercel (web hosting)

| Identifier | Value | Source |
|---|---|---|
| Vercel team / scope | _verify in dashboard_ | https://vercel.com/teams |
| Project ID | _to fill_ | https://vercel.com/<team>/<project>/settings → format `prj_...` |
| Production domain | `zipminator.zip` | https://vercel.com/<team>/<project>/settings/domains |
| Production deploy hook | _to fill if used_ | Project settings → Deploy Hooks |

## GitHub (source + CI)

| Identifier | Value | Source |
|---|---|---|
| Source repo | https://github.com/MoHoushmand/zipminator-pqc | Private/public depending on repo settings |
| Repo full name | `MoHoushmand/zipminator-pqc` | |
| Default branch | `main` | |
| Active development branch | `feat/9-pillars-production-2026-04-26` | |
| Latest tag | `v1.0.0-beta.2` | Pushed 2026-04-29 |
| GH Pages URL | https://mohoushmand.github.io/zipminator-pqc/ | Pages config: `build_type=workflow`, source `main` |

---

## What still needs you to register / look up

These rows are blocked on actions outside this codebase. Ranked by leverage:

| Item | Action | Cost | Time |
|---|---|---|---|
| Apple Developer enrolment | Confirm which Apple ID you used; sign in at https://developer.apple.com/account to copy the Team ID confirmation | $99/yr | 24-48h verify |
| Google Play Console signup | https://play.google.com/console/signup | $25 once | 1-7d verify |
| Google Cloud project ID slug | https://console.cloud.google.com → top-left project picker → copy the slug under the human-readable name | free | 30s |
| Stripe account | https://dashboard.stripe.com/register → fill org details using the IDs above | free signup | 30 min |
| Sentry org | https://sentry.io/signup → create QDaria org | free tier | 5 min |
| LEI (skip unless needed) | https://www.gleif.org/en/lei-data/how-to-get-an-lei-find-lei-issuing-organizations | ~€80/yr | 3-5 days |

**Last verified**: 2026-04-30 by Mo Houshmand. Brønnøysund record pulled live from `data.brreg.no/enhetsregisteret/api/enheter/925030244`. OAuth IDs read from `/Users/mom5/dev/qdaria/.env` (monorepo root, gitignored).
