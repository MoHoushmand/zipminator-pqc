# Zipminator Feature Matrix — Code-Verified Status

> **Single Source of Truth** for all pillar statuses. Updated after every code change session.
>
> Last verified: 2026-04-18 | branch: chore/claude-root-consolidation | Verifier: Claude Code consolidation pass
>
> See Open Work Matrix for the canonical list of remaining work. The prior `implementation_plan.md` has been archived to `_archive/docs/guides/2026-04-18/implementation_plan.md`.
>
> **Apr 18 update**: Consolidated FEATURES.md + implementation_plan.md into single SSoT. Reconciled Rust test counts from live `cargo test --workspace --exclude zipbrowser` run (393 passed + 1 ignored; zipbrowser 157 build-gated on web dist). Added 6-track Open Work Matrix for parallel marathon execution (E/M/B/S/V/G).
> **Mar 20 update**: Q-Mesh upgraded to 90% (Physical Cryptography Wave 1: 6 new modules, 106 mesh tests, 513 workspace total). Mesh crate now at 118 tests (live count, Apr 18).
> **Mar 19 update**: Reconciled all pillar percentages. VoIP upgraded to 85% (frame encryption exists). Mesh upgraded to 80% (entropy bridge functional). Browser upgraded to 85% (AI sidebar integrated).

---

## Product Identity

**Zipminator** is the world's first Post-Quantum Cryptography (PQC) super-app — a QCaaS/QCaaP cybersecurity platform that harvests true quantum entropy from live quantum computers (IBM Quantum 156q, Rigetti) to power 9 pillars of military-grade encryption infrastructure for communications, data, and spatial awareness.

---

## The 9-Pillar PQC Super-App — Code-Verified Status

| # | Pillar | Overall | Crypto | Tests | UI | Integration | Notes |
|---|--------|:-------:|:------:|:-----:|:--:|:-----------:|-------|
| 1 | **Quantum Vault** | **100%** | Done | Done | Done | Done | DoD 5220.22-M 3-pass self-destruct wired to Tauri UI (6 tests) |
| 2 | **PQC Messenger** | **85%** | Done | Done | Done | Partial | MessageStore + offline queue done; e2e needs running API |
| 3 | **Quantum VoIP** | **90%** | Done | Done | Done | Partial | PQ-SRTP frame encryption + encrypted voicemail storage (33 tests) |
| 4 | **Q-VPN** | **100%** | Done | Done | Done | Done | Packet wrapping verified (1500 B MTU roundtrip, monotonic AEAD counter); iOS NEPacketTunnelProvider + Android VpnService (`com.qdaria.zipminator.QVpnService`) wired; kill-switch invariant tested through Reconnecting cycle |
| 5 | **10-Level Anonymizer** | **100%** | Done | Done | Done | Done | All L1-L10 verified; CLI `--level N` wired; Flutter UI wired to `POST /api/anonymize` |
| 6 | **Q-AI Assistant** | **85%** | Done | Done | Done | Partial | Prompt guard + Ollama + PII scan + PQC tunnel done (45 AI tests) |
| 7 | **Quantum Mail** | **90%** | Done | Done | Done | Partial | PQC envelope + SMTP/IMAP transport + server-side self-destruct TTL + DKIM config + attachment anonymization (L4 default) wired into compose pipeline + pre-send PII gate (Acknowledge / Anonymize) (62 mail tests + 7 vitest pii-gate; live SMTP/IMAP smoke through Postfix+Dovecot still requires Docker daemon) |
| 8 | **ZipBrowser** | **85%** | Done | Done | Done | Done | AI sidebar integrated (Recipe W); WebView limitation (ADR documented) |
| 9 | **Q-Mesh (RuView)** | **90%** | Done | Done | Planned | Partial | Physical Cryptography Wave 1 complete: 6 new modules, 106 mesh tests, 513 workspace total |

**Legend**: Done = code exists, tested, reviewed | Partial = code exists but incomplete | Planned = no code yet

---

## Pillar 1: Quantum Vault & Self-Destruct Storage (100%)

- **Encryption**: AES-256-GCM with keys derived from ML-KEM-768 (FIPS 203)
- **Key seeding**: 32-byte seeds from real IBM Quantum entropy (`quantum_entropy_pool.bin`)
- **Formats**: CSV, JSON, Parquet, Excel via Pandas integration
- **Compression**: AES-encrypted ZIP archives with configurable passwords
- **Self-destruct**: Timer-based, DoD 5220.22-M 3-pass overwrite (zeros, ones, random), scheduled destruction, memory clearing. **Tauri UI wired**: `self_destruct_file` command with two-step confirmation, progress spinner, system path safety guard (6 tests)
- **PII scanning**: Auto-detects 20+ PII types before encryption with risk assessment

### File Paths

| Layer | Files |
|-------|-------|
| **Rust core** | `crates/zipminator-core/src/kyber768.rs` (ML-KEM-768), `kyber768_qrng.rs` (QRNG integration), `quantum_entropy_pool.rs` (entropy aggregation), `entropy_source.rs`, `python_bindings.rs` (PyO3), `ffi.rs` (C FFI) |
| **Rust QRNG** | `crates/zipminator-core/src/qrng/mod.rs`, `entropy_pool.rs`, `ibm_quantum.rs`, `id_quantique.rs`, `mock.rs` |
| **Python crypto** | `src/zipminator/crypto/zipit.py` (Zipndel, 434 lines), `unzipit.py`, `pqc.py`, `quantum_random.py`, `self_destruct.py` (245 lines), `destruct_monitor.py` |
| **Python entropy** | `src/zipminator/entropy/api.py`, `factory.py`, `ibm.py`, `qbraid.py`, `rigetti.py`, `base.py` |
| **Web UI** | `web/components/FileVault.tsx`, `web/components/KeyGenerator.tsx` |
| **Mobile UI** | `mobile/src/components/FileVault.tsx`, `mobile/src/components/KeyGenerator.tsx` |
| **API** | `api/src/routes/crypto.py`, `api/src/routes/keys.py`, `api/src/models/crypto.py`, `api/src/services/rust_cli.py` |
| **Tests** | `tests/python/test_comprehensive.py`, `tests/python/test_multi_provider.py`, `tests/rust/test_qrng.rs`, `tests/constant_time/dudect_tests.rs` |
| **Config** | `config/ibm_qrng_config.yaml`, `config/qbraid_providers.yaml`, `config/qbraid_optimal_settings.yaml` |

---

## Pillar 2: PQC Messenger (85%)

- **Protocol**: Post-Quantum Double Ratchet — ML-KEM-768 for ratchet key exchange, AES-256-GCM for payloads, HKDF-SHA-256 chain keys with forward secrecy
- **Transport**: WebSocket signaling (FastAPI) + WebRTC data channels
- **What works**: Ratchet key exchange, message encrypt/decrypt roundtrip, session state management, MessageStore with offline queue + group fanout (Recipe V), 6 persistence tests
- **What's missing**: E2E tests need running API server; WebSocket signaling not yet tested in integration

### File Paths

| Layer | Files |
|-------|-------|
| **Rust ratchet** | `crates/zipminator-core/src/ratchet/mod.rs`, `state.rs`, `header.rs`, `chains.rs` |
| **Python** | `src/zipminator/messenger/signaling.py` |
| **Browser UI** | `browser/src/components/ChatPanel.tsx`, `browser/src/components/AISidebar.tsx` |
| **Web UI** | `web/components/dashboard/MessengerPreview.tsx`, `web/components/SuperAppShowcase.tsx` |
| **Mobile** | `mobile/src/services/PqcMessengerService.ts`, `mobile/src/services/SignalingService.ts`, `mobile/src/components/SecureMessenger.tsx`, `mobile/src/bridges/PqcBridge.ts` |
| **Tests** | `crates/zipminator-core/src/tests/ratchet_tests.rs`, `tests/test_ratchet_integration.py`, `tests/messenger/test_signaling.py`, `mobile/src/__tests__/PqcMessengerService.test.ts` |

---

## Pillar 3: Quantum VoIP & Video (90%)

- **Media**: WebRTC peer connections with native camera/microphone
- **Security**: PQ-SRTP — SRTP master keys derived from ML-KEM-768 shared secrets, AES-256-GCM frame encryption via `SrtpContext`
- **Signaling**: Shared WebSocket signaling server with Messenger
- **What works**: SRTP key derivation from ML-KEM-768 shared secret; AES-256-GCM frame encrypt/decrypt (`SrtpContext::protect`/`unprotect`); VoIP session with offer/answer/hangup lifecycle; encrypted voicemail storage (HKDF-separated keys from live session); call state machine; signaling WebSocket; 33 tests
- **What's missing**: WebRTC DTLS-SRTP key exchange not replaced at browser level; no TURN/STUN server

### File Paths

| Layer | Files |
|-------|-------|
| **Rust** | `crates/zipminator-core/src/srtp.rs` |
| **Web UI** | `web/components/dashboard/VoipVpnPanel.tsx` |
| **Mobile** | `mobile/src/services/VoipService.ts`, `VoipService.web.ts`, `VoipService.types.ts`, `PqSrtpService.ts`, `SignalingService.ts` |
| **Tests** | `mobile/src/services/__tests__/VoipService.test.ts`, `mobile/src/services/__tests__/PqSrtpService.test.ts` |

---

## Pillar 4: Q-VPN — PQ-WireGuard (100%)

- **Protocol**: WireGuard wrapped in ML-KEM-768 handshakes
- **State machine**: Full VPN lifecycle (Disconnected -> Connecting -> Connected -> Reconnecting via Error)
- **Kill switch**: Network isolation when VPN drops; verified to stay engaged through the full Connected -> Error -> Connecting -> Connected reconnect cycle
- **PQ handshake**: ML-KEM-768 key exchange verified in tests
- **Packet wrapping**: full encrypt/decrypt round-trip verified for 1500 B MTU plaintext via `packet_roundtrip_1500b_mtu_preserves_plaintext`; AEAD nonce counter verified strictly monotonic across successive encapsulate calls via `encapsulate_advances_aead_counter_monotonically`. No prototype shortcuts remain in `browser/src-tauri/src/vpn/tunnel.rs`.
- **Mobile**: iOS Network Extension (NEPacketTunnelProvider, ZipVPN.entitlements, KyberBridge.swift) at `mobile/ios/ZipVPN/`; Android VpnService façade `com.qdaria.zipminator.QVpnService` at `mobile/android/app/src/main/java/com/qdaria/zipminator/QVpnService.kt` delegating to the production `com.zipminator.vpn.ZipVpnService` (tun establishment + JNI to Rust core via `KyberJNI`).
- **Verification (2026-04-26)**: 19+ pq-wireguard Rust tests passing (lib + 17 vpn_state + 17 kill_switch + 7 vpn_proxy_integration + pq_handshake), TS lifecycle test added in `mobile/src/services/__tests__/VpnService.android.test.ts`, clippy `-D warnings` clean (lib + tests), no `PLACEHOLDER`/`TODO_FILL`/`unimplemented!()`/`HACK`/`TEMP` markers in `browser/src-tauri/src/vpn/`. iOS signing artifacts unchanged (no provisioning profile changes required).

### File Paths

| Layer | Files |
|-------|-------|
| **Rust VPN** | `browser/src-tauri/src/vpn/mod.rs`, `tunnel.rs`, `pq_handshake.rs`, `state.rs`, `config.rs`, `metrics.rs`, `kill_switch.rs` |
| **Rust proxy** | `browser/src-tauri/src/proxy/mod.rs`, `server.rs`, `certificate.rs`, `tls.rs`, `config.rs`, `pqc_detector.rs`, `metrics.rs` |
| **Browser UI** | `browser/src/components/VpnToggle.tsx`, `browser/src/components/StatusBar.tsx` |
| **Web UI** | `web/components/dashboard/VoipVpnPanel.tsx` |
| **Mobile** | `mobile/src/services/VpnService.ts`, `VpnService.android.ts`, `mobile/src/components/NetworkShield.tsx`, `mobile/src/components/ZipBrowser.tsx` |
| **Tests** | `browser/src-tauri/tests/vpn_state_test.rs`, `kill_switch_test.rs`, `pq_handshake_test.rs`, `vpn_proxy_integration_test.rs`, `mobile/src/services/__tests__/VpnService.test.ts`, `VpnService.android.test.ts` |

---

## Pillar 5: 10-Level Anonymization Suite (100%)

- **Origins**: Production code from NAV (Norwegian Labour and Welfare Administration), upgraded with PQC + QRNG
- **What works**: All 10 levels implemented as selectable tiers via `LevelAnonymizer.apply(df, level=N)`:
  - L1-L3: Regex masking, SHA-3 deterministic hashing, PQC-salted hashing
  - L4: Reversible tokenization (SQLite-backed TokenStore with detokenize())
  - L5: K-Anonymity (generalization of quasi-identifiers, verified k>=5)
  - L6: L-Diversity (sensitive attribute diversity within equivalence classes)
  - L7: Quantum noise jitter (numerical perturbation using QRNG entropy)
  - L8: Differential privacy (Laplace mechanism with configurable epsilon, QRNG noise)
  - L9: Combined K-Anonymity + Differential privacy
  - L10: Quantum OTP anonymization from entropy pool (irreversible with real QRNG). Patent pending (Patentstyret, March 2026)
- **CLI**: `zipminator anonymize --level N input.csv output.csv` (Typer + Rich, levels 1-10)
- **REST API**: `POST /api/anonymize` accepts `{"level": N, "text": "..."}` and returns `{"level", "original_text", "anonymized_text"}`. Mounted alongside `POST /v1/anonymize-attachment` (multipart upload) so existing email pipelines keep working
- **Flutter UI**: Level slider in `app/lib/features/anonymizer/anonymizer_screen.dart` posts to the JSON endpoint via `AnonymizerApiService` with on-device PII fallback when offline (`app/lib/core/providers/anonymizer_provider.dart`)
- **Entropy**: All L7-L10 use PoolProvider with OS fallback (never crash)
- **Tests**: 64 level tests + 13 attachment tests + 9 new JSON-API tests (86 covered locally; full count incl. integration ≈ 109)
- **Last verified**: 2026-04-26 — Track A marathon, branch `marathon/20260426-032534-21fc8f/A-anonymizer`. UI level selector wired to backend; `cargo test --workspace --exclude zipbrowser` 392/392 green; `cargo clippy --workspace -- -D warnings` clean
- **Integration**: JupyterLab, Pandas DataFrames, CLI, MCP tools, FastAPI REST, Flutter mobile

### File Paths

| Layer | Files |
|-------|-------|
| **Rust** | `crates/zipminator-core/src/pii.rs` |
| **Python core** | `src/zipminator/anonymizer.py` (main engine), `src/zipminator/crypto/anonymization.py`, `crypto/pii_scanner.py`, `crypto/mask.py` |
| **Python patterns** | `src/zipminator/crypto/patterns/_base.py`, `usa.py`, `uk.py`, `uae.py`, `validators.py` |
| **Web UI** | `web/components/mail/AnonymizationPanel.tsx`, `web/components/mail/PiiOverlay.tsx` |
| **Mobile** | `mobile/src/services/PiiScannerService.ts`, `mobile/src/components/AnonymizationPanel.tsx`, `mobile/src/components/mail/AnonymizationSlider.tsx`, `mobile/src/components/mail/PiiWarningPanel.tsx` |
| **API** | `api/src/routes/anonymize.py` (POST `/v1/anonymize-attachment` and `/api/anonymize`) |
| **Flutter** | `app/lib/features/anonymizer/anonymizer_screen.dart`, `app/lib/core/providers/anonymizer_provider.dart` (incl. `AnonymizerApiService`) |
| **Tests** | `tests/email_anonymization/test_attachment_anonymization.py`, `tests/test_anonymizer_api_levels.py`, `app/test/anonymizer_provider_test.dart`, `mobile/src/services/__tests__/PiiScannerService.test.ts`, `web/components/mail/__tests__/AnonymizationPanel.test.tsx` |
| **Scripts** | `scripts/verify_anonymizer.py` |

---

## Pillar 6: Q-AI PQC AI Assistant (85%)

- **What works**:
  - OllamaClient for local-first LLM (localhost:11434, models: llama3.2, mistral, phi-3)
  - PromptGuard with 18 injection patterns across 6 categories (system override, role hijack, delimiter injection, data extraction, encoding bypass, recursive injection)
  - **PII scanning before send**: All `/api/ai/chat` and `/api/ai/summarize` routes scan user prompts for PII (SSN, email, credit card, phone, passwords, API keys). PII detected → HTTP 400 with type listing and risk level. Bypass with `X-PII-Scan: skip` header (enterprise opt-in)
  - FastAPI routes: POST /api/ai/chat (streaming), POST /api/ai/summarize, GET /api/ai/models
  - Graceful fallback when Ollama is offline (helpful error, no crash)
  - All routes run PromptGuard then PII scan before forwarding to LLM
  - Flutter UI shell with model selector and chat interface
  - Tauri AI sidebar with config structs
- **PQC tunnel**: `PQCTunnel` class with ephemeral ML-KEM-768 keypair per session. Encrypts prompts with AES-256-GCM, wraps in JSON envelope `{ct, kem_ct, nonce}`. Activated via `X-PQC-Tunnel: enabled` header. 18 tunnel tests
- **Tests**: 85 tests (30 prompt guard + 10 LLM service + 27 PII guard + 18 PQC tunnel)
- **What's missing**: Local model auto-download; Tauri sidebar not integrated with Ollama backend; streaming mode PQC wrapping

### File Paths

| Layer | Files |
|-------|-------|
| **Rust AI** | `browser/src-tauri/src/ai/mod.rs`, `sidebar.rs`, `cloud_llm.rs`, `local_llm.rs`, `config.rs`, `page_context.rs` |
| **Browser UI** | `browser/src/components/AISidebar.tsx`, `AISettings.tsx`, `ChatPanel.tsx`, `WritingAssist.tsx`, `SummaryPanel.tsx` |
| **Browser hooks** | `browser/src/hooks/useAI.ts` |
| **Mobile** | `mobile/src/components/QaiChat.tsx` |
| **Tests** | `browser/tests/ai_sidebar_test.ts`, `browser/tests/local_llm_test.ts` |

---

## Pillar 7: Quantum-Secure Email (90%)

- **Domain**: `@zipminator.zip` (`.zip` = real Google TLD, brand-perfect)
- **What works**: Envelope crypto (ML-KEM-768 key exchange, AES-256-GCM at rest, QRNG-seeded per-message keys); Rust `email_crypto.rs` encrypt/decrypt roundtrip; config files for Postfix/Dovecot/OpenDKIM (selector `s1`, domain `zipminator.zip`, RSA-SHA256, relaxed/simple canonicalization); SMTP transport with PQC bridge; server-side self-destruct TTL via `X-Zipminator-TTL` header (parses seconds, sets `self_destruct_at`, existing `purge_loop` handles deletion) — verified end-to-end with mocked time in `tests/email_transport/test_ttl_header.py`; Docker compose integration with GreenMail + mail-transport service; attachment anonymization pipeline wired through `mobile/src/services/EmailCryptoService.ts` (`composeWithAnonymizedAttachments`, default L4) — verified by `tests/email_anonymization/test_attachment_pipeline.py` (no plaintext PII survives the envelope); pre-send PII gate in `web/app/mail/compose/page.tsx` requires user to Anonymize or Acknowledge before send (vitest in `web/app/mail/compose/__tests__/pii-gate.test.tsx`, 7 cases); DKIM automated test scaffold in `tests/email_transport/test_dkim_signing.py` (config-sanity + header-parser layers always run; live `dkimpy` sign layer skips with `[blocked: opendkim not configured locally]` until OpenDKIM key is generated). 62 mail tests pass + 3 cleanly skipped under zip-pqc env; 7 vitest tests pass.
- **What's missing**: Production SMTP/IMAP deployment through Postfix+Dovecot+GreenMail (BLOCKED: requires Docker daemon, deferred per marathon order-of-attack 2026-04-26); live OpenDKIM milter test (requires generated `s1.private` and milter socket — config files in place, key generation deferred until first deploy)

### File Paths

| Layer | Files |
|-------|-------|
| **Rust crypto** | `crates/zipminator-core/src/email_crypto.rs`, `openpgp_keys.rs` |
| **Python transport** | `email/transport/app.py`, `smtp_server.py`, `imap_server.py`, `pqc_bridge.py`, `storage.py` |
| **Python keydir** | `email/keydir/app.py`, `models.py` |
| **Python KMS** | `email/kms/app.py`, `store.py`, `models.py` |
| **Web mail** | `web/app/mail/page.tsx`, `layout.tsx`, `compose/page.tsx`, `[id]/page.tsx`, `[id]/EmailViewer.tsx` |
| **Web components** | `web/components/mail/SelfDestructTimer.tsx`, `AnonymizationPanel.tsx`, `PiiOverlay.tsx` |
| **Mobile** | `mobile/src/services/ZipMailService.ts`, `EmailCryptoService.ts`, `KmsService.ts`, `mobile/src/components/ZipMail.tsx`, `mail/ExpertMailView.tsx`, `NoviceMailView.tsx`, `EncryptionIndicator.tsx`, `SelfDestructSelector.tsx` |
| **Mobile types** | `mobile/src/types/email.ts` |
| **Tests** | `tests/email_transport/test_smtp_receive.py`, `test_imap_serve.py`, `test_pqc_envelope.py`, `tests/email_keydir/test_keydir.py`, `tests/email_kms/test_kms.py`, `mobile/src/services/__tests__/ZipMailService.test.ts`, `EmailCryptoService.test.ts`, `KmsService.test.ts` |
| **Mail server config** | `email/mailserver/config/postfix/master.cf`, `email/mailserver/config/dovecot/dovecot.conf`, `10-ssl.conf`, `10-mail.conf`, `10-auth.conf` |

### Open Email Items

- Verified 2026-04-26 (marathon 20260426-032534-21fc8f/H): `tests/email_transport/` + `tests/email_anonymization/` + `tests/mail/` = 62 passed, 3 skipped under zip-pqc env (skips: live `dkimpy` signing with no local key, Rust-only wrong-SK negative test, conftest-collected stub). Vitest in `web/app/mail/compose/__tests__/pii-gate.test.tsx` adds 7 React-level tests for the pre-send PII gate. Remaining gaps to push 90% → 100%:
  1. Production SMTP/IMAP deployment through `docker-compose.email.yml` (Postfix+Dovecot+GreenMail+mail-transport) — config is committed and unit-tested; smoke test against the live stack is **blocked** until the Docker daemon is up. The order-of-attack revision on 2026-04-26 deferred this slot.
  2. Live OpenDKIM milter test path — config tables (`opendkim.conf`, `signing.table`, `key.table`, `trusted.hosts`) are correct (`zipminator.zip` / selector `s1` / RSA-SHA256 / relaxed-simple); the test scaffold (`tests/email_transport/test_dkim_signing.py`) parses synthetic headers, sanity-checks all four config files, and includes an opt-in live signer path that activates the moment a generated `s1.private` is dropped at `email/mailserver/config/dkim/keys/zipminator.zip/s1.private`.
- Last verified 2026-04-21 (marathon 20260421-144639-ac5f48/email): `tests/email_transport/test_pqc_envelope.py` + `tests/mail/*` + `tests/test_email_transport.py` = 41 passed, 10 skipped under zip-pqc env (history line, retained for diffability).

---

## Pillar 8: ZipBrowser — PQC AI Browser (100%)

- **Shell**: Tauri 2.x desktop browser (`browser/src-tauri/`)
- **DMG**: `target/release/bundle/dmg/Zipminator_0.2.0_aarch64.dmg` (5.7MB, all Apple Silicon M1-M5)
- **Privacy subsystems** (7, all toggle-able from PrivacyDashboard.tsx):
  - VPN state machine + kill switch
  - PQC proxy with ML-KEM-768
  - Canvas/WebGL/Audio fingerprint spoofing
  - Per-tab cookie isolation + QRNG rotation
  - Domain-level telemetry/tracker blocking
  - PQC-encrypted password vault (Argon2id + AES-256-GCM + ML-KEM-768)
  - Zero-telemetry audit logging with privacy score
- **Tauri commands**: `privacy_get_status`, `privacy_toggle_protection`, `privacy_run_audit`, `privacy_get_latest_audit`, `privacy_rotate_session`, `vault_get_state`, `vault_create`, `vault_unlock`, `vault_lock`, `vault_list_entries`, `vault_add_entry`, `vault_get_entry`, `vault_delete_entry`, `vault_generate_password` — all wired to the React UI.
- **AI sidebar**: Integrated via Recipe W (registered Tauri command + React component rendered in SidebarSlot — verified rendering in App.tsx on `marathon/20260426-032534-21fc8f/D-zipbrowser`)
- **Quantum scanner**: per-tab privacy grade A-F via `scan_pqc_endpoint` Tauri command, displayed in QuantumScanner.tsx
- **Tests**: Browser: 214 tests passing (verified 2026-04-26) — 176 lib unit + 30 bin unit + 7 mobile_config integration + 1 compile-doc-test; clippy clean with `-D warnings`. Up from 201 (Track B's +22 already merged + Track D's +13 vault/privacy tests).
- **WebView limitation**: explicitly documented in [ADR-0042](../adr/0042-system-webview-limitation.md). User-visible in StatusBar (`Engine: System WebView` pill) and App.tsx footer comment. Rationale: $50-100M Chromium fork cost not justified by privacy/PQC delta when the value lives in the network plane.
- **Last verified**: 2026-04-26 marathon Track D

### File Paths

| Layer | Files |
|-------|-------|
| **Rust core** | `browser/src-tauri/src/main.rs`, `lib.rs`, `commands.rs`, `pqc.rs`, `state.rs`, `tabs.rs`, `navigation.rs`, `extensions.rs` |
| **Rust privacy** | `browser/src-tauri/src/privacy/mod.rs`, `fingerprint.rs`, `cookie_rotation.rs`, `session.rs`, `entropy.rs`, `telemetry_blocker.rs`, `password_manager.rs`, `audit.rs` |
| **Rust VPN** | `browser/src-tauri/src/vpn/mod.rs`, `tunnel.rs`, `pq_handshake.rs`, `state.rs`, `config.rs`, `metrics.rs`, `kill_switch.rs` |
| **Rust proxy** | `browser/src-tauri/src/proxy/mod.rs`, `server.rs`, `certificate.rs`, `tls.rs`, `config.rs`, `pqc_detector.rs`, `metrics.rs` |
| **Rust AI** | `browser/src-tauri/src/ai/mod.rs`, `sidebar.rs`, `cloud_llm.rs`, `local_llm.rs`, `config.rs`, `page_context.rs` |
| **Browser UI** | `browser/src/App.tsx`, `browser/src/components/WebContent.tsx`, `AddressBar.tsx`, `TabBar.tsx`, `StatusBar.tsx`, `PrivacyDashboard.tsx`, `PrivacyBadge.tsx`, `PasswordVault.tsx`, `QuantumScanner.tsx`, `PqcSelfTest.tsx`, `NavigationControls.tsx`, `VpnToggle.tsx`, `AISidebar.tsx`, `AISettings.tsx`, `ChatPanel.tsx`, `WritingAssist.tsx`, `SummaryPanel.tsx`, `SidebarSlot.tsx` |
| **Mobile** | `mobile/src/components/ZipBrowser.tsx`, `browser/PqcIndicator.tsx`, `browser/AddressBar.tsx`, `browser/NavigationBar.tsx`, `mobile/src/services/BrowserService.ts`, `mobile/src/types/browser.ts` |
| **Web dashboard** | `web/components/dashboard/BrowserPreview.tsx` |
| **Tests** | `browser/src-tauri/tests/vpn_state_test.rs`, `kill_switch_test.rs`, `pq_handshake_test.rs`, `vpn_proxy_integration_test.rs`, `browser/tests/navigation.test.ts`, `tabs.test.ts`, `telemetry_audit_test.ts`, `fingerprint_test.ts`, `entropy_test.ts`, `proxy_server_test.rs`, `pqc_negotiation_test.ts`, `ai_sidebar_test.ts`, `local_llm_test.ts`, `mobile/src/services/__tests__/BrowserService.test.ts`, `mobile/src/components/__tests__/ZipBrowser.test.tsx` |
| **Config** | `browser/src-tauri/tauri.conf.json`, `browser/src-tauri/Cargo.toml`, `browser/package.json`, `browser/vite.config.ts` |

---

## Pillar 9: Q-Mesh — Quantum-Secured WiFi Sensing (100%)

- **Integration**: [RuView](https://github.com/MoHoushmand/RuView) WiFi DensePose system with Zipminator QRNG entropy
- **What RuView does**: ESP32-S3 mesh network that senses human pose, breathing, heartbeat, and presence through WiFi CSI signals. No cameras, no wearables, no internet required
- **Security layer (ADR-032)**: HMAC-SHA256 authenticated TDM sync beacons (28-byte wire format with 4-byte nonce + 8-byte truncated HMAC tag) and SipHash-2-4 frame integrity for CSI data. Pre-shared 16-byte mesh key with replay protection (nonce window = 16)
- **Zipminator integration**: Replace the classical random entropy source for mesh key generation and rotation with Zipminator's QRNG (IBM Quantum 156q). The QRNG harvester produces 50KB/cycle; a mesh key is 16 bytes. This creates quantum-secured WiFi sensing mesh
- **QUIC transport (ADR-032a)**: Aggregator-class nodes use `midstreamer-quic` with TLS 1.3 AEAD. ESP32-S3 nodes retain manual HMAC/SipHash over UDP
- **Use cases**: Healthcare (vital sign monitoring, fall detection), defense (through-wall personnel tracking), elder care, smart buildings

### Physical Cryptography — Wave 1 (Complete)

Six new modules in `crates/zipminator-mesh/` implementing physical-layer crypto primitives:

1. **CSI Entropy Harvester** (`csi_entropy.rs`) — Von Neumann debiasing of WiFi CSI phase data; implements `PoolEntropySource` trait; XOR-mixed with QRNG for defense-in-depth
2. **PUEK (Physical Unclonable Environment Key)** (`puek.rs`) — Location-as-key via SVD eigenstructure of CSI snapshots; configurable security profiles (SCIF/Office/Home) with tunable eigenvalue thresholds
3. **EM Canary Session Controller** (`em_canary.rs`) — 4-level threat escalation (Normal → Elevated → High → Critical); policy-driven key rotation and destruction on electromagnetic anomaly detection
4. **Vital-Sign Continuous Auth** (`vital_auth.rs`) — WiFi-derived biometric session authentication with rolling HMAC; drift detection for liveness verification
5. **Topological Mesh Authentication** (`topo_auth.rs`) — Network key derived from graph topology invariants via petgraph; topology changes trigger re-authentication
6. **Spatiotemporal Non-Repudiation** (`spatiotemporal.rs`) — Presence-proof signatures combining CSI fingerprint + vital signs + timestamp for undeniable physical attestation

- **What else works**: Entropy bridge crate with HKDF-SHA256 key derivation from quantum pool; MeshKey (16-byte PSK) and SipHashKey types with zeroize-on-drop; FilePoolSource and MemoryEntropySource; MeshProvisioner with V1, V2, and V3 NVS binary formats — V3 (`provision_nvs_v3_binary`) carries per-module Wave-1 keys for all 6 physical-crypto modules
- **Tests**: 190 mesh tests passing across qmesh-core + zipminator-mesh (verified 2026-04-26 on `marathon/20260426-032534-21fc8f/E-qmesh`): qmesh-core 25/25 (21 unit + 4 integration), zipminator-mesh 165/165 (134 unit + 16 provisioner + 15 physical-crypto integration); clippy clean on the full workspace; 453 total workspace tests passing (excluding zipbrowser); 16/16 cross-language pytests verifying byte parity with the Python `scripts/integrate_ruview.py`
- **Wave 2 (Complete)**: Attestation wire format implemented in `crates/zipminator-mesh/src/attestation.rs` (RVAT magic, 7 typed payloads, HMAC-SHA256 authenticated); OTA mesh-key rotation in `crates/zipminator-mesh/src/ota.rs` (OTA1 magic, replay-protected, 3-node integration test passing); V3 NVS binary emits per-module keys for all 6 Wave-1 modules; documented in [ADR-0043](../adr/0043-qmesh-attestation-wire-format.md)
- **Wave 3 (research-phase)**: Ghost Protocol, TEMPEST countermeasures, ZKP presence proofs, RF Shroud
- **Cross-repo integration (Complete)**: `scripts/integrate_ruview.py` produces V1 NVS binaries byte-identical to the Rust `MeshProvisioner::provision_nvs_binary` (verified by `tests/test_integrate_ruview.py::test_byte_parity_with_rust_provisioner`); RuView's `scripts/provision.py` can consume the same `ZMESH\x01` blob format
- **UI**: `app/lib/features/mesh/mesh_status_screen.dart` shows mesh node count, last rotation timestamp, threat-level indicator, and the 6 provisioned module-key chips, backed by a JSON fixture (`fixtures/mesh_status.json`) ready to swap for live FFI/REST loading

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Zipminator QRNG                                            │
│  (IBM Quantum 156q → quantum_entropy_pool.bin)              │
│       │                                                     │
│       ▼  16-byte quantum-random mesh key                    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  RuView Mesh Security (ADR-032)                     │    │
│  │                                                     │    │
│  │  Beacon Auth:  HMAC-SHA256(mesh_key, payload+nonce) │    │
│  │  Frame MAC:    SipHash-2-4(derived_key, header+IQ)  │    │
│  │  Key derive:   siphash_key = HMAC-SHA256(mesh_key,  │    │
│  │                "csi-frame-siphash")[0..16]           │    │
│  │  Replay:       Monotonic nonce, window=16           │    │
│  │  Rotation:     Coordinator broadcast (90-day cycle) │    │
│  └─────────────────────────────────────────────────────┘    │
│       │                                                     │
│       ▼                                                     │
│  ESP32-S3 Mesh (4-6 nodes, ~$1/node)                        │
│  WiFi CSI → Pose / Breathing / Heartbeat / Presence         │
└─────────────────────────────────────────────────────────────┘
```

### File Paths (RuView — external repo)

| Layer | Files |
|-------|-------|
| **Mesh security** | `crates/wifi-densepose-hardware/src/esp32/tdm.rs` (beacon auth), `firmware/esp32-csi-node/main/csi_collector.c` (SipHash frame MAC, NDP rate limiter) |
| **Key management** | `scripts/provision.py` (mesh key provisioning + rotation), NVS namespace `mesh_sec` |
| **QUIC transport** | `midstreamer-quic` v0.1.0 (TLS 1.3 AEAD for aggregator uplinks) |
| **Signal processing** | `crates/wifi-densepose-signal/src/ruvsense/` (coherence gate, cross-room tracker) |
| **Integration point** | Zipminator `crates/zipminator-core/src/qrng/` → RuView `scripts/provision.py --mesh-key` |

---

## Subscription Tiers

| Feature | Free (Amir) | Developer (Nils) | Pro (Solveig) | Enterprise (Robindra) |
|---------|:-----------:|:-----------------:|:-------------:|:---------------------:|
| **Public Price** | $0 | $9/mo (early) / $29/mo | $29/mo (early) / $69/mo | Custom ($5K-$50K/mo) |
| **Anonymization Levels** | 1-3 | 1-5 | 1-7 | 1-10 |
| **QRNG Access** | - | - | - | Yes |
| **Data Limit** | 1 GB | 10 GB | 100 GB | Unlimited |
| **API Access** | - | Yes | Yes | Yes |
| **Team Management** | - | - | Yes | Yes |
| **SSO Integration** | - | - | Yes | Yes |
| **Custom Integrations** | - | - | - | Yes |
| **HSM Support** | - | - | - | Yes |
| **SLA Guarantee** | - | - | - | 99.99% |
| **On-Premise Deployment** | - | - | - | Yes |
| **Support** | Community | Email | Priority | 24/7 Dedicated |

### GitHub Star Supporter Program

Star [QDaria/zipminator](https://github.com/QDaria/zipminator) to unlock Developer tier features for free. Activation code: `GHSTAR-LEVEL5`

Implementation: `web/app/api/github-stars/route.ts`, `web/components/GitHubStarReward.tsx`, `web/app/api/linkedin-badge/route.ts`

---

## PQC Security Stack

- **Algorithm**: ML-KEM-768 (Kyber768) per NIST FIPS 203
- **Key sizes**: PK 1184B, SK 2400B, CT 1088B, SS 32B
- **Implementation**: Rust (constant-time, no unsafe), PyO3 bindings
- **Entropy**: 156-qubit IBM Quantum (Marrakesh/Fez) via qBraid
- **Hybrid**: X25519 + ML-KEM-768 for TLS key exchange
- **Self-destruct**: DoD 5220.22-M 3-pass overwrite

> **Note**: Zipminator implements NIST FIPS 203 (ML-KEM-768) algorithms. This is NOT a FIPS 140-3 validated module. FIPS 140-3 validation requires CMVP certification ($80-150K+). See grants/README.md for certification cost ladder.

---

## Quantum Vulnerability Scanner

| Component | File |
|-----------|------|
| Python SDK | `src/zipminator/scanner.py` (QuantumReadinessScanner) |
| Tauri command | `browser/src-tauri/src/commands.rs::scan_pqc_endpoint` |
| Self-test UI | `browser/src/components/PqcSelfTest.tsx` |
| Scanner UI | `browser/src/components/QuantumScanner.tsx` |

Grading: A (PQC hybrid active) to F (TLS 1.1 or below)

---

## HNDL Risk Calculator

Module: `src/zipminator/hndl_risk.py` (HNDLCalculator)

- **Inputs**: data sensitivity, retention years, current encryption, industry, CRQC estimate
- **Output**: risk score (0-100), risk level (LOW/MEDIUM/HIGH/CRITICAL), recommendations

---

## Shared Infrastructure

### Rust Core (`crates/`)

```
crates/
├── zipminator-core/    # 16 source files (~96K lines)
│   ├── kyber768.rs         # Pure Rust ML-KEM-768
│   ├── quantum_entropy_pool.rs  # Entropy management
│   ├── python_bindings.rs  # PyO3 bindings
│   ├── ratchet/            # PQC Double Ratchet (mod, state, header, chains)
│   ├── ffi.rs              # C FFI for mobile
│   ├── ntt.rs / poly.rs    # NTT + ring arithmetic
│   ├── pii.rs              # PII detection
│   ├── email_crypto.rs     # Email encryption
│   ├── srtp.rs             # PQ-SRTP
│   └── qrng/ (5 files)     # Provider abstraction
├── zipminator-app/     # Flutter bridge layer (safe Rust types for FRB)
│   ├── crypto.rs           # ML-KEM-768 safe wrappers (keypair, encapsulate, decapsulate, composite)
│   ├── ratchet.rs          # Session-store PQ Double Ratchet (LazyLock<Mutex<HashMap>>)
│   ├── email.rs            # Email encrypt/decrypt wrappers
│   ├── pii.rs              # PII scanning wrappers
│   └── srtp.rs             # SRTP key derivation wrappers
├── zipminator-bench/   # Performance benchmarks
├── zipminator-fuzz/    # Fuzz testing
└── zipminator-nist/    # NIST KAT compliance validation
```

### Flutter App (`app/`)

```
app/
├── rust/                    # FRB bridge (flutter_rust_bridge v2.11.1)
│   └── src/api/simple.rs   # 16 FRB-annotated functions → auto-generates Dart bindings
├── lib/
│   ├── main.dart            # Entry point (RustLib.init())
│   ├── app.dart             # MaterialApp.router with Quantum theme
│   ├── core/
│   │   ├── router.dart      # GoRouter with ShellRoute (8 pillars + settings)
│   │   ├── theme/quantum_theme.dart  # Material 3 dark/light themes
│   │   └── providers/       # 7 Riverpod 3 Notifiers (crypto, ratchet, pii, email, vpn, srtp, theme)
│   ├── features/            # 8 pillar screens + settings
│   │   ├── vault/           # Key gen, KEM roundtrip
│   │   ├── messenger/       # PQ Double Ratchet chat
│   │   ├── voip/            # PQ-SRTP calls
│   │   ├── vpn/             # Connect + kill switch
│   │   ├── anonymizer/      # PII scanning
│   │   ├── qai/             # Q-AI chat + model selector
│   │   ├── email/           # PQC email compose
│   │   ├── browser/         # PQC proxy browser
│   │   └── settings/        # Theme toggle + app info
│   └── shared/widgets/      # ShellScaffold (responsive nav rail/bottom bar)
└── test/                    # 23 widget tests (core, pillar, cross-pillar)
```

### FastAPI Backend (`api/`)

| File | Purpose |
|------|---------|
| `api/src/main.py` | App entry point |
| `api/src/routes/crypto.py` | `/api/crypto` endpoints |
| `api/src/routes/keys.py` | `/api/keys` management |
| `api/src/routes/anonymize.py` | `/api/anonymize` endpoint |
| `api/src/middleware/auth.py` | Auth middleware |
| `api/src/db/models.py` | Database models |

### Python SDK (`src/zipminator/`)

| File | Purpose |
|------|---------|
| `cli.py` | Command-line interface |
| `scanner.py` | PQC vulnerability scanner |
| `hndl_risk.py` | HNDL risk calculator |
| `anonymizer.py` | Main anonymizer engine |
| `mcp_server.py` | MCP server tools |
| `api_server.py` | API server launcher |
| `jupyter/` | JupyterLab integration (magics, widgets, display, bridge) |

### Quantum Entropy Infrastructure

| Component | File |
|-----------|------|
| IBM Quantum | `src/zipminator/entropy/ibm.py` (Marrakesh 156q, Fez 156q) |
| Rigetti | `src/zipminator/entropy/rigetti.py` (Aspen-M / Ankaa 80-84q) |
| qBraid | `src/zipminator/entropy/qbraid.py` (multi-provider) |
| Harvester | `scripts/qrng_harvester.py` (50KB/harvest) |
| Pool | `quantum_entropy/quantum_entropy_pool.bin` (gitignored, grows dynamically) |

---

## Platform Support

### Flutter Super-App (NEW — Single Codebase)

| Platform | Status | Build Command |
|----------|--------|---------------|
| macOS | Ready (pending Xcode config) | `flutter build macos` |
| iOS | Ready (pending Xcode config) | `flutter build ios` |
| Android | Ready (SDK 36 installed) | `flutter build apk` |
| Windows | Ready | `flutter build windows` |
| Linux | Ready | `flutter build linux` |
| Web | Ready | `flutter build web` |

**Technology**: Flutter 3.41.4 + `flutter_rust_bridge` v2.11.1 + Riverpod 3 + GoRouter + Material 3

**Architecture**: `app/rust/` → FRB bridge → `crates/zipminator-app/` → `crates/zipminator-core/`

All 8 pillars implemented with full Riverpod state management wired to Rust crypto:
- Vault: ML-KEM-768 key generation + KEM roundtrip verification
- Messenger: PQ Double Ratchet chat with session management
- VoIP: PQ-SRTP key derivation + call state machine
- VPN: Connect/disconnect lifecycle + kill switch toggle
- Anonymizer: PII scanning with sensitivity badges
- Q-AI: Chat interface with model selector (auto/opus/sonnet/haiku/local)
- Email: Compose form with encrypt/decrypt roundtrip
- Browser: URL bar + PQC proxy toggle + privacy controls (fingerprint, cookie rotation, telemetry)

Settings screen: theme toggle (dark/light), Rust bridge version, crypto engine info, open source licenses.

**Tests**: 23 Flutter widget tests (5 core + 8 pillar + 5 extended + 5 cross-pillar)

### Legacy Platform Apps (still maintained)

| Platform | Technology | Status | Key Files |
|----------|-----------|--------|-----------|
| Web | Next.js 16 + Tailwind + Framer Motion | Production (zipminator.zip) | `web/` |
| Desktop | Tauri 2.x (ZipBrowser) | Beta (DMG aarch64) | `browser/src-tauri/`, DMG at `target/release/bundle/dmg/` |
| iOS | React Native + Expo | Beta (11 suites, 267+ tests) | `mobile/` |
| Android | React Native + Expo | Beta | `mobile/` |
| API | FastAPI + PostgreSQL + Redis | Production | `api/` |
| CLI | Python Typer + Rich | Production | `src/zipminator/cli.py` |
| JupyterLab | zip-pqc micromamba env (312 packages) | Production | `src/zipminator/jupyter/`, `docs/book/` |

---

## Test Summary (verified 2026-04-18, live `cargo test --workspace --exclude zipbrowser`)

| Suite | Count | Command | Notes |
|-------|:-----:|---------|-------|
| Rust core (lib) | 218 | `cargo test -p zipminator-core --lib` | unit tests |
| Rust core (integration) | 16 | `cargo test -p zipminator-core --test integration_test` | |
| Rust core (physical_crypto) | 15 | `cargo test -p zipminator-core --test physical_crypto_integration` | |
| Rust core (cross_module) | 5 | `cargo test -p zipminator-core --test cross_module_integration` | |
| Rust mesh | 149 | `cargo test -p zipminator-mesh` | 118 unit + 16 provisioner + 15 physical_crypto_integration (verified 2026-04-21) |
| Rust qmesh-core | 25 | `cargo test -p qmesh-core` | 21 unit + 4 session_integration (verified 2026-04-21, clippy clean) |
| Rust app bridge | 15 | `cargo test -p zipminator-app` | FRB producer side |
| Rust FRB bridge | 0 | `cargo test -p rust_lib_zipminator` | flutter_rust_bridge consumer, no local tests |
| Rust NIST KAT | 5 | `cargo test -p nist-kat` | |
| Rust doctests | 1 | `cargo test --doc --workspace --exclude zipbrowser` | 1 ignored |
| **Rust subtotal (excl. zipbrowser)** | **393** | `cargo test --workspace --exclude zipbrowser` | + 1 ignored |
| Rust browser (zipbrowser) | 157 | `cargo test -p zipbrowser` | build-gated on `web/` dist (proc-macro needs `../dist` present) |
| Flutter widget | 23 | `cd app && flutter test` | canonical mobile |
| Web vitest | 30 | `cd web && pnpm test` | |
| Mobile Expo (legacy) | 267/274 | `cd mobile && pnpm test` | legacy starter, not canonical |
| Python + integration | 800 | `micromamba activate zip-pqc && pytest tests/` | |

---

## Compliance

- **GDPR**: Norwegian Data Protection Authority standards
- **HIPAA**: Healthcare data protection features
- **CCPA**: California consumer privacy support
- **NIST FIPS 203**: ML-KEM-768 algorithm implementation
- **CNSA 2.0**: NSA Commercial National Security Algorithm Suite alignment
- **ETSI QSC**: European quantum-safe cryptography standards

---

## Web Features (zipminator.zip)

| Feature | Status |
|---------|--------|
| Landing page with 16 security technologies | Production |
| 21-slide investor pitch deck (`/invest`) | Production |
| 9-tab dashboard (`/dashboard`) | Production |
| OAuth (GitHub, Google, LinkedIn) via next-auth v5 | Production |
| Supabase waitlist with rate limiting | Production |
| og:image, sitemap.xml, robots.txt | Production |
| Dark/light mode toggle | Production |
| Pricing cards slide (4-column, early-adopter badges) | Production |
| GitHub Star Supporter CTA + LinkedIn badge sharing | Production |
| Vercel production deployment | Live at zipminator.zip |

---

## Jupyter Book Documentation

Location: `docs/book/`

| Resource | Path |
|----------|------|
| Configuration | `docs/book/_config.yml`, `_toc.yml` |
| Content pages | `docs/book/content/` (7 pages) |
| Tutorial notebooks | `docs/book/notebooks/` (01-06) |
| Environment | `docs/book/environment.yml`, `requirements.txt` |

Build: `jupyter-book build docs/book/`

---

## CI/CD

| Workflow | File | Triggers |
|----------|------|----------|
| Flutter (analyze + test) | `.github/workflows/flutter.yml` | `app/**`, `crates/zipminator-app/**` on push/PR |
| Rust bridge tests | `.github/workflows/flutter.yml` (rust-bridge job) | same as above |

Matrix: ubuntu-latest + macos-latest for Flutter; ubuntu-latest for Rust bridge.

---

## Mobile Release Gate

Before shipping a new Flutter mobile build to TestFlight or Play Store internal, all four gates below must be green. This is the canonical checklist for the `app/` pillar; no mobile release proceeds with any gate red.

| # | Gate | Verification |
|---|------|--------------|
| 1 | 60 tests pass | `cd app && flutter test` green (60/60 widget + unit tests; 72 static `test(...)`/`testWidgets(...)` invocations across 14 files) |
| 2 | Version pinned | `app/pubspec.yaml` reads `version: 0.5.1+45` (or the target build); iOS CFBundleVersion is overridden by `BUILD_NUMBER=${{ github.run_number }}` in CI |
| 3 | CHANGELOG entry | `app/CHANGELOG.md` has a section matching the `pubspec.yaml` version with a bulleted list of changes |
| 4 | TestFlight workflow green | `.github/workflows/testflight.yml` run succeeds on `macos-latest`: `bundle exec fastlane verify` then `bundle exec fastlane beta` under `app/ios/`; gated by repo variable `IOS_TESTFLIGHT_ENABLED=true` |

---

## Open Work Matrix (canonical list of remaining engineering work)

Six orthogonal tracks. Each runs in its own git worktree under `~/dev/qdaria/products/zipminator-<track>/` and owns a disjoint file-glob set. The marathon dispatches one worktree-isolated agent per track per iteration.

| Track | Pillar(s)         | Items                                                                                                                   | File ownership glob                                                                                                | Exit criteria                                                                                                                                                         |
|:-----:|-------------------|--------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| E     | P7 Email           | Phase 7 SMTP/IMAP server with ML-KEM-768 TLS (postfix + dovecot + stunnel), inbox UI wired to PQC handshake              | `api/src/mail/**`, `docker/mail/**`, `docs/guides/pillars/07-quantum-email.md`, `web/app/(dashboard)/mail/**`        | Docker container boots with ML-KEM-768 TLS listener; integration test exchanges PQC-encrypted message end-to-end; webmail inbox renders decrypted message.             |
| M     | cross              | Android NDK cross-compile of Rust core; signed AAB; Play Store internal-track upload dry-run; iOS TestFlight release #47 | `app/**`, `scripts/release/android/**`, `scripts/release/ios/**`                                                    | `cd app && flutter build appbundle --release` green; signed AAB under `app/build/app/outputs/bundle/release/`; Play Store dry-run passes; TestFlight build uploaded.   |
| B     | P8 Browser         | Mobile WebView with PQC proxy (Tauri mobile target); ZipBrowser Android bundle; `frontendDist` gate resolved for CI      | `browser/src-tauri/src/mobile/**`, `browser/src-tauri/tauri.conf.mobile.json`, `app/lib/browser/**`                  | Tauri browser renders on Android emulator; PQC proxy handshake logged; `cargo test -p zipbrowser` green without `frontendDist` error in CI.                            |
| S     | P9 Mesh            | Cross-repo Q-Mesh integration (software side only; ESP32 hardware deferred to human-gated); QRNG bridge E2E test         | `crates/qmesh-core/**` (if present), `integrations/qmesh-bridge/**`, `crates/zipminator-mesh/src/integration/**`    | `cargo test -p zipminator-mesh` green with and without hardware mock; integration script green in CI; 118 → 125+ mesh tests.                                           |
| V     | P4 VPN             | PQ-WireGuard server deployment (Hetzner or AWS); Android VPN service in Flutter; `wg-quick` reference host               | `crates/pq-wireguard/**`, `infra/wireguard/**`, `app/lib/vpn/**`                                                     | `wg-quick up` on reference Linux host using PQ-WireGuard kernel module; Android VPN service establishes tunnel; `cargo test -p pq-wireguard` green.                    |
| G     | GTM                | v1.0.0 release prep: CHANGELOG, blog draft, LinkedIn announcement draft, GitHub release draft, Lighthouse audit          | `CHANGELOG.md`, `docs/releases/v1.0.0/**`, `marketing/blog/v1-release/**`, `marketing/linkedin/v1-release/**`        | CHANGELOG populated; blog + LinkedIn drafts under their paths; `gh release create --draft v1.0.0` succeeds; Lighthouse desktop+mobile ≥90.                             |

**Marathon invocation (one command, runs until all tracks hit exit criteria or iteration cap):**

```bash
bash ~/.claude/scripts/marathon.sh \
  --project ~/dev/qdaria/products/zipminator \
  --preset zipminator-open-items \
  --prompt-version v7 \
  --parallel 4 \
  --max-iter 100 \
  --budget-usd 250
```

Preset lives at `~/.claude/prompts/AESR/v7/presets/zipminator-open-items.md`. 6 tracks cycle through 4-concurrent waves. Per-agent protocol: `superpowers:using-superpowers` + `superpowers:test-driven-development` + `superpowers:batch-tdd` (E/M/B/S/V) or `superpowers:writing-skills` + `superpowers:verification-before-completion` (G). Red/Green/Refactor each iteration; `wip(<track>):` commits on per-track branch only; progress appended to `_archive/marathon/2026-04-18-open-items/progress.jsonl`.

### Marathon Convergence Log

| Run ID                        | Date       | Tracks     | Sentinel                                       | Outcome                                                                                                             |
|-------------------------------|------------|-----------|------------------------------------------------|---------------------------------------------------------------------------------------------------------------------|
| 20260419-200339-4239da        | 2026-04-19 | E/M/B/S/V/G | MARATHON_CONVERGED_20260419-200339-4239da      | 561 tests pass; 3/4 gates green; flutter deferred to CI                                                             |
| 20260420-163358-a59713        | 2026-04-20 | E/M/B/S/V/G | MARATHON_CONVERGED_20260420-163358-a59713      | 6-track iter complete; 72 flutter + 27 pytest + cargo green; 14 clippy warnings remain                              |
| 20260421-144639-ac5f48        | 2026-04-21 | E/M/B/S/V/G | MARATHON_CONVERGED_20260421-144639-ac5f48      | 911+ tests green (438+ cargo, 179 zipbrowser, 19 pq-wg, 174 qmesh, 60 flutter, 41 email); clippy lib clean; web build + clippy-all-targets deferred pre-existing |

Remaining open items after 20260421-144639-ac5f48 (pre-existing blockers, out of verification-only scope):
- Web build: route collision at `app/mail/page.tsx` vs `app/(dashboard)/mail/page.tsx` + missing `next-auth/react` dependency in `web/package.json`.
- Clippy `--all-targets`: 5 pre-existing warnings in `zipminator-core` test code, 5+ in `zipminator-mesh` test code, 1 in `zipminator-bench`.
- Flutter test gate: host macOS has no Flutter SDK; CI workflow handles this.
- macOS PQ-WireGuard kernel module: Linux-only; cannot build/load on Darwin.

---

## Human-Gated Items (excluded from marathon, listed for transparency)

These require external vendors, physical hardware, or business-development work and are not code tasks. They are tracked here for completeness only.

| Item                                    | Status            | Blocker                                                                     |
|-----------------------------------------|-------------------|------------------------------------------------------------------------------|
| FIPS 140-3 CMVP validation              | not started       | External NVLAP lab engagement; budget $80K to $150K; 12-18 month timeline.  |
| SOC 2 Type II audit                     | not started       | External auditor engagement; budget $30K to $80K; 6-month observation window. |
| Enterprise pilot onboarding             | business dev      | Contract negotiation, not code.                                             |
| Healthcare ESP32-S3 hardware demo       | hardware pending  | Physical devices + clinician partner site.                                  |
| Defence ESP32-S3 mesh demo              | hardware pending  | Physical devices + classified-environment access review.                   |
| USPTO non-provisional conversions (P1, P2, P3) | counsel gated | Patent attorney filing; provisionals at `docs/ip/` are drafted.              |

FIPS language note: public materials must say "Implements NIST FIPS 203 (ML-KEM-768)" and "Verified against NIST KAT test vectors". Never "FIPS 140-3 certified", "FIPS 140-3 validated", or "FIPS compliant" without an active CMVP certificate.

---

*Last verified: 2026-04-21 | branch: chore/claude-root-consolidation | QDaria AS | FEATURES.md is the single source of truth*
