#!/usr/bin/env bash
# release-mobile.sh
# Bundles the pre-upload release gates and Android AAB build for the Flutter
# canonical app (`app/`). Does NOT upload to Play Store or TestFlight.
#
# Usage:
#   bash scripts/release-mobile.sh                 # full gate + AAB
#   bash scripts/release-mobile.sh --skip-aab      # gates only
#   bash scripts/release-mobile.sh --ios           # gates + ipa (requires Xcode)
#
# Exit codes:
#   0 success, gates green and artifacts produced
#   1 gate failure (analyze, test, or version bump)
#   2 build failure (AAB or IPA)
#   3 environment missing (no Android SDK, no Xcode, no flutter)

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_DIR="$REPO_ROOT/app"

SKIP_AAB=0
BUILD_IOS=0
for arg in "$@"; do
  case "$arg" in
    --skip-aab) SKIP_AAB=1 ;;
    --ios) BUILD_IOS=1 ;;
    -h|--help)
      sed -n '2,16p' "$0"
      exit 0
      ;;
    *)
      echo "unknown flag: $arg" >&2
      exit 1
      ;;
  esac
done

log() { printf '[release-mobile] %s\n' "$*"; }

if ! command -v flutter >/dev/null 2>&1; then
  log "flutter not in PATH; install from https://docs.flutter.dev/get-started/install"
  exit 3
fi

cd "$APP_DIR"

log "flutter pub get"
flutter pub get

log "flutter analyze (scoped to lib/ + test/, fatal on errors only)"
# Scope analyze to lib/ and test/ so vendored cargokit noise does not gate release.
# --no-fatal-warnings --no-fatal-infos keeps the gate at error-level so
# release is not blocked by pre-existing style lints. Fix those separately.
if ! flutter analyze --no-fatal-warnings --no-fatal-infos lib test; then
  log "analyze reported errors in lib/ or test/, abort"
  exit 1
fi

log "flutter test"
if ! flutter test; then
  log "test failed, abort"
  exit 1
fi

if [ "$SKIP_AAB" -eq 1 ]; then
  log "gates green; --skip-aab supplied, stopping here"
  exit 0
fi

if ! command -v sdkmanager >/dev/null 2>&1 && [ -z "${ANDROID_HOME:-}" ]; then
  log "ANDROID_HOME unset and sdkmanager missing; cannot build AAB"
  log "gates green; AAB step skipped. Install Android SDK then re-run."
  exit 3
fi

log "flutter build appbundle --release"
if ! flutter build appbundle --release; then
  log "AAB build failed"
  exit 2
fi

AAB="$APP_DIR/build/app/outputs/bundle/release/app-release.aab"
if [ ! -f "$AAB" ]; then
  log "AAB missing at expected path: $AAB"
  exit 2
fi
log "AAB ready: $AAB"

if command -v bundletool >/dev/null 2>&1; then
  log "bundletool validate"
  bundletool validate --bundle="$AAB"
else
  log "bundletool not installed; skipping validate (brew install bundletool)"
fi

if [ "$BUILD_IOS" -eq 1 ]; then
  if ! xcodebuild -version >/dev/null 2>&1; then
    log "Xcode missing; cannot build IPA"
    exit 3
  fi
  log "flutter build ipa --release --export-options-plist ios/ExportOptions.plist"
  if ! flutter build ipa --release --export-options-plist ios/ExportOptions.plist; then
    log "IPA build failed"
    exit 2
  fi
  log "IPA ready: $APP_DIR/build/ios/ipa/"
fi

log "release gates green; artifacts ready for manual upload"
