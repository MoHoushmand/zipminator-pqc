use serde::{Deserialize, Serialize};
use std::path::Path;
use std::sync::{Arc, Mutex};
use uuid::Uuid;

use zipbrowser::privacy::{PrivacyConfig, PrivacyEngine};

/// Security level of the current connection.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum SecurityLevel {
    /// Post-quantum TLS via the PQC proxy.
    Pqc,
    /// Standard classical TLS.
    Classical,
    /// No TLS (plain HTTP).
    None,
}

/// Proxy configuration for routing webview traffic through the PQC TLS proxy.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProxyConfig {
    pub host: String,
    pub port: u16,
    pub enabled: bool,
}

impl Default for ProxyConfig {
    fn default() -> Self {
        Self {
            host: "127.0.0.1".to_string(),
            port: 8443,
            enabled: false,
        }
    }
}

/// VPN connection status (mirrored in AppState for synchronous read by the status bar).
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct VpnState {
    pub connected: bool,
    pub server_location: Option<String>,
    pub protocol: Option<String>,
    pub uptime_secs: u64,
    /// When `true`, the VPN is configured to auto-connect on browser launch.
    #[serde(default)]
    pub always_on: bool,
}

/// QRNG entropy pool status.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
#[derive(Default)]
pub enum EntropyStatus {
    Available,
    Harvesting,
    Depleted,
    #[default]
    Unknown,
}

/// Bookmark entry.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Bookmark {
    pub id: String,
    pub url: String,
    pub title: String,
    pub created_at: String,
}

/// Mutable runtime configuration for privacy subsystem toggles.
///
/// `PrivacyConfig` (in `privacy::mod`) holds the static config; this struct
/// tracks user-facing toggles that the dashboard can flip at runtime.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PrivacyToggles {
    pub fingerprint_resistance: bool,
    pub cookie_rotation: bool,
    pub telemetry_blocking: bool,
    pub strict_pqc_mode: bool,
}

impl Default for PrivacyToggles {
    fn default() -> Self {
        Self {
            fingerprint_resistance: true,
            cookie_rotation: true,
            telemetry_blocking: true,
            strict_pqc_mode: false,
        }
    }
}

/// Full application state shared across Tauri commands.
pub struct AppState {
    pub tabs: Mutex<super::tabs::TabManager>,
    pub proxy_config: Mutex<ProxyConfig>,
    pub vpn_state: Mutex<VpnState>,
    pub entropy_status: Mutex<EntropyStatus>,
    pub bookmarks: Mutex<Vec<Bookmark>>,
    pub session_token: Mutex<String>,
    /// Privacy engine handle (entropy, session, fingerprint, cookies, vault, blocker, auditor).
    /// Initialized at app startup with the project root and vault path.
    pub privacy: Mutex<Option<Arc<PrivacyEngine>>>,
    pub privacy_toggles: Mutex<PrivacyToggles>,
}

impl std::fmt::Debug for AppState {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("AppState")
            .field("tabs", &"<TabManager>")
            .field("proxy_config", &self.proxy_config)
            .field("vpn_state", &self.vpn_state)
            .field("entropy_status", &self.entropy_status)
            .field("bookmarks", &"<bookmarks>")
            .field("session_token", &"<redacted>")
            .field("privacy", &self.privacy.lock().ok().map(|p| p.is_some()))
            .field("privacy_toggles", &self.privacy_toggles)
            .finish()
    }
}

impl AppState {
    pub fn new() -> Self {
        Self {
            tabs: Mutex::new(super::tabs::TabManager::new()),
            proxy_config: Mutex::new(ProxyConfig::default()),
            vpn_state: Mutex::new(VpnState::default()),
            entropy_status: Mutex::new(EntropyStatus::default()),
            bookmarks: Mutex::new(Vec::new()),
            session_token: Mutex::new(Uuid::new_v4().to_string()),
            privacy: Mutex::new(None),
            privacy_toggles: Mutex::new(PrivacyToggles::default()),
        }
    }

    /// Initialize the privacy engine and store it in `AppState`.
    ///
    /// Must be called once at startup, after the app data directory is known.
    /// Subsequent calls replace the engine (used by tests).
    pub fn init_privacy(&self, project_root: &Path, vault_path: &Path) {
        let engine = PrivacyEngine::init(project_root, vault_path, PrivacyConfig::default());
        if let Ok(mut guard) = self.privacy.lock() {
            *guard = Some(engine);
        }
    }

    /// Borrow the privacy engine.  Returns `None` if not initialized yet.
    pub fn privacy_engine(&self) -> Option<Arc<PrivacyEngine>> {
        self.privacy.lock().ok().and_then(|g| g.clone())
    }

    /// Generate a new session token. The privacy engine can override this
    /// to provide QRNG-seeded tokens.
    pub fn regenerate_session_token(&self) -> String {
        let new_token = Uuid::new_v4().to_string();
        if let Ok(mut token) = self.session_token.lock() {
            *token = new_token.clone();
        }
        new_token
    }

    /// Persist bookmarks to the app data directory.
    pub fn save_bookmarks(&self, app_data_dir: &std::path::Path) -> Result<(), String> {
        let bookmarks = self
            .bookmarks
            .lock()
            .map_err(|e| format!("Failed to lock bookmarks: {}", e))?;
        let path = app_data_dir.join("bookmarks.json");
        let data =
            serde_json::to_string_pretty(&*bookmarks).map_err(|e| format!("Serialize: {}", e))?;
        std::fs::write(&path, data).map_err(|e| format!("Write: {}", e))?;
        Ok(())
    }

    /// Load bookmarks from the app data directory.
    pub fn load_bookmarks(&self, app_data_dir: &std::path::Path) -> Result<(), String> {
        let path = app_data_dir.join("bookmarks.json");
        if !path.exists() {
            return Ok(());
        }
        let data = std::fs::read_to_string(&path).map_err(|e| format!("Read: {}", e))?;
        let loaded: Vec<Bookmark> =
            serde_json::from_str(&data).map_err(|e| format!("Deserialize: {}", e))?;
        let mut bookmarks = self.bookmarks.lock().map_err(|e| format!("Lock: {}", e))?;
        *bookmarks = loaded;
        Ok(())
    }
}

impl Default for AppState {
    fn default() -> Self {
        Self::new()
    }
}

// ── Tests ────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    #[test]
    fn appstate_starts_without_privacy_engine() {
        let s = AppState::new();
        assert!(s.privacy_engine().is_none());
    }

    #[test]
    fn init_privacy_populates_engine() {
        let s = AppState::new();
        let tmp = TempDir::new().unwrap();
        s.init_privacy(tmp.path(), &tmp.path().join("vault.json"));
        let engine = s.privacy_engine();
        assert!(engine.is_some(), "privacy engine should be populated");
    }

    #[test]
    fn privacy_toggles_default_safe() {
        let s = AppState::new();
        let toggles = s.privacy_toggles.lock().unwrap().clone();
        assert!(toggles.fingerprint_resistance);
        assert!(toggles.cookie_rotation);
        assert!(toggles.telemetry_blocking);
        assert!(!toggles.strict_pqc_mode);
    }

    #[test]
    fn privacy_engine_session_rotation_propagates() {
        let s = AppState::new();
        let tmp = TempDir::new().unwrap();
        s.init_privacy(tmp.path(), &tmp.path().join("vault.json"));
        let engine = s.privacy_engine().unwrap();
        let before = engine.session.current_token();
        engine.rotate_session();
        let after = engine.session.current_token();
        assert_ne!(before, after);
    }
}
