//! PQ-WireGuard userspace handshake scaffold. Implements NIST FIPS 203 (ML-KEM-768) wrapping over WireGuard Noise_IK pattern. This crate is userspace-only; kernel-module glue lives in a separate crate (deferred).

pub mod handshake;
pub mod wire;

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

    // --- ITER 2 new tests: wire format serialization -------------------------

    use super::wire::{MessageType, WireMessage, INITIATION_WIRE_LEN, RESPONSE_WIRE_LEN};
    use super::handshake::MSG_TYPE_INITIATION;

    /// Deterministic ciphertext filler so the fixture is stable across runs.
    /// NOT a valid KEM ciphertext; iter 2 only validates byte layout.
    fn deterministic_kem_ciphertext() -> Vec<u8> {
        // 1088 bytes of (i % 251) — avoids trivial all-zero patterns.
        (0..pqcrypto_kyber::kyber768::ciphertext_bytes())
            .map(|i| (i % 251) as u8)
            .collect()
    }

    fn deterministic_initiation() -> WireMessage {
        WireMessage {
            message_type: MessageType::Initiation,
            sender_index: 0x11223344,
            receiver_index: 0,
            kem_ciphertext: deterministic_kem_ciphertext(),
        }
    }

    #[test]
    fn wire_initiation_round_trip_is_identity() {
        let msg = deterministic_initiation();
        let bytes = msg.to_bytes();
        assert_eq!(bytes.len(), INITIATION_WIRE_LEN);
        assert_eq!(bytes[0], MSG_TYPE_INITIATION);

        let decoded = WireMessage::from_bytes(&bytes).expect("round-trip");
        assert_eq!(decoded.message_type, MessageType::Initiation);
        assert_eq!(decoded.sender_index, 0x11223344);
        assert_eq!(decoded.receiver_index, 0);
        assert_eq!(decoded.kem_ciphertext, deterministic_kem_ciphertext());
    }

    #[test]
    fn wire_initiation_matches_committed_fixture() {
        // The committed fixture lives at tests/vpn/fixtures/initiation.hex
        // (repo-root relative). Dart's iter-5 widget test will load the same
        // file and expect the same bytes.
        let expected_hex = include_str!(
            "../../../tests/vpn/fixtures/initiation.hex"
        );
        let expected_bytes = hex::decode(expected_hex.trim()).expect("valid hex fixture");
        let actual_bytes = deterministic_initiation().to_bytes();
        assert_eq!(
            actual_bytes, expected_bytes,
            "wire format drift: fixture must be regenerated if layout changed"
        );
    }

    #[test]
    fn wire_response_encodes_with_empty_kem_ciphertext() {
        let msg = WireMessage {
            message_type: MessageType::Response,
            sender_index: 0xDEADBEEF,
            receiver_index: 0x11223344,
            kem_ciphertext: Vec::new(),
        };
        let bytes = msg.to_bytes();
        assert_eq!(bytes.len(), RESPONSE_WIRE_LEN);
        assert_eq!(bytes[0], 2); // MSG_TYPE_RESPONSE

        let decoded = WireMessage::from_bytes(&bytes).expect("round-trip");
        assert_eq!(decoded.message_type, MessageType::Response);
        assert_eq!(decoded.sender_index, 0xDEADBEEF);
        assert_eq!(decoded.receiver_index, 0x11223344);
        assert!(decoded.kem_ciphertext.is_empty());
    }

    #[test]
    fn wire_rejects_truncated_initiation() {
        let mut bytes = deterministic_initiation().to_bytes();
        bytes.truncate(bytes.len() - 1);
        assert!(WireMessage::from_bytes(&bytes).is_err());
    }
}
