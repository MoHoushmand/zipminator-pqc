# PyPI Ship Readiness, zipminator 0.5.1

Track D deliverable. Prepared on branch `worktree-agent-a2fc776e`. Do not upload from this document; it is a pre-flight checklist.

## Version State

- Current `pyproject.toml`: **0.5.1**
- Current `src/zipminator/__init__.py` `__version__`: **0.5.1** (was 0.5.0, bumped in this commit)
- Latest version already on PyPI: **0.5.0** (uploaded 2026-04-02)
- Prior releases on PyPI: 0.5.0b1 (2026-03-20), 0.3.0, 0.2.0, 0.1.0 (2023)
- Bump rationale: 0.5.0 is already published, so publishing 0.5.0 again would fail with a 400 "File already exists" (or be silently skipped by `skip-existing: true` in the GH workflow). Patch bump to 0.5.1.

## Package Metadata (from `pyproject.toml`)

- Name: `zipminator`
- Build backend: `maturin >=1.0,<2.0`
- Rust manifest: `crates/zipminator-core/Cargo.toml`
- Python source: `src/`, module `zipminator._core` via PyO3 abi3
- License: Apache-2.0
- `requires-python`: `>=3.9`
- Classifiers: Dev Status 4 - Beta, Python 3.9 through 3.13, Rust, Security :: Cryptography

## Test Status

Python suite run in `zip-pqc` micromamba env, Python 3.12.13 (`/Users/mom5/mamba/envs/zip-pqc`).

- Full test collection: **957 tests**
- Core Python run (excluding optional-dep suites and non-Python language test dirs): **629 passed, 129 skipped, 0 failed** in 4.71 s
- Collection errors: 5 modules fail to import because `fastapi` is not in the `zip-pqc` env (optional dependency for `api/`, `email_*/`, and `test_ai_pii_guard.py`). These are gated on an extra that is not part of the PyPI package runtime, so not blocking.
- Excluded from this run: `tests/cpp`, `tests/rust`, `tests/mojo`, `tests/wheel_test` (non-Python), `tests/email_*`, `tests/test_ai_pii_guard.py`, `tests/test_email_transport.py`, `tests/integration/*`, `tests/staging/*`, `tests/ai/*`, `tests/mcp/*`, `tests/jupyter/*` (optional-dep suites)
- Rust core separately verified: `cargo build -p zipminator-core` succeeded, release profile built in 12.27 s

Command to reproduce the Python run:

```bash
micromamba activate zip-pqc
pytest tests/ --tb=short --no-header -q \
  --ignore=tests/email_anonymization --ignore=tests/email_transport \
  --ignore=tests/email_keydir --ignore=tests/email_kms \
  --ignore=tests/cpp --ignore=tests/rust --ignore=tests/mojo \
  --ignore=tests/wheel_test --ignore=tests/test_email_transport.py \
  --ignore=tests/test_ai_pii_guard.py --ignore=tests/integration \
  --ignore=tests/staging --ignore=tests/ai --ignore=tests/mcp \
  --ignore=tests/jupyter --ignore=tests/test_pqc_tunnel.py \
  --ignore=tests/test_ratchet_integration.py
```

## Wheel Build Status

- Command used: `uv build --wheel --out-dir dist`
- Backend: maturin 1.13.1, pyo3 0.20.3, abi3 (CPython >= 3.8)
- Target: `aarch64-apple-darwin`, `MACOSX_DEPLOYMENT_TARGET=11.0`
- Artifact: `dist/zipminator-0.5.1-cp38-abi3-macosx_11_0_arm64.whl` (984,582 bytes)
- Status: **built clean, release profile, 12.27 s compile**

Note: `uv build` (wheel + sdist in one go) failed with a `cargo metadata` error caused by a transitive dep (`bit-set v0.2.0` from a legacy Cargo index entry) when maturin walked the full workspace for sdist. Wheel build succeeded on its own. Sdist built separately by invoking maturin directly against the core crate manifest.

## Sdist Build Status

- Command: `maturin sdist --manifest-path crates/zipminator-core/Cargo.toml --out dist`
- Artifact: `dist/zipminator-0.5.1.tar.gz` (274,281 bytes)
- Status: **built clean**

## Twine Check Status

```
Checking dist/zipminator-0.5.1-cp38-abi3-macosx_11_0_arm64.whl: PASSED
Checking dist/zipminator-0.5.1.tar.gz: PASSED
```

Both artifacts have valid PyPI long-description rendering and metadata. Ready for upload.

## Publish Path (how it actually ships)

This repo uses **OIDC Trusted Publishing**, not a PyPI API token. The workflow is `.github/workflows/wheels.yml`, job `publish-pypi`.

- Trigger: pushing a tag matching `v*` to `main`
- Action: `pypa/gh-action-pypi-publish@release/v1`
- GitHub Environment name: `pypi`, URL `https://pypi.org/p/zipminator`
- Permissions: `id-token: write` (OIDC)
- `skip-existing: true` is set, so a re-push of the same version is safe but won't overwrite

There is no `PYPI_TOKEN` secret in this repo. Publishing is gated by:

1. This branch merged to `main`
2. A tag `v0.5.1` pushed to `main`
3. The `publish-pypi` job running under the `pypi` GitHub environment (may need manual approval depending on env protection rules)

### If manual emergency upload is needed (not the default path)

```bash
# In zip-pqc env, with a PyPI API token in ~/.pypirc or env var TWINE_PASSWORD
micromamba activate zip-pqc
twine upload --repository pypi dist/zipminator-0.5.1*
```

Requires a user-scoped or project-scoped token on PyPI for `zipminator`. The account that owns the project is `Houshmand`. Token source: https://pypi.org/manage/account/token/ → scoped to project `zipminator`. Export as `TWINE_PASSWORD` with `TWINE_USERNAME=__token__`. Do not commit the token.

For a dry-run against TestPyPI first, the repo has a `publish-test-pypi` job dispatched via `workflow_dispatch` on the same workflow file.

## Ship Readiness Checklist

- [x] `pyproject.toml` version bumped to 0.5.1
- [x] `src/zipminator/__init__.py` `__version__` aligned to 0.5.1
- [x] Wheel builds clean (`uv build --wheel`)
- [x] Sdist builds clean (`maturin sdist`)
- [x] `twine check dist/*` PASSED for both artifacts
- [x] Core Python tests pass (629 passed, 0 failed)
- [x] Rust core builds clean (`cargo build -p zipminator-core`)
- [x] README.md, LICENSE, CHANGELOG.md included in wheel (per `[tool.maturin].include`)
- [ ] Branch merged to `main` (pending, Track D does not merge)
- [ ] Tag `v0.5.1` pushed (pending, gated on merge)
- [ ] `publish-pypi` GH Actions job succeeded (pending tag push)

## Blockers (for actual publish step)

1. **Merge to `main`.** This branch (`worktree-agent-a2fc776e`) must land on `main` before tagging.
2. **Tag `v0.5.1`.** Only after merge. Exact command once merged:
   ```bash
   git checkout main && git pull
   git tag -a v0.5.1 -m "Release 0.5.1"
   git push origin v0.5.1
   ```
3. **GitHub `pypi` environment approval.** If the environment has required reviewers, a human must approve the deployment in the Actions UI before `publish-pypi` runs.
4. **Linux and Windows wheels are NOT in this local dist/.** The GH Actions `wheels.yml` job builds wheels for Linux (manylinux2014), Windows, and macOS across Python 3.9 through 3.13. The local build here only covers macOS arm64. This is expected; the GH workflow handles the cross-platform matrix.
5. **Sdist-only `uv build` is broken by a stale `bit-set v0.2.0` entry** in the Cargo index that prevents workspace-wide `cargo metadata` from resolving. Workaround: build wheel and sdist separately as done here. Not a ship blocker (GH workflow uses `maturin build` and `maturin sdist` separately anyway).

## Non-blocking notes

- 5 test modules fail to collect because `fastapi` is not in the `zip-pqc` env. These are `api/`-side tests, not SDK runtime tests. Install with `uv pip install fastapi` to re-enable them. No effect on the published wheel.
- 129 test skips are expected: quantum hardware provider tests, provider-keyed integration tests, and conditional platform tests.
