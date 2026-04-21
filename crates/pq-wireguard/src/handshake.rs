//! PQ-WireGuard handshake state machine.
//!
//! Iter 3 contract (supersedes iter 1):
//! - Responder generates a static ML-KEM-768 keypair on construction.
//! - Initiator encapsulates to that key, producing a type-1 message carrying
//!   an ML-KEM-768 ciphertext (wire format frozen in `wire.rs` iter 2).
//! - Responder decapsulates. Both sides now hold the same 32-byte KEM shared
//!   secret.
//! - Both sides run an HKDF-SHA-256 chain (salt = protocol-version string)
//!   over the shared secret, deriving:
//!     * `chaining_key` (32 bytes, internal)
//!     * `k_send_i2r`   (32 bytes, initiator -> responder transport key)
//!     * `k_send_r2i`   (32 bytes, responder -> initiator transport key)
//!     * `response_mac` (32 bytes, responder's proof-of-decapsulation)
//! - Responder emits a type-2 response carrying `response_mac`. The initiator
//!   re-derives `response_mac` locally and compares with
//!   `subtle::ConstantTimeEq`; mismatch rejects the handshake.
//! - All `[u8; 32]` secret buckets are wrapped in `zeroize::Zeroizing` so they
//!   are wiped when the `Handshake` (or returned `TransportSecret`) is dropped.
//!
//! Cryptography: NIST FIPS 203 (ML-KEM-768) via the PQClean reference
//! implementation exposed by the `pqcrypto-kyber` crate (pinned `=0.8.1`);
//! HKDF-SHA-256 via RustCrypto's `hkdf` + `sha2`. No custom crypto.
//!
//! Wire format is frozen at iter 2's layout: the `response_mac` lives in
//! `HandshakeMessage` state only; iter 2's `RESPONSE_WIRE_LEN = 12` does not
//! change. Callers that need MAC-on-wire should extend the `wire` module in a
//! later iter with an explicit fixture regeneration.

use hkdf::Hkdf;
use pqcrypto_kyber::kyber768;
use pqcrypto_traits::kem::{Ciphertext as _, PublicKey as _, SharedSecret as _};
use sha2::Sha256;
use subtle::ConstantTimeEq;
use thiserror::Error;
use zeroize::{Zeroize, Zeroizing};

/// Number of bytes in an ML-KEM-768 shared secret (NIST FIPS 203) and in every
/// HKDF-derived transport key / MAC.
pub const SHARED_SECRET_BYTES: usize = 32;

/// Message types on the wire. Matches WireGuard convention where feasible.
pub const MSG_TYPE_INITIATION: u8 = 1;
pub const MSG_TYPE_RESPONSE: u8 = 2;

/// HKDF salt pinning this specific protocol revision. Changing this value is
/// a wire-incompatible break; bump the version suffix if the chain layout
/// changes and regenerate cross-language fixtures.
const HKDF_SALT: &[u8] = b"PQ-WireGuard v1 FIPS203 ML-KEM-768";

/// HKDF `info` labels. Distinct strings give domain separation between
/// derived keys so that leakage of one cannot be rewound into another.
const HKDF_INFO_CHAINING: &[u8] = b"pq-wg:chaining-key:v1";
const HKDF_INFO_SEND_I2R: &[u8] = b"pq-wg:transport:initiator->responder:v1";
const HKDF_INFO_SEND_R2I: &[u8] = b"pq-wg:transport:responder->initiator:v1";
const HKDF_INFO_RESPONSE_MAC: &[u8] = b"pq-wg:response-mac:v1";

/// Transport key / MAC wrapper. `Zeroizing<[u8; 32]>` derefs transparently to
/// the byte array, so call sites can treat it as `&[u8; 32]`, but the backing
/// bytes are wiped when the value is dropped.
pub type TransportSecret = Zeroizing<[u8; SHARED_SECRET_BYTES]>;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum HandshakeState {
    Uninitialized,
    InitiationSent,
    InitiationReceived,
    Established,
    Failed,
}

/// Typed handshake errors. Variant names mirror the iter-1 string messages so
/// grep audits stay stable.
#[derive(Debug, Error, PartialEq, Eq)]
pub enum Error {
    #[error("invalid peer public key bytes")]
    InvalidPeerPublicKey,
    #[error("responder cannot initiate")]
    RoleMismatchInitiate,
    #[error("initiator cannot consume initiation")]
    RoleMismatchConsumeInit,
    #[error("initiator cannot create response")]
    RoleMismatchCreateResp,
    #[error("responder cannot consume response")]
    RoleMismatchConsumeResp,
    #[error("handshake already progressed")]
    AlreadyProgressed,
    #[error("response requires prior initiation")]
    ResponseBeforeInit,
    #[error("response out of order")]
    ResponseOutOfOrder,
    #[error("wrong message type: got {got}")]
    WrongMessageType { got: u8 },
    #[error("ml-kem ciphertext wrong length: got {got}, want {want}")]
    BadCiphertextLength { got: usize, want: usize },
    #[error("malformed ml-kem ciphertext")]
    MalformedCiphertext,
    #[error("initiator has no peer public key")]
    NoPeerPublicKey,
    #[error("responder missing static secret key")]
    MissingResponderKey,
    #[error("no shared secret established")]
    NoSharedSecret,
    #[error("response is missing a MAC")]
    MissingResponseMac,
    #[error("response MAC failed constant-time comparison")]
    InvalidResponseMac,
}

/// Wire message exchanged during the handshake.
///
/// `response_mac` is `None` on a type-1 initiation and `Some` on a type-2
/// response (iter 3). It is not part of the `wire::WireMessage` serialized
/// layout; see module docstring.
#[derive(Debug, Clone)]
pub struct HandshakeMessage {
    pub message_type: u8,
    pub kem_ciphertext: Vec<u8>,
    pub response_mac: Option<[u8; SHARED_SECRET_BYTES]>,
}

/// PQ-WireGuard handshake state.
pub struct Handshake {
    state: HandshakeState,
    is_initiator: bool,
    // Responder-side static keypair (responder role only).
    responder_sk: Option<kyber768::SecretKey>,
    responder_pk: Option<kyber768::PublicKey>,
    // Initiator-side cached peer public key (initiator role only).
    peer_pk: Option<kyber768::PublicKey>,
    // Raw 32-byte KEM shared secret. Kept so tests can compare derived keys
    // against it; wiped on drop.
    shared_secret: Option<Zeroizing<[u8; SHARED_SECRET_BYTES]>>,
    // Directional transport keys from the HKDF chain.
    k_send_i2r: Option<Zeroizing<[u8; SHARED_SECRET_BYTES]>>,
    k_send_r2i: Option<Zeroizing<[u8; SHARED_SECRET_BYTES]>>,
    // Expected response MAC (responder derives and emits; initiator derives
    // and compares). Not wrapped in `Zeroizing`: a MAC's secrecy matters only
    // because it commits to the shared secret; still good hygiene to wipe,
    // handled explicitly in `Drop`.
    response_mac: Option<[u8; SHARED_SECRET_BYTES]>,
}

impl Handshake {
    /// Construct a responder. Generates a fresh ML-KEM-768 static keypair.
    pub fn new_responder() -> Self {
        let (pk, sk) = kyber768::keypair();
        Self {
            state: HandshakeState::Uninitialized,
            is_initiator: false,
            responder_sk: Some(sk),
            responder_pk: Some(pk),
            peer_pk: None,
            shared_secret: None,
            k_send_i2r: None,
            k_send_r2i: None,
            response_mac: None,
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
            k_send_i2r: None,
            k_send_r2i: None,
            response_mac: None,
        }
    }

    /// Construct an initiator targeting `peer_public_bytes` (the responder's
    /// ML-KEM-768 static public key).
    pub fn new_initiator_for(peer_public_bytes: &[u8]) -> Result<Self, Error> {
        let peer_pk = kyber768::PublicKey::from_bytes(peer_public_bytes)
            .map_err(|_| Error::InvalidPeerPublicKey)?;
        Ok(Self {
            state: HandshakeState::Uninitialized,
            is_initiator: true,
            responder_sk: None,
            responder_pk: None,
            peer_pk: Some(peer_pk),
            shared_secret: None,
            k_send_i2r: None,
            k_send_r2i: None,
            response_mac: None,
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
    /// type-1 initiation. Runs the HKDF chain so that `consume_response` can
    /// compare MACs without re-running the KEM.
    pub fn create_initiation(&mut self) -> Result<HandshakeMessage, Error> {
        if !self.is_initiator {
            return Err(Error::RoleMismatchInitiate);
        }
        if self.state != HandshakeState::Uninitialized {
            return Err(Error::AlreadyProgressed);
        }
        let peer_pk = self.peer_pk.as_ref().ok_or(Error::NoPeerPublicKey)?;
        let (ss, ct) = kyber768::encapsulate(peer_pk);
        let shared = copy_shared(&ss);
        self.derive_chain(&shared);
        self.shared_secret = Some(shared);
        self.state = HandshakeState::InitiationSent;
        Ok(HandshakeMessage {
            message_type: MSG_TYPE_INITIATION,
            kem_ciphertext: ct.as_bytes().to_vec(),
            response_mac: None,
        })
    }

    /// Responder consumes a type-1 initiation, decapsulating to the same
    /// shared secret and running the HKDF chain.
    pub fn consume_initiation(&mut self, msg: &HandshakeMessage) -> Result<(), Error> {
        if self.is_initiator {
            return Err(Error::RoleMismatchConsumeInit);
        }
        if msg.message_type != MSG_TYPE_INITIATION {
            return Err(Error::WrongMessageType {
                got: msg.message_type,
            });
        }
        if msg.kem_ciphertext.len() != kyber768::ciphertext_bytes() {
            return Err(Error::BadCiphertextLength {
                got: msg.kem_ciphertext.len(),
                want: kyber768::ciphertext_bytes(),
            });
        }
        let ct = kyber768::Ciphertext::from_bytes(&msg.kem_ciphertext)
            .map_err(|_| Error::MalformedCiphertext)?;
        let sk = self
            .responder_sk
            .as_ref()
            .ok_or(Error::MissingResponderKey)?;
        let ss = kyber768::decapsulate(&ct, sk);
        let shared = copy_shared(&ss);
        self.derive_chain(&shared);
        self.shared_secret = Some(shared);
        self.state = HandshakeState::InitiationReceived;
        Ok(())
    }

    /// Responder emits the type-2 response, carrying the HKDF-derived
    /// response MAC so the initiator can prove both sides agree on the
    /// shared secret before transitioning to `Established`.
    pub fn create_response(&mut self) -> Result<HandshakeMessage, Error> {
        if self.is_initiator {
            return Err(Error::RoleMismatchCreateResp);
        }
        if self.state != HandshakeState::InitiationReceived {
            return Err(Error::ResponseBeforeInit);
        }
        let mac = self.response_mac.ok_or(Error::NoSharedSecret)?;
        self.state = HandshakeState::Established;
        Ok(HandshakeMessage {
            message_type: MSG_TYPE_RESPONSE,
            kem_ciphertext: Vec::new(),
            response_mac: Some(mac),
        })
    }

    /// Initiator consumes a type-2 response, verifying the response MAC in
    /// constant time before transitioning to `Established`.
    pub fn consume_response(&mut self, msg: &HandshakeMessage) -> Result<(), Error> {
        if !self.is_initiator {
            return Err(Error::RoleMismatchConsumeResp);
        }
        if self.state != HandshakeState::InitiationSent {
            return Err(Error::ResponseOutOfOrder);
        }
        if msg.message_type != MSG_TYPE_RESPONSE {
            return Err(Error::WrongMessageType {
                got: msg.message_type,
            });
        }
        let expected = self.response_mac.ok_or(Error::NoSharedSecret)?;
        let received = msg.response_mac.ok_or(Error::MissingResponseMac)?;
        // Constant-time comparison; branching on the bool is safe only AFTER
        // the full-length compare has completed.
        if !bool::from(expected.ct_eq(&received)) {
            return Err(Error::InvalidResponseMac);
        }
        self.state = HandshakeState::Established;
        Ok(())
    }

    /// Post-handshake directional send key (initiator -> responder).
    pub fn send_key_i2r(&self) -> Option<TransportSecret> {
        self.k_send_i2r.clone()
    }

    /// Post-handshake directional send key (responder -> initiator).
    pub fn send_key_r2i(&self) -> Option<TransportSecret> {
        self.k_send_r2i.clone()
    }

    /// Legacy 32-byte transport secret. Iter 3 returns the i2r directional
    /// key by convention; call sites that need r2i should use `send_key_r2i`.
    /// Returns `None` unless the handshake has reached `Established`.
    pub fn transport_secret(&self) -> Option<TransportSecret> {
        if self.state != HandshakeState::Established {
            return None;
        }
        self.k_send_i2r.clone()
    }

    /// Tests-only accessor: returns the raw KEM shared secret, used to assert
    /// that HKDF actually ran (derived keys differ from raw). Gated on `cfg
    /// (test)` to keep it out of the public surface.
    #[cfg(test)]
    pub(crate) fn raw_shared_secret_for_tests(&self) -> Option<TransportSecret> {
        self.shared_secret.clone()
    }

    /// HKDF-SHA-256 over the raw KEM shared secret. Populates the directional
    /// transport keys and the response MAC. Must be called exactly once per
    /// side per handshake.
    fn derive_chain(&mut self, shared: &[u8; SHARED_SECRET_BYTES]) {
        let hkdf = Hkdf::<Sha256>::new(Some(HKDF_SALT), shared);

        // Chaining key is derived but currently unused by iter 3 transport; it
        // anchors future ratchets. Keeping it in the chain for forward
        // compatibility and to match the protocol docstring.
        let mut _chaining = [0u8; SHARED_SECRET_BYTES];
        hkdf.expand(HKDF_INFO_CHAINING, &mut _chaining)
            .expect("hkdf output 32 bytes is within SHA-256 L*255 bound");

        let mut k_i2r = [0u8; SHARED_SECRET_BYTES];
        hkdf.expand(HKDF_INFO_SEND_I2R, &mut k_i2r)
            .expect("hkdf i2r output within bound");

        let mut k_r2i = [0u8; SHARED_SECRET_BYTES];
        hkdf.expand(HKDF_INFO_SEND_R2I, &mut k_r2i)
            .expect("hkdf r2i output within bound");

        let mut mac = [0u8; SHARED_SECRET_BYTES];
        hkdf.expand(HKDF_INFO_RESPONSE_MAC, &mut mac)
            .expect("hkdf response-mac output within bound");

        self.k_send_i2r = Some(Zeroizing::new(k_i2r));
        self.k_send_r2i = Some(Zeroizing::new(k_r2i));
        self.response_mac = Some(mac);
    }
}

impl Drop for Handshake {
    fn drop(&mut self) {
        // Zeroizing<T> fields wipe themselves on drop; explicitly zero the
        // plain-[u8; 32] response_mac as defense in depth so we do not rely
        // on the compiler's implicit drop ordering.
        if let Some(m) = self.response_mac.as_mut() {
            m.zeroize();
        }
    }
}

/// Copy a `pqcrypto_kyber::kyber768::SharedSecret` into a zeroizing fixed-size
/// array so we do not depend on the library's opaque type at call sites, and
/// so the copy is wiped on drop.
fn copy_shared(ss: &kyber768::SharedSecret) -> Zeroizing<[u8; SHARED_SECRET_BYTES]> {
    let bytes = ss.as_bytes();
    debug_assert_eq!(bytes.len(), SHARED_SECRET_BYTES);
    let mut out = [0u8; SHARED_SECRET_BYTES];
    out.copy_from_slice(bytes);
    Zeroizing::new(out)
}
