# Mobile Ship Readiness (Flutter to TestFlight)

Ship-readiness state for the Flutter app at `app/` targeting iOS TestFlight
distribution. Android Play Store is out of scope for this document.

## Version

`app/pubspec.yaml` pins `version: 0.5.0+44`, matching the CHANGELOG.
Flutter injects `CFBundleShortVersionString=0.5.0` and `CFBundleVersion=44`
into the iOS bundle during `flutter build`. TestFlight rejects duplicate
`+build` numbers for a given `x.y.z` release, so bump the `+N` before
tagging the next release.

## Workflow

Workflow file: `.github/workflows/testflight.yml`
Runner: `macos-14`, 60 min timeout

### Triggers

- Push a tag matching `v*` on the default branch, e.g. `git tag v0.5.0 && git push origin v0.5.0`
- Manual `workflow_dispatch` from GitHub Actions UI (recovery path if a tag-push run fails)

### Steps

1. `actions/checkout@v4`
2. `subosito/flutter-action@v2` on stable channel
3. `ruby/setup-ruby@v1` at 3.2, bundler cache disabled (cache done separately)
4. `dtolnay/rust-toolchain@stable` (flutter_rust_bridge needs cargo)
5. Caches: Cargo, Flutter pub cache, fastlane vendor/bundle
6. `flutter pub get` (in `app/`)
7. `pod install` (in `app/ios/`)
8. `bundle install --gemfile=app/ios/Gemfile`
9. `bundle exec fastlane beta` (in `app/ios/`)

### Fastlane beta lane

`app/ios/fastlane/Fastfile` lane `beta`:

1. `setup_ci` when `CI=true` (creates temporary keychain)
2. `app_store_connect_api_key` with the three `ASC_*` env vars (base64-decoded `.p8`)
3. `match(type: "appstore", readonly: true)` fetches signing certs and profile from the private certs repo
4. `flutter build ipa --release --export-method=app-store` (run from `app/`)
5. `pilot` uploads the `.ipa` with `skip_waiting_for_build_processing: true`

Apple post-upload processing takes 10 to 30 minutes before the build
surfaces in the TestFlight tab.

## Required GitHub Actions Secrets

Configure under Settings, Secrets and variables, Actions in the repo that
hosts the workflow (`QDaria/zipminator` or `QDaria/zipminator-pqc`).

| Secret | Purpose | How to obtain |
|---|---|---|
| `ASC_API_KEY_ID` | 10-char Key ID for the App Store Connect API key | App Store Connect, Users and Access, Integrations, App Store Connect API, Keys. Create with `App Manager` role. |
| `ASC_API_KEY_ISSUER_ID` | UUID Issuer ID that owns the API key (BLOCKER, see below) | Same page, shown at the top of the Keys tab as `Issuer ID`. |
| `ASC_API_KEY_CONTENT` | Base64 of the `AuthKey_<KEYID>.p8` file | Download the `.p8` once from App Store Connect, then `base64 -i AuthKey_XXXX.p8 \| pbcopy` on macOS, or `base64 -w0 AuthKey_XXXX.p8` on Linux. |
| `MATCH_GIT_URL` | SSH or HTTPS URL of the private certs repo | Create a private repo (suggested: `QDaria/certificates`). Run `bundle exec fastlane match init` locally to seed. |
| `MATCH_PASSWORD` | Passphrase encrypting the certs repo contents | Chosen during first `fastlane match init`. Store in a password manager. |
| `FASTLANE_APPLE_APPLICATION_SPECIFIC_PASSWORD` | Backup credential for the Transporter fallback path | Generate at appleid.apple.com, Sign-In and Security, App-Specific Passwords. Label `fastlane CI`. |

## Blockers Before First Run

### External (require Mo or Apple Developer Portal access)

1. `ASC_API_KEY_ISSUER_ID` (the pending ISSUER_ID). App Store Connect, Users
   and Access, Integrations tab shows this; it is a UUID like
   `57246542-96fe-1a63-e053-0824d011072a`. Without it, `fastlane pilot` cannot
   authenticate and the workflow fails at the first App Store Connect API call.
2. `itc_team_id` in `app/ios/fastlane/Appfile` still holds `TODO_ITC_TEAM_ID`.
   Fill with the numeric App Store Connect team ID from Users and Access,
   shown next to the team name. This is distinct from the Developer Portal
   `team_id` (already set to `5EK49H64WB`, sourced from
   `app/ios/ExportOptions.plist`).
3. Private certs repo for `match` must be created. The workflow reads
   `MATCH_GIT_URL` from secrets; the value has to point at an accessible
   repo (SSH deploy key or HTTPS token). Suggested location:
   `QDaria/certificates`.
4. `fastlane match init` must be run once locally to seed the certs repo with
   an `appstore` distribution certificate and a provisioning profile for
   `com.qdaria.zipminator`.
5. `app/ios/fastlane/Matchfile` currently has
   `git_url("TODO: replace with private certs repo ...")` as a literal
   placeholder. Once the certs repo exists, replace the placeholder with the
   real URL so `match` does not fall back to the secret (the secret is
   authoritative in CI, but local runs need the Matchfile value).

### Secrets to register (all 6 rows in the table above)

None are registered yet. Registration is a one-time action and does not
require any code change.

## Manual Fallback

If the CI pipeline blocks and a build must ship immediately, the manual path
is:

```bash
# 1. Build the IPA locally (requires Xcode, CocoaPods, matching signing certs in Keychain)
cd app
flutter build ipa --release --export-method=app-store

# 2. Upload via Transporter.app (GUI)
# Drop the .ipa from app/build/ios/ipa/ into Transporter and hit Deliver.

# 3. Or upload via altool (CLI; requires FASTLANE_APPLE_APPLICATION_SPECIFIC_PASSWORD)
xcrun altool --upload-app \
  --type ios \
  --file app/build/ios/ipa/Runner.ipa \
  --username mo@qdaria.com \
  --password "$FASTLANE_APPLE_APPLICATION_SPECIFIC_PASSWORD"
```

Caveats for the manual path:

- Requires a local macOS machine with Xcode fully installed and an iOS
  distribution certificate in the login Keychain matching the bundle ID
  `com.qdaria.zipminator`.
- Requires a provisioning profile for `com.qdaria.zipminator` with the
  App Store distribution type. Download from Apple Developer Portal or let
  Xcode generate it automatically when the team is set.
- Apple-ID 2FA does not apply when using an app-specific password, but the
  local machine must be known to Apple.

## Dry-run Status (local)

Local `flutter build ios --release --no-codesign` fails on this machine
because `flutter doctor -v` reports:

- `[x] Xcode`: incomplete installation (stub dev tools only)
- `[x] CocoaPods`: not installed

Both are pre-provisioned on the `macos-14` GitHub runner, so a failed
local dry-run is not a signal about CI health. To run the build locally
before the first tag push, install Xcode from the App Store and then:

```bash
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
sudo xcodebuild -runFirstLaunch
brew install cocoapods
cd app && flutter pub get && cd ios && pod install && cd .. && flutter build ios --release --no-codesign
```

Expected first-success output ends with
`Built build/ios/iphoneos/Runner.app` and exits 0.

## Build Artifact Path

- Flutter produces `app/build/ios/ipa/Runner.ipa` from
  `flutter build ipa --release --export-method=app-store`
- Fastlane `pilot` uploads that IPA to TestFlight
- Apple processes 10 to 30 minutes
- Build appears in App Store Connect, TestFlight, iOS Builds with status
  `Processing` then `Ready to Submit` or `Ready to Test`

## Summary

Workflow is wired. Appfile has the Developer Portal team ID. Trigger covers
both tag pushes and manual dispatch. Beyond the 6 GitHub secrets, the only
remaining edits are 2 TODOs in Appfile/Matchfile and running
`fastlane match init` against a freshly-created private certs repo. All of
those are external actions that require Mo's Apple Developer credentials,
so the code side is ship-ready contingent on those inputs.
