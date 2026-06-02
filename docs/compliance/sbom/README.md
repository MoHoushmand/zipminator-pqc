# Zipminator SBOM — Software Bill of Materials

Generated: 2026-06-03  
Format: CycloneDX 1.5 (JSON)

## Files

| File | Ecosystem | Status | Component count |
|------|-----------|--------|----------------|
| `sbom-cargo.cyclonedx.json` | Rust / Cargo workspace | **Complete** (derived from `cargo metadata`) | 671 |
| `sbom-pip.cyclonedx.json` | Python SDK (`pyproject.toml`) | **Stub** — direct deps only, no transitive resolution | 22 |
| `sbom-flutter.cyclonedx.json` | Flutter app (`app/pubspec.lock`) | **Stub** — direct + lock deps, licenses best-effort | 40 |

## Tool Availability (2026-06-03)

| Tool | Installed | Install command |
|------|-----------|----------------|
| `cargo-cyclonedx` | No | `cargo install cargo-cyclonedx` |
| `cargo metadata` (used) | Yes | built-in |
| `cyclonedx-py` | No | `micromamba activate zip-pqc && uv pip install cyclonedx-bom` |
| `pip-licenses` | No | `micromamba activate zip-pqc && uv pip install pip-licenses` |
| `cyclonedx_dart` | No | `dart pub global activate cyclonedx_dart` |

## Regeneration Commands

```bash
# Cargo (full CycloneDX via cargo-cyclonedx):
cargo install cargo-cyclonedx
cargo cyclonedx --format json --output-cdx docs/compliance/sbom/sbom-cargo.cyclonedx.json

# Python (full resolved SBOM):
micromamba activate zip-pqc
uv pip install cyclonedx-bom
cyclonedx-py environment -o docs/compliance/sbom/sbom-pip.cyclonedx.json

# Python (license table only):
uv pip install pip-licenses
pip-licenses --format=json --with-urls --with-authors \
  > docs/compliance/sbom/pip-licenses.json

# Flutter:
dart pub global activate cyclonedx_dart
cd app && cyclonedx_dart -o ../docs/compliance/sbom/sbom-flutter.cyclonedx.json
```

## License Summary — Rust Workspace (671 packages)

| Count | License expression |
|-------|--------------------|
| 308 | MIT OR Apache-2.0 |
| 152 | MIT |
| 49 | Apache-2.0 OR MIT |
| 43 | MIT/Apache-2.0 |
| 18 | Unicode-3.0 |
| 15 | Apache-2.0 WITH LLVM-exception OR Apache-2.0 OR MIT |
| 13 | Zlib OR Apache-2.0 OR MIT |
| 10 | Apache-2.0 |
| 6 | Unlicense OR MIT |
| 6 | BSD-3-Clause |
| 5 | MPL-2.0 |
| 5 | Apache-2.0/MIT |
| 4 | Apache-2.0 OR ISC OR MIT |
| 3 | UNKNOWN (manual review: allo-isolate, rust_lib_zipminator, zipminator-fuzz) |
| 2 | CDLA-Permissive-2.0 (webpki-roots — permissive data license) |
| 2 | BSL-1.0 variant (ryu — Apache-2.0 OR BSL-1.0; BSL is permissive for production use) |
| 1 | ISC AND (Apache-2.0 OR ISC) AND OpenSSL (aws-lc-sys) |
| 1 | (MIT OR Apache-2.0) AND NCSA (libfuzzer-sys — dev/test only) |

## Flagged Licenses — Action Required

| Package | License | Action |
|---------|---------|--------|
| `cssparser` 0.29.6 | MPL-2.0 | Used by Servo/WebKit rendering in `zipbrowser`. File-level copyleft. Review if zipbrowser ships binary. |
| `cssparser-macros` 0.6.1 | MPL-2.0 | Same as above. |
| `dtoa-short` 0.3.5 | MPL-2.0 | Review usage scope. |
| `option-ext` 0.2.0 | MPL-2.0 | Review usage scope. |
| `selectors` 0.24.0 | MPL-2.0 | Same as cssparser above. |
| `aws-lc-sys` 0.38.0 | ISC AND (Apache-2.0 OR ISC) AND OpenSSL | OpenSSL license is permissive but not OSI-approved. Acceptable for commercial use; note in NOTICE. |
| `libfuzzer-sys` 0.4.12 | (MIT OR Apache-2.0) AND NCSA | Dev/fuzz crate only — not shipped in production binaries. NCSA is permissive. |
| `webpki-roots` 0.26/1.0 | CDLA-Permissive-2.0 | Mozilla root certs. Data license; permissive for use. |
| `allo-isolate` 0.1.27 | UNKNOWN | Verify on crates.io; likely MIT. |
| `rust_lib_zipminator` 0.1.0 | UNKNOWN | Internal Flutter-Rust bridge crate. Set license in its Cargo.toml. |
| `zipminator-fuzz` 0.0.0 | UNKNOWN | Fuzzing harness, not shipped. Set license. |
