# Zipminator v1.0.0-beta.2 ships today

Zipminator, our 9-pillar PQC super-app, just cut its second public beta on branch `feat/9-pillars-production-2026-04-26`. Marathon run `MARATHON_CONVERGED_20260429-wave1plus2` brought three parallel agents on disjoint scopes to a clean convergence at HEAD.

What this beta closes:

- Pillar status: 8 of 9 pillars at 100% production-ready (Quantum Vault, PQC Messenger, Quantum VoIP, Q-VPN, 10-Level Anonymizer, Q-AI Assistant, ZipBrowser, Q-Mesh). Pillar 7 Quantum Mail moves 90% to 95% under a deliberate scope decision; the last 5% is the live SMTP/IMAP smoke through Postfix+Dovecot+GreenMail and unblocks at first production deploy. Code, config, attachment anonymization (L4 default), pre-send PII gate, and `dkimpy` opt-in signer are all merged.
- OAuth callback fix: sign-in from zipminator.zip was redirecting to `:4321` because a monorepo-root `.env` leaked the Astro dev port into the Next.js dashboard on 3099. Closed via `trustHost: true` in `web/lib/auth.ts` plus a per-app `.env.local` override (commit `8fc1267`). `OAuthButtons` now reads `callbackUrl` from search params instead of hardcoding `/dashboard` (commit `7123cce`).
- Verified gates at HEAD: cargo test 459 pass + 1 ignored, vitest 37 pass (up from 30 at beta.1), pnpm build green, clippy `--all-targets` clean across the workspace.
- Crypto posture (unchanged, restated for transparency): Implements NIST FIPS 203 (ML-KEM-768 and ML-KEM-1024) for key encapsulation, verified against NIST KAT test vectors via deterministic DRBG. Implements NIST FIPS 204 (ML-DSA-65) for signatures. No FIPS 140-3 CMVP certificate; CMVP engagement is human-gated on NVLAP lab access and $80K to $150K of budget.

What is not in this beta: ESP32-S3 hardware demos for Pillar 9 (gated on physical devices and partner sites), App Store / Play Store public distribution (gated on Apple Developer Program and Google Play Console enrollment), kernel-mode PQ-WireGuard on Darwin (host limitation, not code; lands in v1.1).

DORA Art. 6.4 quantum-readiness is Norwegian law as of 1 July 2025. Beta.2 is a step closer to making that auditable, with the FEATURES.md Marathon Convergence Log as the single source of truth.

Try the beta: zipminator.zip. Star or watch the repo: github.com/QDaria/zipminator. Python SDK: `pip install "zipminator[all]"`. Rust core: `cargo add zipminator-core`. Feedback through GitHub Issues, please; the Pillar 7 SMTP/IMAP deploy and the `web/app/privacy/delete/page.tsx` page are the next concrete blockers we are tracking.

#PostQuantumCryptography #PQC #Cybersecurity #Norway #QuantumSafe
