//! Q-Mesh (Pillar 9) core library.
//!
//! Provides:
//! - A software-mocked CSI (Channel State Information) frame source for
//!   WiFi-sensing development without hardware.
//! - An ML-KEM-768 handshake wrapper re-exporting NIST FIPS 203 primitives
//!   from `zipminator-core`.
//! - HKDF-SHA256 session-key derivation with `zeroize`-on-drop hygiene.
//! - A Rényi-entropy (order 2) estimator over quantized CSI magnitudes.
//!
//! Iter 1 scaffolds the module tree and commits a failing handshake test.
//! Iters 2-5 implement the bodies in Red/Green/Refactor order.

pub mod csi;
pub mod entropy;
pub mod handshake;
pub mod kdf;
pub mod session;

#[cfg(test)]
mod tests {
    use super::csi::{CsiSource, MockCsiSource};

    #[test]
    fn mock_csi_source_produces_frame() {
        let mut src = MockCsiSource::new(64);
        let frame = src.next_frame().expect("frame available");
        assert_eq!(frame.subcarriers.len(), 64);
        assert!(frame.timestamp_ns > 0);
    }

    #[test]
    fn mock_csi_source_is_deterministic_when_seeded() {
        let mut a = MockCsiSource::with_seed(64, 42);
        let mut b = MockCsiSource::with_seed(64, 42);
        let fa = a.next_frame().unwrap();
        let fb = b.next_frame().unwrap();
        assert_eq!(fa.subcarriers, fb.subcarriers);
    }
}
