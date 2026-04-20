//! PQ-WireGuard userspace handshake scaffold. Implements NIST FIPS 203 (ML-KEM-768) wrapping over WireGuard Noise_IK pattern. This crate is userspace-only; kernel-module glue lives in a separate crate (deferred).

pub mod handshake;

#[cfg(test)]
mod tests {
    use super::handshake::{Handshake, HandshakeState, SHARED_SECRET_BYTES};
    use subtle::ConstantTimeEq;

    #[test]
    fn new_handshake_is_initiator_and_uninitialized() {
        let hs = Handshake::new_initiator();
        assert_eq!(hs.state(), HandshakeState::Uninitialized);
        assert!(hs.is_initiator());
    }

    #[test]
    fn initiator_transitions_to_sent_after_first_message() {
        let responder = Handshake::new_responder();
        let pk = responder.static_public().expect("responder has public key");
        let mut hs = Handshake::new_initiator_for(&pk).expect("init for peer");
        let msg = hs.create_initiation().expect("initiation");
        assert_eq!(hs.state(), HandshakeState::InitiationSent);
        assert_eq!(msg.message_type, 1);
        // Real ML-KEM-768 ciphertext is 1088 bytes, not a 32-byte placeholder.
        assert_eq!(msg.kem_ciphertext.len(), pqcrypto_kyber::kyber768::ciphertext_bytes());
    }

    #[test]
    fn responder_accepts_initiation_and_moves_to_received() {
        let mut responder = Handshake::new_responder();
        let pk = responder.static_public().expect("responder has public key");
        let mut initiator = Handshake::new_initiator_for(&pk).unwrap();
        let msg = initiator.create_initiation().unwrap();
        responder.consume_initiation(&msg).expect("accepted");
        assert_eq!(responder.state(), HandshakeState::InitiationReceived);
    }

    // --- ITER 1 new tests: real ML-KEM-768 end-to-end -------------------------

    #[test]
    fn responder_exposes_public_key_of_expected_size() {
        let responder = Handshake::new_responder();
        let pk = responder.static_public().expect("responder keypair present");
        // ML-KEM-768 (NIST FIPS 203) public keys are 1184 bytes.
        assert_eq!(pk.len(), pqcrypto_kyber::kyber768::public_key_bytes());
    }

    #[test]
    fn handshake_completes_on_both_sides() {
        let mut responder = Handshake::new_responder();
        let pk = responder.static_public().unwrap();
        let mut initiator = Handshake::new_initiator_for(&pk).unwrap();

        let init_msg = initiator.create_initiation().unwrap();
        responder.consume_initiation(&init_msg).unwrap();
        let resp_msg = responder.create_response().unwrap();
        initiator.consume_response(&resp_msg).unwrap();

        assert_eq!(initiator.state(), HandshakeState::Established);
        assert_eq!(responder.state(), HandshakeState::Established);
    }

    #[test]
    fn initiator_and_responder_derive_same_shared_secret() {
        let mut responder = Handshake::new_responder();
        let pk = responder.static_public().unwrap();
        let mut initiator = Handshake::new_initiator_for(&pk).unwrap();

        let init_msg = initiator.create_initiation().unwrap();
        responder.consume_initiation(&init_msg).unwrap();
        let resp_msg = responder.create_response().unwrap();
        initiator.consume_response(&resp_msg).unwrap();

        let ss_i = initiator.transport_secret().expect("initiator transport secret");
        let ss_r = responder.transport_secret().expect("responder transport secret");

        assert_eq!(ss_i.len(), SHARED_SECRET_BYTES);
        assert_eq!(ss_r.len(), SHARED_SECRET_BYTES);
        // Constant-time equality check; bool conversion only after the CT op.
        assert!(bool::from(ss_i.ct_eq(&ss_r)));
    }
}
