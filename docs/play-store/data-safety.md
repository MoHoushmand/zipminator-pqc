# Google Play Store — Data Safety form (paste-ready)

Source of truth: `docs/guides/FEATURES.md`. Last refresh: 2026-04-29.

Paste these into Play Console → **App content** → **Data safety**. The form has 4 sections; answers below match the screen flow.

> Do NOT lie on this form. Google cross-checks against your Manifest permissions and detected SDKs. False answers are a hard policy violation that get apps removed.

---

## Section 1: Data collection and security

| Question | Answer |
|---|---|
| Does your app collect or share any of the required user data types? | **Yes** |
| Is all of the user data collected by your app encrypted in transit? | **Yes** (TLS 1.3 + ML-KEM-768 hybrid for application data; standard HTTPS for OAuth flows) |
| Do you provide a way for users to request that their data be deleted? | **Yes** — URL: `https://zipminator.zip/privacy/delete` (action item: ensure this page exists; current `web/app/privacy/page.tsx` does not have a `/delete` sub-page) |

---

## Section 2: Data types collected

For each row: tick **Collected** if the app stores it, **Shared** if you send it to a third party, **Required** if collection blocks app function, **Optional** if user can opt out, **Ephemeral** if data is processed but never stored.

| Data type | Collected? | Shared? | Required? | Purpose |
|---|---|---|---|---|
| **Personal info — Name** | Yes | No | Optional | Account display name |
| **Personal info — Email address** | Yes | No (kept in your Supabase) | Required | Account creation, transactional email via Resend |
| **Personal info — User IDs** | Yes | No | Required | OAuth provider identifiers |
| Personal info — Address | No | — | — | — |
| Personal info — Phone number | No | — | — | — |
| Personal info — Race/ethnicity | No | — | — | — |
| Personal info — Political/religious beliefs | No | — | — | — |
| Personal info — Sexual orientation | No | — | — | — |
| Personal info — Other | No | — | — | — |
| **Financial — Payment info** | No (Stripe handles directly) | — | — | — |
| Financial — Purchase history | No (Stripe handles directly) | — | — | — |
| Financial — Other | No | — | — | — |
| **Health and fitness** | No | — | — | — |
| **Messages — Emails** | Yes (encrypted at rest) | No | Optional | Quantum Mail pillar; envelope encrypted client-side, server cannot read content |
| **Messages — SMS or MMS** | No | — | — | — |
| **Messages — Other** | Yes (encrypted at rest) | No | Optional | PQC Messenger pillar; Double Ratchet encrypted, server cannot read content |
| **Photos and videos — Photos** | No | — | — | — |
| **Photos and videos — Videos** | No | — | — | — |
| **Audio files — Voice or sound recordings** | Yes (encrypted in transit, ephemeral) | No | Optional | Quantum VoIP pillar; PQ-SRTP encrypted at the wire, no server-side storage |
| Audio files — Music files | No | — | — | — |
| Audio files — Other | No | — | — | — |
| **Files and docs** | Yes (encrypted at rest) | No | Optional | Quantum Vault pillar; user-uploaded files are encrypted client-side before storage |
| **Calendar — Events** | No | — | — | — |
| **Contacts — Contacts** | No | — | — | — |
| **App activity — App interactions** | Yes | Yes (Sentry) | Optional | Crash reports for stability; users can disable in Settings |
| **App activity — In-app search history** | No | — | — | — |
| App activity — Installed apps | No | — | — | — |
| **App activity — Other user-generated content** | No | — | — | — |
| **App activity — Other actions** | No | — | — | — |
| **Web browsing — Web browsing history** | No (ZipBrowser stores locally only, never sent to server) | — | — | — |
| **App info and performance — Crash logs** | Yes | Yes (Sentry) | Optional | Same as App interactions |
| **App info and performance — Diagnostics** | Yes | Yes (Sentry) | Optional | Performance profiling |
| **App info and performance — Other** | No | — | — | — |
| **Device or other IDs — Device or other IDs** | Yes | No | Required | OAuth session continuity |

---

## Section 3: Data security practices

| Question | Answer |
|---|---|
| Is all of the user data collected by your app encrypted in transit? | **Yes** |
| Do you provide a way for users to request that their data be deleted? | **Yes** — URL `https://zipminator.zip/privacy/delete` |
| Have you committed to follow Google Play's Families Policy? | **Not applicable** (target audience is 18+) |
| Is your app independently validated against a global security standard? | **No** (FIPS 140-3 CMVP and SOC 2 Type II are on the roadmap; do not check this box until those certificates are issued) |

---

## Section 4: Third-party SDK disclosure

Disclose every SDK that handles user data:

| SDK | Purpose | Data shared with |
|---|---|---|
| Sentry | Crash reporting and diagnostics | Sentry, Inc. (San Francisco, CA, USA) |
| Resend | Transactional email delivery | Resend, Inc. (San Francisco, CA, USA) |
| Supabase | Authentication and database | Supabase, Inc. (San Francisco, CA, USA) |
| Stripe (if/when billing ships) | Payment processing | Stripe, Inc. |
| OpenAI / Anthropic / local Ollama (Q-AI pillar) | LLM inference; user opt-in per request | Configurable; default is local-only via Ollama |
| Google Sign-In | OAuth provider | Google LLC |
| Apple Sign-In (iOS only, not Play Store relevant for Android binary) | OAuth provider | Apple Inc. |
| GitHub OAuth | OAuth provider | GitHub, Inc. (Microsoft) |
| LinkedIn OIDC | OAuth provider | LinkedIn Corporation (Microsoft) |

---

## Section 5: Data retention and deletion

State explicitly in your Privacy Policy (already at `https://zipminator.zip/privacy`):

- Account data is retained until user requests deletion or 24 months of inactivity, whichever is first.
- Encrypted content is retained per the user's explicit self-destruct TTL setting (default: indefinite for vault; 30 days for messenger; user-selected for mail).
- Crash logs are retained 90 days at Sentry then auto-purged.
- OAuth tokens are rotated every 30 days and never persisted in plaintext.

---

## Action items before submitting this form

- [ ] Create `https://zipminator.zip/privacy/delete` page with a working "Delete my account" form (currently missing)
- [ ] Add "Last updated" date refresh on `https://zipminator.zip/privacy` (currently stuck on 2026-03-15)
- [ ] Verify Sentry SDK is actually integrated; if not, remove it from this form
- [ ] Verify Stripe SDK presence in Android binary; if not yet integrated, remove from this form
- [ ] File BIS Self-Classification Report for ECCN 5D002 within 30 days of first US distribution (https://snap-r.bis.doc.gov)
