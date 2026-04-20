//! Public Q-Mesh session API tying handshake, KDF, and entropy together.
//!
//! A session has two sides:
//! - The **initiator** calls [`QMeshSession::new`] to generate a keypair
//!   and publish [`QMeshSession::public_key`]. After receiving a
//!   ciphertext from the peer, it calls [`QMeshSession::accept`] to
//!   derive session keys.
//! - The **responder** receives the initiator's public key and calls
//!   [`QMeshSession::encapsulate_to`] to produce a ciphertext (sent back
//!   over the wire) and a matching [`SessionKeys`] pair.
//!
//! The [`QMeshSession::handshake`] method is a responder-side
//! convenience that returns only the session keys; the ciphertext is
//! stashed on the session and retrieved via
//! [`QMeshSession::take_ciphertext`]. This keeps the literal
//! `handshake(peer_pk) -> SessionKeys` signature asked for by the
//! spec while accommodating the fact that the ciphertext must still
//! reach the initiator.
//!
//! Implements NIST FIPS 203 (ML-KEM-768) via `zipminator-core` and
//! FIPS 198 / 180-4 (HMAC-SHA256 + HKDF) for key derivation.

use crate::csi::CsiFrame;
use crate::entropy::{renyi2_bits, EntropyError};
use crate::handshake::QMeshHandshake;
use crate::kdf::{derive_session_keys, KdfError, SessionKeys};
use thiserror::Error;
use zipminator_core::{Ciphertext, PublicKey};

/// Errors produced by the session layer.
#[derive(Debug, Error)]
pub enum SessionError {
    /// Key derivation failed.
    #[error("kdf: {0}")]
    Kdf(#[from] KdfError),
    /// Entropy estimation failed (bad bin count or empty input).
    #[error("entropy: {0}")]
    Entropy(#[from] EntropyError),
    /// [`QMeshSession::take_ciphertext`] called before a successful
    /// [`QMeshSession::handshake`] / [`QMeshSession::encapsulate_to`].
    #[error("no pending ciphertext")]
    NoCiphertext,
}

/// Entropy estimate in bits.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct EntropyBits(pub f64);

/// Default number of bins used by [`QMeshSession::ingest_csi`].
///
/// A power of two so the bin-mapping bitmask is unbiased.
pub const DEFAULT_ENTROPY_BINS: usize = 16;

/// A Q-Mesh session endpoint.
pub struct QMeshSession {
    handshake: QMeshHandshake,
    psk: Option<Vec<u8>>,
    pending_ct: Option<Ciphertext>,
}

impl QMeshSession {
    /// Create a new session endpoint with no pre-shared key salt.
    #[must_use]
    pub fn new() -> Self {
        Self {
            handshake: QMeshHandshake::new(),
            psk: None,
            pending_ct: None,
        }
    }

    /// Create a new session endpoint that salts HKDF with a pre-shared key.
    ///
    /// The PSK binds session keys to a shared context; two endpoints
    /// using different PSKs will derive different session keys even from
    /// an identical ML-KEM shared secret.
    #[must_use]
    pub fn with_psk(psk: Vec<u8>) -> Self {
        Self {
            handshake: QMeshHandshake::new(),
            psk: Some(psk),
            pending_ct: None,
        }
    }

    /// Our local public key, to be sent to the peer.
    #[must_use]
    pub fn public_key(&self) -> &PublicKey {
        self.handshake.public_key()
    }

    /// Responder path: encapsulate against the peer's public key and
    /// return the ciphertext together with derived session keys.
    pub fn encapsulate_to(&self, peer_pk: &PublicKey) -> Result<(Ciphertext, SessionKeys), SessionError> {
        let (ct, ss) = QMeshHandshake::encapsulate(peer_pk);
        let keys = derive_session_keys(ss.as_bytes(), self.psk.as_deref())?;
        Ok((ct, keys))
    }

    /// Responder convenience wrapper: encapsulates to `peer_pk`, stashes
    /// the ciphertext so [`Self::take_ciphertext`] can return it, and
    /// yields the session keys. Matches the literal spec signature.
    pub fn handshake(&mut self, peer_pk: &PublicKey) -> Result<SessionKeys, SessionError> {
        let (ct, keys) = self.encapsulate_to(peer_pk)?;
        self.pending_ct = Some(ct);
        Ok(keys)
    }

    /// Retrieve the ciphertext produced by the most recent
    /// [`Self::handshake`] call. Consumes it; a second call returns
    /// [`SessionError::NoCiphertext`].
    pub fn take_ciphertext(&mut self) -> Result<Ciphertext, SessionError> {
        self.pending_ct.take().ok_or(SessionError::NoCiphertext)
    }

    /// Initiator path: decapsulate a peer-sent ciphertext with our
    /// secret key, then derive session keys.
    pub fn accept(&self, ct: &Ciphertext) -> Result<SessionKeys, SessionError> {
        let ss = self.handshake.decapsulate(ct);
        Ok(derive_session_keys(ss.as_bytes(), self.psk.as_deref())?)
    }

    /// Estimate the Rényi-2 entropy (in bits) of a single CSI frame using
    /// [`DEFAULT_ENTROPY_BINS`] bins.
    ///
    /// Single-frame estimates are noisy; use
    /// [`Self::ingest_csi_windowed`] to aggregate across a window.
    pub fn ingest_csi(&self, frame: &CsiFrame) -> Result<EntropyBits, SessionError> {
        let frames = std::slice::from_ref(frame);
        Ok(EntropyBits(renyi2_bits(frames, DEFAULT_ENTROPY_BINS)?))
    }

    /// Estimate the Rényi-2 entropy (in bits) across a window of frames
    /// using [`DEFAULT_ENTROPY_BINS`] bins. The windowed estimate is
    /// less biased than a single-frame estimate.
    pub fn ingest_csi_windowed(&self, frames: &[CsiFrame]) -> Result<EntropyBits, SessionError> {
        Ok(EntropyBits(renyi2_bits(frames, DEFAULT_ENTROPY_BINS)?))
    }
}

impl Default for QMeshSession {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::csi::{ConstantCsiSource, CsiSource, MockCsiSource};

    #[test]
    fn session_endpoints_agree_on_keys() {
        let alice = QMeshSession::new();
        let bob = QMeshSession::new();
        let (ct, bob_keys) = bob
            .encapsulate_to(alice.public_key())
            .expect("bob encapsulates");
        let alice_keys = alice.accept(&ct).expect("alice accepts");
        assert!(alice_keys.ct_eq(&bob_keys));
    }

    #[test]
    fn handshake_convenience_wrapper_returns_keys_and_stashes_ct() {
        let alice = QMeshSession::new();
        let mut bob = QMeshSession::new();
        let bob_keys = bob.handshake(alice.public_key()).expect("bob handshakes");
        let ct = bob.take_ciphertext().expect("ct available");
        let alice_keys = alice.accept(&ct).expect("alice accepts");
        assert!(alice_keys.ct_eq(&bob_keys));
        // Second take returns NoCiphertext.
        assert!(matches!(
            bob.take_ciphertext(),
            Err(SessionError::NoCiphertext)
        ));
    }

    #[test]
    fn psk_changes_session_keys() {
        let alice_a = QMeshSession::with_psk(b"psk-a".to_vec());
        let alice_b = QMeshSession::with_psk(b"psk-b".to_vec());
        let bob_a = QMeshSession::with_psk(b"psk-a".to_vec());
        let bob_b = QMeshSession::with_psk(b"psk-b".to_vec());

        let (ct_a, keys_a_bob) = bob_a.encapsulate_to(alice_a.public_key()).expect("bob_a");
        let (ct_b, keys_b_bob) = bob_b.encapsulate_to(alice_b.public_key()).expect("bob_b");
        let keys_a_alice = alice_a.accept(&ct_a).expect("alice_a");
        let keys_b_alice = alice_b.accept(&ct_b).expect("alice_b");

        assert!(keys_a_alice.ct_eq(&keys_a_bob));
        assert!(keys_b_alice.ct_eq(&keys_b_bob));
        // Different PSK + different keypairs => different session keys.
        assert!(!keys_a_alice.ct_eq(&keys_b_alice));
    }

    #[test]
    fn ingest_csi_constant_source_yields_near_zero() {
        let sess = QMeshSession::new();
        let mut src = ConstantCsiSource::new(64, 9);
        let frame = src.next_frame().unwrap();
        let h = sess.ingest_csi(&frame).expect("entropy defined");
        assert!(h.0.abs() < 1e-9, "got {}", h.0);
    }

    #[test]
    fn ingest_csi_windowed_mock_source_is_positive() {
        let sess = QMeshSession::new();
        let mut src = MockCsiSource::with_seed(128, 0xABCD);
        let frames: Vec<_> = (0..30).map(|_| src.next_frame().unwrap()).collect();
        let h = sess.ingest_csi_windowed(&frames).expect("entropy defined");
        assert!(h.0 > 0.5, "got {}", h.0);
        assert!(h.0 <= (DEFAULT_ENTROPY_BINS as f64).log2() + 1e-9);
    }
}
