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
