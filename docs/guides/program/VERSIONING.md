# Zipminator Versioning Scheme

Status: binding decision, 2026-05-30 (Track T0, full-program push).

## Scheme: per-artifact, independent

Zipminator ships several independently distributed artifacts. Each artifact is
versioned on its own track. A version bump in one artifact does NOT imply a bump
in any other. There is no single "Zipminator version".

| Artifact | Manifest | Current version | Distribution |
|----------|----------|-----------------|--------------|
| **Python SDK** | `pyproject.toml` (package `zipminator`) + `src/zipminator/__init__.py` `__version__` | **0.5.1** | PyPI |
| **Flutter app** | `app/pubspec.yaml` | **0.5.1+45** | App Store / TestFlight / Play Store |
| **Tauri browser** | `browser/src-tauri/tauri.conf.json` | **0.2.0** | Standalone desktop installer |

The Flutter `+45` suffix is the build number (independent of the `0.5.1`
semantic part). The app and SDK share the `0.5.1` semantic version today by
coincidence of cadence, not by rule; they may diverge in future releases.

## Python SDK version decision (binding)

- PyPI already has **0.5.0** published. PyPI releases are immutable, so 0.5.0
  cannot be re-uploaded or overwritten.
- The next safe SDK release is the patch **0.5.1**.
- `src/zipminator/__init__.py` `__version__` was already `0.5.1`. As of Track T0,
  `pyproject.toml` was reconciled from `1.0.0` to `0.5.1` so the build metadata,
  source `__version__`, and citation metadata all agree.
- `CITATION.cff` was aligned from `1.0.0-beta.1` to `0.5.1`.

The earlier `1.0.0` in `pyproject.toml` was an aspirational marketing version
that never shipped to PyPI; it would have produced a `zipminator-1.0.0` wheel
inconsistent with the `0.5.x` PyPI line and the source `__version__`.

## What is NOT covered by this SDK track

The following carry `1.0.0` (or other) versions that are deliberately on their
own tracks and were NOT changed by Track T0:

- `Cargo.toml` workspace `version = "1.0.0"` — Rust workspace crates.
- `config/pyproject.toml` (package `zipminator-pqc`, MIT) — alternate/legacy config snapshot, not the published `zipminator` SDK.
- `config/Cargo-cli.toml` / `config/npm-package.json` (`@qdaria/zipminator`) — CLI wrapper artifacts.
- `api/pyproject.toml` (`zipminator-api`) — FastAPI backend service.

If/when these are released, version each on its own track using the same
per-artifact principle.

## Release checklist (Python SDK)

1. Bump both `pyproject.toml` `version` and `src/zipminator/__init__.py` `__version__` to the new patch/minor (never re-use a published number).
2. Update `CITATION.cff` `version` to match.
3. `maturin build --release --sdist` and verify the wheel/sdist filenames carry the new version.
4. `twine upload` only after confirming the version is not already on PyPI.
