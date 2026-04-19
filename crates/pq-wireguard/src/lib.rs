//! PQ-WireGuard userspace handshake scaffold. Implements NIST FIPS 203 (ML-KEM-768) wrapping over WireGuard Noise_IK pattern. This crate is userspace-only; kernel-module glue lives in a separate crate (deferred).

pub mod handshake;

#[cfg(test)]
mod tests {
    use super::handshake::{Handshake, HandshakeState};

    #[test]
    fn new_handshake_is_initiator_and_uninitialized() {
        let hs = Handshake::new_initiator();
        assert_eq!(hs.state(), HandshakeState::Uninitialized);
        assert!(hs.is_initiator());
    }

    #[test]
    fn initiator_transitions_to_sent_after_first_message() {
        let mut hs = Handshake::new_initiator();
        let msg = hs.create_initiation().expect("initiation");
        assert_eq!(hs.state(), HandshakeState::InitiationSent);
        assert_eq!(msg.message_type, 1);
        assert!(!msg.ml_kem_ciphertext_placeholder.is_empty());
    }

    #[test]
    fn responder_accepts_initiation_and_moves_to_received() {
        let mut initiator = Handshake::new_initiator();
        let msg = initiator.create_initiation().unwrap();
        let mut responder = Handshake::new_responder();
        responder.consume_initiation(&msg).expect("accepted");
        assert_eq!(responder.state(), HandshakeState::InitiationReceived);
    }
}
