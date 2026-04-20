//! Mobile WebView bridge (Track B, Pillar 8 mobile target).
//!
//! Purpose: expose a narrow, serde-safe PQC proxy surface that the Flutter
//! app (`app/lib/browser/`) can call through Tauri 2.x IPC to wrap WebView
//! traffic in ML-KEM-768 key-encapsulated sessions.
//!
//! Scope boundary: this module does NOT implement crypto. It wraps
//! `zipminator_core::Kyber768` so that one audited core remains the only
//! implementation. The module's job is the IPC shape: validate inputs,
//! surface typed errors, produce base64-encoded outputs safely serialized
//! to Dart.
//!
//! Naming note: the single public command is `pqc_proxy_command` per the
//! Track B exit criterion. Future commands (e.g. session reuse, metrics)
//! live alongside it under the same `mobile` module.

use base64::engine::general_purpose::STANDARD as B64;
use base64::Engine;
use serde::{Deserialize, Serialize};
use zipminator_core::{Kyber768, PublicKey, KYBER768_PUBLICKEYBYTES};

/// Request shape coming from the Dart side. `url` is the WebView target
/// the proxy is being asked to wrap; `peer_public_key_b64` is the
/// responder's ML-KEM-768 public key encoded as standard base64.
#[derive(Debug, Clone, Deserialize)]
pub struct PqcProxyRequest {
    /// WebView target URL. Must be http(s) and non-empty.
    pub url: String,
    /// Responder's Kyber768 public key, base64-encoded.
    /// Must decode to exactly `KYBER768_PUBLICKEYBYTES` (1184) bytes.
    pub peer_public_key_b64: String,
}

/// Response returned to the Dart side. All byte fields are base64 so they
/// pass through Tauri 2.x IPC without binary escaping and so Flutter can
/// log them in development without corrupting payloads.
#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
pub struct PqcProxyResponse {
    /// Echoed sanitized URL so the Dart side can confirm routing.
    pub url: String,
    /// Ciphertext produced by `Kyber768::encapsulate`, base64.
    pub ciphertext_b64: String,
    /// Shared secret size in bytes (always 32 for ML-KEM-768).
    pub shared_secret_bytes: usize,
    /// NIST security level (3 for ML-KEM-768).
    pub nist_level: u8,
    /// Algorithm tag so logs stay unambiguous cross-process.
    pub algorithm: &'static str,
}

/// Typed error surface for the mobile bridge. Each variant maps to a
/// distinct Dart-side failure mode so the UI can differentiate "user fed
/// bad URL" from "crypto backend refused the key".
#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
#[serde(tag = "kind", content = "message")]
pub enum PqcProxyError {
    /// `url` failed basic shape validation (empty, wrong scheme, etc.).
    InvalidUrl(String),
    /// `peer_public_key_b64` was not valid standard base64.
    InvalidBase64(String),
    /// Decoded key length did not match `Kyber768::PK_BYTES` (1184).
    InvalidKeyLength {
        expected: usize,
        got: usize,
    },
    /// Crypto core rejected the key (caller-supplied error text).
    EncapsulationFailed(String),
}

impl std::fmt::Display for PqcProxyError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::InvalidUrl(m) => write!(f, "invalid url: {m}"),
            Self::InvalidBase64(m) => write!(f, "invalid base64: {m}"),
            Self::InvalidKeyLength { expected, got } => {
                write!(f, "invalid key length: expected {expected}, got {got}")
            }
            Self::EncapsulationFailed(m) => write!(f, "encapsulation failed: {m}"),
        }
    }
}

impl std::error::Error for PqcProxyError {}

/// Validate a WebView target URL. Minimal check (scheme + non-empty host)
/// since the WebView itself enforces full RFC 3986 shape; we just stop
/// the obvious garbage at the IPC boundary.
fn validate_url(url: &str) -> Result<String, PqcProxyError> {
    let trimmed = url.trim();
    if trimmed.is_empty() {
        return Err(PqcProxyError::InvalidUrl("empty url".into()));
    }
    let is_http = trimmed.starts_with("http://") || trimmed.starts_with("https://");
    if !is_http {
        return Err(PqcProxyError::InvalidUrl(format!(
            "scheme must be http or https, got: {trimmed:?}"
        )));
    }
    // Strip scheme to confirm host is non-empty. Also rejects ":8080/path"
    // (port-only authority) which is not a routable WebView target.
    let rest = trimmed
        .trim_start_matches("https://")
        .trim_start_matches("http://");
    if rest.is_empty() || rest.starts_with('/') || rest.starts_with(':') {
        return Err(PqcProxyError::InvalidUrl("missing host".into()));
    }
    Ok(trimmed.to_string())
}

/// Decode a base64-encoded Kyber768 public key into the typed wrapper.
/// Length is checked before touching the crypto core so bad inputs never
/// reach constant-time code paths.
fn decode_peer_key(peer_public_key_b64: &str) -> Result<PublicKey, PqcProxyError> {
    let decoded = B64
        .decode(peer_public_key_b64)
        .map_err(|e| PqcProxyError::InvalidBase64(e.to_string()))?;
    if decoded.len() != KYBER768_PUBLICKEYBYTES {
        return Err(PqcProxyError::InvalidKeyLength {
            expected: KYBER768_PUBLICKEYBYTES,
            got: decoded.len(),
        });
    }
    PublicKey::from_bytes(&decoded)
        .map_err(|e| PqcProxyError::EncapsulationFailed(e.to_string()))
}

/// Core logic, exposed for unit tests. Returns typed errors rather than
/// flattening to strings so callers can match specific failure modes.
pub fn pqc_proxy_core(req: PqcProxyRequest) -> Result<PqcProxyResponse, PqcProxyError> {
    let sanitized_url = validate_url(&req.url)?;
    let peer_key = decode_peer_key(&req.peer_public_key_b64)?;

    // Encapsulate against the peer's public key. We base64 the ciphertext
    // and only report the shared-secret length over IPC so secret material
    // never crosses the WebView bridge.
    let (ct, ss) = Kyber768::encapsulate(&peer_key);

    Ok(PqcProxyResponse {
        url: sanitized_url,
        ciphertext_b64: B64.encode(&ct.data),
        shared_secret_bytes: ss.as_bytes().len(),
        nist_level: 3,
        algorithm: "ML-KEM-768 (NIST FIPS 203)",
    })
}

/// Tauri command callable from Dart via `invoke("pqc_proxy_command", ...)`.
///
/// Flattens the typed error to a JSON string for Tauri 2.x's IPC surface,
/// because `Result<T, E>` from a command serializes the error via its
/// Serialize impl; exposing the structured variant lets Dart match on
/// `kind`.
#[tauri::command]
pub fn pqc_proxy_command(request: PqcProxyRequest) -> Result<PqcProxyResponse, PqcProxyError> {
    pqc_proxy_core(request)
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Happy path: valid https URL + valid Kyber768 public key produces a
    /// response with 32-byte shared secret and ML-KEM-768 algorithm tag.
    #[test]
    fn pqc_proxy_core_happy_path_returns_response() {
        // Generate a real Kyber768 keypair so this is not a hand-rolled
        // fixture that would silently drift from the core.
        let (pk, _sk) = Kyber768::keypair();
        let pk_b64 = B64.encode(&pk.data);

        let req = PqcProxyRequest {
            url: "https://example.com/wallet".into(),
            peer_public_key_b64: pk_b64,
        };
        let resp = pqc_proxy_core(req).expect("happy path must succeed");

        assert_eq!(resp.url, "https://example.com/wallet");
        assert!(
            !resp.ciphertext_b64.is_empty(),
            "ciphertext must not be empty"
        );
        assert_eq!(resp.shared_secret_bytes, 32, "ML-KEM-768 SS is 32 bytes");
        assert_eq!(resp.nist_level, 3);
        assert_eq!(resp.algorithm, "ML-KEM-768 (NIST FIPS 203)");
    }

    #[test]
    fn pqc_proxy_core_rejects_empty_url() {
        let req = PqcProxyRequest {
            url: "   ".into(),
            peer_public_key_b64: "aa".into(),
        };
        match pqc_proxy_core(req).unwrap_err() {
            PqcProxyError::InvalidUrl(m) => assert!(m.contains("empty")),
            other => panic!("expected InvalidUrl, got {other:?}"),
        }
    }

    #[test]
    fn pqc_proxy_core_rejects_non_http_scheme() {
        let req = PqcProxyRequest {
            url: "ftp://example.com".into(),
            peer_public_key_b64: "aa".into(),
        };
        match pqc_proxy_core(req).unwrap_err() {
            PqcProxyError::InvalidUrl(m) => assert!(m.contains("scheme")),
            other => panic!("expected InvalidUrl, got {other:?}"),
        }
    }

    #[test]
    fn pqc_proxy_core_rejects_missing_host() {
        let req = PqcProxyRequest {
            url: "https://".into(),
            peer_public_key_b64: "aa".into(),
        };
        match pqc_proxy_core(req).unwrap_err() {
            PqcProxyError::InvalidUrl(m) => assert!(m.contains("host")),
            other => panic!("expected InvalidUrl, got {other:?}"),
        }
    }

    /// Regression: a port-only authority such as `https://:8080/path` is not
    /// a routable WebView target. The shape check must reject it before the
    /// crypto core ever sees the input.
    #[test]
    fn pqc_proxy_core_rejects_port_only_authority() {
        let req = PqcProxyRequest {
            url: "https://:8080/wallet".into(),
            peer_public_key_b64: "aa".into(),
        };
        match pqc_proxy_core(req).unwrap_err() {
            PqcProxyError::InvalidUrl(m) => assert!(m.contains("host")),
            other => panic!("expected InvalidUrl, got {other:?}"),
        }
    }

    #[test]
    fn pqc_proxy_core_rejects_bad_base64() {
        let req = PqcProxyRequest {
            url: "https://example.com".into(),
            peer_public_key_b64: "not-base64!!!".into(),
        };
        match pqc_proxy_core(req).unwrap_err() {
            PqcProxyError::InvalidBase64(_) => {}
            other => panic!("expected InvalidBase64, got {other:?}"),
        }
    }

    #[test]
    fn pqc_proxy_core_rejects_wrong_key_length() {
        // 64 zero bytes, base64 -> decodes to 64 bytes, not 1184.
        let short_key = B64.encode([0u8; 64]);
        let req = PqcProxyRequest {
            url: "https://example.com".into(),
            peer_public_key_b64: short_key,
        };
        match pqc_proxy_core(req).unwrap_err() {
            PqcProxyError::InvalidKeyLength { expected, got } => {
                assert_eq!(expected, KYBER768_PUBLICKEYBYTES);
                assert_eq!(got, 64);
            }
            other => panic!("expected InvalidKeyLength, got {other:?}"),
        }
    }

    /// Serde contract test: the response shape must serialize with snake_case
    /// field names the Dart side expects. If someone renames a field this
    /// catches the break before the app ships.
    #[test]
    fn pqc_proxy_response_serializes_with_snake_case_keys() {
        let resp = PqcProxyResponse {
            url: "https://example.com".into(),
            ciphertext_b64: "AAAA".into(),
            shared_secret_bytes: 32,
            nist_level: 3,
            algorithm: "ML-KEM-768 (NIST FIPS 203)",
        };
        let json = serde_json::to_value(&resp).expect("serialize response");
        assert!(json.get("url").is_some());
        assert!(json.get("ciphertext_b64").is_some());
        assert!(json.get("shared_secret_bytes").is_some());
        assert!(json.get("nist_level").is_some());
        assert!(json.get("algorithm").is_some());
    }

    /// Serde contract test: the error variants must serialize with a
    /// `kind` tag so the Dart side can pattern-match.
    #[test]
    fn pqc_proxy_error_serializes_with_kind_tag() {
        let err = PqcProxyError::InvalidKeyLength {
            expected: 1184,
            got: 64,
        };
        let json = serde_json::to_value(&err).expect("serialize error");
        assert_eq!(json.get("kind").and_then(|v| v.as_str()), Some("InvalidKeyLength"));
    }
}
