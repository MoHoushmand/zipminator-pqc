# Mobile Release Playbook (Flutter canonical)

Audience: single maintainer shipping the Zipminator Flutter app under `app/`.
Scope: Android Play Store AAB + iOS TestFlight builds. Cadence: per marathon
mobile track, or on demand for a hotfix.

The legacy Expo project under `mobile/` is NOT canonical and is out of scope
for this playbook.

## Release checklist (RELEASE_CHECKLIST)

Run top to bottom. Any failing gate aborts the release.

1. `cd app && flutter pub get`
2. `flutter analyze` clean
3. `flutter test` green (includes `test/release_version_test.dart` version gate)
4. Bump `pubspec.yaml` `version:` field. Semver + build number are both required.
   - The version gate test enforces strict monotonic increase over the last
     shipped `0.5.0+44`.
5. Verify `ios/Runner/Info.plist` reads `$(FLUTTER_BUILD_NAME)` /
   `$(FLUTTER_BUILD_NUMBER)`; do NOT hardcode.
6. Android release signing config is present (see "Android signing").
7. Build Android AAB: `flutter build appbundle --release`
8. Verify AAB with bundletool (see "Play Store dry-run").
9. Build iOS archive: `flutter build ipa --release --export-options-plist ios/ExportOptions.plist`
10. Upload with Transporter or `xcrun altool` (manual step, not scripted here).
11. Tag the commit: `git tag vX.Y.Z+N && git push --tags` (only when user approves).
12. Append release entry to `CHANGELOG.md`.

## Version policy

- Version format: `major.minor.patch+buildNumber`, e.g. `0.5.1+45`
- `pubspec.yaml` is the single source of truth.
- Android `versionCode` = `buildNumber`; max 2_100_000_000 (Play Store limit).
- iOS `CFBundleVersion` = `buildNumber`; iOS TestFlight rejects builds with
  lower build numbers than previously uploaded.
- The TDD gate lives in `app/test/release_version_test.dart`.

## Android signing

Release builds are signed via `android/key.properties` (never committed).

Template: `android/key.properties.example`.

Required env vars or file contents:

```
storePassword=<keystore password>
keyPassword=<key password>
keyAlias=zipminator-key
storeFile=/absolute/path/to/zipminator-release.jks
```

Generate the keystore once, keep it in a password-manager-backed vault:

```bash
keytool -genkey -v -keystore ~/zipminator-release.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias zipminator-key
```

If `key.properties` is missing, `android/app/build.gradle.kts` falls back to
debug signing. This is safe for local smoke builds; it is NOT acceptable for
a Play Store upload.

## Build the Android AAB

```bash
cd app
flutter build appbundle --release
```

Artifact lands at: `app/build/app/outputs/bundle/release/app-release.aab`.

Typical build time on Apple Silicon (M-series) with cold cache: 5-15 minutes
because `flutter_rust_bridge` triggers a full `cargo build --release` for the
Rust crypto core.

## Play Store dry-run (no upload)

Install `bundletool` locally:

```bash
brew install bundletool
```

Verify AAB structure:

```bash
bundletool validate --bundle=app/build/app/outputs/bundle/release/app-release.aab
```

Generate a universal APK for smoke testing without touching the Play Console:

```bash
bundletool build-apks \
  --bundle=app/build/app/outputs/bundle/release/app-release.aab \
  --output=app/build/app/outputs/bundle/release/app-release.apks \
  --mode=universal
```

Extract the universal APK:

```bash
cd app/build/app/outputs/bundle/release
unzip -o app-release.apks -d app-release.apks.extracted
ls app-release.apks.extracted/universal.apk
```

Install on a connected device:

```bash
adb install -r app-release.apks.extracted/universal.apk
```

Do NOT push `*.aab`, `*.apks`, or extracted APKs to git. They are ignored by
`app/.gitignore` (under `/build/`).

## iOS TestFlight build

iOS requires Xcode 15+ and an Apple Developer account tied to
`com.qdaria.zipminator`.

```bash
cd app
flutter build ipa --release --export-options-plist ios/ExportOptions.plist
```

Artifact: `app/build/ios/ipa/zipminator.ipa`.

Upload options (pick one; both require valid signing certificates):

1. Transporter.app, drag the IPA in.
2. `xcrun altool --upload-app --type ios -f app/build/ios/ipa/zipminator.ipa \
      --apiKey $APPSTORE_API_KEY --apiIssuer $APPSTORE_ISSUER_ID`

The TestFlight build number is taken from `pubspec.yaml` via
`$(FLUTTER_BUILD_NUMBER)`, so the pubspec bump is sufficient.

## Release automation

`scripts/release-mobile.sh` in the repo root chains `flutter pub get`,
`flutter analyze`, `flutter test`, and `flutter build appbundle --release`.
Run it from the repo root:

```bash
bash scripts/release-mobile.sh
```

The script does NOT upload. Uploads are manual to keep release gates in a
human-verified path.

## Prerequisites (Mac release host)

Install once:

1. Xcode full install (`xcode-select -p` must point at `/Applications/Xcode.app/...`, not `/Library/Developer/CommandLineTools`).
2. Android Studio + Android SDK (Platform API 34+, Build-Tools 34+).
3. `export ANDROID_HOME="$HOME/Library/Android/sdk"` in shell profile.
4. `flutter doctor` reports all green.
5. `brew install bundletool` for Play Store dry-run.
6. Apple Developer account + signing certificates installed in the login keychain.

A CI-style subagent host that lacks Android SDK or Xcode can still run the
`flutter analyze` and `flutter test` gates; the AAB and IPA builds will fail
early with a clear error and no partial artifacts.

## Known gotchas

- First-time `flutter pub get` on a fresh worktree may fail with
  `No file or variants found for asset: .env`. Create an empty `app/.env`
  placeholder. Real values are injected at build time via CI env vars.
- `flutter_rust_bridge` cargo build can exceed the default 2-minute shell
  timeout. Always budget 15 minutes for a clean release AAB build.
- Android `minSdk` is inherited from Flutter; the Play Console rejects AABs
  below API 21. Verify with `grep minSdk android/app/build.gradle.kts` if
  the Play Store flags a mismatch.
- iOS archive requires Apple Developer Team ID in `ios/Runner.xcodeproj`
  build settings. A missing team ID surfaces as "No signing identity found".
- Running `flutter build appbundle` without the Android SDK aborts with
  "No Android SDK found. Try setting the ANDROID_HOME environment variable."
  This is a pre-check failure, not a partial build; no cleanup needed.
