# ZipBrowser Ship-Readiness Checklist

Pillar 8 of Zipminator. Tauri 2.x desktop app (Rust backend, Vite + React 18 TS frontend).

Scope of this document: what is verified green, what is required to produce a signed universal macOS DMG, and what gaps remain before first user-facing shipment.

---

## (a) Build status

Verified on `worktree-agent-a9b8520d` against host target `aarch64-apple-darwin`.

| Step | Command | Result |
|------|---------|--------|
| Rust check | `cargo check --manifest-path browser/src-tauri/Cargo.toml` | clean, 1.55s |
| Rust release build | `cargo build --release --manifest-path browser/src-tauri/Cargo.toml` | clean (prior run, 1m 43s) |
| Frontend install | `pnpm install --ignore-workspace` in `browser/` | 287 packages, no errors |
| Frontend build | `pnpm build` in `browser/` | `tsc && vite build`, 985ms, dist 960K |
| `browser/dist/` present | required by `tauri::generate_context!()` macro | yes (index.html + assets) |

The parent `pnpm-workspace.yaml` at `~/dev/qdaria/` does not list `browser/`, so every `pnpm` invocation in `browser/` MUST use `--ignore-workspace`. Without the flag, `pnpm install` reports success but installs zero deps for this package, and the frontend build silently fails TS2307 on `@tauri-apps/plugin-dialog`.

## (b) Test status

Command: `cargo test --manifest-path browser/src-tauri/Cargo.toml`

```
total passed=163 failed=0 ignored=3
```

Breakdown: 145 lib tests + 17 bin tests + 1 doc test passing. 3 doc-tests intentionally ignored. Zero failures. This is an increase of 6 over the FEATURES.md baseline of 157 (new AI sidebar and privacy tests have been added since that spec was written).

## (c) Clippy status

Command: `cargo clippy --all-targets --manifest-path browser/src-tauri/Cargo.toml -- -D warnings`

Clean. Finished in 5.11s dev profile.

14 clippy errors were resolved in this worktree. The same set of cleanups lives on branch `chore/claude-root-consolidation` (wip commit `2959615`); that branch is not reachable from current HEAD, so the fixes were re-applied here as mechanical, semantic-preserving edits:

- Replaced manual `Default` impls with `#[derive(Default)]` + `#[default]` attribute on `ModelProvider::Mock` and `SidebarState`.
- Changed `.filter(...).last()` to `.rfind(...)` in two sidebar call sites.
- Replaced `if x.is_some() { x.unwrap() }` with `if let Some(v) = x` in `cloud_llm.rs`.
- Added `#[allow(dead_code)]` on three `#[derive(Debug, Deserialize)]` structs whose fields are only read by Serde (`Choice`, `StreamChoice`, `GenerateResponse`, `ChatResponse`, `CookieRotator`, `CACHE_SIZE`).
- Replaced `std::io::Error::new(ErrorKind::Other, e)` with `std::io::Error::other(e)` in `self_destruct.rs`.
- Collapsed identical `if let` branches in `navigation.rs::classify_security`.
- Replaced struct field-reassign-after-default with struct-init shorthand in `ai/config.rs` test.
- Removed unused `Manager` import in `ai/sidebar.rs` and renamed `cloud_opt` to `_cloud_opt` at the binding that is legitimately discarded.
- Gated `let app_handle = app.handle().clone();` in `main.rs` behind `#[cfg(feature = "vpn")]` so builds without the vpn feature do not warn on an unused binding.

All edits are in support of `-D warnings`; no crypto, no security-relevant logic path was touched.

## (d) Bundle command

Do NOT build the DMG in this track. The documented, canonical command for producing the macOS universal debug bundle is:

```bash
cd browser/src-tauri
tauri build --debug --target universal-apple-darwin
```

Output path: `target/universal-apple-darwin/debug/bundle/dmg/`.

For a signed release bundle, swap `--debug` for default release and ensure the prerequisites in (e) and (f) are satisfied first.

## (e) Code signing requirements

`browser/src-tauri/tauri.conf.json` currently has:

```json
"macOS": {
  "minimumSystemVersion": "11.0",
  "frameworks": [],
  "signingIdentity": null
}
```

To ship a distributable DMG, this must be populated with a valid Apple Developer ID Application certificate. Ship prerequisites:

1. Apple Developer Program membership in good standing for the `com.qdaria.zipminator` identifier.
2. Developer ID Application certificate installed in the macOS keychain of the signing host; confirm with `security find-identity -v -p codesigning`.
3. Set `"signingIdentity": "Developer ID Application: QDaria AS (<TEAM_ID>)"` in `tauri.conf.json`, or export `APPLE_SIGNING_IDENTITY` to the build environment.
4. Notarization credentials for stapling: `APPLE_ID`, `APPLE_PASSWORD` (app-specific password), `APPLE_TEAM_ID` exported to the environment, or pre-configured via `xcrun notarytool store-credentials`.
5. Staple the notarization ticket post-notarization: `xcrun stapler staple target/.../bundle/dmg/Zipminator_0.2.0_universal.dmg`.
6. Hardened runtime and Gatekeeper entitlements: Tauri 2 applies hardened runtime by default; if the VPN feature is enabled, additional entitlements may be required for network extension APIs.

Until all six are in place, DMG output will be unsigned and flagged by macOS Gatekeeper.

## (f) Universal binary plan (Intel + Apple Silicon)

Target: lipo-joined binary covering `aarch64-apple-darwin` (Apple Silicon) and `x86_64-apple-darwin` (Intel).

Current state:

```
rustup target list --installed
aarch64-apple-darwin
```

Intel target is missing. Action items before first universal build:

1. `rustup target add x86_64-apple-darwin` on the build host.
2. Verify native dependencies cross-compile: `openssl-sys`, `reqwest`'s TLS stack, `rustls-post-quantum`, `boringtun` (if vpn feature is on). These are the most likely to fail on Intel if the host has mixed homebrew prefixes.
3. Confirm `tauri build --target universal-apple-darwin` succeeds; under the hood Tauri invokes two `cargo build` passes and `lipo -create` on the binaries before bundling.
4. If any native dep fails for `x86_64-apple-darwin`, fall back to producing two single-arch DMGs (`--target aarch64-apple-darwin` and `--target x86_64-apple-darwin`) and ship both until cross-compilation is resolved.

## (g) Outstanding AI and privacy gaps

Items that block a user-facing 0.2.0 shipment. These are not crashes or test failures; they are runtime feature completeness issues and must be addressed before declaring the DMG "ready for users."

1. **Tauri 2 dialog plugin is registered only on the JS side.** `browser/src/components/FileVault.tsx` calls `open()` from `@tauri-apps/plugin-dialog`, and the package has been added to `browser/package.json`. The matching Rust plugin is NOT in `browser/src-tauri/Cargo.toml` and `.plugin(tauri_plugin_dialog::init())` is NOT in the `main.rs` builder chain. At runtime the JS call raises, a try/catch in `FileVault.tsx::pickFile` swallows the error, and the file-picker button becomes a silent dead click. Fix requires three edits:
   - Add `tauri-plugin-dialog = "2"` to `[dependencies]` in `browser/src-tauri/Cargo.toml`.
   - Add `.plugin(tauri_plugin_dialog::init())` to the `tauri::Builder::default()` chain in `browser/src-tauri/src/main.rs`.
   - Grant the `dialog:default` permission in `browser/src-tauri/capabilities/default.json` (or the equivalent capabilities file).
2. **Self-destruct flow is reachable but unverified in bundle context.** `commands::self_destruct_file` is wired and unit-tested, but end-to-end exercise through a real bundled DMG has not been performed.
3. **AI sidebar Cloud mode requires a stored API key.** `AiConfig.cloud_api_key` is persisted as a hex-encoded ciphertext blob; the encrypt/decrypt path depends on a keystore plugin that is not registered in `main.rs`. Local-only mode is the safe default; Cloud mode should be flagged as preview-only in release notes until the keystore integration lands.
4. **VPN feature is feature-gated.** `#[cfg(feature = "vpn")]` covers all VPN surfaces. A release DMG that claims "PQ-WireGuard VPN" in user-facing copy must be built with `--features vpn` and must also solve the macOS network-extension entitlement work separately.
5. **AI model download flow has no bundle-install target.** `ai::sidebar::ai_download_model` pulls a GGUF at first run into the Tauri app-data dir. Cold first-run UX has not been exercised; users without network access at first launch will see no local model available.
6. **Window title copy has been denormalized.** `tauri.conf.json::app.windows[0].title` was `"Zipminator — Quantum-Secure Encryption"` (em dash). Per QDaria style rules, em dashes are banned. Changed to `"Zipminator, Quantum-Secure Encryption"`. Confirm this reads correctly in the frame of a real DMG before locking the 0.2.0 copy.

None of the six is a regression. Items 1, 3, and 5 are the likeliest to surface as bug reports within the first hour of user testing; item 1 is the cheapest to close (one-line Cargo edit + one-line `main.rs` edit + capability JSON).

---

## Track C scope boundary

This track did not:

- Build or sign a DMG. `tauri build` was not run.
- Modify any crypto module (`crates/`, `browser/src-tauri/src/vpn/`, `browser/src-tauri/src/proxy/`). The crypto pipeline (NIST FIPS 203 ML-KEM-768 via `rustls-post-quantum 0.2`, and Kyber768 primitives via `pqcrypto-kyber`) is untouched.
- Push to `main` or open a PR.
- Add a new runtime dependency to the Rust workspace. `@tauri-apps/plugin-dialog@^2.0.0` was added to `browser/package.json` to resolve a TS2307 build blocker; the matching Rust crate is flagged above as gap (g.1) but was NOT added in this track to keep the change set mechanical.

Baseline commit before this track: `138aa91 fix(web): revert LaTeX SVG wordmarks and broken image sizing in nav`.
