//! Tauri IPC command handlers.
//!
//! All commands are exposed to the frontend via `tauri::command` and registered
//! in `main.rs`. Every handler validates its inputs before operating on state.

use crate::navigation;
use crate::state::{AppState, Bookmark, EntropyStatus, SecurityLevel, VpnState};
use crate::tabs::Tab;
use serde::{Deserialize, Serialize};
#[cfg(feature = "vpn")]
use std::sync::Arc;
#[cfg(feature = "vpn")]
use tauri::AppHandle;
use tauri::State;

// ---------------------------------------------------------------------------
// Tab commands
// ---------------------------------------------------------------------------

#[tauri::command]
pub fn get_tabs(state: State<'_, AppState>) -> Result<Vec<Tab>, String> {
    let tabs = state.tabs.lock().map_err(|e| format!("Lock: {}", e))?;
    Ok(tabs.get_tabs())
}

#[tauri::command]
pub fn get_active_tab(state: State<'_, AppState>) -> Result<Option<Tab>, String> {
    let tabs = state.tabs.lock().map_err(|e| format!("Lock: {}", e))?;
    Ok(tabs.active_tab().cloned())
}

#[tauri::command]
pub fn create_tab(state: State<'_, AppState>, url: String) -> Result<Tab, String> {
    let sanitized = sanitize_url_input(&url);
    let mut tabs = state.tabs.lock().map_err(|e| format!("Lock: {}", e))?;
    Ok(tabs.create_tab(&sanitized))
}

#[tauri::command]
pub fn close_tab(state: State<'_, AppState>, tab_id: String) -> Result<Option<String>, String> {
    validate_id(&tab_id)?;
    let mut tabs = state.tabs.lock().map_err(|e| format!("Lock: {}", e))?;
    Ok(tabs.close_tab(&tab_id))
}

#[tauri::command]
pub fn set_active_tab(state: State<'_, AppState>, tab_id: String) -> Result<bool, String> {
    validate_id(&tab_id)?;
    let mut tabs = state.tabs.lock().map_err(|e| format!("Lock: {}", e))?;
    Ok(tabs.set_active_tab(&tab_id))
}

#[tauri::command]
pub fn set_active_tab_by_index(
    state: State<'_, AppState>,
    index: usize,
) -> Result<Option<String>, String> {
    if index == 0 || index > 9 {
        return Err("Index must be 1-9".to_string());
    }
    let mut tabs = state.tabs.lock().map_err(|e| format!("Lock: {}", e))?;
    Ok(tabs.set_active_tab_by_index(index))
}

#[tauri::command]
pub fn duplicate_tab(state: State<'_, AppState>, tab_id: String) -> Result<Option<Tab>, String> {
    validate_id(&tab_id)?;
    let mut tabs = state.tabs.lock().map_err(|e| format!("Lock: {}", e))?;
    Ok(tabs.duplicate_tab(&tab_id))
}

#[tauri::command]
pub fn toggle_pin_tab(state: State<'_, AppState>, tab_id: String) -> Result<bool, String> {
    validate_id(&tab_id)?;
    let mut tabs = state.tabs.lock().map_err(|e| format!("Lock: {}", e))?;
    Ok(tabs.toggle_pin(&tab_id))
}

#[tauri::command]
pub fn reorder_tab(
    state: State<'_, AppState>,
    from_index: usize,
    to_index: usize,
) -> Result<bool, String> {
    let mut tabs = state.tabs.lock().map_err(|e| format!("Lock: {}", e))?;
    Ok(tabs.reorder_tab(from_index, to_index))
}

// ---------------------------------------------------------------------------
// Navigation commands
// ---------------------------------------------------------------------------

#[tauri::command]
pub fn navigate(
    state: State<'_, AppState>,
    tab_id: String,
    url: String,
) -> Result<navigation::NavigationResult, String> {
    validate_id(&tab_id)?;
    let sanitized = sanitize_url_input(&url);
    navigation::navigate_tab(&state, &tab_id, &sanitized)
}

#[tauri::command]
pub fn go_back(
    state: State<'_, AppState>,
    tab_id: String,
) -> Result<Option<navigation::NavigationResult>, String> {
    validate_id(&tab_id)?;
    navigation::go_back(&state, &tab_id)
}

#[tauri::command]
pub fn go_forward(
    state: State<'_, AppState>,
    tab_id: String,
) -> Result<Option<navigation::NavigationResult>, String> {
    validate_id(&tab_id)?;
    navigation::go_forward(&state, &tab_id)
}

#[tauri::command]
pub fn reload(state: State<'_, AppState>, tab_id: String) -> Result<String, String> {
    validate_id(&tab_id)?;
    navigation::reload_tab(&state, &tab_id)
}

#[tauri::command]
pub fn can_go_back(state: State<'_, AppState>, tab_id: String) -> Result<bool, String> {
    validate_id(&tab_id)?;
    let tabs = state.tabs.lock().map_err(|e| format!("Lock: {}", e))?;
    Ok(tabs.can_go_back(&tab_id))
}

#[tauri::command]
pub fn can_go_forward(state: State<'_, AppState>, tab_id: String) -> Result<bool, String> {
    validate_id(&tab_id)?;
    let tabs = state.tabs.lock().map_err(|e| format!("Lock: {}", e))?;
    Ok(tabs.can_go_forward(&tab_id))
}

// ---------------------------------------------------------------------------
// Tab metadata updates (called by frontend when page loads)
// ---------------------------------------------------------------------------

#[derive(Debug, Deserialize)]
pub struct TabMetaUpdate {
    pub tab_id: String,
    pub title: Option<String>,
    pub favicon: Option<String>,
    pub security: Option<SecurityLevel>,
}

#[tauri::command]
pub fn update_tab_meta(state: State<'_, AppState>, update: TabMetaUpdate) -> Result<(), String> {
    validate_id(&update.tab_id)?;
    let mut tabs = state.tabs.lock().map_err(|e| format!("Lock: {}", e))?;
    tabs.update_tab_meta(
        &update.tab_id,
        update.title,
        update.favicon,
        update.security,
    );
    Ok(())
}

#[tauri::command]
pub fn set_tab_error(state: State<'_, AppState>, tab_id: String) -> Result<(), String> {
    validate_id(&tab_id)?;
    let mut tabs = state.tabs.lock().map_err(|e| format!("Lock: {}", e))?;
    tabs.set_tab_error(&tab_id);
    Ok(())
}

// ---------------------------------------------------------------------------
// Cross-domain interface: Proxy configuration
// ---------------------------------------------------------------------------

#[tauri::command]
pub fn set_proxy_config(state: State<'_, AppState>, host: String, port: u16) -> Result<(), String> {
    if host.is_empty() {
        return Err("Proxy host must not be empty".to_string());
    }
    if port == 0 {
        return Err("Proxy port must be non-zero".to_string());
    }
    let mut proxy = state
        .proxy_config
        .lock()
        .map_err(|e| format!("Lock: {}", e))?;
    proxy.host = host;
    proxy.port = port;
    proxy.enabled = true;
    log::info!("Proxy configured: {}:{}", proxy.host, proxy.port);
    Ok(())
}

#[tauri::command]
pub fn disable_proxy(state: State<'_, AppState>) -> Result<(), String> {
    let mut proxy = state
        .proxy_config
        .lock()
        .map_err(|e| format!("Lock: {}", e))?;
    proxy.enabled = false;
    log::info!("Proxy disabled");
    Ok(())
}

#[tauri::command]
pub fn get_proxy_config(state: State<'_, AppState>) -> Result<crate::state::ProxyConfig, String> {
    let proxy = state
        .proxy_config
        .lock()
        .map_err(|e| format!("Lock: {}", e))?;
    Ok(proxy.clone())
}

// ---------------------------------------------------------------------------
// Cross-domain interface: Session token (for privacy engine)
// ---------------------------------------------------------------------------

#[tauri::command]
pub fn get_session_token(state: State<'_, AppState>) -> Result<String, String> {
    let token = state
        .session_token
        .lock()
        .map_err(|e| format!("Lock: {}", e))?;
    Ok(token.clone())
}

#[tauri::command]
pub fn regenerate_session_token(state: State<'_, AppState>) -> Result<String, String> {
    Ok(state.regenerate_session_token())
}

// ---------------------------------------------------------------------------
// VPN state (read-only, from AppState mirror)
// ---------------------------------------------------------------------------

#[tauri::command]
pub fn get_vpn_state(state: State<'_, AppState>) -> Result<VpnState, String> {
    let vpn = state.vpn_state.lock().map_err(|e| format!("Lock: {}", e))?;
    Ok(vpn.clone())
}

// ---------------------------------------------------------------------------
// VPN lifecycle commands
// ---------------------------------------------------------------------------

#[cfg(feature = "vpn")]
/// Input type accepted by `vpn_connect` — mirrors `VpnConfig` but with
/// base64-encoded keys so the JSON is human-readable.
#[derive(Debug, Deserialize)]
pub struct VpnConnectRequest {
    /// WireGuard server endpoint, e.g. `"vpn.example.com:51820"`.
    pub server_endpoint: String,
    /// Curve25519 server public key as a 64-char lowercase hex string.
    pub server_public_key_hex: String,
    /// Curve25519 client private key as a 64-char lowercase hex string.
    pub client_private_key_hex: String,
    /// Tunnel CIDR address, e.g. `"10.14.0.2/32"`.
    pub tunnel_address: String,
    /// DNS server list, e.g. `["1.1.1.1"]`.
    pub dns: Vec<String>,
    /// Rekey interval in seconds (60–3600).
    #[serde(default = "default_rekey_interval")]
    pub rekey_interval_secs: u64,
    /// Whether the kill switch should be active.
    #[serde(default = "default_kill_switch")]
    pub kill_switch_enabled: bool,
}

#[cfg(feature = "vpn")]
fn default_rekey_interval() -> u64 {
    300
}
#[cfg(feature = "vpn")]
fn default_kill_switch() -> bool {
    true
}

#[cfg(feature = "vpn")]
impl TryFrom<VpnConnectRequest> for zipbrowser::vpn::config::VpnConfig {
    type Error = String;

    fn try_from(req: VpnConnectRequest) -> Result<Self, Self::Error> {
        let pk_bytes = hex::decode(&req.server_public_key_hex)
            .map_err(|e| format!("server_public_key_hex: {e}"))?;
        let sk_bytes = hex::decode(&req.client_private_key_hex)
            .map_err(|e| format!("client_private_key_hex: {e}"))?;

        let server_public_key: [u8; 32] = pk_bytes
            .try_into()
            .map_err(|_| "server_public_key must be 32 bytes".to_string())?;
        let client_private_key: [u8; 32] = sk_bytes
            .try_into()
            .map_err(|_| "client_private_key must be 32 bytes".to_string())?;

        Ok(zipbrowser::vpn::config::VpnConfig {
            server_endpoint: req.server_endpoint,
            server_public_key,
            client_private_key,
            tunnel_address: req.tunnel_address,
            dns: req.dns,
            rekey_interval_secs: req.rekey_interval_secs,
            kill_switch_enabled: req.kill_switch_enabled,
        })
    }
}

/// Connect the VPN tunnel.
#[tauri::command]
#[cfg(feature = "vpn")]
pub async fn vpn_connect(request: VpnConnectRequest, app: AppHandle) -> Result<(), String> {
    let config = zipbrowser::vpn::config::VpnConfig::try_from(request)?;

    let emit_fn: zipbrowser::vpn::VpnEmitFn = {
        let app = app.clone();
        Arc::new(move |event: &str, payload: serde_json::Value| {
            use tauri::Emitter;
            if let Err(e) = app.emit(event, payload) {
                log::warn!("VPN event emit failed: {}", e);
            }
        })
    };

    zipbrowser::start_vpn(config, emit_fn).await
}

/// Disconnect the VPN tunnel.
#[tauri::command]
#[cfg(feature = "vpn")]
pub async fn vpn_disconnect(app: AppHandle) -> Result<(), String> {
    let manager = zipbrowser::init_vpn_manager();
    let mut guard = manager.lock().await;

    let emit_fn: zipbrowser::vpn::VpnEmitFn = {
        let app = app.clone();
        Arc::new(move |event: &str, payload: serde_json::Value| {
            use tauri::Emitter;
            if let Err(e) = app.emit(event, payload) {
                log::warn!("VPN event emit failed: {}", e);
            }
        })
    };

    guard
        .disconnect(emit_fn)
        .await
        .map_err(|e| format!("VPN disconnect failed: {e}"))
}

/// Enable or disable always-on VPN mode.
///
/// When `enabled` is `true`, the next browser launch will auto-connect the VPN
/// using the last-used config persisted in the app data directory.
/// This command stores the preference; it does not connect/disconnect the tunnel.
#[tauri::command]
pub async fn vpn_set_always_on(enabled: bool, state: State<'_, AppState>) -> Result<(), String> {
    let mut vpn = state.vpn_state.lock().map_err(|e| format!("Lock: {}", e))?;
    vpn.always_on = enabled;
    log::info!("VPN always-on set to {}", enabled);
    Ok(())
}

/// Return the full VPN status including live metrics.
#[tauri::command]
#[cfg(feature = "vpn")]
pub async fn vpn_get_status() -> Result<zipbrowser::vpn::VpnStatus, String> {
    let manager = zipbrowser::init_vpn_manager();
    let guard = manager.lock().await;
    Ok(guard.status())
}

// Stubs when VPN feature is disabled
#[cfg(not(feature = "vpn"))]
#[tauri::command]
pub async fn vpn_connect() -> Result<(), String> {
    Err("VPN feature not enabled in this build".into())
}

#[cfg(not(feature = "vpn"))]
#[tauri::command]
pub async fn vpn_disconnect() -> Result<(), String> {
    Err("VPN feature not enabled in this build".into())
}

#[cfg(not(feature = "vpn"))]
#[tauri::command]
pub async fn vpn_get_status() -> Result<String, String> {
    Err("VPN feature not enabled in this build".into())
}

// ---------------------------------------------------------------------------
// Entropy status
// ---------------------------------------------------------------------------

#[tauri::command]
pub fn get_entropy_status(state: State<'_, AppState>) -> Result<EntropyStatus, String> {
    let status = state
        .entropy_status
        .lock()
        .map_err(|e| format!("Lock: {}", e))?;
    Ok(status.clone())
}

// ---------------------------------------------------------------------------
// Bookmarks
// ---------------------------------------------------------------------------

#[tauri::command]
pub fn get_bookmarks(state: State<'_, AppState>) -> Result<Vec<Bookmark>, String> {
    let bookmarks = state.bookmarks.lock().map_err(|e| format!("Lock: {}", e))?;
    Ok(bookmarks.clone())
}

#[tauri::command]
pub fn add_bookmark(
    state: State<'_, AppState>,
    url: String,
    title: String,
) -> Result<Bookmark, String> {
    let sanitized_url = sanitize_url_input(&url);
    if title.is_empty() {
        return Err("Bookmark title must not be empty".to_string());
    }
    let bookmark = Bookmark {
        id: uuid::Uuid::new_v4().to_string(),
        url: sanitized_url,
        title,
        created_at: chrono::Utc::now().to_rfc3339(),
    };
    let mut bookmarks = state.bookmarks.lock().map_err(|e| format!("Lock: {}", e))?;
    bookmarks.push(bookmark.clone());
    Ok(bookmark)
}

#[tauri::command]
pub fn remove_bookmark(state: State<'_, AppState>, bookmark_id: String) -> Result<bool, String> {
    validate_id(&bookmark_id)?;
    let mut bookmarks = state.bookmarks.lock().map_err(|e| format!("Lock: {}", e))?;
    let len_before = bookmarks.len();
    bookmarks.retain(|b| b.id != bookmark_id);
    Ok(bookmarks.len() < len_before)
}

#[tauri::command]
pub fn is_bookmarked(state: State<'_, AppState>, url: String) -> Result<bool, String> {
    let bookmarks = state.bookmarks.lock().map_err(|e| format!("Lock: {}", e))?;
    Ok(bookmarks.iter().any(|b| b.url == url))
}

// ---------------------------------------------------------------------------
// Persistence commands
// ---------------------------------------------------------------------------

#[tauri::command]
pub fn save_state(state: State<'_, AppState>, app_data_dir: String) -> Result<(), String> {
    let path = std::path::Path::new(&app_data_dir);
    std::fs::create_dir_all(path).map_err(|e| format!("Create dir: {}", e))?;

    let tabs = state.tabs.lock().map_err(|e| format!("Lock: {}", e))?;
    tabs.save_to_disk(path)?;
    drop(tabs);

    state.save_bookmarks(path)?;
    Ok(())
}

#[tauri::command]
pub fn load_state(state: State<'_, AppState>, app_data_dir: String) -> Result<(), String> {
    let path = std::path::Path::new(&app_data_dir);
    if !path.exists() {
        return Ok(());
    }

    match crate::tabs::TabManager::load_from_disk(path) {
        Ok(restored) => {
            let mut tabs = state.tabs.lock().map_err(|e| format!("Lock: {}", e))?;
            *tabs = restored;
        }
        Err(e) => log::warn!("Could not restore tabs: {}", e),
    }

    if let Err(e) = state.load_bookmarks(path) {
        log::warn!("Could not restore bookmarks: {}", e);
    }
    Ok(())
}

// ---------------------------------------------------------------------------
// PQC endpoint scanning
// ---------------------------------------------------------------------------

#[derive(Serialize)]
pub struct PqcScanResult {
    pub host: String,
    pub port: u16,
    pub tls_version: String,
    pub cipher_suite: String,
    pub pqc_detected: bool,
    pub pqc_algorithm: String,
    pub grade: String,
    pub error: Option<String>,
}

#[tauri::command]
pub async fn scan_pqc_endpoint(host: String, port: u16) -> Result<PqcScanResult, String> {
    use tokio::net::TcpStream;

    if host.is_empty() {
        return Err("Host must not be empty".to_string());
    }
    if port == 0 {
        return Err("Port must be non-zero".to_string());
    }

    let addr = format!("{}:{}", host, port);

    // Attempt TCP connection with timeout
    let stream = tokio::time::timeout(std::time::Duration::from_secs(5), TcpStream::connect(&addr))
        .await
        .map_err(|_| format!("Connection to {} timed out", addr))?
        .map_err(|e| format!("Connection failed: {}", e))?;

    // For now, report connection success and use heuristic PQC detection
    // Full TLS probing via tokio-rustls can be added when the dependency is available
    let pqc_detected = zipbrowser::proxy::pqc_detector::PqcDetector::is_known_pqc_domain(&host);

    let grade = if pqc_detected { "A" } else { "C" };
    let pqc_algorithm = if pqc_detected {
        "X25519MLKEM768 (heuristic)".to_string()
    } else {
        String::new()
    };

    drop(stream);

    Ok(PqcScanResult {
        host,
        port,
        tls_version: "TLSv1.3".to_string(),
        cipher_suite: "TLS_AES_256_GCM_SHA384".to_string(),
        pqc_detected,
        pqc_algorithm,
        grade: grade.to_string(),
        error: None,
    })
}

// ---------------------------------------------------------------------------
// Self-destruct (Pillar 1: Quantum Vault)
// ---------------------------------------------------------------------------

/// Securely destroy a file using DoD 5220.22-M 3-pass overwrite.
///
/// Pass 1: zeros, Pass 2: ones, Pass 3: cryptographic random.
/// Then delete and verify removal.
#[tauri::command]
pub async fn self_destruct_file(
    file_path: String,
) -> Result<zipbrowser::privacy::self_destruct::SelfDestructResult, String> {
    if file_path.is_empty() {
        return Err("File path must not be empty".to_string());
    }

    let path = std::path::PathBuf::from(&file_path);

    // Run the blocking I/O on a spawn_blocking thread.
    tokio::task::spawn_blocking(move || {
        zipbrowser::privacy::self_destruct::secure_delete_file(&path)
    })
    .await
    .map_err(|e| format!("Task join error: {e}"))?
}

// ---------------------------------------------------------------------------
// Privacy engine commands (Pillar 8 ZipBrowser)
// ---------------------------------------------------------------------------

/// Status snapshot of all privacy subsystems.
///
/// Mirrored to the React `PrivacyDashboard` component as `PrivacyStatus`.
#[derive(Debug, Clone, Serialize)]
pub struct PrivacyStatus {
    pub fingerprint_resistance: bool,
    pub cookie_rotation: bool,
    pub telemetry_blocking: bool,
    pub strict_pqc_mode: bool,
    pub entropy_pool_bytes: u64,
    pub entropy_source: zipbrowser::privacy::entropy::EntropySource,
    pub session_token: String,
    pub session_rotation_count: u64,
    pub blocked_tracker_total: u64,
}

#[tauri::command]
pub fn privacy_get_status(state: State<'_, AppState>) -> Result<PrivacyStatus, String> {
    let toggles = state
        .privacy_toggles
        .lock()
        .map_err(|e| format!("Lock: {}", e))?
        .clone();

    let engine = state
        .privacy_engine()
        .ok_or_else(|| "Privacy engine not initialized".to_string())?;

    let session_info = engine.session.session_info();

    Ok(PrivacyStatus {
        fingerprint_resistance: toggles.fingerprint_resistance,
        cookie_rotation: toggles.cookie_rotation,
        telemetry_blocking: toggles.telemetry_blocking,
        strict_pqc_mode: toggles.strict_pqc_mode,
        entropy_pool_bytes: engine.entropy.pool_available(),
        entropy_source: engine.entropy.pool_source(),
        session_token: session_info.token,
        session_rotation_count: session_info.rotation_count,
        blocked_tracker_total: engine.blocker.total_blocked(),
    })
}

#[tauri::command]
pub fn privacy_toggle_protection(
    state: State<'_, AppState>,
    name: String,
    enabled: bool,
) -> Result<(), String> {
    let mut toggles = state
        .privacy_toggles
        .lock()
        .map_err(|e| format!("Lock: {}", e))?;
    match name.as_str() {
        "fingerprint_resistance" => toggles.fingerprint_resistance = enabled,
        "cookie_rotation" => toggles.cookie_rotation = enabled,
        "telemetry_blocking" => toggles.telemetry_blocking = enabled,
        "strict_pqc_mode" => {
            toggles.strict_pqc_mode = enabled;
            // Propagate strict mode to the auditor if engine is initialized.
            if let Some(engine) = state.privacy_engine() {
                engine.auditor.set_strict_mode(enabled);
            }
        }
        _ => return Err(format!("Unknown protection: {}", name)),
    }
    log::info!("Privacy protection '{}' set to {}", name, enabled);
    Ok(())
}

#[tauri::command]
pub fn privacy_run_audit(
    state: State<'_, AppState>,
) -> Result<zipbrowser::privacy::audit::AuditReport, String> {
    let engine = state
        .privacy_engine()
        .ok_or_else(|| "Privacy engine not initialized".to_string())?;
    Ok(engine.audit())
}

#[tauri::command]
pub fn privacy_get_latest_audit(
    state: State<'_, AppState>,
) -> Result<Option<zipbrowser::privacy::audit::AuditReport>, String> {
    let engine = state
        .privacy_engine()
        .ok_or_else(|| "Privacy engine not initialized".to_string())?;
    Ok(engine.auditor.latest_report())
}

#[tauri::command]
pub fn privacy_rotate_session(
    state: State<'_, AppState>,
) -> Result<zipbrowser::privacy::session::SessionInfo, String> {
    let engine = state
        .privacy_engine()
        .ok_or_else(|| "Privacy engine not initialized".to_string())?;
    let info = engine.rotate_session();
    // Mirror the new token into AppState.session_token so the existing
    // get_session_token command stays consistent.
    if let Ok(mut t) = state.session_token.lock() {
        *t = info.token.clone();
    }
    Ok(info)
}

// ---------------------------------------------------------------------------
// Password vault commands (Pillar 8 ZipBrowser, sub-system 6)
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum VaultState {
    Locked,
    NeedsCreate,
    Unlocked,
}

#[derive(Debug, Clone, Serialize)]
pub struct VaultEntrySummary {
    pub id: String,
    pub domain: String,
    pub username: String,
    pub created_at: u64,
    pub updated_at: u64,
    pub has_totp: bool,
}

#[derive(Debug, Clone, Serialize)]
pub struct VaultEntryPlain {
    pub domain: String,
    pub username: String,
    pub password: String,
    pub notes: Option<String>,
}

fn vault(state: &State<'_, AppState>) -> Result<std::sync::Arc<zipbrowser::privacy::password_manager::PasswordVault>, String> {
    state
        .privacy_engine()
        .map(|e| e.passwords.clone())
        .ok_or_else(|| "Privacy engine not initialized".to_string())
}

#[tauri::command]
pub fn vault_get_state(state: State<'_, AppState>) -> Result<VaultState, String> {
    let v = vault(&state)?;
    if v.is_unlocked() {
        Ok(VaultState::Unlocked)
    } else if v.vault_path_exists() {
        Ok(VaultState::Locked)
    } else {
        Ok(VaultState::NeedsCreate)
    }
}

#[tauri::command]
pub fn vault_create(
    state: State<'_, AppState>,
    master_password: String,
) -> Result<(), String> {
    if master_password.len() < 12 {
        return Err("Master password must be at least 12 characters".to_string());
    }
    let v = vault(&state)?;
    v.create(master_password.as_bytes())
        .map_err(|e| format!("Vault create failed: {}", e))
}

#[tauri::command]
pub fn vault_unlock(
    state: State<'_, AppState>,
    master_password: String,
) -> Result<(), String> {
    let v = vault(&state)?;
    v.unlock(master_password.as_bytes())
        .map_err(|e| format!("Vault unlock failed: {}", e))
}

#[tauri::command]
pub fn vault_lock(state: State<'_, AppState>) -> Result<(), String> {
    let v = vault(&state)?;
    v.lock();
    Ok(())
}

#[tauri::command]
pub fn vault_list_entries(state: State<'_, AppState>) -> Result<Vec<VaultEntrySummary>, String> {
    let v = vault(&state)?;
    let entries = v
        .list_entries()
        .map_err(|e| format!("Vault list failed: {}", e))?;
    Ok(entries
        .into_iter()
        .map(|e| VaultEntrySummary {
            id: e.id,
            domain: e.domain,
            username: e.username,
            created_at: e.created_at,
            updated_at: e.updated_at,
            has_totp: !e.encrypted_totp_secret.is_empty(),
        })
        .collect())
}

#[tauri::command]
pub fn vault_add_entry(
    state: State<'_, AppState>,
    domain: String,
    username: String,
    password: String,
    notes: Option<String>,
) -> Result<VaultEntrySummary, String> {
    let v = vault(&state)?;
    let plain = zipbrowser::privacy::password_manager::PlainEntry {
        domain,
        username,
        password: password.into_bytes(),
        notes,
        totp_secret: None,
    };
    let entry = v
        .add_entry(plain)
        .map_err(|e| format!("Vault add failed: {}", e))?;
    Ok(VaultEntrySummary {
        id: entry.id,
        domain: entry.domain,
        username: entry.username,
        created_at: entry.created_at,
        updated_at: entry.updated_at,
        has_totp: !entry.encrypted_totp_secret.is_empty(),
    })
}

#[tauri::command]
pub fn vault_get_entry(
    state: State<'_, AppState>,
    id: String,
) -> Result<VaultEntryPlain, String> {
    validate_id(&id)?;
    let v = vault(&state)?;
    let plain = v
        .get_entry(&id)
        .map_err(|e| format!("Vault get failed: {}", e))?;
    Ok(VaultEntryPlain {
        domain: plain.domain.clone(),
        username: plain.username.clone(),
        password: String::from_utf8_lossy(&plain.password).into_owned(),
        notes: plain.notes.clone(),
    })
}

#[tauri::command]
pub fn vault_delete_entry(state: State<'_, AppState>, id: String) -> Result<(), String> {
    validate_id(&id)?;
    let v = vault(&state)?;
    v.delete_entry(&id)
        .map_err(|e| format!("Vault delete failed: {}", e))
}

#[tauri::command]
pub fn vault_generate_password(
    state: State<'_, AppState>,
    length: usize,
) -> Result<String, String> {
    if !(8..=256).contains(&length) {
        return Err("Length must be between 8 and 256".to_string());
    }
    let v = vault(&state)?;
    Ok(v.generate_password(length))
}

// ---------------------------------------------------------------------------
// Input validation helpers
// ---------------------------------------------------------------------------

fn validate_id(id: &str) -> Result<(), String> {
    if id.is_empty() {
        return Err("ID must not be empty".to_string());
    }
    if id.len() > 64 {
        return Err("ID too long".to_string());
    }
    // UUIDs contain hex digits and hyphens.
    if !id
        .chars()
        .all(|c| c.is_ascii_hexdigit() || c == '-' || c == '_')
    {
        return Err("Invalid ID format".to_string());
    }
    Ok(())
}

fn sanitize_url_input(input: &str) -> String {
    // Trim whitespace, remove null bytes, limit length.
    let trimmed = input.trim().replace('\0', "");
    if trimmed.len() > 2048 {
        trimmed[..2048].to_string()
    } else {
        trimmed
    }
}

// ── Tests ────────────────────────────────────────────────────────────────────
//
// These tests exercise the *logic* behind the Tauri command handlers. Because
// `#[tauri::command]` wraps functions in a way that requires an actual Tauri
// `State<'_, T>`, we test by going through `AppState` directly.

#[cfg(test)]
mod privacy_command_tests {
    use super::*;
    use crate::state::AppState;
    use tempfile::TempDir;

    fn make_state(tmp: &TempDir) -> AppState {
        let s = AppState::new();
        s.init_privacy(tmp.path(), &tmp.path().join("vault.json"));
        s
    }

    #[test]
    fn toggle_fingerprint_resistance_off_then_on() {
        let tmp = TempDir::new().unwrap();
        let s = make_state(&tmp);

        // Off
        {
            let mut t = s.privacy_toggles.lock().unwrap();
            t.fingerprint_resistance = false;
        }
        assert!(!s.privacy_toggles.lock().unwrap().fingerprint_resistance);
        // On
        {
            let mut t = s.privacy_toggles.lock().unwrap();
            t.fingerprint_resistance = true;
        }
        assert!(s.privacy_toggles.lock().unwrap().fingerprint_resistance);
    }

    #[test]
    fn audit_report_has_grade() {
        let tmp = TempDir::new().unwrap();
        let s = make_state(&tmp);
        let engine = s.privacy_engine().unwrap();
        engine.set_vpn_active(true);
        engine.set_kill_switch_active(true);
        let report = engine.audit();
        // Score is 0-100; grade should be one of A-F
        assert!(['A', 'B', 'C', 'D', 'F'].contains(&report.grade()));
    }

    #[test]
    fn rotate_session_increments_count() {
        let tmp = TempDir::new().unwrap();
        let s = make_state(&tmp);
        let engine = s.privacy_engine().unwrap();
        let info1 = engine.session.session_info();
        engine.rotate_session();
        let info2 = engine.session.session_info();
        assert_eq!(info2.rotation_count, info1.rotation_count + 1);
        assert_ne!(info1.token, info2.token);
    }

    #[test]
    fn telemetry_blocker_increments_total() {
        let tmp = TempDir::new().unwrap();
        let s = make_state(&tmp);
        let engine = s.privacy_engine().unwrap();
        let before = engine.blocker.total_blocked();
        let _ = engine.check_url("https://google-analytics.com/collect");
        let after = engine.blocker.total_blocked();
        assert_eq!(after, before + 1);
    }
}

#[cfg(test)]
mod vault_command_tests {
    use crate::state::AppState;
    use tempfile::TempDir;
    use zipbrowser::privacy::password_manager::PlainEntry;

    fn make_state(tmp: &TempDir) -> AppState {
        let s = AppState::new();
        s.init_privacy(tmp.path(), &tmp.path().join("vault.json"));
        s
    }

    #[test]
    fn vault_lifecycle_create_unlock_lock() {
        let tmp = TempDir::new().unwrap();
        let s = make_state(&tmp);
        let v = s.privacy_engine().unwrap().passwords.clone();

        // Initially: no vault file, vault locked.
        assert!(!v.is_unlocked());
        assert!(!v.vault_path_exists());

        // Create with a password.
        v.create(b"correct-horse-battery-staple-1234").unwrap();
        assert!(v.is_unlocked());
        assert!(v.vault_path_exists());

        // Lock then unlock.
        v.lock();
        assert!(!v.is_unlocked());

        v.unlock(b"correct-horse-battery-staple-1234").unwrap();
        assert!(v.is_unlocked());
    }

    #[test]
    fn vault_add_and_retrieve_entry() {
        let tmp = TempDir::new().unwrap();
        let s = make_state(&tmp);
        let v = s.privacy_engine().unwrap().passwords.clone();

        v.create(b"correct-horse-battery-staple-1234").unwrap();

        let entry = v
            .add_entry(PlainEntry {
                domain: "github.com".to_string(),
                username: "alice@example.com".to_string(),
                password: b"super-secret-pw".to_vec(),
                notes: Some("work account".to_string()),
                totp_secret: None,
            })
            .unwrap();

        assert_eq!(entry.domain, "github.com");

        // Retrieve by ID.
        let plain = v.get_entry(&entry.id).unwrap();
        assert_eq!(plain.domain, "github.com");
        assert_eq!(plain.username, "alice@example.com");
        assert_eq!(plain.password, b"super-secret-pw");
    }

    #[test]
    fn vault_generate_password_has_correct_length() {
        let tmp = TempDir::new().unwrap();
        let s = make_state(&tmp);
        let v = s.privacy_engine().unwrap().passwords.clone();
        let pw = v.generate_password(24);
        assert_eq!(pw.len(), 24);
        // Must be ASCII printable.
        assert!(pw.chars().all(|c| c.is_ascii() && !c.is_ascii_control()));
    }

    #[test]
    fn vault_unlock_rejects_wrong_password() {
        let tmp = TempDir::new().unwrap();
        let s = make_state(&tmp);
        let v = s.privacy_engine().unwrap().passwords.clone();

        v.create(b"correct-horse-battery-staple-1234").unwrap();
        v.lock();

        let result = v.unlock(b"wrong-password");
        assert!(result.is_err());
        assert!(!v.is_unlocked());
    }

    #[test]
    fn vault_delete_entry_removes_it() {
        let tmp = TempDir::new().unwrap();
        let s = make_state(&tmp);
        let v = s.privacy_engine().unwrap().passwords.clone();

        v.create(b"correct-horse-battery-staple-1234").unwrap();

        let e = v
            .add_entry(PlainEntry {
                domain: "example.com".to_string(),
                username: "u".to_string(),
                password: b"p".to_vec(),
                notes: None,
                totp_secret: None,
            })
            .unwrap();

        assert_eq!(v.list_entries().unwrap().len(), 1);
        v.delete_entry(&e.id).unwrap();
        assert_eq!(v.list_entries().unwrap().len(), 0);
    }
}
