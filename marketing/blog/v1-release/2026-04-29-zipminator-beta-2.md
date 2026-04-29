# Zipminator v1.0.0-beta.2: OAuth fixed, Mail to 95%, Wave 1+2 converges

*2026-04-29, QDaria AS, Norway*

Beta.2 ships ten days after beta.1 because one user-facing regression and one scope decision were the only things between `feat/9-pillars-production-2026-04-26` and a clean second public beta. The regression was the OAuth callback URL silently routing to `:4321`, an Astro dev port leaked from a monorepo-root `.env`, which broke sign-in from `zipminator.zip`. The scope decision was Pillar 7 Quantum Mail: ship 95% with code, config, scaffold, and PII gate in place; defer the live SMTP/IMAP smoke through Postfix+Dovecot+GreenMail to the first production deploy. Marathon run `MARATHON_CONVERGED_20260429-wave1plus2` closed both items and verified every gate green at HEAD.

## The 9 pillars at a glance

This table mirrors the canonical status in `docs/guides/FEATURES.md` as of 2026-04-29.

| # | Pillar | Status |
|---|--------|:------:|
| 1 | Quantum Vault | 100% |
| 2 | PQC Messenger | 100% |
| 3 | Quantum VoIP | 100% |
| 4 | Q-VPN (PQ-WireGuard userspace) | 100% |
| 5 | 10-Level Anonymizer | 100% |
| 6 | Q-AI Assistant | 100% |
| 7 | Quantum Mail | 95% |
| 8 | ZipBrowser | 100% |
| 9 | Q-Mesh (RuView) | 100% |

Eight of nine pillars sit at 100% production-ready. The remaining 5% on Pillar 7 is one item: live SMTP/IMAP smoke through `docker-compose.email.yml`, blocked only on a production deploy of the Docker mail stack. Code, configuration, the pre-send PII gate, the attachment anonymization pipeline (L4 default), and the opt-in `dkimpy` signer are already merged.

## What changed since beta.1

**OAuth callback URL fix.** Marathon Agent B traced sign-in failures from `zipminator.zip` to a monorepo-root `.env` whose values leaked into the Next.js dashboard on port 3099, redirecting OAuth callbacks to `:4321` (the Astro landing-page dev port). The fix has two parts. First, `trustHost: true` in `web/lib/auth.ts` so next-auth v5 derives the callback host from the incoming request rather than from a stale env variable. Second, a per-app `web/.env.local` override that insulates the dashboard from the monorepo root. Commit `8fc1267` lands the auth-side change; commit `7123cce` makes `OAuthButtons` read `callbackUrl` from search params instead of the hardcoded `/dashboard`. Together these unblock sign-in for every beta tester arriving at `zipminator.zip`.

**Pillar 7 Quantum Mail 90% to 95%.** Beta.1 shipped Pillar 7 at 75% with the PQC envelope, SMTP/IMAP transport, server-side self-destruct TTL, and DKIM scaffold. Marathon Wave 1+2 added the pre-send PII gate (Acknowledge / Anonymize), wired attachment anonymization (L4 default) into the compose pipeline, and wrote 7 new vitest pii-gate cases on top of the existing 62 mail tests. The 95% state is "everything code-complete, only deploy remains." We deliberately did not push to 100% in this beta because doing so would have meant standing up Postfix+Dovecot+GreenMail under Docker on the dev host, which is not where production mail will live. The smoke runs at first production deploy.

**Wave 1+2 marathon convergence.** Three agents on disjoint scopes: Agent A on the web build, Agent B on the OAuth callback URL, Agent C on clippy test-code cleanup. Two of three found state already clean at HEAD post `af848b1` (the verification-unblock commit). Agent B did the OAuth work. The convergence sentinel `MARATHON_CONVERGED_20260429-wave1plus2` is recorded in the FEATURES.md Marathon Convergence Log alongside the prior `20260426-032534-21fc8f` entry that brought eight pillars to 100%.

**Verified gates at HEAD.** `cargo test --workspace` reports 459 pass plus 1 ignored. `cd web && pnpm test` reports 37 vitest cases (up from 30 at beta.1). `cd web && pnpm build` is green. `cargo clippy --workspace --all-targets -- -D warnings` is clean. The web build route collision noted in earlier marathon scratch (`app/mail/page.tsx` vs `app/(dashboard)/mail/page.tsx`) was stale; only `app/mail/` exists at HEAD.

## What is NOT in beta.2

We are direct about scope so beta testers know what they are getting.

**A CMVP certificate.** Zipminator implements NIST FIPS 203 (ML-KEM-768 and ML-KEM-1024) for key encapsulation and FIPS 204 (ML-DSA-65) for signatures, verified against NIST KAT test vectors via deterministic DRBG. We do not have a CMVP certificate against FIPS 140-3. CMVP validation requires NVLAP lab engagement, $80K to $150K of budget, and 12 to 18 months. Public materials will not claim certification or validation under FIPS 140-3 until that certificate exists.

**ESP32-S3 hardware demos for Q-Mesh.** Pillar 9 ships at 100% on the software side: attestation wire format (ADR-0043), provisioner V3 with per-module keys for the six Wave-1 modules (CSI, PUEK, EM canary, vital-auth, topo-auth, spatiotemporal), cross-repo `scripts/integrate_ruview.py` with byte-parity pytest, and OTA key rotation with a 3-node test. The healthcare ESP32-S3 demo and the defence ESP32-S3 mesh demo are human-gated on physical devices and partner-site access.

**Mobile store distribution.** Flutter builds run on iOS, Android, macOS, Linux, and Windows; iOS TestFlight has 47 builds since first submission. Public App Store and Play Store distribution waits on Apple Developer Program enrollment and Google Play Console signup. Walkthroughs are at `docs/play-store/listing.md` and `docs/play-store/data-safety.md`. The `web/app/privacy/delete/page.tsx` page referenced in the Play Store data-safety form is the next concrete blocker.

**Kernel-mode PQ-WireGuard on macOS.** Pillar 4 Q-VPN ships at 100% in userspace with packet wrapping verified across a 1500-byte MTU roundtrip and a monotonic AEAD counter, plus iOS NEPacketTunnelProvider and Android VpnService (`com.qdaria.zipminator.QVpnService`) wired. The kernel-module deploy on a Linux host (Hetzner or AWS) cannot be built or loaded on Darwin; it is a host limitation, not a code one, and lands in v1.1.

## Where to find Zipminator

The landing site lives at [zipminator.zip](https://zipminator.zip). Beta sign-up is on the same page; entries hit a Resend-backed waitlist endpoint added in commit `103fa48`. Source is at [github.com/QDaria/zipminator](https://github.com/QDaria/zipminator) on branch `feat/9-pillars-production-2026-04-26`. The Python SDK is on PyPI: `pip install "zipminator[all]"`. The Rust core is on crates.io: `cargo add zipminator-core`. Desktop binaries (DMG for macOS, AppImage for Linux, MSI for Windows) and Android APKs are on GitHub Releases.

DORA Article 6.4 quantum-readiness comes into force in Norway as of 1 July 2025. Beta.2 is a step closer to making that auditable, not a finished compliance package. The single source of truth on what is verified, deferred, or human-gated is `docs/guides/FEATURES.md` in the repo, updated after every code session.
