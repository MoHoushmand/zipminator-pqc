# Changelog

All notable changes to the Zipminator Flutter mobile app are recorded here. The
canonical pillar-level status lives in `docs/guides/FEATURES.md`.

## 0.5.1+45

- Confirmed 60/60 Flutter widget + unit tests green on `cd app && flutter test`.
- Static scan: 72 `test(...)` / `testWidgets(...)` invocations across 13 test
  files under `app/test/`. The delta versus the 60 passing-count reflects
  grouped tests and shared setup.
- iOS TestFlight lane wired via `.github/workflows/testflight.yml` with
  `app/ios/fastlane` (`bundle exec fastlane verify` then `bundle exec fastlane
  beta`). Gated by repository variable `IOS_TESTFLIGHT_ENABLED=true`.
- Version pinned at `0.5.1+45` in `app/pubspec.yaml`; CFBundleVersion on iOS is
  overridden by `BUILD_NUMBER=${{ github.run_number }}` from CI.
- Release gate documented in `docs/guides/FEATURES.md` under the new "Mobile
  Release Gate" section (4 gates: tests, version, CHANGELOG entry, TestFlight
  workflow green).

## 0.5.0+44

- Previous TestFlight build on record. No separate CHANGELOG entry was
  maintained at that time; see git history and `_archive/marathon/` progress
  logs for build-level detail.
