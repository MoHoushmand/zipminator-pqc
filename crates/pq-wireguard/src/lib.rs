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
        assert_eq!(
            msg.kem_ciphertext.len(),
            pqcrypto_kyber::kyber768::ciphertext_bytes()
        );
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
        let pk = responder
            .static_public()
            .expect("responder keypair present");
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

        let ss_i = initiator
            .transport_secret()
            .expect("initiator transport secret");
        let ss_r = responder
            .transport_secret()
            .expect("responder transport secret");

        assert_eq!(ss_i.len(), SHARED_SECRET_BYTES);
        assert_eq!(ss_r.len(), SHARED_SECRET_BYTES);
        // Constant-time equality check; bool conversion only after the CT op.
        // Deref through Zeroizing<[u8; 32]> to hand ct_eq plain byte slices.
        let ai: &[u8] = &*ss_i;
        let br: &[u8] = &*ss_r;
        assert!(bool::from(ai.ct_eq(br)));
    }

    // --- ITER 2 new tests: wire format serialization -------------------------

    use super::handshake::MSG_TYPE_INITIATION;
    use super::wire::{MessageType, WireMessage, INITIATION_WIRE_LEN, RESPONSE_WIRE_LEN};

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
        let expected_hex = include_str!("../../../tests/vpn/fixtures/initiation.hex");
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

    // --- ITER 3 new tests: HKDF chain, response MAC, zeroize -----------------
    //
    // These tests pin the iter-3 contract that turns the iter-1 `&'static str`
    // errors into a `thiserror`-derived enum, wraps all post-handshake secret
    // material in `Zeroizing<[u8; 32]>` so it is explicitly wiped on drop, and
    // introduces a 32-byte response MAC derived from the HKDF-SHA-256 chain.
    //
    // The response MAC stays inside `Handshake` state: the wire layout remains
    // frozen at `RESPONSE_WIRE_LEN = 12` (iter 2 fixture stability). The
    // initiator re-derives the MAC locally from its own copy of the shared
    // secret and compares with `subtle::ConstantTimeEq` before transitioning.

    use super::handshake::{Error as HandshakeError, TransportSecret};
    use zeroize::Zeroizing;

    /// Compile-time check that `TransportSecret` is `Zeroizing<[u8; N]>` so
    /// the returned secret is wiped on drop. `Zeroizing` is a transparent
    /// smart pointer that derefs to `[u8; N]`, so the bound also asserts the
    /// byte length is `SHARED_SECRET_BYTES`.
    #[test]
    fn transport_secret_is_zeroize_wrapped() {
        fn assert_is_zeroizing(_: &Zeroizing<[u8; SHARED_SECRET_BYTES]>) {}
        let mut responder = Handshake::new_responder();
        let pk = responder.static_public().unwrap();
        let mut initiator = Handshake::new_initiator_for(&pk).unwrap();
        let resp_msg = responder.after(&mut initiator);
        initiator.consume_response(&resp_msg).unwrap();
        let ts: TransportSecret = initiator.transport_secret().unwrap();
        assert_is_zeroizing(&ts);
    }

    #[test]
    fn directional_transport_keys_are_distinct() {
        // i2r and r2i keys (initiator-to-responder, responder-to-initiator)
        // must differ from each other AND from the raw ML-KEM shared secret.
        // Anything less and we'd be reusing the same key in both directions,
        // which breaks AEAD nonce disjointness guarantees.
        let mut responder = Handshake::new_responder();
        let pk = responder.static_public().unwrap();
        let mut initiator = Handshake::new_initiator_for(&pk).unwrap();
        let resp_msg = responder.after(&mut initiator);
        initiator.consume_response(&resp_msg).unwrap();

        let k_i2r_init = initiator.send_key_i2r().expect("initiator has i2r key");
        let k_r2i_init = initiator.send_key_r2i().expect("initiator has r2i key");
        let k_i2r_resp = responder.send_key_i2r().expect("responder has i2r key");
        let k_r2i_resp = responder.send_key_r2i().expect("responder has r2i key");

        // Cross-party equality (the whole point of a KEM handshake).
        assert!(bool::from(k_i2r_init.ct_eq(&*k_i2r_resp)));
        assert!(bool::from(k_r2i_init.ct_eq(&*k_r2i_resp)));
        // Within-party direction separation.
        assert!(!bool::from(k_i2r_init.ct_eq(&*k_r2i_init)));
        // And neither directional key equals the raw shared secret (would mean
        // HKDF didn't actually run).
        let raw = initiator.raw_shared_secret_for_tests().unwrap();
        assert!(!bool::from(k_i2r_init.ct_eq(&*raw)));
        assert!(!bool::from(k_r2i_init.ct_eq(&*raw)));
    }

    #[test]
    fn consume_response_rejects_tampered_mac() {
        // Flipping a single byte of the responder's MAC must cause the
        // initiator to reject the response with a typed error. Constant-time
        // comparison is verified indirectly: the test exercises the error
        // path via `subtle::ConstantTimeEq` under the hood.
        let mut responder = Handshake::new_responder();
        let pk = responder.static_public().unwrap();
        let mut initiator = Handshake::new_initiator_for(&pk).unwrap();
        let init_msg = initiator.create_initiation().unwrap();
        responder.consume_initiation(&init_msg).unwrap();
        let mut resp = responder.create_response().unwrap();

        // Flip one byte of the MAC carried alongside the response.
        let mac = resp.response_mac.expect("response carries a MAC in iter 3");
        let mut tampered = mac;
        tampered[0] ^= 0x01;
        resp.response_mac = Some(tampered);

        match initiator.consume_response(&resp) {
            Err(HandshakeError::InvalidResponseMac) => (),
            other => panic!("expected InvalidResponseMac, got {other:?}"),
        }
    }

    #[test]
    fn consume_response_accepts_correct_mac() {
        // Positive path: the responder's derived MAC matches the initiator's
        // independently-derived MAC, and the handshake reaches Established.
        let mut responder = Handshake::new_responder();
        let pk = responder.static_public().unwrap();
        let mut initiator = Handshake::new_initiator_for(&pk).unwrap();
        let init_msg = initiator.create_initiation().unwrap();
        responder.consume_initiation(&init_msg).unwrap();
        let resp = responder.create_response().unwrap();
        assert!(resp.response_mac.is_some(), "iter-3 response carries a MAC");
        initiator
            .consume_response(&resp)
            .expect("valid MAC accepted");
        assert_eq!(initiator.state(), HandshakeState::Established);
    }

    #[test]
    fn handshake_errors_are_typed() {
        // Responder rejecting an `Initiation` with the wrong ciphertext length
        // must return a typed variant, not a string. This gives callers a
        // stable discriminator for logging/metrics.
        let mut responder = Handshake::new_responder();
        let bad = super::handshake::HandshakeMessage {
            message_type: super::handshake::MSG_TYPE_INITIATION,
            kem_ciphertext: vec![0u8; 7], // obviously wrong length
            response_mac: None,
        };
        match responder.consume_initiation(&bad) {
            Err(HandshakeError::BadCiphertextLength { .. }) => (),
            other => panic!("expected BadCiphertextLength, got {other:?}"),
        }
    }

    // Tiny test helper. Mirrors a standard dance: initiator.create_initiation
    // -> responder.consume_initiation -> responder.create_response. Returns
    // the response the caller hands to `consume_response`. Kept inside the
    // test module so clippy::items-after-test-module stays clean.
    impl Handshake {
        fn after(&mut self, initiator: &mut Handshake) -> super::handshake::HandshakeMessage {
            let init_msg = initiator.create_initiation().expect("initiation");
            self.consume_initiation(&init_msg).expect("consume init");
            self.create_response().expect("response")
        }
    }
}
