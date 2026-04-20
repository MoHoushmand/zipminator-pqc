//! HKDF-SHA256 key derivation for Q-Mesh session keys.
//!
//! Implements FIPS 198 HMAC + FIPS 180-4 SHA-256 via the `hkdf` crate.
//! Input keying material (IKM) is the 32-byte ML-KEM-768 shared secret.
//! Derived keys are wrapped in [`SessionKeys`], which zeroizes on drop.

use hkdf::Hkdf;
use sha2::Sha256;
use subtle::ConstantTimeEq;
use thiserror::Error;
use zeroize::ZeroizeOnDrop;

/// Length of each derived symmetric session key in bytes.
pub const SESSION_KEY_LEN: usize = 32;

/// HKDF info string identifying the Q-Mesh session protocol version.
pub const QMESH_SESSION_INFO: &[u8] = b"qmesh-session-v1";

/// Directional info suffix for the initiator-to-responder key.
pub const DIR_TX: &[u8] = b"/tx";

/// Directional info suffix for the responder-to-initiator key.
pub const DIR_RX: &[u8] = b"/rx";

/// Errors produced by the Q-Mesh KDF.
#[derive(Debug, Error)]
pub enum KdfError {
    /// HKDF-Expand rejected the requested output length.
    #[error("hkdf expand failed: {0}")]
    Expand(&'static str),
}

/// Pair of symmetric session keys derived from an ML-KEM shared secret.
///
/// `tx` is used by the initiator to send; `rx` is used to receive.
/// Zeroized on drop via `ZeroizeOnDrop`.
#[derive(ZeroizeOnDrop)]
pub struct SessionKeys {
    tx: [u8; SESSION_KEY_LEN],
    rx: [u8; SESSION_KEY_LEN],
}

impl SessionKeys {
    /// Borrow the TX key. Use with a constant-time comparator only.
    #[must_use]
    pub fn tx(&self) -> &[u8; SESSION_KEY_LEN] {
        &self.tx
    }

    /// Borrow the RX key. Use with a constant-time comparator only.
    #[must_use]
    pub fn rx(&self) -> &[u8; SESSION_KEY_LEN] {
        &self.rx
    }

    /// Constant-time equality over both directional keys.
    #[must_use]
    pub fn ct_eq(&self, other: &Self) -> bool {
        let tx_eq = self.tx.ct_eq(&other.tx);
        let rx_eq = self.rx.ct_eq(&other.rx);
        (tx_eq & rx_eq).into()
    }
}

/// Derive a [`SessionKeys`] pair from ML-KEM-768 shared-secret bytes.
///
/// - `ikm` is the 32-byte shared secret from `Kyber768::decapsulate` /
///   `encapsulate`.
/// - `salt` is an optional context salt (e.g. a pre-shared key or a
///   per-session nonce). `None` falls back to HKDF's zero-byte salt.
///
/// Uses domain separation via the `info` parameter to derive two
/// independent 32-byte keys (TX and RX) from a single HKDF-Extract PRK.
pub fn derive_session_keys(ikm: &[u8], salt: Option<&[u8]>) -> Result<SessionKeys, KdfError> {
    let hk = Hkdf::<Sha256>::new(salt, ikm);

    let mut tx = [0u8; SESSION_KEY_LEN];
    let mut rx = [0u8; SESSION_KEY_LEN];

    let mut tx_info = Vec::with_capacity(QMESH_SESSION_INFO.len() + DIR_TX.len());
    tx_info.extend_from_slice(QMESH_SESSION_INFO);
    tx_info.extend_from_slice(DIR_TX);

    let mut rx_info = Vec::with_capacity(QMESH_SESSION_INFO.len() + DIR_RX.len());
    rx_info.extend_from_slice(QMESH_SESSION_INFO);
    rx_info.extend_from_slice(DIR_RX);

    hk.expand(&tx_info, &mut tx)
        .map_err(|_| KdfError::Expand("tx key expand"))?;
    hk.expand(&rx_info, &mut rx)
        .map_err(|_| KdfError::Expand("rx key expand"))?;

    Ok(SessionKeys { tx, rx })
}

#[cfg(test)]
mod tests {
    use super::*;

    fn fixed_ikm() -> [u8; 32] {
        // Deterministic 32-byte vector standing in for an ML-KEM shared secret.
        let mut b = [0u8; 32];
        for (i, slot) in b.iter_mut().enumerate() {
            *slot = i as u8;
        }
        b
    }

    #[test]
    fn hkdf_is_deterministic_for_same_inputs() {
        let ikm = fixed_ikm();
        let salt = Some(b"mesh-salt".as_slice());
        let a = derive_session_keys(&ikm, salt).expect("derive a");
        let b = derive_session_keys(&ikm, salt).expect("derive b");
        assert_eq!(a.tx(), b.tx());
        assert_eq!(a.rx(), b.rx());
        assert!(a.ct_eq(&b));
    }

    #[test]
    fn hkdf_tx_and_rx_are_domain_separated() {
        let ikm = fixed_ikm();
        let keys = derive_session_keys(&ikm, None).expect("derive");
        assert_ne!(
            keys.tx(),
            keys.rx(),
            "TX and RX keys must differ (domain separation via info)"
        );
    }

    #[test]
    fn hkdf_differs_when_salt_changes() {
        let ikm = fixed_ikm();
        let a = derive_session_keys(&ikm, Some(b"salt-a")).expect("derive a");
        let b = derive_session_keys(&ikm, Some(b"salt-b")).expect("derive b");
        assert_ne!(a.tx(), b.tx());
        assert_ne!(a.rx(), b.rx());
    }

    #[test]
    fn hkdf_differs_when_ikm_changes() {
        let ikm_a = fixed_ikm();
        let mut ikm_b = fixed_ikm();
        ikm_b[0] ^= 0x01;
        let a = derive_session_keys(&ikm_a, None).expect("derive a");
        let b = derive_session_keys(&ikm_b, None).expect("derive b");
        assert_ne!(a.tx(), b.tx());
        assert_ne!(a.rx(), b.rx());
    }
}
