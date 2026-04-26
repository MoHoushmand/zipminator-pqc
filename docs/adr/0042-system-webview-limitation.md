# ADR 0042: ZipBrowser uses the system WebView, not a custom engine

- Status: Accepted
- Date: 2026-04-26
- Deciders: ZipBrowser core team
- Pillar: 8 (ZipBrowser)

## Context

ZipBrowser is a Tauri 2.x desktop application that ships a privacy-first
browsing surface for Zipminator's nine-pillar PQC stack. The current
release (`0.2.0`) renders web content through the host operating system's
WebView component:

- macOS: WKWebView (Safari engine, WebKit)
- Linux: WebKitGTK
- Windows: WebView2 (Chromium-based)

This is the standard Tauri rendering model. ZipBrowser does **not** ship
a custom browser engine and does **not** fork Chromium, Gecko, or
WebKit. The privacy and crypto value of ZipBrowser lives in everything
that wraps the WebView: the local PQC HTTPS proxy
(`browser/src-tauri/src/proxy/`), PQ-WireGuard VPN
(`browser/src-tauri/src/vpn/`), QRNG-driven privacy engine
(`browser/src-tauri/src/privacy/`), AI sidebar
(`browser/src-tauri/src/ai/`), and the password vault.

## Decision

ZipBrowser will continue to use the host system WebView for the
foreseeable future. We will **not** build, fork, or vendor a custom
browser engine.

## Rationale

1. **Engineering cost.** Forking Chromium is roughly a $50-100M and
   100+-engineer commitment (Brave's path), even before the security
   audit and patch-cadence overhead. That budget does not exist and is
   not aligned with the company's PQC mission.
2. **Attack surface.** A custom engine inherits every CVE in Blink,
   Skia, V8, libvpx, and the long tail of dependencies. The system
   WebView is patched by the OS vendor; ZipBrowser inherits Apple's
   WebKit security work for free.
3. **The privacy story is not in the renderer.** Browser fingerprint
   resistance, cookie isolation, telemetry blocking, and the PQC TLS
   path all sit on the network plane, not the rendering plane. We
   inject fingerprint defenses via JavaScript shims
   (`privacy/fingerprint.rs::injection_script`) and intercept TLS via a
   local proxy. Both layers work identically against any WebView.
4. **PQC requires a TLS-layer change, not a renderer change.** The
   Kyber768 hybrid handshake (`X25519MLKEM768`) is implemented in the
   `proxy/tls.rs` module using `rustls-post-quantum`. The WebView only
   has to trust our local CA and forward HTTPS to `127.0.0.1`. A
   custom engine would not change this and would not improve
   post-quantum coverage.
5. **AI sidebar is independent.** The Q-AI panel
   (`browser/src/components/AISidebar.tsx`) is React running inside
   Tauri's WebView shell, talking over Tauri commands to a local
   Ollama or cloud LLM. Engine choice is irrelevant here.

## Consequences

### Positive

- Small, auditable Rust footprint (~25 kLOC) instead of a multi-million
  line engine fork.
- OS vendor handles WebView patching; we inherit security updates
  without engineering effort.
- Faster development; PQC and privacy features ship without rendering
  blockers.
- Cross-platform parity: the same Tauri build works on macOS, Linux,
  Windows.
- Memory footprint dramatically smaller than Chromium-based browsers.

### Negative

- We cannot intercept rendering-layer fingerprinting vectors that
  require deep engine hooks (e.g. font-list timing attacks at the
  rasterizer level). We mitigate via JS shims, but they are
  best-effort, not sealed.
- Some Chrome extensions are unsupported (Tauri WebViews don't ship
  the WebExtension API). Users who need extensions should use
  Brave/Firefox alongside ZipBrowser, not instead.
- Passkey / WebAuthn support depends on the host WebView's
  implementation; macOS's WKWebView coverage as of 2026-04 is limited
  for cross-origin assertions.
- We cannot ship custom DevTools UI; we forward to the OS WebView's
  inspector when `devtools` feature is enabled.

### Neutral

- The "browser" pillar is best understood as "secure browsing shell"
  rather than "browser engine". Marketing copy and the FEATURES.md
  pillar description must reflect this.

## Alternatives considered

### Alternative A: Fork Chromium (Brave's model)

- $50-100M, 100+ engineers, 18-24 month bring-up.
- Inherits every Blink CVE.
- Required for ad-blocking at the rendering level (we don't need that
  granularity; URL-level blocking via `telemetry_blocker.rs` is
  sufficient).
- **Rejected:** cost not justified by privacy/PQC delta.

### Alternative B: Embed Servo

- Smaller footprint than Chromium; written in Rust (security wins).
- Mozilla's Servo is no longer actively developed for end-user
  browsing; the code base targets embedding scenarios but not a full
  HTML5 browser.
- WebExtension API not implemented.
- **Rejected:** not production-ready as a primary renderer.

### Alternative C: Wrap Firefox via GeckoView

- GeckoView is Mozilla's Android embedding library; no desktop
  equivalent.
- Would still inherit Gecko CVE surface.
- **Rejected:** desktop fit is poor.

### Alternative D: Use Tauri's system WebView (chosen)

- Standard Tauri model; massive community + first-party docs.
- Privacy work happens at the network layer (proxy/VPN/blocker).
- OS vendor handles renderer security.
- **Accepted.**

## Implementation notes

The Tauri WebView is configured in `browser/src-tauri/tauri.conf.json`
and `browser/src-tauri/src/main.rs`. There is no engine code under
`browser/src-tauri/src/` because there is no engine; what looks like
"engine code" (`navigation.rs`, `tabs.rs`, `extensions.rs`) is the
shell that orchestrates the WebView, not the renderer.

User-visible disclosure: the About page and the dashboard footer
reference this ADR so that a security-conscious user can read why
ZipBrowser does not ship a custom engine.

## References

- `browser/src-tauri/Cargo.toml` (tauri ≥ 2, no engine deps)
- `browser/src-tauri/src/proxy/tls.rs` (PQC handshake)
- `browser/src-tauri/src/privacy/fingerprint.rs` (JS shim)
- Tauri 2 architecture: <https://v2.tauri.app/concept/architecture/>
- Brave Browser engineering FAQ on Chromium fork costs (public)
- Mozilla Servo project status (public)
