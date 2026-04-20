//! Track B mobile configuration contract tests.
//!
//! Purpose: pin the Tauri 2.x frontendDist contract and the mobile target
//! schema so that `cargo test -p zipbrowser` fails loudly the moment the
//! build stub is lost or the mobile config drifts out of schema shape.
//!
//! CI expectation: before running tests, either run the web build
//! (`cd browser && npm run build`) or keep the committed `browser/dist`
//! stub (`.gitkeep` + `index.html`) in place. The Tauri 2.x generator in
//! `tauri_build::build()` panics when `build.frontendDist` is missing or
//! empty; this file locks that invariant as a test, not a runtime surprise.
//!
//! Mobile config discovery note: Tauri 2.x auto-merges
//! `tauri.android.conf.json` / `tauri.ios.conf.json` at build time. The
//! name `tauri.conf.mobile.json` is NOT auto-discovered; it is a
//! deliberate single-file mobile override invoked via
//! `tauri android build --config tauri.conf.mobile.json` (and the iOS
//! equivalent). Keep that contract stable so CI wiring can pin it.
//!
//! Scope: read-only file inspection. These tests do not spawn the Tauri
//! mobile harness; full round-trip is covered by `tests/browser-mobile/`.

use std::path::{Path, PathBuf};

fn tauri_dir() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
}

fn read_json(path: &Path) -> serde_json::Value {
    let text = std::fs::read_to_string(path)
        .unwrap_or_else(|e| panic!("read {path:?}: {e}"));
    serde_json::from_str(&text)
        .unwrap_or_else(|e| panic!("parse {path:?} as JSON: {e}"))
}

#[test]
fn desktop_config_frontend_dist_exists() {
    let conf_path = tauri_dir().join("tauri.conf.json");
    let conf = read_json(&conf_path);

    let frontend_dist = conf["build"]["frontendDist"]
        .as_str()
        .expect("build.frontendDist must be a string");
    let resolved = tauri_dir().join(frontend_dist);
    assert!(
        resolved.exists(),
        "frontendDist {frontend_dist} -> {resolved:?} must exist; \
         run the web build or keep the dist stub (.gitkeep + index.html)"
    );
    assert!(
        resolved.is_dir(),
        "frontendDist {resolved:?} must be a directory, not a file"
    );

    let entry = resolved.join("index.html");
    assert!(
        entry.exists(),
        "frontendDist must contain index.html; the Tauri 2.x generator \
         panics without a frontend entry point"
    );
    let entry_text = std::fs::read_to_string(&entry)
        .unwrap_or_else(|e| panic!("read {entry:?}: {e}"));
    assert!(
        !entry_text.trim().is_empty(),
        "{entry:?} must not be empty; Tauri expects a non-empty HTML document"
    );
    assert!(
        entry_text.to_lowercase().contains("<html"),
        "{entry:?} must contain an <html ...> tag; got head: {:?}",
        entry_text.chars().take(80).collect::<String>()
    );
}

#[test]
fn desktop_config_identifier_and_product_name() {
    // Guard against accidental rename that would break bundle signing and
    // mobile app store identifiers downstream.
    let conf = read_json(&tauri_dir().join("tauri.conf.json"));
    assert_eq!(
        conf["identifier"].as_str(),
        Some("com.qdaria.zipminator"),
        "identifier drift breaks macOS / Android / iOS bundle identity"
    );
    assert_eq!(
        conf["productName"].as_str(),
        Some("Zipminator"),
        "productName drift breaks app-store listings"
    );
}

// --- Mobile config contract (EC1) -----------------------------------------
//
// The mobile override lives at `tauri.conf.mobile.json`. We assert only the
// schema *shape* (keys, types, minimum values that Tauri 2.x enforces) so
// future tuning of SDK minimums, version codes, or descriptions does not
// churn these tests. Anything that would break `tauri android/ios build
// --config tauri.conf.mobile.json` MUST fail here first.

fn mobile_config_path() -> PathBuf {
    tauri_dir().join("tauri.conf.mobile.json")
}

#[test]
fn mobile_config_parses_as_json() {
    let path = mobile_config_path();
    assert!(
        path.exists(),
        "tauri.conf.mobile.json must exist at {path:?}; EC1 requires a \
         committed mobile override invoked via --config"
    );
    // `read_json` panics with a clear message on parse failure.
    let _ = read_json(&path);
}

#[test]
fn mobile_config_identifier_matches_desktop() {
    // Bundle identifier drift across desktop and mobile breaks signing,
    // universal links, and App Store / Play Store listings.
    let desktop = read_json(&tauri_dir().join("tauri.conf.json"));
    let mobile = read_json(&mobile_config_path());
    assert_eq!(
        mobile["identifier"].as_str(),
        desktop["identifier"].as_str(),
        "mobile identifier must match desktop identifier"
    );
    assert_eq!(
        mobile["productName"].as_str(),
        desktop["productName"].as_str(),
        "mobile productName must match desktop productName"
    );
}

#[test]
fn mobile_config_bundle_android_shape() {
    let mobile = read_json(&mobile_config_path());
    let android = mobile["bundle"]["android"]
        .as_object()
        .expect("bundle.android must be a JSON object");

    // Tauri 2.x Android plugin requires `minSdkVersion` as a number and,
    // per NDK guidance, >= 24 for modern Rust toolchain compatibility.
    let min_sdk = android
        .get("minSdkVersion")
        .and_then(|v| v.as_u64())
        .expect("bundle.android.minSdkVersion must be a non-negative integer");
    assert!(
        min_sdk >= 24,
        "bundle.android.minSdkVersion must be >= 24 for Tauri 2.x mobile; got {min_sdk}"
    );

    // `versionCode` is required by Google Play; enforce integer shape.
    let version_code = android
        .get("versionCode")
        .and_then(|v| v.as_u64())
        .expect("bundle.android.versionCode must be a non-negative integer");
    assert!(
        version_code >= 1,
        "bundle.android.versionCode must be >= 1; Google Play rejects 0"
    );
}

#[test]
fn mobile_config_bundle_ios_shape() {
    let mobile = read_json(&mobile_config_path());
    // Tauri 2.x canonical key is "iOS" (capital I-O-S). "ios" silently
    // ignored by the generator, so pin the casing hard.
    let ios = mobile["bundle"]["iOS"]
        .as_object()
        .expect("bundle.iOS (capital I-O-S casing) must be a JSON object");

    let bundle_version = ios
        .get("bundleVersion")
        .and_then(|v| v.as_str())
        .expect("bundle.iOS.bundleVersion must be a string (Apple CFBundleVersion convention)");
    assert!(
        !bundle_version.trim().is_empty(),
        "bundle.iOS.bundleVersion must not be empty"
    );

    let min_sys = ios
        .get("minimumSystemVersion")
        .and_then(|v| v.as_str())
        .expect("bundle.iOS.minimumSystemVersion must be a string (Apple version convention)");
    assert!(
        !min_sys.trim().is_empty(),
        "bundle.iOS.minimumSystemVersion must not be empty"
    );
}

#[test]
fn mobile_config_frontend_dist_resolves_like_desktop() {
    // The mobile override shares the Vite build output with desktop so
    // CI only runs one web build. Drift here means a mobile build would
    // load a stale or missing frontend bundle.
    let desktop = read_json(&tauri_dir().join("tauri.conf.json"));
    let mobile = read_json(&mobile_config_path());

    let desktop_dist = desktop["build"]["frontendDist"]
        .as_str()
        .expect("desktop build.frontendDist must be a string");
    let mobile_dist = mobile["build"]["frontendDist"]
        .as_str()
        .expect("mobile build.frontendDist must be a string");
    assert_eq!(
        mobile_dist, desktop_dist,
        "mobile frontendDist must match desktop frontendDist so one web build serves both"
    );

    let resolved = tauri_dir().join(mobile_dist);
    assert!(
        resolved.is_dir(),
        "mobile frontendDist {mobile_dist} -> {resolved:?} must be an existing directory"
    );
}
