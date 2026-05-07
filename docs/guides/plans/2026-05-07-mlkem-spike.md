# pqcrypto-kyber → ml-kem Spike Report

**Date:** 2026-05-07
**Branch:** `worktree-spike+ml-kem-migration-2026-05-07` (harness-sanitized from `spike/ml-kem-migration-2026-05-07`)
**Worktree:** `/Users/mom5/dev/qdaria/apps/zipminator/core/.claude/worktrees/spike+ml-kem-migration-2026-05-07`
**Outcome:** **GREEN** — `ml-kem 0.3.0` is FIPS 203 conformant against NIST CAVP vectors; production migration is technically viable but requires a separate plan to handle wire-format incompatibility with existing keys/messages.
**Plan:** `/Users/mom5/.claude/plans/yes-pleaese-and-do-jiggly-turtle.md`

---

## Question

Does swapping the underlying KEM library from `pqcrypto-kyber 0.8.x` (CRYSTALS-Kyber Round 3) to `ml-kem 0.3.0` (FIPS 203 final) yield byte-correct outputs against the official NIST ACVP test vectors?

## Result (one line)

Yes. `ml-kem 0.3.0` passes 60/60 ACVP ML-KEM-768 vectors (25 keygen, 35 encap+decap) out of the box. Workspace tests stay at 690/690 pass, clippy stays clean, release build stays clean.

## What changed in this spike

- `crates/zipminator-core/Cargo.toml` — added `ml-kem = "0.3"` with `zeroize` feature, non-optional. Coexists with the existing `pqcrypto-kyber 0.8`.
- `crates/zipminator-nist/Cargo.toml` — added `ml-kem`, `hex`, `serde_json` as `[dev-dependencies]` for the integration test.
- `crates/zipminator-nist/tests/acvp_ml_kem_768.rs` — new integration test that walks NIST CAVP test vectors and asserts byte-exact match against `ml-kem` outputs.
- `crates/zipminator-nist/test-vectors/` — official NIST ACVP-Server prompt + expected JSON for ML-KEM keyGen and encapDecap, sha256-pinned in `SHA256SUMS`, provenance recorded in `SOURCE.md`.
- `docs/guides/FEATURES.md` — single status line under Pillar 1 referencing this report.

No existing source files were modified. The seven files that import `pqcrypto_kyber` directly (`email_crypto.rs`, `email_transport.rs`, `ratchet/{mod,header}.rs`, `openpgp_keys.rs`, `ffi.rs`, `tests/ratchet_tests.rs`) and the in-tree native `kyber768.rs` Kyber-768 implementation are untouched. The fallback path (revert to pqcrypto-kyber by deleting the spike commits) is a clean revert.

### Plan deviation

The original plan (`/Users/mom5/.claude/plans/yes-pleaese-and-do-jiggly-turtle.md`) called for a feature-flag swap in `kyber768.rs` (Cargo features `kem-backend-ml-kem` vs `kem-backend-pqcrypto`). On contact with the codebase the deviation became necessary:

1. `crates/zipminator-core/src/kyber768.rs` is NOT a wrapper around `pqcrypto-kyber`. It is a **from-scratch native Rust Kyber-768 implementation** with its own NTT, polynomial arithmetic, sampling, and FIPS 203 serialization (~480 LOC). The `pqcrypto-kyber` dep is consumed by sibling files in the same crate, not by this wrapper.
2. Making `pqcrypto-kyber` optional + feature-gating all seven direct call sites is a 1-day-or-more refactor that goes beyond a spike's scope.

The simplification — add `ml-kem` as a parallel non-optional dep and validate it independently — answers the spike's question (does ml-kem work for ML-KEM-768?) with the smallest possible blast radius. A production-grade swap remains future work.

## Test results

| Gate | Command | Result |
|---|---|---|
| Workspace tests | `cargo test --workspace` | 690 passed, 0 failed |
| Workspace clippy | `cargo clippy --workspace -- -D warnings` | 0 warnings |
| Release build | `cargo build --release -p zipminator-core` | clean |
| ACVP keygen | `cargo test -p zipminator-nist --test acvp_ml_kem_768 acvp_ml_kem_768_keygen -- --nocapture` | 25/25 pass |
| ACVP encap+decap | `cargo test -p zipminator-nist --test acvp_ml_kem_768 acvp_ml_kem_768_encap_decap -- --nocapture` | 35/35 pass |
| Test-vector integrity | `cd crates/zipminator-nist/test-vectors && shasum -a 256 -c SHA256SUMS` | every line `OK` |

Baseline (commit `4a7ebb5`): same green gates, 690 tests, 0 clippy warnings, clean release build. Spike adds zero regressions.

## Material findings

### 1. The in-tree native Kyber768 impl is `[unverified]` against FIPS 203

`crates/zipminator-core/src/kyber768.rs::Kyber768::keypair_from_seed` takes a 32-byte seed and immediately runs SHA3-512 on it. FIPS 203 KeyGen in §6.1 hashes `d || k` where `k` is the 1-byte KEM parameter (3 for ML-KEM-768). The in-tree impl appears to omit the parameter byte. As a consequence, **the existing native impl will not pass ACVP vectors regardless of any backend swap.** This is consistent with the prior survey report's note that the in-tree impl has "NOT YET VALIDATED" official NIST vectors.

This is not a bug fix the spike performed — it is an observation that calls for either:
- a quick fix to the native impl's seed-hash chain to match FIPS 203, or
- migrating the native-impl callers (`voip_session.rs`, `python_bindings.rs`, `kyber768_qrng.rs`) to `ml-kem` instead.

### 2. Wire-format incompatibility blocks an in-place production swap

`pqcrypto-kyber 0.8` (Round 3) and `ml-kem 0.3` (FIPS 203 final) produce **different bytes for the same logical input** because of Round 4 finalization changes (notably KeyGen seed handling and encapsulation/decapsulation hash chains). Practical implications:

- **`pq-wireguard`**: handshakes encrypted under pqcrypto-kyber will not decrypt under ml-kem. The crate is pinned to `pqcrypto-kyber = "=0.8.1"` precisely because this is a wire protocol. Cannot be migrated without a protocol version bump and a transition window.
- **`email_crypto.rs`, `ratchet/*.rs`, `openpgp_keys.rs`, `email_transport.rs`**: messages encrypted on disk under pqcrypto-kyber will not decrypt under ml-kem. Migration requires either keeping both backends behind a feature flag and converting on key rotation, or accepting a hard cutover that invalidates existing encrypted blobs.
- **Browser `pq_handshake.rs`**: same as `pq-wireguard` — wire protocol, needs a version bump.

### 3. ml-kem 0.3 API quirks worth recording

For future implementers:

- KeyGen takes the FIPS 203 form `(d, z)` as a 64-byte `Seed = Array<u8, U64>`. There is no public `generate_deterministic(d, z)`; use `DecapsulationKey::<MlKem768>::from_seed(seed)`.
- The decapsulation key bytes for ACVP comparison come from the **deprecated** `ExpandedKeyEncoding::to_expanded_bytes()` (returns the 2400-byte FIPS 203 canonical form). The non-deprecated `KeyExport::to_bytes()` returns only the 64-byte seed. ACVP vectors use the expanded form, so this deprecated method is required for validation.
- `encapsulate_deterministic(&B32)` is on `EncapsulationKey` directly (not a trait). It is `cfg_attr(not(feature = "hazmat"), doc(hidden))` but always callable. Returns `(Ciphertext<P>, SharedKey)` directly, no `Result`.
- `Decapsulate::decapsulate(&Ciphertext<P>) -> SharedKey` is infallible (FIPS 203 implicit rejection produces pseudorandom bytes for invalid ciphertexts; never a hard error).
- `aws-lc-rs 1.16.1` is already in the transitive dep tree via `rustls-post-quantum 0.2.4`; it provides a CMVP-validated ML-KEM if the procurement story ever needs FIPS 140-3 module validation.

## Decision options

- [x] **Default recommendation**: keep the spike branch live, do NOT merge to main yet. Open a follow-up plan to migrate the native-impl callers (Pillar 1: vault, Pillar 3: VoIP) to `ml-kem`. That migration is internal-state-only (not a wire format change), so it can land safely. Defer the wire-format-affected migrations (`pq-wireguard`, browser, email/ratchet) to a separate plan that includes a protocol version bump and key-rotation plan.
- [ ] Merge the spike branch to main as-is. Acceptable because nothing existing is changed; only new dep + new test added. Doesn't unlock any behavior change but pre-stages ml-kem for future migrations.
- [ ] Roll back the spike. Only justified if a different KEM library is preferred. The fact that `aws-lc-rs` is already transitively in the build suggests it could be a viable alternative if CMVP coverage is a hard procurement requirement — but `aws-lc-rs` is C-backed (NEON intrinsics, etc.), which conflicts with the codebase's pure-Rust posture in `crates/`. `ml-kem` keeps things pure Rust and wins on that axis.

## Next step (recommended)

A 2-3 day follow-up plan:

1. Migrate the native-impl callers (`voip_session.rs`, `python_bindings.rs`, `kyber768_qrng.rs`) to `ml-kem`. These are internal-state-only consumers with no on-disk or on-wire keys yet (Pillar 1 vault writes new keys per session per the `kyber768_qrng.rs` integration).
2. Add ACVP vectors as an opt-in workspace test (`cargo test --workspace --features acvp-tests`) so future PRs catch ML-KEM regressions automatically.
3. Defer `email_crypto.rs`, `ratchet/*`, `pq-wireguard`, browser PQ-handshake to a third plan that addresses key/message rotation.
4. Once steps 1-2 land on main, retire the in-tree native Kyber-768 impl in favor of the `ml-kem` backend everywhere. Reduces ~480 LOC of hand-rolled crypto, transfers maintenance to RustCrypto, and cleanly aligns the project with FIPS 203 final.

## Resume

```bash
cd /Users/mom5/dev/qdaria/apps/zipminator/core/.claude/worktrees/spike+ml-kem-migration-2026-05-07
git status
git log --oneline -10
```

The spike branch is unpushed at the time of writing this report. Push happens in Task 8 of the plan.
