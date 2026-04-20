//! ML-KEM-768 handshake wrapper for Q-Mesh (Pillar 9).
//!
//! Implements NIST FIPS 203 (ML-KEM-768) key encapsulation over the
//! `zipminator-core` Kyber-768 core. Iter 2 will populate the
//! `QMeshHandshake` type; iter 1 commits the failing test (Red state).

#[cfg(test)]
mod tests {
    // NOTE (iter 1, Red state): `QMeshHandshake` is intentionally unimplemented.
    // This test will fail to compile until iter 2 adds the type.
    use super::QMeshHandshake;

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
}
