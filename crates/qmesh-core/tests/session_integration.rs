//! End-to-end integration test for the Q-Mesh session layer.
//!
//! Exercises the public API only (no `pub(crate)` or `#[cfg(test)]`
//! internals) to prove the crate composes correctly from a downstream
//! caller's perspective.

use qmesh_core::csi::{CsiSource, MockCsiSource};
use qmesh_core::session::QMeshSession;

#[test]
fn two_endpoints_agree_on_session_keys_via_public_api() {
    // Alice is the initiator: she publishes her public key.
    let alice = QMeshSession::new();
    // Bob is the responder: he encapsulates against Alice's public key.
    let bob = QMeshSession::new();

    let (ct, bob_keys) = bob
        .encapsulate_to(alice.public_key())
        .expect("bob encapsulates");
    let alice_keys = alice.accept(&ct).expect("alice accepts");

    assert!(
        alice_keys.ct_eq(&bob_keys),
        "both sides must derive identical session keys"
    );
}

#[test]
fn handshake_convenience_stashes_ciphertext_for_take() {
    let alice = QMeshSession::new();
    let mut bob = QMeshSession::new();

    let bob_keys = bob
        .handshake(alice.public_key())
        .expect("bob handshake returns keys");
    let ct = bob.take_ciphertext().expect("ciphertext stashed");
    let alice_keys = alice.accept(&ct).expect("alice accepts");
    assert!(alice_keys.ct_eq(&bob_keys));
}

#[test]
fn psk_binds_session_keys_to_shared_context() {
    let alice = QMeshSession::with_psk(b"mesh-psk-alpha".to_vec());
    let bob = QMeshSession::with_psk(b"mesh-psk-alpha".to_vec());
    let mallory = QMeshSession::with_psk(b"mesh-psk-beta".to_vec());

    let (ct_ab, bob_keys) = bob.encapsulate_to(alice.public_key()).expect("bob");
    let alice_keys = alice.accept(&ct_ab).expect("alice");
    assert!(alice_keys.ct_eq(&bob_keys));

    // Same keypair exchange but different PSK derives different keys.
    let (ct_am, mallory_keys) = mallory.encapsulate_to(alice.public_key()).expect("mallory");
    let alice_via_mallory = alice.accept(&ct_am).expect("alice mallory path");
    assert!(!alice_via_mallory.ct_eq(&mallory_keys));
}

#[test]
fn windowed_csi_entropy_from_mock_source_is_positive_and_bounded() {
    let sess = QMeshSession::new();
    let mut src = MockCsiSource::with_seed(128, 0xDEAD_BEEF);
    let frames: Vec<_> = (0..40).map(|_| src.next_frame().unwrap()).collect();

    let h = sess
        .ingest_csi_windowed(&frames)
        .expect("entropy estimate defined");

    // The mock source is not cryptographic but spreads samples across
    // bins; H_2 should be strictly positive and at most log2(16) = 4.
    assert!(
        h.0 > 0.5,
        "windowed H_2 should exceed 0.5 bits, got {}",
        h.0
    );
    assert!(
        h.0 <= 4.0_f64 + 1e-9,
        "H_2 must not exceed log2(16), got {}",
        h.0
    );
}
