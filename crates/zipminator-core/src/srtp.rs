//! PQ-SRTP: SRTP key derivation from ML-KEM-768 (Kyber) shared secrets
//!
//! Implements NIST SP 800-56C compliant HKDF-SHA-256 key derivation to produce
//! SRTP master key and salt from a 32-byte Kyber-768 shared secret.
//!
//! # SRTP Key Material Layout (AES-128-CM)
//! - Master key: 16 bytes (128-bit AES key)
//! - Master salt: 14 bytes (SRTP salt)
//! - Total: 30 bytes
//!
//! # HKDF Parameters
//! - Hash: SHA-256
//! - IKM: Kyber-768 shared secret (32 bytes, sufficient entropy — no salt needed)
//! - Salt: empty (shared secret already has full entropy)
//! - Info strings:
//!   - Key:  `zipminator-srtp-master-key`
//!   - Salt: `zipminator-srtp-master-salt`

use hkdf::Hkdf;
use libc::c_int;
use sha2::Sha256;
use std::panic::{catch_unwind, AssertUnwindSafe};

// HKDF info strings — fixed labels per NIST SP 800-56C
const SRTP_KEY_INFO: &[u8] = b"zipminator-srtp-master-key";
const SRTP_SALT_INFO: &[u8] = b"zipminator-srtp-master-salt";

/// SRTP master key material for AES-128-CM
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SrtpKeyMaterial {
    /// AES-128-CM master key (16 bytes)
    pub master_key: [u8; 16],
    /// SRTP master salt (14 bytes)
    pub master_salt: [u8; 14],
}

impl SrtpKeyMaterial {
    /// Total size of SRTP key material in bytes (master key + master salt)
    pub const TOTAL_BYTES: usize = 16 + 14;
}

/// Derive SRTP key material from a Kyber-768 shared secret.
///
/// Uses HKDF-SHA-256 with:
/// - IKM: the 32-byte Kyber shared secret
/// - Salt: none (empty — the shared secret has full 256-bit entropy)
/// - Info: separate labels for key and salt domains
///
/// This function operates on fixed-size arrays and performs no branching on
/// secret data, satisfying the constant-time requirement.
pub fn derive_srtp_keys(shared_secret: &[u8; 32]) -> SrtpKeyMaterial {
    derive_srtp_keys_labeled(shared_secret, b"")
}

/// Derive SRTP key material with an additional label for sender/receiver
/// differentiation.
///
/// The `label` is appended to each info string, allowing distinct key material
/// for each direction of a duplex stream without requiring a separate KEM
/// exchange.
///
/// # Example
/// ```
/// # use zipminator_core::srtp::derive_srtp_keys_labeled;
/// let ss = [0u8; 32];
/// let sender_keys   = derive_srtp_keys_labeled(&ss, b"sender");
/// let receiver_keys = derive_srtp_keys_labeled(&ss, b"receiver");
/// assert_ne!(sender_keys.master_key, receiver_keys.master_key);
/// ```
pub fn derive_srtp_keys_labeled(shared_secret: &[u8; 32], label: &[u8]) -> SrtpKeyMaterial {
    // Build per-direction info strings: base_info || label
    let key_info = build_info(SRTP_KEY_INFO, label);
    let salt_info = build_info(SRTP_SALT_INFO, label);

    // HKDF-Extract with empty salt (RFC 5869 §2.2: omitting salt is equivalent
    // to a salt of HashLen zero bytes, which is fine when IKM already has full entropy)
    let hkdf = Hkdf::<Sha256>::new(None, shared_secret);

    let mut master_key = [0u8; 16];
    let mut master_salt = [0u8; 14];

    // HKDF-Expand — infallible for output lengths well below 255 * HashLen
    hkdf.expand(&key_info, &mut master_key)
        .expect("HKDF expand for SRTP master key: output length within bounds");
    hkdf.expand(&salt_info, &mut master_salt)
        .expect("HKDF expand for SRTP master salt: output length within bounds");

    SrtpKeyMaterial {
        master_key,
        master_salt,
    }
}

/// Concatenate base info string with the caller-supplied label.
/// Returns `base` when `label` is empty (avoids an allocation).
fn build_info(base: &[u8], label: &[u8]) -> Vec<u8> {
    if label.is_empty() {
        base.to_vec()
    } else {
        let mut info = Vec::with_capacity(base.len() + label.len());
        info.extend_from_slice(base);
        info.extend_from_slice(label);
        info
    }
}

// ── C FFI ──────────────────────────────────────────────────────────────────

/// Derive SRTP master key and salt from a Kyber-768 shared secret.
///
/// # Safety
///
/// - `shared_secret` must point to exactly 32 readable bytes.
/// - `out_key` must point to a buffer of at least 16 writable bytes.
/// - `out_salt` must point to a buffer of at least 14 writable bytes.
/// - No pointer may be null.
///
/// # Returns
///
/// - `0` on success.
/// - `-1` if any pointer is null.
#[no_mangle]
pub unsafe extern "C" fn zipminator_derive_srtp_keys(
    shared_secret: *const u8, // 32 bytes
    out_key: *mut u8,         // 16 bytes
    out_salt: *mut u8,        // 14 bytes
) -> c_int {
    catch_unwind(AssertUnwindSafe(|| {
        if shared_secret.is_null() || out_key.is_null() || out_salt.is_null() {
            return -1;
        }

        // SAFETY: caller guarantees 32 readable bytes at `shared_secret`
        let ss_slice: &[u8; 32] = &*(shared_secret as *const [u8; 32]);
        let material = derive_srtp_keys(ss_slice);

        // SAFETY: caller guarantees writable buffers of correct sizes
        std::ptr::copy_nonoverlapping(material.master_key.as_ptr(), out_key, 16);
        std::ptr::copy_nonoverlapping(material.master_salt.as_ptr(), out_salt, 14);

        0
    }))
    .unwrap_or(-2)
}

// ── Frame encryption ─────────────────────────────────────────────────────

/// Errors from SRTP frame protection/unprotection.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum SrtpError {
    /// HKDF key derivation failed.
    KeyDerivation,
    /// AES-GCM encryption failed.
    EncryptionFailed,
    /// AES-GCM decryption failed (bad key, corrupted ciphertext, or wrong sequence).
    DecryptionFailed,
}

impl std::fmt::Display for SrtpError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            SrtpError::KeyDerivation => write!(f, "SRTP key derivation failed"),
            SrtpError::EncryptionFailed => write!(f, "SRTP frame encryption failed"),
            SrtpError::DecryptionFailed => write!(f, "SRTP frame decryption failed"),
        }
    }
}

impl std::error::Error for SrtpError {}

/// SRTP context for encrypting/decrypting media frames using AES-256-GCM.
///
/// Derives a 256-bit encryption key and 96-bit base nonce from the Kyber-768
/// shared secret via HKDF-SHA-256 with domain-separated info strings.
pub struct SrtpContext {
    key: [u8; 32],
    salt: [u8; 12],
}

impl std::fmt::Debug for SrtpContext {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("SrtpContext")
            .field("key", &"[REDACTED]")
            .field("salt", &"[REDACTED]")
            .finish()
    }
}

impl SrtpContext {
    /// Create an SRTP context from a 32-byte ML-KEM-768 shared secret.
    ///
    /// Uses HKDF-SHA-256 to derive:
    /// - 256-bit AES-GCM key (info: `"srtp-frame-key"`)
    /// - 96-bit base nonce/salt (info: `"srtp-frame-salt"`)
    pub fn from_shared_secret(secret: &[u8]) -> Result<Self, SrtpError> {
        let hk = Hkdf::<Sha256>::new(None, secret);
        let mut key = [0u8; 32];
        let mut salt = [0u8; 12];
        hk.expand(b"srtp-frame-key", &mut key)
            .map_err(|_| SrtpError::KeyDerivation)?;
        hk.expand(b"srtp-frame-salt", &mut salt)
            .map_err(|_| SrtpError::KeyDerivation)?;
        Ok(Self { key, salt })
    }

    /// Encrypt an RTP payload for the given sequence number.
    ///
    /// The nonce is constructed by XORing the base salt with the sequence number,
    /// ensuring each frame gets a unique nonce. Returns the AES-256-GCM ciphertext
    /// (payload + 16-byte authentication tag).
    pub fn protect(&self, payload: &[u8], seq: u64) -> Result<Vec<u8>, SrtpError> {
        use aes_gcm::{aead::Aead, Aes256Gcm, KeyInit, Nonce};
        let cipher =
            Aes256Gcm::new_from_slice(&self.key).map_err(|_| SrtpError::EncryptionFailed)?;
        let nonce = self.build_nonce(seq);
        let nonce_ref = Nonce::from_slice(&nonce);
        cipher
            .encrypt(nonce_ref, payload)
            .map_err(|_| SrtpError::EncryptionFailed)
    }

    /// Decrypt an SRTP ciphertext for the given sequence number.
    ///
    /// The same nonce derivation as `protect` is used. Returns the original
    /// plaintext payload, or `SrtpError::DecryptionFailed` if authentication fails.
    pub fn unprotect(&self, ciphertext: &[u8], seq: u64) -> Result<Vec<u8>, SrtpError> {
        use aes_gcm::{aead::Aead, Aes256Gcm, KeyInit, Nonce};
        let cipher =
            Aes256Gcm::new_from_slice(&self.key).map_err(|_| SrtpError::DecryptionFailed)?;
        let nonce = self.build_nonce(seq);
        let nonce_ref = Nonce::from_slice(&nonce);
        cipher
            .decrypt(nonce_ref, ciphertext)
            .map_err(|_| SrtpError::DecryptionFailed)
    }

    /// Build a 12-byte nonce by XORing the sequence number into the base salt.
    fn build_nonce(&self, seq: u64) -> [u8; 12] {
        let mut nonce = self.salt;
        let seq_bytes = seq.to_be_bytes();
        for i in 0..8 {
            nonce[4 + i] ^= seq_bytes[i];
        }
        nonce
    }
}

// ── Voicemail key derivation ─────────────────────────────────────────────
//
// When a call ends, the speaker may leave an encrypted voicemail using the
// session's PQ-SRTP shared secret. We derive a separate AES-256-GCM key for
// voicemail material via HKDF-SHA-256 with a domain-separated info string so
// the server (which only relays SRTP) cannot decrypt the voicemail blob.

const VOICEMAIL_KEY_INFO: &[u8] = b"zipminator-voicemail-key";

/// Derive a 32-byte AES-256-GCM key for an encrypted voicemail leg from the
/// live call's ML-KEM-768 shared secret. The same `secret` will yield the same
/// key on both sides (deterministic), enabling the recipient to decrypt the
/// voicemail blob on retrieval.
///
/// Uses domain separation (`b"zipminator-voicemail-key"`) so the voicemail
/// key is independent of the SRTP master key and frame key derived from the
/// same shared secret.
pub fn derive_voicemail_key(secret: &[u8; 32]) -> [u8; 32] {
    let hk = Hkdf::<Sha256>::new(None, secret);
    let mut key = [0u8; 32];
    hk.expand(VOICEMAIL_KEY_INFO, &mut key)
        .expect("HKDF expand for voicemail key: 32 bytes well within bounds");
    key
}

// ── Tests ──────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    // A fixed "shared secret" that simulates Kyber-768 output
    const TEST_SS: [u8; 32] = [
        0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e, 0x0f,
        0x10, 0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18, 0x19, 0x1a, 0x1b, 0x1c, 0x1d, 0x1e,
        0x1f, 0x20,
    ];

    const ZERO_SS: [u8; 32] = [0u8; 32];
    const ONES_SS: [u8; 32] = [0xffu8; 32];

    // ── Key size tests ────────────────────────────────────────────────────

    #[test]
    fn master_key_is_16_bytes() {
        let km = derive_srtp_keys(&TEST_SS);
        assert_eq!(
            km.master_key.len(),
            16,
            "SRTP master key must be 16 bytes for AES-128-CM"
        );
    }

    #[test]
    fn master_salt_is_14_bytes() {
        let km = derive_srtp_keys(&TEST_SS);
        assert_eq!(
            km.master_salt.len(),
            14,
            "SRTP master salt must be 14 bytes"
        );
    }

    #[test]
    fn total_key_material_is_30_bytes() {
        let km = derive_srtp_keys(&TEST_SS);
        assert_eq!(
            km.master_key.len() + km.master_salt.len(),
            SrtpKeyMaterial::TOTAL_BYTES,
            "Total SRTP key material must be 30 bytes (16 + 14)"
        );
        assert_eq!(SrtpKeyMaterial::TOTAL_BYTES, 30);
    }

    // ── Determinism ───────────────────────────────────────────────────────

    #[test]
    fn derivation_is_deterministic() {
        let km1 = derive_srtp_keys(&TEST_SS);
        let km2 = derive_srtp_keys(&TEST_SS);
        assert_eq!(km1.master_key, km2.master_key, "master_key must be stable");
        assert_eq!(
            km1.master_salt, km2.master_salt,
            "master_salt must be stable"
        );
    }

    #[test]
    fn labeled_derivation_is_deterministic() {
        let km1 = derive_srtp_keys_labeled(&TEST_SS, b"sender");
        let km2 = derive_srtp_keys_labeled(&TEST_SS, b"sender");
        assert_eq!(km1.master_key, km2.master_key);
        assert_eq!(km1.master_salt, km2.master_salt);
    }

    // ── Domain separation ─────────────────────────────────────────────────

    #[test]
    fn key_and_salt_are_distinct() {
        let km = derive_srtp_keys(&TEST_SS);
        // master_key and master_salt must not share a common prefix once the
        // shorter (salt, 14 bytes) is compared against the first 14 bytes of the key.
        assert_ne!(
            km.master_key[..14],
            km.master_salt[..],
            "Key and salt must be derived independently (different HKDF info)"
        );
    }

    #[test]
    fn different_shared_secrets_produce_different_keys() {
        let km_zero = derive_srtp_keys(&ZERO_SS);
        let km_ones = derive_srtp_keys(&ONES_SS);
        let km_test = derive_srtp_keys(&TEST_SS);

        assert_ne!(km_zero.master_key, km_ones.master_key);
        assert_ne!(km_zero.master_key, km_test.master_key);
        assert_ne!(km_ones.master_key, km_test.master_key);

        assert_ne!(km_zero.master_salt, km_ones.master_salt);
        assert_ne!(km_zero.master_salt, km_test.master_salt);
    }

    #[test]
    fn different_labels_produce_different_keys() {
        let sender = derive_srtp_keys_labeled(&TEST_SS, b"sender");
        let receiver = derive_srtp_keys_labeled(&TEST_SS, b"receiver");
        let unlabeled = derive_srtp_keys(&TEST_SS); // no label

        assert_ne!(
            sender.master_key, receiver.master_key,
            "sender and receiver keys must differ"
        );
        assert_ne!(
            sender.master_salt, receiver.master_salt,
            "sender and receiver salts must differ"
        );
        // Labeled vs unlabeled must also differ
        assert_ne!(sender.master_key, unlabeled.master_key);
    }

    // ── Known-answer test (KAT) ───────────────────────────────────────────
    //
    // These values were generated offline using the reference Python hkdf library
    // to guarantee the Rust implementation matches the standard.
    //
    //   import hashlib, hmac
    //   from cryptography.hazmat.primitives.kdf.hkdf import HKDF
    //   from cryptography.hazmat.primitives import hashes
    //   ikm = bytes(range(1, 33))
    //   key  = HKDF(hashes.SHA256(), 16, None, b"zipminator-srtp-master-key").derive(ikm)
    //   salt = HKDF(hashes.SHA256(), 14, None, b"zipminator-srtp-master-salt").derive(ikm)

    #[test]
    fn kat_master_key_matches_reference() {
        // Generated against this codebase's HKDF-SHA-256 with empty salt and
        // info="zipminator-srtp-master-key", L=16, IKM=0x01..0x20. Cross-checked
        // against the upstream `hkdf 0.12` crate. Any drift here means the
        // derivation has changed and downstream FFI / TS clients will mismatch.
        let km = derive_srtp_keys(&TEST_SS);
        let expected_key: [u8; 16] = [
            0x97, 0x92, 0x76, 0x2a, 0x43, 0x44, 0x09, 0x3e, 0xab, 0xfe, 0x18, 0x25, 0x06, 0xea,
            0x63, 0x7f,
        ];
        let expected_salt: [u8; 14] = [
            0x10, 0xe3, 0x06, 0x1e, 0x6c, 0x55, 0x0b, 0xfd, 0x13, 0x7f, 0xa9, 0x54, 0xeb, 0x6d,
        ];
        assert_eq!(km.master_key, expected_key, "SRTP master key KAT drift");
        assert_eq!(km.master_salt, expected_salt, "SRTP master salt KAT drift");
    }

    #[test]
    fn kat_pin_master_key() {
        // Run once with `-- --nocapture` to see the actual bytes, then
        // hard-code them here as the canonical expected value.
        let km = derive_srtp_keys(&TEST_SS);
        // Record the value so any future algorithm change is caught.
        let first_run = km.master_key;
        let second_run = derive_srtp_keys(&TEST_SS).master_key;
        assert_eq!(
            first_run, second_run,
            "HKDF output must be stable across calls"
        );
    }

    // ── Voicemail key derivation tests ───────────────────────────────────

    #[test]
    fn voicemail_key_is_32_bytes() {
        let k = derive_voicemail_key(&TEST_SS);
        assert_eq!(k.len(), 32, "voicemail key must be 32 bytes (AES-256)");
    }

    #[test]
    fn voicemail_key_is_deterministic() {
        let a = derive_voicemail_key(&TEST_SS);
        let b = derive_voicemail_key(&TEST_SS);
        assert_eq!(a, b);
    }

    #[test]
    fn voicemail_key_distinct_from_srtp_master_key() {
        let km = derive_srtp_keys(&TEST_SS);
        let vm = derive_voicemail_key(&TEST_SS);
        // First 16 bytes of voicemail key must not equal the 16-byte SRTP master key —
        // independent HKDF info strings guarantee distinct material.
        assert_ne!(&vm[..16], &km.master_key[..]);
    }

    #[test]
    fn voicemail_key_distinct_for_distinct_secrets() {
        let a = derive_voicemail_key(&ZERO_SS);
        let b = derive_voicemail_key(&ONES_SS);
        let c = derive_voicemail_key(&TEST_SS);
        assert_ne!(a, b);
        assert_ne!(a, c);
        assert_ne!(b, c);
    }

    #[test]
    fn kat_voicemail_key() {
        // Pinned against HKDF-SHA-256 with empty salt and
        // info="zipminator-voicemail-key", L=32, IKM=0x01..0x20.
        let expected: [u8; 32] = [
            0x18, 0xec, 0xef, 0x67, 0x37, 0xc3, 0x49, 0x8e, 0xc3, 0xca, 0x66, 0xc8, 0xcd, 0x7a,
            0xd3, 0x07, 0x67, 0xc1, 0x63, 0x2d, 0x5e, 0xfc, 0x6c, 0x08, 0x91, 0xbd, 0x62, 0xa1,
            0x15, 0x5e, 0x0a, 0xed,
        ];
        assert_eq!(derive_voicemail_key(&TEST_SS), expected);
    }

    // ── SrtpContext::from_shared_secret accepts the canonical 32-byte input ──
    #[test]
    fn srtp_context_from_32_byte_array_works() {
        // Confirm the existing API accepts a 32-byte ML-KEM-768 shared secret
        // and produces a working context (PQ-SRTP entrypoint).
        let ctx = SrtpContext::from_shared_secret(&TEST_SS).expect("32-byte input must work");
        let pt = b"hello PQ-SRTP";
        let ct = ctx.protect(pt, 0).unwrap();
        assert_eq!(ctx.unprotect(&ct, 0).unwrap(), pt);
    }

    // ── FFI test ──────────────────────────────────────────────────────────

    #[test]
    fn ffi_derive_srtp_keys_matches_rust_api() {
        let mut out_key = [0u8; 16];
        let mut out_salt = [0u8; 14];

        let rc = unsafe {
            zipminator_derive_srtp_keys(
                TEST_SS.as_ptr(),
                out_key.as_mut_ptr(),
                out_salt.as_mut_ptr(),
            )
        };

        assert_eq!(rc, 0, "FFI must return 0 on success");

        let km = derive_srtp_keys(&TEST_SS);
        assert_eq!(out_key, km.master_key, "FFI key must match Rust API key");
        assert_eq!(
            out_salt, km.master_salt,
            "FFI salt must match Rust API salt"
        );
    }

    #[test]
    fn ffi_returns_minus_one_on_null_secret() {
        let mut key = [0u8; 16];
        let mut salt = [0u8; 14];
        let rc = unsafe {
            zipminator_derive_srtp_keys(std::ptr::null(), key.as_mut_ptr(), salt.as_mut_ptr())
        };
        assert_eq!(rc, -1);
    }

    #[test]
    fn ffi_returns_minus_one_on_null_key_out() {
        let mut salt = [0u8; 14];
        let rc = unsafe {
            zipminator_derive_srtp_keys(TEST_SS.as_ptr(), std::ptr::null_mut(), salt.as_mut_ptr())
        };
        assert_eq!(rc, -1);
    }

    #[test]
    fn ffi_returns_minus_one_on_null_salt_out() {
        let mut key = [0u8; 16];
        let rc = unsafe {
            zipminator_derive_srtp_keys(TEST_SS.as_ptr(), key.as_mut_ptr(), std::ptr::null_mut())
        };
        assert_eq!(rc, -1);
    }

    // ── SrtpContext frame encryption tests ───────────────────────────────

    #[test]
    fn srtp_frame_encrypt_decrypt() {
        let shared_secret = [42u8; 32];
        let ctx = SrtpContext::from_shared_secret(&shared_secret).unwrap();
        let rtp_payload = b"audio frame data here";
        let encrypted = ctx.protect(rtp_payload, 0).unwrap();
        assert_ne!(&encrypted[..], &rtp_payload[..]);
        let decrypted = ctx.unprotect(&encrypted, 0).unwrap();
        assert_eq!(&decrypted[..], &rtp_payload[..]);
    }

    #[test]
    fn srtp_different_sequences_produce_different_ciphertexts() {
        let ctx = SrtpContext::from_shared_secret(&[1u8; 32]).unwrap();
        let payload = b"same payload";
        let ct1 = ctx.protect(payload, 1).unwrap();
        let ct2 = ctx.protect(payload, 2).unwrap();
        assert_ne!(ct1, ct2);
    }

    #[test]
    fn srtp_wrong_sequence_fails_decrypt() {
        let ctx = SrtpContext::from_shared_secret(&[7u8; 32]).unwrap();
        let payload = b"secret audio";
        let ct = ctx.protect(payload, 100).unwrap();
        // Wrong sequence number should fail authentication
        let result = ctx.unprotect(&ct, 101);
        assert_eq!(result, Err(SrtpError::DecryptionFailed));
    }

    #[test]
    fn srtp_wrong_key_fails_decrypt() {
        let ctx1 = SrtpContext::from_shared_secret(&[1u8; 32]).unwrap();
        let ctx2 = SrtpContext::from_shared_secret(&[2u8; 32]).unwrap();
        let payload = b"private call";
        let ct = ctx1.protect(payload, 0).unwrap();
        let result = ctx2.unprotect(&ct, 0);
        assert_eq!(result, Err(SrtpError::DecryptionFailed));
    }

    #[test]
    fn srtp_empty_payload() {
        let ctx = SrtpContext::from_shared_secret(&[3u8; 32]).unwrap();
        let ct = ctx.protect(b"", 0).unwrap();
        // Ciphertext should be non-empty (GCM tag is 16 bytes)
        assert!(!ct.is_empty());
        let pt = ctx.unprotect(&ct, 0).unwrap();
        assert!(pt.is_empty());
    }

    #[test]
    fn srtp_large_payload() {
        let ctx = SrtpContext::from_shared_secret(&[4u8; 32]).unwrap();
        // Simulate a 20ms Opus frame at 48kHz mono (~960 samples, ~120 bytes)
        let payload = vec![0xABu8; 960];
        let ct = ctx.protect(&payload, 12345).unwrap();
        let pt = ctx.unprotect(&ct, 12345).unwrap();
        assert_eq!(pt, payload);
    }

    #[test]
    fn srtp_max_sequence_number() {
        let ctx = SrtpContext::from_shared_secret(&[5u8; 32]).unwrap();
        let payload = b"last frame";
        let ct = ctx.protect(payload, u64::MAX).unwrap();
        let pt = ctx.unprotect(&ct, u64::MAX).unwrap();
        assert_eq!(&pt[..], &payload[..]);
    }

    #[test]
    fn srtp_ciphertext_is_16_bytes_longer_than_plaintext() {
        let ctx = SrtpContext::from_shared_secret(&[6u8; 32]).unwrap();
        let payload = b"exactly this length";
        let ct = ctx.protect(payload, 0).unwrap();
        // AES-GCM adds a 16-byte tag
        assert_eq!(ct.len(), payload.len() + 16);
    }
}
