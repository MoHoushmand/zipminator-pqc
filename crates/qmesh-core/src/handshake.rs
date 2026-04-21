//! ML-KEM-768 handshake wrapper for Q-Mesh (Pillar 9).
//!
//! Implements NIST FIPS 203 (ML-KEM-768) key encapsulation.
//! Delegates the core KEM to `zipminator-core`, which is verified against
//! NIST KAT test vectors. This wrapper exposes only the subset of the KEM
//! API that the Q-Mesh session layer needs.

use thiserror::Error;
use zipminator_core::{Ciphertext, Kyber768, PublicKey, SecretKey, SharedSecret};

/// Errors produced by the Q-Mesh handshake wrapper.
#[derive(Debug, Error)]
pub enum HandshakeError {
    /// Peer-supplied key or ciphertext was malformed.
    #[error("invalid peer material: {0}")]
    InvalidPeerMaterial(&'static str),
}

/// One end of a Q-Mesh ML-KEM-768 handshake.
///
/// Holds the local keypair. The secret key is zeroized on drop by
/// `zipminator-core::SecretKey`.
pub struct QMeshHandshake {
    pk: PublicKey,
    sk: SecretKey,
}

impl QMeshHandshake {
    /// Generate a fresh ML-KEM-768 keypair for this node.
    #[must_use]
    pub fn new() -> Self {
        let (pk, sk) = Kyber768::keypair();
        Self { pk, sk }
    }

    /// Expose the local public key so the peer can encapsulate against it.
    #[must_use]
    pub fn public_key(&self) -> &PublicKey {
        &self.pk
    }

    /// Encapsulate a shared secret against a peer public key.
    ///
    /// Returns `(ciphertext, shared_secret)` where the ciphertext is sent
    /// to the peer and the shared secret feeds the Q-Mesh KDF.
    #[must_use]
    pub fn encapsulate(peer_pk: &PublicKey) -> (Ciphertext, SharedSecret) {
        Kyber768::encapsulate(peer_pk)
    }

    /// Decapsulate a peer-sent ciphertext with our secret key.
    #[must_use]
    pub fn decapsulate(&self, ct: &Ciphertext) -> SharedSecret {
        Kyber768::decapsulate(ct, &self.sk)
    }
}

impl Default for QMeshHandshake {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn ml_kem_roundtrip() {
        // Initiator (Alice) generates a keypair and publishes her public key.
        let alice = QMeshHandshake::new();

        // Responder (Bob) encapsulates against Alice's public key,
        // producing a ciphertext to send back and a shared secret.
        let (ct, ss_bob) = QMeshHandshake::encapsulate(alice.public_key());

        // Alice decapsulates the ciphertext with her secret key and
        // derives the same shared secret.
        let ss_alice = alice.decapsulate(&ct);

        assert_eq!(
            ss_alice.as_bytes(),
            ss_bob.as_bytes(),
            "ML-KEM-768 handshake must produce identical shared secrets on both sides"
        );
        assert_eq!(
            ss_alice.as_bytes().len(),
            32,
            "ML-KEM-768 shared secret must be 32 bytes (FIPS 203)"
        );
    }

    #[test]
    fn independent_handshakes_produce_different_shared_secrets() {
        let alice_a = QMeshHandshake::new();
        let alice_b = QMeshHandshake::new();
        let (_, ss_a) = QMeshHandshake::encapsulate(alice_a.public_key());
        let (_, ss_b) = QMeshHandshake::encapsulate(alice_b.public_key());
        assert_ne!(
            ss_a.as_bytes(),
            ss_b.as_bytes(),
            "Independent keypairs must yield different ML-KEM-768 shared secrets"
        );
    }
}
