# Security & Dependency Audit — 2026-06-03

Track Sec, marathon program. Read-only audit plus remediation plans. No keys
rotated, no dependencies changed, no merges, no history rewrites. This document
records findings and the recommended fixes; the user performs all rotations and
the human-gated history operations.

Repo: `zipminator` (origin `MoHoushmand/zipminator-pqc`, public mirror
`QDaria/zipminator`). Branch: `marathon/20260603/security`.

Tooling used:
- `cargo audit` 0.21.2 (advisory-db local copy)
- `pnpm audit --prod --json --ignore-workspace` (pnpm 10.15.0)
- `cargo deny check advisories` — **not run, `cargo-deny` is not installed**
- manual `grep` of Cargo.toml / package.json for dep pinning + crypto versions

---

## 0. Severity Summary

| Source | Critical | High | Moderate | Low | Notes |
|--------|---------:|-----:|---------:|----:|-------|
| Rust (`cargo audit`) | 0 | 7 vulns | — | — | + 22 unmaintained warnings, 4 unsound warnings |
| Web (`pnpm audit --prod`, scoped) | 0 | 19 | 20 | 5 | 42 distinct advisories; mostly via one alpha dep |

Highest-priority items for the user (detail below):
1. **`next@15.5.15` — 7 HIGH + 4 MODERATE + 2 LOW**, all fixed by bumping to
   `>=15.5.18`. This is the live dashboard and a direct prod dependency. **HIGH —
   act first.**
2. **`pyo3@0.20.3` in `zipminator-core` (the crypto core)** — RUSTSEC-2025-0020
   buffer overflow. Patched in `>=0.24.1`. No call site of the affected API
   (`PyString::from_object`) found in `crates/`, so likely not currently
   reachable, but the crate must still be upgraded. **HIGH (crypto crate).**
3. **`gemini-flow@2.1.0-alpha.1` in `web/`** drags in a large vulnerable
   transitive tree (MCP SDK ReDoS + cross-client data leak, protobufjs code
   injection, express/path-to-regexp/qs/tmp/picomatch). Removing or replacing it
   eliminates ~15 of the 19 HIGH findings. **HIGH.**
4. **`aws-lc-sys@0.38.0` + `rustls-webpki@0.103.9`** (TLS/cert validation, used by
   the Tauri browser proxy) — X.509 name-constraint bypass, CRL logic errors.
   **HIGH for the browser TLS path.**

---

## 1. Rust workspace — `cargo audit`

### Tooling note (worked around, then reverted)
`cargo audit` 0.21.2 aborts on the local advisory-db because 47 advisories use
CVSS v4.0 vectors (e.g. `RUSTSEC-2026-0073` / `libcrux-poly1305`) which this
version cannot parse. To get a clean run the 47 CVSS-4.0 advisory files were
temporarily moved aside, audit was run offline (`cargo audit -n -f Cargo.lock`),
and **all 47 files were restored afterward** (verified). The repo and the
advisory DB are unchanged.

Recommended fix: upgrade the audit tool (`cargo install cargo-audit --locked`,
≥0.22 supports CVSS 4.0), or install `cargo-deny` which has its own parser.

### Vulnerabilities (7)

| RUSTSEC | Crate @ ver | Severity | Patched | Path / impact |
|---------|-------------|----------|---------|---------------|
| RUSTSEC-2025-0020 | `pyo3@0.20.3` | High | `>=0.24.1` | **Direct dep of `zipminator-core`** (optional, `pyo3` feature). Buffer overflow in `PyString::from_object`. No call site found in `crates/`; upgrade anyway. |
| RUSTSEC-2026-0044 | `aws-lc-sys@0.38.0` | High | `>=0.39.0` | via `aws-lc-rs` ← `rustls`/`rustls-post-quantum` (browser TLS). X.509 name-constraint bypass via wildcard/Unicode CN. |
| RUSTSEC-2026-0048 | `aws-lc-sys@0.38.0` | High (CVSS 3.1 H/H) | `>=0.39.0` | Same path. CRL distribution-point scope check logic error. |
| RUSTSEC-2026-0104 | `rustls-webpki@0.103.9` | High | `>=0.103.13` | via `rustls` (browser TLS). Reachable panic in CRL parsing (DoS). |
| RUSTSEC-2026-0098 | `rustls-webpki@0.103.9` | High | `>=0.103.12` | URI name constraints incorrectly accepted. |
| RUSTSEC-2026-0099 | `rustls-webpki@0.103.9` | High | `>=0.103.12` | Name constraints accepted for wildcard-asserting certs. |
| RUSTSEC-2026-0049 | `rustls-webpki@0.103.9` | High | `>=0.103.10` | CRLs not considered authoritative due to faulty matching. |

Recommended remediation:
- `pyo3`: bump `crates/zipminator-core/Cargo.toml` `pyo3` from `"0.20"` to a
  current 0.24+ line. This is an API-breaking jump for PyO3; the maturin bindings
  will need adjustment and a full `cargo test --workspace` + `pytest` pass. Treat
  as its own crypto-crate task under `--effort max`.
- `rustls`/`rustls-webpki`/`aws-lc-sys`: run `cargo update -p rustls-webpki`,
  `cargo update -p aws-lc-sys` (and `rustls`/`rustls-post-quantum` as needed) to
  pull the patched lines without a manifest change, then re-run
  `cd browser/src-tauri && cargo test`.

### Unsound (4)
- `RUSTSEC-2026-0097` `rand@0.7.3 / 0.8.5 / 0.9.2` — unsound with a custom logger
  using `rand::rng()`. Patched in `>=0.8.6 / >=0.9.3 / >=0.10.1`. Three rand
  major lines are present in the lock; `zipminator-core` and `qmesh-core` declare
  `rand = "0.8"`. Low practical risk (depends on a custom global logger), but
  bump where cheap.
- `RUSTSEC-2024-0429` `glib@0.18.5` — iterator unsoundness; patched `>=0.20.0`.
  Transitive via GTK3 (browser/Tauri Linux). Track with the GTK3 deprecation
  below.

### Unmaintained (22) — informational, not exploitable
- **`pqcrypto-kyber@0.8.1` (RUSTSEC-2024-0381)** — the project's KEM crate is
  flagged unmaintained, "replaced by `pqcrypto-mlkem`". Relevant to PQC policy
  (see §3). Used directly by `zipminator-core`, `zipminator-app`, `pq-wireguard`,
  `browser/src-tauri`.
- 11× gtk-rs GTK3 bindings (`atk`, `gdk`, `gtk`, `gdkx11`, `gdkwayland-sys`,
  etc. RUSTSEC-2024-041x/0420) — GTK3 no longer maintained; migrate to GTK4 or
  accept as a tracked transitive of the Linux Tauri build.
- `paste@1.0.15`, `proc-macro-error@1.0.4`, `rustls-pemfile@2.2.0`, `fxhash`,
  `libusb@0.3.0`, and 6× `unic-*` crates — all build-time/transitive, low risk.

---

## 2. Web app — `pnpm audit --prod`

### Scoping note (important)
A first `pnpm audit --prod` from `web/` produced misleading results: pnpm walked
**up** to the parent monorepo workspace config (`/Users/mos/dev/qdaria/pnpm-workspace.yaml`)
and audited a different project (`qdaria-next-new`, with `shadcn`→MCP-SDK→`hono`
chains). `web/` has no installed `node_modules` and no own workspace file, so the
parent config bled in. The numbers below come from the **correctly scoped** run:

```
cd web && pnpm audit --prod --json --ignore-workspace
```

which roots every advisory path at `.` (the web app) and reflects the real
`web/pnpm-lock.yaml`. **Re-run audits in `web/` with `--ignore-workspace`** until
`web/` has its own `pnpm-workspace.yaml` or the parent config is fixed.

Installed runtime: **`next@15.5.15`** (the `next@16.0.3` in the lockfile is only
`eslint-config-next` / `@next/eslint-plugin-next`, a devDep — not the runtime).

### Scoped counts: 0 critical / 19 high / 20 moderate / 5 low (42 advisories)

#### `next@15.5.15` — direct prod dep (the live dashboard) — fix to `>=15.5.18`
| Severity | Advisory | Fixed in |
|----------|----------|----------|
| High | Middleware/Proxy bypass (Pages Router i18n) GHSA-36qx-fr4f-26g5 | 15.5.16 |
| High | DoS with Server Components GHSA-8h8q-6873-q5fj | 15.5.16 |
| High | SSRF via WebSocket upgrades GHSA-c4j6-fc7j-m34r | 15.5.16 |
| High | DoS via connection exhaustion (Cache Components) GHSA-mg66-mrh9-m8jx | 15.5.16 |
| High | Middleware bypass via segment-prefetch GHSA-267c-6grr-h53f | 15.5.16 |
| High | Middleware bypass via segment-prefetch (incomplete-fix follow-up) GHSA-26hh-7cqf-hhc6 | **15.5.18** |
| High | Middleware bypass via dynamic route param injection GHSA-492v-c6pp-mqqv | 15.5.16 |
| Moderate | Image Optimization API DoS GHSA-h64f-5h5j-jqjh | 15.5.16 |
| Moderate | XSS in beforeInteractive scripts GHSA-gx5p-jg67-6x7h | 15.5.16 |
| Moderate | XSS via CSP nonces (App Router) GHSA-ffhc-5mcf-pf4q | 15.5.16 |
| Moderate | Cache poisoning in RSC responses GHSA-wfc6-r584-vfw7 | 15.5.16 |
| Low | Middleware/Proxy redirect cache poisoning GHSA-3g8h-86w9-wvmq | 15.5.16 |
| Low | RSC cache-busting collision cache poisoning GHSA-vfv6-92ff-j949 | 15.5.16 |

Fix: bump `web/package.json` `"next": "^15.0.0"` to `"next": "^15.5.18"` (or pin
`15.5.18`), `pnpm install`, then `cd web && pnpm build`. Single highest-value
change; closes all 13 `next` advisories.

#### `gemini-flow@2.1.0-alpha.1` — direct prod dep, the bulk of the surface
This single alpha package pulls in `@upstash/context7-mcp` → `@modelcontextprotocol/sdk@1.22.0`
(express, ajv, fast-uri), `@google-ai/generativelanguage` → `google-gax` →
`protobufjs@7.5.5`, plus `inquirer`/`tmp`, `fast-glob`/`picomatch`. It is the
source of essentially all the non-`next` HIGH/MODERATE findings:

| Severity | Crate | Advisory | Fixed in |
|----------|-------|----------|----------|
| High | `@modelcontextprotocol/sdk@1.22.0` | ReDoS GHSA + cross-client data leak + missing DNS-rebind protection | sdk ≥1.26.0 |
| High | `protobufjs@7.5.5` (×4) | code-gen gadget after proto pollution, code injection via bytes defaults, unbounded recursion DoS, process-wide DoS | ≥7.5.6 |
| High | `fast-uri@3.1.0` (×2) | path traversal, host confusion | ≥3.1.2 |
| High | `path-to-regexp@8.3.0` | DoS via sequential optional groups | ≥8.4.0 |
| High | `tmp@0.0.33` | path traversal via prefix/postfix | ≥0.2.6 |
| High | `picomatch@2.3.1` | ReDoS | ≥2.3.2 |
| Moderate | `ajv@8.17.1`, `body-parser@2.2.0`, `qs@6.14.0`, `uuid@9/10`, `@protobufjs/utf8` | ReDoS / DoS / bounds | various |

Fix (preferred): **remove `gemini-flow`** if it is not actually used at runtime
(the web app already imports `@google/generative-ai` directly), or pin it to a
non-alpha release once published. Most of these have no patched-version path
reachable without an upstream `gemini-flow` bump. Verify usage:
`grep -rn "gemini-flow" web/src web/app web/components` before removing.

#### Other prod-dep findings
| Severity | Crate | Advisory | Fixed in | Path |
|----------|-------|----------|----------|------|
| Moderate | `ws@8.20.0` | uninitialized memory disclosure | ≥8.20.1 | `@supabase/supabase-js`→`@supabase/realtime-js`→`ws` |
| Moderate | `postcss@8.4.31 / 8.5.6` | XSS via unescaped `</style>` | ≥8.5.10 | `next`, `critters` |

Fix: `pnpm update ws postcss` (or bump the parents); both are simple
transitive patch bumps.

---

## 3. PQC dependency policy check (`.claude/rules/02-security-pqc.md`)

### liboqs ≥ 0.10.0
**N/A — the project does not use liboqs/oqs.** PQC is implemented with the
pure-Rust `pqcrypto-kyber@0.8.1` (FIPS 203 / ML-KEM-768), not liboqs bindings.
The rule's "liboqs ≥ 0.10.0" line does not apply; the relevant fact is that
`pqcrypto-kyber` is flagged **unmaintained** (RUSTSEC-2024-0381, superseded by
`pqcrypto-mlkem`). Recommend a tracked migration to `pqcrypto-mlkem` and updating
the rule text to reflect the actual implementation.

### Crypto dependency pinning (rule: "exact versions, no ^ or ~")
**Violated in every crypto crate except `pq-wireguard`.** Only
`crates/pq-wireguard` pins exactly (`pqcrypto-kyber = "=0.8.1"`,
`pqcrypto-traits = "=0.3.5"`). The rest use loose/caret ranges:

| Crate | Crypto deps not exact-pinned |
|-------|------------------------------|
| `zipminator-core` | `pqcrypto-kyber "0.8"`, `pqcrypto-traits "0.3"`, `aes-gcm "0.10"`, `aes "0.8"`, `sha3 "0.10"`, `sha2 "0.10"`, `hkdf "0.12"`, `hmac "0.12"`, `x25519-dalek "2"`, `ed25519-dalek "2"`, `subtle "2.5"`, `zeroize "1"`, `rand "0.8"`, `getrandom "0.2"` |
| `zipminator-app` | `pqcrypto-kyber "0.8"`, `pqcrypto-traits "0.3"` |
| `browser/src-tauri` | `pqcrypto-kyber "0.8"`, `pqcrypto-traits "0.3"`, `aes-gcm "0.10"`, `sha2 "0.10"`, `hkdf "0.12"`, `subtle "2"`, `zeroize "1"`, `getrandom "0.2"` |
| `qmesh-core` | `hkdf "0.12"`, `sha2 "0.10"`, `subtle "2.5"`, `zeroize "1"`, `rand "0.8"`, `rand_chacha "0.3"` |
| `zipminator-nist` | `aes "0.8"`, `sha3 "0.10"`, `subtle "2.5"` |
| `zipminator-mesh` | `hkdf "0.12"`, `sha2 "0.10"` |

Note: `Cargo.lock` is committed, so resolved versions are reproducible for
binaries; the policy gap is in the manifests. Recommendation: pin crypto deps
exactly (`=x.y.z`) across these crates to match `pq-wireguard`, or formally relax
the rule to "lockfile-pinned + exact for KEM/signature primitives only." Decide
which, then apply uniformly.

---

## 4. `cargo deny`
Not installed (`cargo deny --version` → "no such command"). No advisory/license/
ban check was performed. Recommend: `cargo install cargo-deny --locked`, add a
minimal `deny.toml` (advisories + sources + a license allowlist consistent with
the MIT workspace), and wire it into CI alongside `cargo audit`. The existing
`.github/dependabot.yml` already references a `cargo-deny-action` bump
(`EmbarkStudios/cargo-deny-action-2`), so CI intent exists but the tool is not
present locally.

---

## 5. Recommended remediation order

1. `next` → `^15.5.18`, `pnpm install`, `pnpm build`. (HIGH, low effort)
2. Decide on `gemini-flow`: remove if unused, else pin off-alpha. (HIGH)
3. `cargo update -p rustls-webpki -p aws-lc-sys` (+ rustls), re-test browser. (HIGH)
4. `pnpm update ws postcss`. (MODERATE, trivial)
5. `pyo3` 0.20 → 0.24+ in `zipminator-core` as a dedicated crypto task. (HIGH, breaking)
6. Crypto dep pinning sweep per §3. (policy)
7. Install `cargo-deny` + `cargo-audit` ≥0.22; add `deny.toml`; wire into CI. (tooling)
8. Migrate `pqcrypto-kyber` → `pqcrypto-mlkem`. (tracked)

No code or dependency files were modified in this audit.
