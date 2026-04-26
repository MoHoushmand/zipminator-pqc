// Prevents an additional console window on Windows in release builds.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
#[allow(dead_code)]
mod extensions;
mod navigation;
mod pqc;
mod state;
mod tabs;

// Domain modules (declared in lib.rs, re-used here via crate path)
use state::AppState;
#[cfg(feature = "vpn")]
#[allow(unused_imports)]
use state::VpnState;
use tauri::Manager;
#[cfg(feature = "vpn")]
use tauri::Listener;

// AI sidebar commands (Domain 4)
use zipbrowser::ai;
// Mobile WebView bridge (Pillar 8 mobile target)
use zipbrowser::mobile;

fn main() {
    // Initialize structured logging (tracing for domain modules, env_logger for shell).
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env().unwrap_or_else(|_| {
                "zipbrowser=info,proxy=debug,vpn=info,privacy=info,ai=info".into()
            }),
        )
        .init();

    tracing::info!("Starting Zipminator v0.2.0");

    // Verify TLS provider before launching the app.
    if let Err(e) = zipbrowser::verify_tls() {
        tracing::error!(error = %e, "TLS provider verification failed");
        eprintln!("FATAL: {e}");
        std::process::exit(1);
    }
    tracing::info!(info = ?zipbrowser::get_tls_info(), "TLS provider verified");

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(AppState::new())
        .setup(|app| {
            #[cfg(feature = "vpn")]
            let app_handle = app.handle().clone();

            // ── Domain 2: Start PQC HTTPS Proxy ───────────────────────────
            // Use a channel so the proxy port feeds back into AI sidebar state.
            let data_dir = app
                .path()
                .app_data_dir()
                .unwrap_or_else(|_| std::env::temp_dir().join("zipbrowser"));
            let proxy_data_dir = data_dir.clone();
            let (port_tx, port_rx) = std::sync::mpsc::channel();
            tauri::async_runtime::spawn(async move {
                match zipbrowser::start_proxy(proxy_data_dir).await {
                    Ok((host, port)) => {
                        tracing::info!(host, port, "PQC HTTPS proxy started");
                        let _ = port_tx.send(Some(port));
                    }
                    Err(e) => {
                        tracing::error!(error = %e, "Failed to start PQC proxy");
                        let _ = port_tx.send(None);
                    }
                }
            });
            // Wait briefly for proxy to start, then wire port into AI state.
            let proxy_port = port_rx
                .recv_timeout(std::time::Duration::from_secs(5))
                .unwrap_or(None);
            tracing::info!(?proxy_port, "AI sidebar proxy port configured");
            app.manage(ai::initial_state(proxy_port));

            // ── Domain 3: Initialize the VPN manager ──────────────────────
            zipbrowser::init_vpn_manager();

            #[cfg(feature = "vpn")]
            {
                let vpn_handle = app_handle.clone();
                app.listen("vpn-state-changed", move |event: tauri::Event| {
                    let payload_str = event.payload();
                    let managed: tauri::State<'_, AppState> = vpn_handle.state();
                    if let Ok(mut vpn) = managed.vpn_state.lock() {
                        if let Ok(v) = serde_json::from_str::<serde_json::Value>(payload_str) {
                            let state_str = v.get("state").and_then(|s| s.as_str()).unwrap_or("");
                            vpn.connected = matches!(state_str, "Connected" | "Rekeying");
                            if vpn.connected {
                                vpn.protocol = Some("PQ-WireGuard".to_string());
                            } else {
                                vpn.protocol = None;
                                vpn.uptime_secs = 0;
                            }
                        }
                    }
                    tracing::info!("VPN state updated from event");
                });
            }

            // ── Domain 1: Restore persisted state ─────────────────────────
            if let Ok(data_dir) = app.path().app_data_dir() {
                let state = app.state::<AppState>();
                let path = data_dir.as_path();
                if path.exists() {
                    match tabs::TabManager::load_from_disk(path) {
                        Ok(restored) => {
                            if let Ok(mut tabs) = state.tabs.lock() {
                                *tabs = restored;
                            }
                        }
                        Err(e) => tracing::warn!(error = %e, "Could not restore tabs"),
                    }
                    if let Err(e) = state.load_bookmarks(path) {
                        tracing::warn!(error = %e, "Could not restore bookmarks");
                    }
                }
            }

            // ── Domain 5: Initialize the Privacy Engine ──────────────────
            // The privacy engine wires together: entropy reader, session manager,
            // fingerprint guard, cookie rotator, password vault, telemetry blocker
            // and the zero-telemetry auditor. It is the source of truth for the
            // PrivacyDashboard.tsx component.
            {
                let state = app.state::<AppState>();
                let privacy_data_dir = data_dir.clone();
                // Walk up from the data dir to find a candidate project root for
                // the QRNG entropy pool; if not present, the QrngReader falls
                // back to OS CSPRNG automatically.
                let project_root = std::env::var("ZIPMINATOR_PROJECT_ROOT")
                    .map(std::path::PathBuf::from)
                    .unwrap_or_else(|_| {
                        // Default: parent of app data dir (developer mode) or a
                        // sentinel path that triggers CSPRNG fallback.
                        privacy_data_dir
                            .parent()
                            .map(|p| p.to_path_buf())
                            .unwrap_or_else(|| std::path::PathBuf::from("/nonexistent"))
                    });
                if !privacy_data_dir.exists() {
                    let _ = std::fs::create_dir_all(&privacy_data_dir);
                }
                let vault_path = privacy_data_dir.join("password-vault.json");
                state.init_privacy(&project_root, &vault_path);
                tracing::info!(
                    vault_path = %vault_path.display(),
                    "Privacy engine initialized"
                );
            }

            tracing::info!("ZipBrowser setup complete — all domains initialized");
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // ── Domain 1: Browser shell commands ──────────────────────────
            // Tab management
            commands::get_tabs,
            commands::get_active_tab,
            commands::create_tab,
            commands::close_tab,
            commands::set_active_tab,
            commands::set_active_tab_by_index,
            commands::duplicate_tab,
            commands::toggle_pin_tab,
            commands::reorder_tab,
            // Navigation
            commands::navigate,
            commands::go_back,
            commands::go_forward,
            commands::reload,
            commands::can_go_back,
            commands::can_go_forward,
            // Tab metadata
            commands::update_tab_meta,
            commands::set_tab_error,
            // Bookmarks
            commands::get_bookmarks,
            commands::add_bookmark,
            commands::remove_bookmark,
            commands::is_bookmarked,
            // Persistence
            commands::save_state,
            commands::load_state,
            // ── Cross-domain integration commands ─────────────────────────
            // Proxy (Domain 2: PQC TLS)
            commands::set_proxy_config,
            commands::disable_proxy,
            commands::get_proxy_config,
            // Session token (Domain 5: privacy engine)
            commands::get_session_token,
            commands::regenerate_session_token,
            // VPN lifecycle (Domain 3: embedded VPN)
            commands::get_vpn_state,
            commands::vpn_connect,
            commands::vpn_disconnect,
            commands::vpn_set_always_on,
            commands::vpn_get_status,
            // Entropy status (Domain 5: privacy engine)
            commands::get_entropy_status,
            // ── PQC Kyber768 commands (zipminator-core) ───────────────────
            pqc::pqc_info,
            pqc::pqc_keygen,
            pqc::pqc_encapsulate,
            pqc::pqc_decapsulate,
            pqc::pqc_self_test,
            // ── PQC Scanning ─────────────────────────────────────────────
            commands::scan_pqc_endpoint,
            // ── Self-destruct (Pillar 1: Quantum Vault) ─────────────────
            commands::self_destruct_file,
            // ── AI Sidebar (Domain 4) ───────────────────────────────────────
            ai::sidebar::ai_chat,
            ai::sidebar::ai_summarize,
            ai::sidebar::ai_rewrite,
            ai::sidebar::ai_get_config,
            ai::sidebar::ai_set_config,
            ai::sidebar::ai_extract_page_context,
            ai::sidebar::ai_clear_history,
            ai::sidebar::ai_download_model,
            ai::sidebar::ai_load_model,
            // ── AI Ollama integration (Pillar 6) ────────────────────────────
            ai::sidebar::ai_ollama_list_models,
            ai::sidebar::ai_ollama_pull_model,
            ai::sidebar::ai_ollama_ensure_default_model,
            ai::sidebar::ai_ollama_chat_stream,
            // ── AI PQC envelope streaming (Pillar 6) ────────────────────────
            ai::sidebar::ai_pqc_envelope_session_init,
            ai::sidebar::ai_pqc_envelope_wrap_chunk,
            ai::sidebar::ai_pqc_envelope_unwrap_chunk,
            ai::sidebar::ai_pqc_envelope_session_close,
            // ── Mobile WebView PQC proxy (Pillar 8 mobile target) ──────────
            mobile::pqc_proxy_command,
            // ── Privacy engine (Pillar 8: 7 privacy subsystems) ─────────────
            commands::privacy_get_status,
            commands::privacy_toggle_protection,
            commands::privacy_run_audit,
            commands::privacy_get_latest_audit,
            commands::privacy_rotate_session,
            // ── Password vault (Pillar 8: PQC-encrypted credentials) ───────
            commands::vault_get_state,
            commands::vault_create,
            commands::vault_unlock,
            commands::vault_lock,
            commands::vault_list_entries,
            commands::vault_add_entry,
            commands::vault_get_entry,
            commands::vault_delete_entry,
            commands::vault_generate_password,
        ])
        .run(tauri::generate_context!())
        .expect("error running Zipminator");
}
