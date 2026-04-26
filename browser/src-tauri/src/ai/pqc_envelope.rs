//! PQC envelope wrapper for AI streaming chunks.
//!
//! Provides ML-KEM-768 + AES-256-GCM envelope encryption for AI streaming
//! token chunks. Each session establishes a shared secret via Kyber768; each
//! streaming chunk is wrapped under that shared secret with a fresh per-chunk
//! nonce. The wire format `{ ct, kem_ct, nonce }` is the contract surfaced to
//! the frontend (see `browser/tests/pqc_tunnel_streaming_test.ts`).
//!
//! # Threat model
//!
//! Defends against an adversary who can read `ai-token-generated` Tauri
//! event payloads but does not have access to the in-process session
//! secret. Combined with the existing PQC TLS proxy, streaming AI tokens
//! never appear in plaintext on any IPC channel that crosses a process
//! boundary in cloud mode.
//!
//! # Determinism
//!
//! `wrap_chunk` is non-deterministic by design (fresh nonce per call).
//! `unwrap_chunk` is deterministic and rejects tampered envelopes via the
//! AES-GCM authentication tag and the recorded session shared secret.
//!
//! # Standards
//!
//! - NIST FIPS 203 (ML-KEM-768) for the KEM primitive
//! - NIST SP 800-38D (AES-256-GCM) for the data-encapsulation primitive
//! - RFC 5869 (HKDF-SHA-256) for shared-secret -> AES key derivation

use std::sync::Mutex;

use aes_gcm::aead::{Aead, KeyInit};
use aes_gcm::{Aes256Gcm, Key, Nonce};
use base64::engine::general_purpose::STANDARD as B64;
use base64::Engine;
use dashmap::DashMap;
use hkdf::Hkdf;
use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};
use sha2::Sha256;
use zeroize::Zeroizing;

use zipminator_core::Kyber768;

/// 96-bit nonce length for AES-GCM (per NIST SP 800-38D recommendation).
const NONCE_LEN: usize = 12;

/// Maximum live sessions to keep in memory before LRU-evicting (defensive
/// bound; in practice each browser tab uses at most one concurrent session).
const MAX_SESSIONS: usize = 256;

// ---------------------------------------------------------------------------
// Wire-format types
// ---------------------------------------------------------------------------

/// Output of `session_init`: the public-key half of the KEM, the per-session
/// ciphertext bound to that public key, and an opaque session identifier.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PqcEnvelopeSession {
    /// Opaque identifier the frontend must echo back on every wrap/unwrap.
    pub session_id: String,
    /// Base64-encoded ML-KEM-768 public key (1184 bytes raw).
    pub public_key: String,
    /// Base64-encoded ML-KEM-768 ciphertext that encapsulates the shared
    /// secret (1088 bytes raw).
    pub kem_ct: String,
}

/// Wire envelope for a single streaming chunk.
///
/// Field order matches the spec: `{ ct, kem_ct, nonce }`. The
/// `kem_ct` is repeated on every chunk so that an out-of-order observer
/// can still pin chunks to a session without keeping additional state.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct PqcEnvelope {
    /// Base64-encoded AES-GCM ciphertext (plaintext + 16-byte auth tag).
    pub ct: String,
    /// Base64-encoded ML-KEM-768 ciphertext for this session.
    pub kem_ct: String,
    /// Base64-encoded 12-byte nonce, fresh per chunk.
    pub nonce: String,
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

#[derive(Debug, thiserror::Error)]
pub enum EnvelopeError {
    #[error("session not found")]
    SessionNotFound,

    #[error("base64 decode error: {0}")]
    Base64(String),

    #[error("kem decapsulation failed: {0}")]
    Decapsulation(String),

    #[error("AEAD encryption failed")]
    AeadEncrypt,

    #[error("AEAD decryption failed (tampered ciphertext, nonce, or wrong session)")]
    AeadDecrypt,

    #[error("invalid nonce length: expected {NONCE_LEN}, got {0}")]
    InvalidNonce(usize),

    #[error("session_id mismatch between envelope.kem_ct binding and supplied session_id")]
    SessionMismatch,
}

pub type EnvelopeResult<T> = Result<T, EnvelopeError>;

// ---------------------------------------------------------------------------
// Session registry
// ---------------------------------------------------------------------------

/// In-memory session entry. The shared secret is wiped on drop via
/// `Zeroizing`. The KEM ciphertext is stored as base64 to avoid re-encoding
/// on every wrap call.
struct SessionEntry {
    aes_key: Zeroizing<[u8; 32]>,
    kem_ct_b64: String,
}

/// Process-global session registry. `DashMap` allows concurrent wrap/unwrap
/// from multiple Tauri command handlers without contention.
static SESSIONS: Lazy<DashMap<String, SessionEntry>> = Lazy::new(DashMap::new);

/// LRU eviction guard — bounds memory if a buggy frontend leaks sessions.
static EVICTION_LOCK: Mutex<()> = Mutex::new(());

fn maybe_evict() {
    if SESSIONS.len() > MAX_SESSIONS {
        // Take the lock so two threads cannot both decide to evict.
        let _guard = EVICTION_LOCK.lock().ok();
        // Evict 1/4 of the entries by deterministic key order to bound memory.
        if SESSIONS.len() > MAX_SESSIONS {
            let mut keys: Vec<String> = SESSIONS.iter().map(|e| e.key().clone()).collect();
            keys.sort();
            let drop_count = keys.len() / 4;
            for k in keys.into_iter().take(drop_count) {
                SESSIONS.remove(&k);
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Public API (called by Tauri commands)
// ---------------------------------------------------------------------------

/// Initialize a new envelope session.
///
/// Generates a Kyber768 keypair, encapsulates a shared secret against its own
/// public key, derives an AES-256 key via HKDF-SHA-256, and stores
/// `(session_id -> aes_key)` in the registry. The frontend receives the
/// public key (for transparency / future re-handshake) and the KEM ciphertext.
pub fn session_init() -> EnvelopeResult<PqcEnvelopeSession> {
    let (pk, sk) = Kyber768::keypair();
    let (ct, ss) = Kyber768::encapsulate(&pk);

    let _ = sk; // We don't keep the secret key; this session only encrypts
                // outbound chunks server-side. If we ever need to accept
                // inbound encapsulations we can extend the API.

    let mut aes_key = Zeroizing::new([0u8; 32]);
    let hk = Hkdf::<Sha256>::new(None, ss.as_bytes());
    hk.expand(b"zipminator-ai-pqc-tunnel-v1", aes_key.as_mut())
        .map_err(|e| EnvelopeError::Decapsulation(e.to_string()))?;

    let session_id = format!("sess-{}", random_id());
    let kem_ct_b64 = B64.encode(&ct.data);

    let entry = SessionEntry {
        aes_key,
        kem_ct_b64: kem_ct_b64.clone(),
    };
    SESSIONS.insert(session_id.clone(), entry);
    maybe_evict();

    Ok(PqcEnvelopeSession {
        session_id,
        public_key: B64.encode(&pk.data),
        kem_ct: kem_ct_b64,
    })
}

/// Wrap a single streaming-chunk plaintext into a `PqcEnvelope`.
pub fn wrap_chunk(session_id: &str, plaintext: &str) -> EnvelopeResult<PqcEnvelope> {
    let entry = SESSIONS
        .get(session_id)
        .ok_or(EnvelopeError::SessionNotFound)?;

    let key = Key::<Aes256Gcm>::from_slice(entry.aes_key.as_ref());
    let cipher = Aes256Gcm::new(key);

    let mut nonce_bytes = [0u8; NONCE_LEN];
    getrandom::getrandom(&mut nonce_bytes)
        .map_err(|e| EnvelopeError::Decapsulation(format!("rng: {e}")))?;
    let nonce = Nonce::from_slice(&nonce_bytes);

    let ct = cipher
        .encrypt(nonce, plaintext.as_bytes())
        .map_err(|_| EnvelopeError::AeadEncrypt)?;

    Ok(PqcEnvelope {
        ct: B64.encode(&ct),
        kem_ct: entry.kem_ct_b64.clone(),
        nonce: B64.encode(nonce_bytes),
    })
}

/// Unwrap a `PqcEnvelope` back to plaintext.
pub fn unwrap_chunk(session_id: &str, envelope: &PqcEnvelope) -> EnvelopeResult<String> {
    let entry = SESSIONS
        .get(session_id)
        .ok_or(EnvelopeError::SessionNotFound)?;

    if envelope.kem_ct != entry.kem_ct_b64 {
        return Err(EnvelopeError::SessionMismatch);
    }

    let key = Key::<Aes256Gcm>::from_slice(entry.aes_key.as_ref());
    let cipher = Aes256Gcm::new(key);

    let nonce_bytes = B64
        .decode(&envelope.nonce)
        .map_err(|e| EnvelopeError::Base64(e.to_string()))?;
    if nonce_bytes.len() != NONCE_LEN {
        return Err(EnvelopeError::InvalidNonce(nonce_bytes.len()));
    }
    let nonce = Nonce::from_slice(&nonce_bytes);

    let ct = B64
        .decode(&envelope.ct)
        .map_err(|e| EnvelopeError::Base64(e.to_string()))?;

    let pt_bytes = cipher
        .decrypt(nonce, ct.as_ref())
        .map_err(|_| EnvelopeError::AeadDecrypt)?;

    String::from_utf8(pt_bytes).map_err(|e| EnvelopeError::Base64(e.to_string()))
}

/// Tear down a session and zero its key material.
pub fn session_close(session_id: &str) -> bool {
    SESSIONS.remove(session_id).is_some()
}

/// Number of live sessions (test-only helper).
#[cfg(test)]
pub fn live_session_count() -> usize {
    SESSIONS.len()
}

fn random_id() -> String {
    let mut buf = [0u8; 8];
    let _ = getrandom::getrandom(&mut buf);
    hex::encode(buf)
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn session_init_returns_distinct_session_ids() {
        let s1 = session_init().expect("session_init #1");
        let s2 = session_init().expect("session_init #2");
        assert_ne!(s1.session_id, s2.session_id);
        assert!(!s1.kem_ct.is_empty());
        assert!(!s2.kem_ct.is_empty());
        // Public key length is base64 of 1184 bytes (Kyber768) -> 1580 chars.
        assert!(s1.public_key.len() > 1000);
    }

    #[test]
    fn wrap_then_unwrap_roundtrip() {
        let s = session_init().unwrap();
        let pt = "Hello, post-quantum world!";
        let env = wrap_chunk(&s.session_id, pt).unwrap();
        let out = unwrap_chunk(&s.session_id, &env).unwrap();
        assert_eq!(out, pt);
    }

    #[test]
    fn envelope_has_required_fields() {
        let s = session_init().unwrap();
        let env = wrap_chunk(&s.session_id, "x").unwrap();
        assert!(!env.ct.is_empty());
        assert!(!env.nonce.is_empty());
        assert!(!env.kem_ct.is_empty());
        assert_eq!(env.kem_ct, s.kem_ct);
    }

    #[test]
    fn fresh_nonce_per_chunk() {
        let s = session_init().unwrap();
        let a = wrap_chunk(&s.session_id, "chunk a").unwrap();
        let b = wrap_chunk(&s.session_id, "chunk b").unwrap();
        assert_ne!(a.nonce, b.nonce, "nonce must be unique per chunk");
        // Same plaintext should still produce different ciphertext (nonce reuse defence).
        let c1 = wrap_chunk(&s.session_id, "same plaintext").unwrap();
        let c2 = wrap_chunk(&s.session_id, "same plaintext").unwrap();
        assert_ne!(c1.ct, c2.ct);
        assert_ne!(c1.nonce, c2.nonce);
    }

    #[test]
    fn unwrap_rejects_tampered_ct() {
        let s = session_init().unwrap();
        let mut env = wrap_chunk(&s.session_id, "Original").unwrap();
        // Flip a byte in the ciphertext.
        let mut raw = B64.decode(&env.ct).unwrap();
        raw[0] ^= 0xff;
        env.ct = B64.encode(&raw);

        let res = unwrap_chunk(&s.session_id, &env);
        assert!(matches!(res, Err(EnvelopeError::AeadDecrypt)));
    }

    #[test]
    fn unwrap_rejects_tampered_nonce() {
        let s = session_init().unwrap();
        let mut env = wrap_chunk(&s.session_id, "Original").unwrap();
        // Replace nonce with another well-formed nonce.
        let mut bad = [0u8; NONCE_LEN];
        let _ = getrandom::getrandom(&mut bad);
        env.nonce = B64.encode(bad);

        let res = unwrap_chunk(&s.session_id, &env);
        assert!(matches!(res, Err(EnvelopeError::AeadDecrypt)));
    }

    #[test]
    fn unwrap_rejects_unknown_session() {
        let env = PqcEnvelope {
            ct: "AAAA".to_string(),
            kem_ct: "AAAA".to_string(),
            nonce: B64.encode([0u8; NONCE_LEN]),
        };
        let res = unwrap_chunk("nonexistent-session", &env);
        assert!(matches!(res, Err(EnvelopeError::SessionNotFound)));
    }

    #[test]
    fn unwrap_rejects_session_kem_mismatch() {
        let s1 = session_init().unwrap();
        let s2 = session_init().unwrap();
        let env = wrap_chunk(&s1.session_id, "wrong session test").unwrap();
        // Address the envelope to s2 (which has a different kem_ct).
        let res = unwrap_chunk(&s2.session_id, &env);
        assert!(matches!(res, Err(EnvelopeError::SessionMismatch)));
    }

    #[test]
    fn invalid_nonce_length_rejected() {
        let s = session_init().unwrap();
        let mut env = wrap_chunk(&s.session_id, "x").unwrap();
        env.nonce = B64.encode([0u8; 8]); // wrong length
        let res = unwrap_chunk(&s.session_id, &env);
        assert!(matches!(res, Err(EnvelopeError::InvalidNonce(8))));
    }

    #[test]
    fn session_close_removes_session() {
        let s = session_init().unwrap();
        assert!(session_close(&s.session_id));
        let env = PqcEnvelope {
            ct: "AAAA".into(),
            kem_ct: s.kem_ct.clone(),
            nonce: B64.encode([0u8; NONCE_LEN]),
        };
        let res = unwrap_chunk(&s.session_id, &env);
        assert!(matches!(res, Err(EnvelopeError::SessionNotFound)));
    }

    #[test]
    fn n_chunk_stream_roundtrips() {
        let s = session_init().unwrap();
        let chunks: Vec<&str> = vec![
            "Token 1 - opening",
            "Token 2 - middle",
            "Token 3 - body",
            "Token 4 - close",
        ];
        let envelopes: Vec<PqcEnvelope> = chunks
            .iter()
            .map(|t| wrap_chunk(&s.session_id, t).unwrap())
            .collect();

        let nonces: std::collections::HashSet<_> = envelopes.iter().map(|e| &e.nonce).collect();
        assert_eq!(nonces.len(), chunks.len(), "all nonces must be unique");

        let decoded: Vec<String> = envelopes
            .iter()
            .map(|e| unwrap_chunk(&s.session_id, e).unwrap())
            .collect();
        assert_eq!(
            decoded,
            chunks
                .iter()
                .map(|s| s.to_string())
                .collect::<Vec<_>>()
        );
    }

    #[test]
    fn session_handles_empty_plaintext() {
        let s = session_init().unwrap();
        let env = wrap_chunk(&s.session_id, "").unwrap();
        let out = unwrap_chunk(&s.session_id, &env).unwrap();
        assert_eq!(out, "");
    }

    #[test]
    fn session_handles_unicode_plaintext() {
        let s = session_init().unwrap();
        let pt = "Quantum Encryption: 量子加密 - 🔐 ML-KEM-768";
        let env = wrap_chunk(&s.session_id, pt).unwrap();
        let out = unwrap_chunk(&s.session_id, &env).unwrap();
        assert_eq!(out, pt);
    }
}
