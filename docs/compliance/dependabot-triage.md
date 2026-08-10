# Dependabot Triage — 2026-06-03

Track Sec, marathon program. Triage only — **no PRs merged.** Recommendations for
the user. Source: `gh pr list` + `gh pr checks` against `MoHoushmand/zipminator-pqc`.

## Open Dependabot PRs (6)

| PR | Branch | Bump | Ecosystem | CI | Class |
|----|--------|------|-----------|----|-------|
| #10 | `…/docker/build-push-action-7` | docker/build-push-action 5→7 | GitHub Actions | all fail | safe-auto-merge* |
| #11 | `…/metcalfc/changelog-generator-4.7.0` | changelog-generator 4.3.1→4.7.0 | GitHub Actions | all fail | safe-auto-merge* |
| #12 | `…/docker/metadata-action-6` | docker/metadata-action 5→6 | GitHub Actions | all fail | safe-auto-merge* |
| #14 | `…/actions/upload-pages-artifact-5` | upload-pages-artifact 3→5 | GitHub Actions | all fail | safe-auto-merge* |
| #15 | `…/actions/deploy-pages-5` | deploy-pages 4→5 | GitHub Actions | all fail | safe-auto-merge* |
| #17 | `…/npm_and_yarn/demo/react-dom-19.2.6` | react-dom 18.3.1→19.2.6 in `/demo` | npm (demo) | all fail | needs-review |

\* "safe-auto-merge" = the bump itself is low-risk (pinned GitHub Action major
bumps that don't touch product code). **But every PR currently has failing CI**
(see below), so none can be merged on green right now.

### CI status (the blocker)
All 6 PRs show **all checks failing**, including jobs that the bumps cannot
affect (Build Rust Workspace, Build Wheels, Code Coverage, Jupyter Book). The
failures complete in seconds-to-low-minutes, indicating **pre-existing CI
breakage on the base branch**, not breakage introduced by the dependency bumps.
The action-version bumps (#10–#15) don't touch the failing Rust/Python/wheel
jobs at all. PR #17's `Dependency Review` and `Dependency Health` checks also
fail, which warrants a look but is likely the same base-branch breakage.

**Therefore: fix base-branch CI first; do not force-merge red PRs.**

## Recommended merge order (after CI is green)

1. **Fix base-branch CI** (out of scope here) so check status becomes meaningful.
2. **GitHub Actions major bumps — #10, #12, #14, #15, #11** (batch). These are
   the lowest-risk and unblock the supply chain of the workflows themselves
   (`build-push-action`, `metadata-action`, `upload-pages-artifact`,
   `deploy-pages`, `changelog-generator`). Merge oldest-first; rebase each on the
   updated default branch; merge only on green. `@dependabot squash and merge`
   per PR, or enable auto-merge for the `github-actions` ecosystem.
3. **#17 react-dom 18.3.1→19.2.6 in `/demo` — needs-review.** This is a React
   **major** version jump (18→19), not a patch. React 19 has breaking changes
   (removed `ReactDOM.render`/`hydrate` legacy APIs, ref-as-prop, stricter
   effects). It only affects `/demo`, which is isolated from the product, but it
   should be reviewed and the demo build/tested before merge, not auto-merged.

## Higher-priority config gap (blocks effective triage)

`.github/dependabot.yml` points at **directories that no longer match the repo
layout**, so Dependabot is not scanning the production code:

| Configured ecosystem/dir | Reality | Effect |
|--------------------------|---------|--------|
| `cargo` `/src/rust` | actual Rust workspace is `crates/` (+ `browser/src-tauri`, `app/rust`) | Rust crypto crates **not scanned** |
| `cargo` `/cli`, `/compliance/nist-kat` | not the current layout | no PRs |
| `pip` `/cli` | Python SDK lives in `src/zipminator/` (+ `api/`) | Python deps **not scanned** |
| `npm` `/demo` | the production web app is `web/` | **`web/` (next@15.5.15) not scanned** |
| `github-actions` `/` | correct | the only working set |
| `docker` `/docker` | correct | working |

This is why all open Dependabot PRs are Actions/docker/demo only and **none of
the HIGH findings in `security-audit-20260603.md` (next, pyo3, rustls, the
gemini-flow tree) surfaced as a Dependabot PR.** Dependabot is effectively blind
to the product.

**Recommended `dependabot.yml` correction (user to apply):**
- `cargo` → `directory: "/"` (workspace root scans all members) or one entry per
  active crate (`/crates/zipminator-core`, `/crates/pq-wireguard`,
  `/browser/src-tauri`, `/app/rust`).
- `npm` → add `directory: "/web"` (and keep/remove `/demo` as desired).
- `pip` → `directory: "/"` or `/api` and the SDK root, wherever
  `requirements.txt`/`pyproject.toml` live.
- Keep the existing `github-actions` `/` and `docker` `/docker` entries.

Once corrected, expect new Dependabot PRs for `next`, `ws`, `postcss`, the Rust
TLS stack, and `pyo3`, which should then be triaged with the same class scheme
(patch/minor transitive → auto; major / crypto / direct → review).

No PRs were merged, closed, or rebased.
