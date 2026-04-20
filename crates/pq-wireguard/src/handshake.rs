//! PQ-WireGuard handshake state machine.
//!
//! Iter 1 contract:
//! - Responder generates a static ML-KEM-768 keypair on construction.
//! - Initiator is constructed with the responder's static public key.
//! - Initiator encapsulates, producing a `HandshakeMessage` (type 1) containing
//!   the ML-KEM-768 ciphertext.
//! - Responder decapsulates and derives the same 32-byte shared secret.
//! - Responder emits a marker response (type 2). On the initiator side,
//!   consuming the response transitions state to `Established`.
//!
//! Cryptography: NIST FIPS 203 (ML-KEM-768) via the PQClean reference
//! implementation exposed by the `pqcrypto-kyber` crate. No custom crypto.
//!
//! Pending follow-ups (later iters): iter 2 adds the full wire format and a
//! byte-for-byte fixture; iter 3 introduces the HKDF-SHA-256 key-derivation
//! chain, constant-time MAC comparison, and zeroize-on-drop for all secret
//! state; iter 3 also replaces the `&'static str` error strings with a
//! `thiserror`-derived enum.

use pqcrypto_kyber::kyber768;
use pqcrypto_traits::kem::{Ciphertext as _, PublicKey as _, SharedSecret as _};

/// Number of bytes in an ML-KEM-768 shared secret (NIST FIPS 203).
pub const SHARED_SECRET_BYTES: usize = 32;

/// Message types on the wire. Matches WireGuard convention where feasible.
pub const MSG_TYPE_INITIATION: u8 = 1;
pub const MSG_TYPE_RESPONSE: u8 = 2;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum HandshakeState {
    Uninitialized,
    InitiationSent,
    InitiationReceived,
    Established,
    Failed,
}

/// Wire message exchanged during the handshake.
///
/// Iter 1 stores only message type and KEM ciphertext. Iter 2 will extend this
/// with sender index, counter, and MAC1/MAC2 per full WireGuard layout, along
/// with `to_bytes` / `from_bytes` serialization and a committed hex fixture.
#[derive(Debug, Clone)]
pub struct HandshakeMessage {
    pub message_type: u8,
    pub kem_ciphertext: Vec<u8>,
}

/// PQ-WireGuard handshake state.
///
/// Secret material (ML-KEM secret key, derived shared secret) lives here.
/// Iter 3 will wrap these in `Zeroize` newtypes; for now the underlying
/// `pqcrypto-kyber` types are `Copy` arrays without a zeroize drop hook, which
/// is a known limitation tracked by the iter-3 TODO.
pub struct Handshake {
    state: HandshakeState,
    is_initiator: bool,
    // Responder-side static keypair (responder role only).
    responder_sk: Option<kyber768::SecretKey>,
    responder_pk: Option<kyber768::PublicKey>,
    // Initiator-side cached peer public key (initiator role only).
    peer_pk: Option<kyber768::PublicKey>,
    // Derived 32-byte shared secret once the handshake has material on both
    // sides. Iter 3 replaces this with HKDF-expanded send/recv transport keys.
    shared_secret: Option<[u8; SHARED_SECRET_BYTES]>,
}

impl Handshake {
    /// Construct a responder. Generates a fresh ML-KEM-768 static keypair.
    ///
    /// In a long-running deployment the static keypair would be persisted and
    /// re-loaded; iter 4 documents that path in the wg-quick templates.
    pub fn new_responder() -> Self {
        let (pk, sk) = kyber768::keypair();
        Self {
            state: HandshakeState::Uninitialized,
            is_initiator: false,
            responder_sk: Some(sk),
            responder_pk: Some(pk),
            peer_pk: None,
            shared_secret: None,
        }
    }

    /// Construct an initiator that has no peer yet. Calling
    /// `create_initiation` on this handshake will fail until a peer public
    /// key is supplied via `new_initiator_for` (the common path).
    pub fn new_initiator() -> Self {
        Self {
            state: HandshakeState::Uninitialized,
            is_initiator: true,
            responder_sk: None,
            responder_pk: None,
            peer_pk: None,
            shared_secret: None,
        }
    }

    /// Construct an initiator targeting `peer_public_bytes` (the responder's
    /// ML-KEM-768 static public key).
    pub fn new_initiator_for(peer_public_bytes: &[u8]) -> Result<Self, &'static str> {
        let peer_pk = kyber768::PublicKey::from_bytes(peer_public_bytes)
            .map_err(|_| "invalid peer public key bytes")?;
        Ok(Self {
            state: HandshakeState::Uninitialized,
            is_initiator: true,
            responder_sk: None,
            responder_pk: None,
            peer_pk: Some(peer_pk),
            shared_secret: None,
        })
    }

    pub fn state(&self) -> HandshakeState {
        self.state
    }

    pub fn is_initiator(&self) -> bool {
        self.is_initiator
    }

    /// Responder's static ML-KEM-768 public key bytes. Returns `None` for an
    /// initiator handshake.
    pub fn static_public(&self) -> Option<Vec<u8>> {
        self.responder_pk.as_ref().map(|pk| pk.as_bytes().to_vec())
    }

    /// Initiator encapsulates to the peer's static public key and emits the
    /// type-1 initiation.
    pub fn create_initiation(&mut self) -> Result<HandshakeMessage, &'static str> {
        if !self.is_initiator {
            return Err("responder cannot initiate");
        }
        if self.state != HandshakeState::Uninitialized {
            return Err("handshake already progressed");
        }
        let peer_pk = self
            .peer_pk
            .as_ref()
            .ok_or("initiator has no peer public key")?;
        let (ss, ct) = kyber768::encapsulate(peer_pk);
        self.shared_secret = Some(copy_shared(&ss));
        self.state = HandshakeState::InitiationSent;
        Ok(HandshakeMessage {
            message_type: MSG_TYPE_INITIATION,
            kem_ciphertext: ct.as_bytes().to_vec(),
        })
    }

    /// Responder consumes a type-1 initiation, decapsulating the ciphertext to
    /// recover the same 32-byte shared secret the initiator has.
    pub fn consume_initiation(&mut self, msg: &HandshakeMessage) -> Result<(), &'static str> {
        if self.is_initiator {
            return Err("initiator cannot consume initiation");
        }
        if msg.message_type != MSG_TYPE_INITIATION {
            return Err("wrong message type");
        }
        if msg.kem_ciphertext.len() != kyber768::ciphertext_bytes() {
            return Err("ML-KEM ciphertext has wrong length");
        }
        let ct = kyber768::Ciphertext::from_bytes(&msg.kem_ciphertext)
            .map_err(|_| "malformed ML-KEM ciphertext")?;
        let sk = self
            .responder_sk
            .as_ref()
            .ok_or("responder missing static secret key")?;
        let ss = kyber768::decapsulate(&ct, sk);
        self.shared_secret = Some(copy_shared(&ss));
        self.state = HandshakeState::InitiationReceived;
        Ok(())
    }

    /// Responder emits the type-2 response once the initiation has been
    /// processed. Iter 1 payload is empty; iter 3 will add a MAC and ephemeral
    /// material per the full Noise_IK + PQC hybrid.
    pub fn create_response(&mut self) -> Result<HandshakeMessage, &'static str> {
        if self.is_initiator {
            return Err("initiator cannot create response");
        }
        if self.state != HandshakeState::InitiationReceived {
            return Err("response requires prior initiation");
        }
        if self.shared_secret.is_none() {
            return Err("no shared secret established");
        }
        self.state = HandshakeState::Established;
        Ok(HandshakeMessage {
            message_type: MSG_TYPE_RESPONSE,
            kem_ciphertext: Vec::new(),
        })
    }

    /// Initiator consumes a type-2 response, reaching `Established`.
    pub fn consume_response(&mut self, msg: &HandshakeMessage) -> Result<(), &'static str> {
        if !self.is_initiator {
            return Err("responder cannot consume response");
        }
        if self.state != HandshakeState::InitiationSent {
            return Err("response out of order");
        }
        if msg.message_type != MSG_TYPE_RESPONSE {
            return Err("wrong message type for response");
        }
        if self.shared_secret.is_none() {
            return Err("initiator has no shared secret to finalize");
        }
        self.state = HandshakeState::Established;
        Ok(())
    }

    /// Post-handshake 32-byte transport secret (iter 1 exposes the raw
    /// ML-KEM-768 shared secret; iter 3 will split this into directional
    /// send/recv keys via HKDF-SHA-256).
    pub fn transport_secret(&self) -> Option<[u8; SHARED_SECRET_BYTES]> {
        if self.state != HandshakeState::Established {
            return None;
        }
        self.shared_secret
    }
}

/// Copy a `pqcrypto_kyber::kyber768::SharedSecret` into a plain fixed-size
/// array so we do not depend on the library's opaque type at call sites.
fn copy_shared(ss: &kyber768::SharedSecret) -> [u8; SHARED_SECRET_BYTES] {
    let bytes = ss.as_bytes();
    debug_assert_eq!(bytes.len(), SHARED_SECRET_BYTES);
    let mut out = [0u8; SHARED_SECRET_BYTES];
    out.copy_from_slice(bytes);
    out
}
