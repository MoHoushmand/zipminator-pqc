//! AI sidebar state management and Tauri command handlers.
//!
//! This module is the bridge between the Tauri frontend (React) and the
//! AI inference backends (local + cloud). It:
//!
//! - Maintains [`SidebarState`] in the Tauri app state (a `Mutex`-guarded struct).
//! - Exposes Tauri commands invoked by the React UI via `invoke()`.
//! - Emits Tauri events for streaming token delivery.
//! - Handles page content extraction from the active webview.

use std::path::PathBuf;
use std::sync::Arc;

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter, State};
use tokio::sync::{mpsc, Mutex};

use crate::ai::cloud_llm::{CloudClientConfig, CloudLlmClient, CloudTokenEvent};
use crate::ai::config::{AiConfig, AiConfigPublic, AiMode};
use crate::ai::local_llm::{
    ChatMessage, InferenceRequest, LocalLlmEngine, Role, TokenEvent, CHAT_SYSTEM_PROMPT,
    SUMMARIZE_SYSTEM_PROMPT, WRITING_SYSTEM_PROMPT,
};
use crate::ai::ollama::{OllamaClient, OllamaMessage, OllamaModelInfo, OllamaStreamEvent, PullProgress};
use crate::ai::page_context::{PageContext, RawPageData};
use crate::ai::pqc_envelope::{self, PqcEnvelope, PqcEnvelopeSession};
use crate::ai::prompt_guard;

// ---------------------------------------------------------------------------
// Event names emitted to the frontend
// ---------------------------------------------------------------------------

/// Event emitted for each token in a streaming local response.
pub const EVENT_AI_TOKEN: &str = "ai-token-generated";
/// Event emitted when the AI starts generating (used to show a spinner).
pub const EVENT_AI_START: &str = "ai-generation-start";
/// Event emitted when the AI finishes generating.
pub const EVENT_AI_DONE: &str = "ai-generation-done";
/// Event emitted on model download progress.
pub const EVENT_MODEL_DOWNLOAD: &str = "ai-model-download";
/// Event emitted when an error occurs in the AI pipeline.
pub const EVENT_AI_ERROR: &str = "ai-error";
/// Event emitted on Ollama pull progress (model auto-download).
pub const EVENT_OLLAMA_PULL: &str = "ai-ollama-pull";
/// Event emitted for each PQC-wrapped streaming chunk.
pub const EVENT_AI_PQC_CHUNK: &str = "ai-pqc-chunk";

// ---------------------------------------------------------------------------
// Sidebar state (held in Tauri's managed state)
// ---------------------------------------------------------------------------

/// Mutable sidebar state shared across Tauri command handlers.
#[derive(Default)]
pub struct SidebarState {
    pub config: AiConfig,
    /// Loaded local inference engine (`None` until the model is loaded).
    pub local_engine: Option<LocalLlmEngine>,
    /// Cloud client (`None` until the config is valid).
    pub cloud_client: Option<CloudLlmClient>,
    /// Per-tab chat history keyed by tab ID.
    pub chat_histories: std::collections::HashMap<String, Vec<ChatMessage>>,
    /// PQC proxy port (forwarded from the proxy module at startup).
    pub proxy_port: Option<u16>,
}

/// Thread-safe handle to [`SidebarState`].
pub type AiState = Arc<Mutex<SidebarState>>;

// ---------------------------------------------------------------------------
// Command input / output types
// ---------------------------------------------------------------------------

/// Request payload for `ai_chat`.
#[derive(Debug, Deserialize)]
pub struct ChatRequest {
    /// Identifier of the browser tab (for history isolation).
    pub tab_id: String,
    /// The user's new message.
    pub message: String,
    /// Current page context (if "Ask about this page" is active).
    pub page_context: Option<PageContext>,
}

/// Request payload for `ai_summarize`.
#[derive(Debug, Deserialize)]
pub struct SummarizeRequest {
    pub page_context: PageContext,
}

/// Request payload for `ai_rewrite`.
#[derive(Debug, Deserialize)]
pub struct RewriteRequest {
    pub text: String,
    pub action: WritingAction,
    pub tone: Option<WritingTone>,
}

/// Writing transformation action.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum WritingAction {
    Rewrite,
    Simplify,
    Expand,
    FixGrammar,
    Translate,
}

/// Writing tone modifier.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum WritingTone {
    Professional,
    Casual,
    Academic,
    Creative,
}

/// Generic response sent back to the frontend for non-streaming calls.
#[derive(Debug, Serialize)]
pub struct AiResponse {
    pub text: String,
    pub mode: AiMode,
}

/// Error wrapper that Tauri can serialise and send to the frontend.
#[derive(Debug, Serialize)]
pub struct AiError {
    pub message: String,
    pub code: String,
}

impl AiError {
    fn new(code: impl Into<String>, msg: impl Into<String>) -> Self {
        Self {
            message: msg.into(),
            code: code.into(),
        }
    }
}

// ---------------------------------------------------------------------------
// Tauri commands
// ---------------------------------------------------------------------------

/// Return the current AI configuration (safe subset without raw keys).
#[tauri::command]
pub async fn ai_get_config(state: State<'_, AiState>) -> Result<AiConfigPublic, AiError> {
    let guard = state.lock().await;
    Ok(AiConfigPublic::from(&guard.config))
}

/// Update AI configuration from the settings panel.
#[tauri::command]
pub async fn ai_set_config(
    state: State<'_, AiState>,
    app: AppHandle,
    new_config: AiConfig,
) -> Result<AiConfigPublic, AiError> {
    let mut guard = state.lock().await;
    guard.config = new_config;

    // Re-build the cloud client if cloud mode is now active.
    if guard.config.mode == AiMode::Cloud {
        guard.cloud_client = build_cloud_client(&guard.config, guard.proxy_port);
    }

    let public = AiConfigPublic::from(&guard.config);

    // Emit config-changed event so other windows can react.
    let _ = app.emit("ai-config-changed", &public);

    Ok(public)
}

/// Extract the current page's content and return it as structured context.
///
/// The frontend calls this, which in turn injects the JS extraction snippet
/// into the active webview. The result is returned synchronously here because
/// Tauri commands are async.
#[tauri::command]
pub async fn ai_extract_page_context(
    state: State<'_, AiState>,
    raw: RawPageData,
) -> Result<PageContext, AiError> {
    let guard = state.lock().await;
    let max_tokens = guard.config.effective_context_window();
    Ok(raw.into_page_context(max_tokens))
}

/// Send a chat message. Streams tokens back via `ai-token-generated` events.
///
/// Returns the full response text once generation is complete (useful for
/// non-streaming callers that just need the result).
#[tauri::command]
pub async fn ai_chat(
    state: State<'_, AiState>,
    app: AppHandle,
    request: ChatRequest,
) -> Result<AiResponse, AiError> {
    let (mode, engine_opt, _cloud_opt, history, config_snapshot) = {
        let mut guard = state.lock().await;

        // Build user message, optionally prefixed with page context.
        let user_msg = if let Some(ctx) = &request.page_context {
            format!(
                "Page context:\n{}\n\n---\n\nUser question: {}",
                ctx.to_prompt_context(),
                request.message
            )
        } else {
            request.message.clone()
        };

        // Update history with user turn.
        let history = guard
            .chat_histories
            .entry(request.tab_id.clone())
            .or_default();
        history.push(ChatMessage {
            role: Role::User,
            content: user_msg.clone(),
        });

        // Clone what we need so we can release the mutex before I/O.
        let history_snapshot = history.clone();
        let mode = guard.config.mode;
        let engine_opt = guard.local_engine.clone();
        let cloud_opt = guard.cloud_client.as_ref().map(|_| ());
        let config = guard.config.clone();

        (mode, engine_opt, cloud_opt, history_snapshot, config)
    };

    // --- Prompt guard: scan the user message before sending to any LLM ---
    let safety = prompt_guard::scan(&request.message);
    if !safety.is_safe {
        return Err(AiError::new(
            "prompt_injection_blocked",
            format!(
                "Your message was blocked by the prompt safety scanner. Detected issues: {}",
                safety.threats.join("; ")
            ),
        ));
    }

    let _ = app.emit(EVENT_AI_START, ());

    let result_text = match mode {
        AiMode::Local => run_local_chat(&app, engine_opt, &history, &config_snapshot).await?,
        AiMode::Cloud => run_cloud_chat(&app, &state, &history, &config_snapshot).await?,
        AiMode::Off => {
            return Err(AiError::new("ai_disabled", "AI assistant is turned off."));
        }
    };

    // Persist assistant response to history.
    {
        let mut guard = state.lock().await;
        if let Some(history) = guard.chat_histories.get_mut(&request.tab_id) {
            history.push(ChatMessage {
                role: Role::Assistant,
                content: result_text.clone(),
            });
        }
    }

    let _ = app.emit(EVENT_AI_DONE, ());

    Ok(AiResponse {
        text: result_text,
        mode,
    })
}

/// Summarise the current page content.
#[tauri::command]
pub async fn ai_summarize(
    state: State<'_, AiState>,
    app: AppHandle,
    request: SummarizeRequest,
) -> Result<AiResponse, AiError> {
    let (mode, engine_opt, config_snapshot) = {
        let guard = state.lock().await;
        (
            guard.config.mode,
            guard.local_engine.clone(),
            guard.config.clone(),
        )
    };

    // --- Prompt guard: scan page content for injection attempts ---
    let page_text = request.page_context.to_prompt_context();
    let safety = prompt_guard::scan(&page_text);
    if !safety.is_safe {
        return Err(AiError::new(
            "prompt_injection_blocked",
            format!(
                "Page content was blocked by the prompt safety scanner. Detected issues: {}",
                safety.threats.join("; ")
            ),
        ));
    }

    let _ = app.emit(EVENT_AI_START, ());

    let prompt_content = page_text;

    let history = vec![ChatMessage {
        role: Role::User,
        content: format!("Please summarise the following web page:\n\n{prompt_content}"),
    }];

    let result_text = match mode {
        AiMode::Local => {
            let full_prompt = crate::ai::local_llm::format_phi3_prompt(
                SUMMARIZE_SYSTEM_PROMPT,
                &[],
                &history[0].content,
            );
            let (tx, mut rx) = mpsc::channel::<TokenEvent>(128);
            let engine = engine_opt.ok_or_else(|| {
                AiError::new(
                    "no_model",
                    "Local model not loaded. Please download the model.",
                )
            })?;

            let app_clone = app.clone();
            tokio::spawn(async move {
                while let Some(event) = rx.recv().await {
                    let _ = app_clone.emit(EVENT_AI_TOKEN, &event);
                }
            });

            let result = engine
                .generate(
                    InferenceRequest {
                        prompt: full_prompt,
                        max_new_tokens: config_snapshot.max_tokens,
                        temperature: config_snapshot.temperature,
                        streaming: config_snapshot.streaming,
                    },
                    Some(tx),
                )
                .await
                .map_err(|e| AiError::new("inference_error", e.to_string()))?;

            result.text
        }
        AiMode::Cloud => run_cloud_chat(&app, &state, &history, &config_snapshot).await?,
        AiMode::Off => {
            return Err(AiError::new("ai_disabled", "AI assistant is turned off."));
        }
    };

    let _ = app.emit(EVENT_AI_DONE, ());

    Ok(AiResponse {
        text: result_text,
        mode,
    })
}

/// Rewrite / transform text using the writing assistant.
#[tauri::command]
pub async fn ai_rewrite(
    state: State<'_, AiState>,
    app: AppHandle,
    request: RewriteRequest,
) -> Result<AiResponse, AiError> {
    let action_instruction = match request.action {
        WritingAction::Rewrite => "Rewrite the following text to be clearer and more engaging.",
        WritingAction::Simplify => "Simplify the following text so that a general audience can understand it easily.",
        WritingAction::Expand => "Expand the following text with more detail and supporting information.",
        WritingAction::FixGrammar => "Fix all grammar, punctuation, and spelling errors in the following text. Keep the meaning unchanged.",
        WritingAction::Translate => "Translate the following text to English (if not already English), or to Spanish (if in English).",
    };

    let tone_instruction = request
        .tone
        .as_ref()
        .map(|t| match t {
            WritingTone::Professional => " Use a professional, formal tone.",
            WritingTone::Casual => " Use a casual, conversational tone.",
            WritingTone::Academic => " Use an academic, scholarly tone with precise language.",
            WritingTone::Creative => " Use a creative, expressive tone.",
        })
        .unwrap_or("");

    // --- Prompt guard: scan the user-supplied text for injection ---
    let safety = prompt_guard::scan(&request.text);
    if !safety.is_safe {
        return Err(AiError::new(
            "prompt_injection_blocked",
            format!(
                "Your text was blocked by the prompt safety scanner. Detected issues: {}",
                safety.threats.join("; ")
            ),
        ));
    }

    let user_message = format!(
        "{action_instruction}{tone_instruction}\n\nText:\n{text}",
        text = request.text
    );

    let (mode, engine_opt, config_snapshot) = {
        let guard = state.lock().await;
        (
            guard.config.mode,
            guard.local_engine.clone(),
            guard.config.clone(),
        )
    };

    let _ = app.emit(EVENT_AI_START, ());

    let history = vec![ChatMessage {
        role: Role::User,
        content: user_message,
    }];

    let result_text = match mode {
        AiMode::Local => {
            let full_prompt = crate::ai::local_llm::format_phi3_prompt(
                WRITING_SYSTEM_PROMPT,
                &[],
                &history[0].content,
            );
            let (tx, mut rx) = mpsc::channel::<TokenEvent>(128);
            let engine =
                engine_opt.ok_or_else(|| AiError::new("no_model", "Local model not loaded."))?;

            let app_clone = app.clone();
            tokio::spawn(async move {
                while let Some(event) = rx.recv().await {
                    let _ = app_clone.emit(EVENT_AI_TOKEN, &event);
                }
            });

            let result = engine
                .generate(
                    InferenceRequest {
                        prompt: full_prompt,
                        max_new_tokens: config_snapshot.max_tokens,
                        temperature: config_snapshot.temperature,
                        streaming: config_snapshot.streaming,
                    },
                    Some(tx),
                )
                .await
                .map_err(|e| AiError::new("inference_error", e.to_string()))?;

            result.text
        }
        AiMode::Cloud => run_cloud_chat(&app, &state, &history, &config_snapshot).await?,
        AiMode::Off => {
            return Err(AiError::new("ai_disabled", "AI assistant is turned off."));
        }
    };

    let _ = app.emit(EVENT_AI_DONE, ());

    Ok(AiResponse {
        text: result_text,
        mode,
    })
}

/// Clear the chat history for a specific tab.
#[tauri::command]
pub async fn ai_clear_history(state: State<'_, AiState>, tab_id: String) -> Result<(), AiError> {
    let mut guard = state.lock().await;
    guard.chat_histories.remove(&tab_id);
    Ok(())
}

/// Download the default local model, streaming progress events.
#[tauri::command]
pub async fn ai_download_model(
    state: State<'_, AiState>,
    app: AppHandle,
    dest_dir: String,
) -> Result<String, AiError> {
    use crate::ai::local_llm::{ensure_model_downloaded, DownloadProgress};

    let (tx, mut rx) = mpsc::channel::<DownloadProgress>(32);
    let app_clone = app.clone();

    // Forward download progress to the frontend.
    tokio::spawn(async move {
        while let Some(progress) = rx.recv().await {
            let _ = app_clone.emit(EVENT_MODEL_DOWNLOAD, &progress);
        }
    });

    let path = ensure_model_downloaded(std::path::Path::new(&dest_dir), Some(tx))
        .await
        .map_err(|e| AiError::new("download_failed", e.to_string()))?;

    // Load the engine now that the model is present.
    let engine = LocalLlmEngine::load(path.clone())
        .await
        .map_err(|e| AiError::new("load_failed", e.to_string()))?;

    {
        let mut guard = state.lock().await;
        guard.local_engine = Some(engine);
        guard.config.local_model_path = Some(path.clone());
    }

    Ok(path.display().to_string())
}

/// Load a local model from an existing file path.
#[tauri::command]
pub async fn ai_load_model(
    state: State<'_, AiState>,
    model_path: String,
) -> Result<String, AiError> {
    let path = PathBuf::from(&model_path);
    let engine = LocalLlmEngine::load(path.clone())
        .await
        .map_err(|e| AiError::new("load_failed", e.to_string()))?;

    {
        let mut guard = state.lock().await;
        guard.local_engine = Some(engine);
        guard.config.local_model_path = Some(path);
    }

    Ok(model_path)
}

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

fn build_cloud_client(config: &AiConfig, proxy_port: Option<u16>) -> Option<CloudLlmClient> {
    let key = config.cloud_api_key.as_ref()?.clone();
    CloudLlmClient::new(CloudClientConfig {
        endpoint: config.cloud_api_endpoint.clone(),
        api_key: key,
        model: config.cloud_model.clone(),
        max_tokens: config.max_tokens,
        temperature: config.temperature,
        timeout_secs: config.cloud_timeout_secs,
        max_retries: config.cloud_max_retries,
        proxy_port,
    })
    .ok()
}

async fn run_local_chat(
    app: &AppHandle,
    engine_opt: Option<LocalLlmEngine>,
    history: &[ChatMessage],
    config: &AiConfig,
) -> Result<String, AiError> {
    let engine = engine_opt.ok_or_else(|| {
        AiError::new(
            "no_model",
            "Local model not loaded. Please download the model first.",
        )
    })?;

    let last_user_msg = history
        .iter()
        .rfind(|m| m.role == Role::User)
        .map(|m| m.content.as_str())
        .unwrap_or("");

    let prior_history = if history.len() > 1 {
        &history[..history.len() - 1]
    } else {
        &[]
    };

    let full_prompt =
        crate::ai::local_llm::format_phi3_prompt(CHAT_SYSTEM_PROMPT, prior_history, last_user_msg);

    let (tx, mut rx) = mpsc::channel::<TokenEvent>(128);
    let app_clone = app.clone();

    tokio::spawn(async move {
        while let Some(event) = rx.recv().await {
            let _ = app_clone.emit(EVENT_AI_TOKEN, &event);
        }
    });

    let result = engine
        .generate(
            InferenceRequest {
                prompt: full_prompt,
                max_new_tokens: config.max_tokens,
                temperature: config.temperature,
                streaming: config.streaming,
            },
            Some(tx),
        )
        .await
        .map_err(|e| AiError::new("inference_error", e.to_string()))?;

    Ok(result.text)
}

async fn run_cloud_chat(
    app: &AppHandle,
    state: &State<'_, AiState>,
    history: &[ChatMessage],
    config: &AiConfig,
) -> Result<String, AiError> {
    let key = config
        .cloud_api_key
        .as_ref()
        .ok_or_else(|| AiError::new("no_api_key", "No cloud API key configured."))?
        .clone();

    let proxy_port = state.lock().await.proxy_port;

    let client = CloudLlmClient::new(CloudClientConfig {
        endpoint: config.cloud_api_endpoint.clone(),
        api_key: key,
        model: config.cloud_model.clone(),
        max_tokens: config.max_tokens,
        temperature: config.temperature,
        timeout_secs: config.cloud_timeout_secs,
        max_retries: config.cloud_max_retries,
        proxy_port,
    })
    .map_err(|e| AiError::new("client_init", e.to_string()))?;

    let system = crate::ai::cloud_llm::cloud_system_prompt(CHAT_SYSTEM_PROMPT);

    let prior_history = if history.len() > 1 {
        &history[..history.len() - 1]
    } else {
        &[]
    };

    let last_user_msg = history
        .iter()
        .rfind(|m| m.role == Role::User)
        .map(|m| m.content.as_str())
        .unwrap_or("");

    let (tx, mut rx) = mpsc::channel::<CloudTokenEvent>(128);
    let app_clone = app.clone();

    tokio::spawn(async move {
        while let Some(event) = rx.recv().await {
            let token_event = TokenEvent {
                token: event.token,
                done: event.done,
            };
            let _ = app_clone.emit(EVENT_AI_TOKEN, &token_event);
        }
    });

    let result = client
        .chat(&system, prior_history, last_user_msg, Some(tx))
        .await
        .map_err(|e| AiError::new("cloud_error", e.to_string()))?;

    Ok(result.text)
}

// ---------------------------------------------------------------------------
// Ollama integration commands (Pillar 6 Q-AI: local model auto-download +
// model picker + chat streaming with PQC-envelope wrapping)
// ---------------------------------------------------------------------------

/// Default Ollama base URL used when the config has no explicit override.
const DEFAULT_OLLAMA_URL: &str = "http://localhost:11434";

/// Default model auto-pulled on first run.
pub const DEFAULT_OLLAMA_MODEL: &str = "llama3.2";

fn build_ollama_client(state_guard: &SidebarState, model_override: Option<&str>) -> OllamaClient {
    // The config currently routes all local URLs through the cloud_api_endpoint
    // when in cloud mode. For Ollama (which is always local) we use a fixed
    // localhost URL unless the user has overridden it via cloud_api_endpoint
    // explicitly to an Ollama endpoint.
    let base = if state_guard
        .config
        .cloud_api_endpoint
        .contains(":11434")
    {
        state_guard.config.cloud_api_endpoint.as_str()
    } else {
        DEFAULT_OLLAMA_URL
    };
    let model = match model_override {
        Some(m) => m,
        None if state_guard.config.cloud_model.is_empty() => DEFAULT_OLLAMA_MODEL,
        None => {
            // When mode is Local + Ollama, cloud_model is repurposed as the
            // active Ollama model name (e.g. "llama3.2", "phi3").
            state_guard.config.cloud_model.as_str()
        }
    };
    OllamaClient::new(base, model)
}

/// List models available on the local Ollama daemon.
///
/// Returns an empty list if Ollama is not running. The frontend uses this to
/// populate the model-picker dropdown in `AISidebar.tsx`.
#[tauri::command]
pub async fn ai_ollama_list_models(
    state: State<'_, AiState>,
) -> Result<Vec<OllamaModelInfo>, AiError> {
    let client = {
        let guard = state.lock().await;
        build_ollama_client(&guard, None)
    };
    client
        .list_models()
        .await
        .map_err(|e| AiError::new("ollama_list_failed", e.to_string()))
}

/// Pull a model from the Ollama registry, streaming progress events to the
/// frontend on the `EVENT_OLLAMA_PULL` channel.
///
/// Spec contract: "First-run flow auto-downloads default model `llama3.2` via
/// Ollama API (`POST http://localhost:11434/api/pull` with stream).
/// UI shows progress (download size in MB)."
#[tauri::command]
pub async fn ai_ollama_pull_model(
    state: State<'_, AiState>,
    app: AppHandle,
    model_name: String,
) -> Result<String, AiError> {
    let client = {
        let guard = state.lock().await;
        build_ollama_client(&guard, Some(&model_name))
    };

    let (tx, mut rx) = mpsc::channel::<PullProgress>(64);
    let app_clone = app.clone();
    tokio::spawn(async move {
        while let Some(progress) = rx.recv().await {
            let _ = app_clone.emit(EVENT_OLLAMA_PULL, &progress);
        }
    });

    client
        .pull_model(&model_name, Some(tx))
        .await
        .map_err(|e| AiError::new("ollama_pull_failed", e.to_string()))?;

    // Update config with the now-active local model.
    {
        let mut guard = state.lock().await;
        guard.config.cloud_model = model_name.clone();
        guard.config.mode = AiMode::Local;
    }

    Ok(model_name)
}

/// Auto-pull the default model on first run if it is not already present.
///
/// Idempotent: a no-op when `llama3.2` is already in `/api/tags`.
/// Returns `true` if the model was pulled, `false` if it was already present.
#[tauri::command]
pub async fn ai_ollama_ensure_default_model(
    state: State<'_, AiState>,
    app: AppHandle,
) -> Result<bool, AiError> {
    let already_present = {
        let guard = state.lock().await;
        let client = build_ollama_client(&guard, Some(DEFAULT_OLLAMA_MODEL));
        client.has_model(DEFAULT_OLLAMA_MODEL).await.unwrap_or(false)
    };

    if already_present {
        // Already set up — just mark the config so the UI shows the model.
        let mut guard = state.lock().await;
        if guard.config.cloud_model.is_empty() {
            guard.config.cloud_model = DEFAULT_OLLAMA_MODEL.to_string();
        }
        return Ok(false);
    }

    ai_ollama_pull_model(state, app, DEFAULT_OLLAMA_MODEL.to_string()).await?;
    Ok(true)
}

/// Stream a chat completion through Ollama, optionally wrapping each chunk
/// in a PQC envelope.
///
/// When `pqc_session_id` is provided, every emitted token chunk is wrapped
/// using `pqc_envelope::wrap_chunk` and emitted on `EVENT_AI_PQC_CHUNK`. When
/// `None`, raw token text is emitted on `EVENT_AI_TOKEN` for backward
/// compatibility with the existing UI streaming path.
#[tauri::command]
pub async fn ai_ollama_chat_stream(
    state: State<'_, AiState>,
    app: AppHandle,
    tab_id: String,
    message: String,
    pqc_session_id: Option<String>,
) -> Result<AiResponse, AiError> {
    // Gate: PromptGuard scan before any LLM call.
    let safety = prompt_guard::scan(&message);
    if !safety.is_safe {
        return Err(AiError::new(
            "prompt_injection_blocked",
            format!(
                "Your message was blocked by the prompt safety scanner. Detected issues: {}",
                safety.threats.join("; ")
            ),
        ));
    }

    let (client, mut messages) = {
        let mut guard = state.lock().await;
        let client = build_ollama_client(&guard, None);
        let history = guard.chat_histories.entry(tab_id.clone()).or_default();
        history.push(ChatMessage {
            role: Role::User,
            content: message.clone(),
        });
        let messages: Vec<OllamaMessage> = history
            .iter()
            .map(|m| OllamaMessage {
                role: match m.role {
                    Role::User => "user".into(),
                    Role::Assistant => "assistant".into(),
                    Role::System => "system".into(),
                },
                content: m.content.clone(),
            })
            .collect();
        (client, messages)
    };

    // Prepend a system message to anchor the assistant.
    messages.insert(
        0,
        OllamaMessage {
            role: "system".into(),
            content: CHAT_SYSTEM_PROMPT.to_string(),
        },
    );

    let _ = app.emit(EVENT_AI_START, ());

    // Spawn forwarder that wraps each chunk in PQC envelope (if session
    // present) and emits the wrapped chunk on EVENT_AI_PQC_CHUNK; the raw
    // token also goes out on EVENT_AI_TOKEN so existing UI keeps working.
    let (tx, mut rx) = mpsc::channel::<OllamaStreamEvent>(128);
    let app_clone = app.clone();
    let pqc_sid = pqc_session_id.clone();
    tokio::spawn(async move {
        while let Some(ev) = rx.recv().await {
            let token_event = TokenEvent {
                token: ev.token.clone(),
                done: ev.done,
            };
            let _ = app_clone.emit(EVENT_AI_TOKEN, &token_event);

            if let Some(sid) = &pqc_sid {
                if !ev.token.is_empty() {
                    if let Ok(env) = pqc_envelope::wrap_chunk(sid, &ev.token) {
                        let _ = app_clone.emit(EVENT_AI_PQC_CHUNK, &env);
                    }
                }
            }
        }
    });

    let result = client
        .chat_stream(&messages, tx)
        .await
        .map_err(|e| AiError::new("ollama_chat_failed", e.to_string()))?;

    {
        let mut guard = state.lock().await;
        if let Some(history) = guard.chat_histories.get_mut(&tab_id) {
            history.push(ChatMessage {
                role: Role::Assistant,
                content: result.clone(),
            });
        }
    }

    let _ = app.emit(EVENT_AI_DONE, ());

    Ok(AiResponse {
        text: result,
        mode: AiMode::Local,
    })
}

// ---------------------------------------------------------------------------
// PQC envelope commands (Pillar 6 Q-AI: streaming PQC tunnel)
// ---------------------------------------------------------------------------

/// Initialize a PQC envelope session for AI streaming.
#[tauri::command]
pub async fn ai_pqc_envelope_session_init() -> Result<PqcEnvelopeSession, AiError> {
    pqc_envelope::session_init().map_err(|e| AiError::new("pqc_session_init_failed", e.to_string()))
}

/// Wrap a single plaintext chunk into a PQC envelope.
#[tauri::command]
pub async fn ai_pqc_envelope_wrap_chunk(
    session_id: String,
    plaintext: String,
) -> Result<PqcEnvelope, AiError> {
    pqc_envelope::wrap_chunk(&session_id, &plaintext)
        .map_err(|e| AiError::new("pqc_wrap_failed", e.to_string()))
}

/// Unwrap a PQC envelope back to plaintext.
#[tauri::command]
pub async fn ai_pqc_envelope_unwrap_chunk(
    session_id: String,
    envelope: PqcEnvelope,
) -> Result<String, AiError> {
    pqc_envelope::unwrap_chunk(&session_id, &envelope)
        .map_err(|e| AiError::new("pqc_unwrap_failed", e.to_string()))
}

/// Tear down a PQC envelope session.
#[tauri::command]
pub async fn ai_pqc_envelope_session_close(session_id: String) -> Result<bool, AiError> {
    Ok(pqc_envelope::session_close(&session_id))
}

// ---------------------------------------------------------------------------
// Command registration helper
// ---------------------------------------------------------------------------

/// Register all AI sidebar Tauri commands.
///
/// Call this from `main.rs` inside the `tauri::Builder` chain:
/// ```ignore
/// .invoke_handler(tauri::generate_handler![
///     ...
///     ...ai::sidebar::tauri_commands()...,
/// ])
/// ```
///
/// Because `tauri::generate_handler!` is a macro, the individual command
/// function names are listed in `mod.rs` alongside the macro invocation.
pub fn initial_state(proxy_port: Option<u16>) -> AiState {
    Arc::new(Mutex::new(SidebarState {
        proxy_port,
        ..Default::default()
    }))
}
