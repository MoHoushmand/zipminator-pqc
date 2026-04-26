//! OTA (Over-The-Air) Mesh Key Rotation Message.
//!
//! Defines the wire format for broadcasting a fresh mesh key to all nodes
//! in a Zipminator/RuView mesh. A coordinator node (typically the
//! aggregator) derives a new `MeshKey` from the QRNG pool and wraps it in an
//! `OtaRotationMessage` authenticated by HMAC-SHA256 under the *current*
//! mesh key. Receiving nodes verify the HMAC, replace their PSK with the new
//! key, and acknowledge the rotation.
//!
//! ## Wire Format
//!
//! ```text
//! [0..4]    magic bytes        b"OTA1"
//! [4]       version            0x01
//! [5..21]   sender_node_id     16-byte NodeId
//! [21..29]  rotation_counter   u64 LE (monotonically increasing)
//! [29..37]  timestamp_ms       u64 LE (UNIX milliseconds, replay window)
//! [37..53]  encrypted_psk      16 bytes; new MeshKey XOR-masked with HMAC keystream
//! [53..69]  encrypted_siphash  16 bytes; new SipHashKey XOR-masked with HMAC keystream
//! [69..101] hmac_tag           HMAC-SHA256(current_key, magic..encrypted_siphash)
//! ```
//!
//! Total wire size: **101 bytes**.
//!
//! The XOR mask is `HMAC-SHA256(current_key, b"ota-mask-v1" || rotation_counter LE)`,
//! truncated to 32 bytes. The first 16 bytes mask the new PSK; the next 16 mask the
//! new SipHash key. Receiving the same `rotation_counter` again produces the same
//! mask, so the protocol relies on `rotation_counter` being monotonic.
//!
//! ## Threat Model
//!
//! - Adversary cannot forge: HMAC-SHA256 under the current key gates acceptance.
//! - Adversary cannot replay: `rotation_counter` strictly increases; nodes reject
//!   any counter <= last_accepted.
//! - Adversary cannot recover the new key without the current key (XOR masking
//!   uses an HMAC-derived keystream, not raw broadcast).
//! - Forward secrecy after rotation: once the old key is destroyed, an attacker
//!   who later compromises the new key cannot decrypt prior rotation messages
//!   since the mask requires the *old* key.

use hmac::{Hmac, Mac};
use sha2::Sha256;
use subtle::ConstantTimeEq;

use crate::mesh_key::{MeshKey, MESH_PSK_SIZE};
use crate::siphash_key::{SipHashKey, SIPHASH_KEY_SIZE};
use crate::topology_auth::NodeId;

type HmacSha256 = Hmac<Sha256>;

/// Magic bytes identifying an OTA rotation message.
pub const OTA_MAGIC: &[u8; 4] = b"OTA1";

/// Current OTA wire format version.
pub const OTA_VERSION: u8 = 1;

/// HMAC tag size (SHA-256 output, full 32 bytes).
pub const OTA_HMAC_SIZE: usize = 32;

/// Total wire size of an `OtaRotationMessage` after serialization.
pub const OTA_WIRE_SIZE: usize = 4 + 1 + 16 + 8 + 8 + 16 + 16 + OTA_HMAC_SIZE;

/// Info string for the XOR keystream HMAC.
const KEYSTREAM_INFO: &[u8] = b"ota-mask-v1";

/// Errors from OTA rotation operations.
#[derive(Debug, thiserror::Error, PartialEq, Eq)]
pub enum OtaError {
    /// Wire format buffer is too short.
    #[error("OTA buffer too short: need {OTA_WIRE_SIZE} bytes, got {got}")]
    TooShort {
        /// Bytes received.
        got: usize,
    },

    /// Magic bytes do not match `OTA1`.
    #[error("invalid OTA magic bytes")]
    InvalidMagic,

    /// Wire format version is not supported.
    #[error("unsupported OTA version: expected {OTA_VERSION}, got {got}")]
    UnsupportedVersion {
        /// Version byte received.
        got: u8,
    },

    /// HMAC-SHA256 verification failed (forged or wrong key).
    #[error("OTA HMAC verification failed")]
    HmacVerifyFailed,

    /// Rotation counter did not strictly increase.
    #[error("replay detected: rotation_counter {got} <= last_accepted {last_accepted}")]
    ReplayDetected {
        /// Counter on the incoming message.
        got: u64,
        /// Counter most recently accepted by this node.
        last_accepted: u64,
    },
}

/// A single OTA mesh-key rotation broadcast.
///
/// Constructed by the coordinator with `OtaRotationMessage::new`, serialized
/// with `serialize`, and verified at each node with `deserialize`.
#[derive(Debug, Clone)]
pub struct OtaRotationMessage {
    /// Sender (coordinator) node identifier.
    pub sender_node_id: NodeId,
    /// Monotonically increasing rotation counter.
    pub rotation_counter: u64,
    /// UNIX milliseconds when the message was created (replay window guard).
    pub timestamp_ms: u64,
    /// New 16-byte PSK to install (plaintext; serialization XOR-masks).
    new_psk: [u8; MESH_PSK_SIZE],
    /// New 16-byte SipHash key to install.
    new_siphash: [u8; SIPHASH_KEY_SIZE],
}

impl OtaRotationMessage {
    /// Construct an OTA message that will install `new_psk` and `new_siphash`
    /// when authenticated under the recipients' *current* mesh key.
    pub fn new(
        sender_node_id: NodeId,
        rotation_counter: u64,
        timestamp_ms: u64,
        new_psk: &MeshKey,
        new_siphash: &SipHashKey,
    ) -> Self {
        Self {
            sender_node_id,
            rotation_counter,
            timestamp_ms,
            new_psk: *new_psk.as_bytes(),
            new_siphash: *new_siphash.as_bytes(),
        }
    }

    /// Serialize to wire bytes, authenticating with `current_key`.
    ///
    /// The new keys are XOR-masked with an HMAC-derived keystream so they are
    /// not exposed in the broadcast.
    pub fn serialize(&self, current_key: &MeshKey) -> Vec<u8> {
        let mask = derive_keystream(current_key, self.rotation_counter);

        let mut buf = Vec::with_capacity(OTA_WIRE_SIZE);
        buf.extend_from_slice(OTA_MAGIC);
        buf.push(OTA_VERSION);
        buf.extend_from_slice(&self.sender_node_id);
        buf.extend_from_slice(&self.rotation_counter.to_le_bytes());
        buf.extend_from_slice(&self.timestamp_ms.to_le_bytes());

        // XOR new_psk with first 16 bytes of mask.
        for (i, b) in self.new_psk.iter().enumerate() {
            buf.push(b ^ mask[i]);
        }
        // XOR new_siphash with bytes 16..32 of mask.
        for (i, b) in self.new_siphash.iter().enumerate() {
            buf.push(b ^ mask[16 + i]);
        }

        // HMAC over magic..encrypted_siphash (everything except the tag).
        let mut mac = HmacSha256::new_from_slice(current_key.as_bytes())
            .expect("HMAC-SHA256 accepts any key length");
        mac.update(&buf);
        let tag = mac.finalize().into_bytes();
        buf.extend_from_slice(&tag);

        buf
    }

    /// Verify and decode an OTA message under `current_key`, returning the
    /// new (`MeshKey`, `SipHashKey`) pair on success.
    ///
    /// `last_accepted_counter` is checked to prevent replay; the incoming
    /// counter must be strictly greater.
    pub fn deserialize(
        wire: &[u8],
        current_key: &MeshKey,
        last_accepted_counter: u64,
    ) -> Result<DeserializedOta, OtaError> {
        if wire.len() != OTA_WIRE_SIZE {
            return Err(OtaError::TooShort { got: wire.len() });
        }
        if &wire[0..4] != OTA_MAGIC.as_slice() {
            return Err(OtaError::InvalidMagic);
        }
        if wire[4] != OTA_VERSION {
            return Err(OtaError::UnsupportedVersion { got: wire[4] });
        }

        // Verify HMAC first to gate any decryption.
        let (signed, tag) = wire.split_at(OTA_WIRE_SIZE - OTA_HMAC_SIZE);
        let mut mac = HmacSha256::new_from_slice(current_key.as_bytes())
            .expect("HMAC-SHA256 accepts any key length");
        mac.update(signed);
        let expected = mac.finalize().into_bytes();
        if !bool::from(tag.ct_eq(&expected)) {
            return Err(OtaError::HmacVerifyFailed);
        }

        // HMAC valid; parse fields.
        let mut sender_node_id = [0u8; 16];
        sender_node_id.copy_from_slice(&wire[5..21]);
        let rotation_counter = u64::from_le_bytes(wire[21..29].try_into().unwrap());
        let timestamp_ms = u64::from_le_bytes(wire[29..37].try_into().unwrap());

        if rotation_counter <= last_accepted_counter {
            return Err(OtaError::ReplayDetected {
                got: rotation_counter,
                last_accepted: last_accepted_counter,
            });
        }

        // Recover new keys via XOR demask.
        let mask = derive_keystream(current_key, rotation_counter);
        let mut new_psk = [0u8; MESH_PSK_SIZE];
        for (i, slot) in new_psk.iter_mut().enumerate() {
            *slot = wire[37 + i] ^ mask[i];
        }
        let mut new_siphash = [0u8; SIPHASH_KEY_SIZE];
        for (i, slot) in new_siphash.iter_mut().enumerate() {
            *slot = wire[53 + i] ^ mask[16 + i];
        }

        let new_psk = MeshKey::from_bytes(&new_psk).ok_or(OtaError::HmacVerifyFailed)?;
        let new_siphash =
            SipHashKey::from_bytes(&new_siphash).ok_or(OtaError::HmacVerifyFailed)?;

        Ok(DeserializedOta {
            sender_node_id,
            rotation_counter,
            timestamp_ms,
            new_psk,
            new_siphash,
        })
    }
}

/// Result of successfully decoding an OTA message.
#[derive(Debug)]
pub struct DeserializedOta {
    /// Coordinator node that issued the rotation.
    pub sender_node_id: NodeId,
    /// Counter advertised in this rotation.
    pub rotation_counter: u64,
    /// UNIX millisecond timestamp claimed by the sender.
    pub timestamp_ms: u64,
    /// New mesh PSK to install.
    pub new_psk: MeshKey,
    /// New SipHash frame-integrity key to install.
    pub new_siphash: SipHashKey,
}

/// Derive the 32-byte XOR keystream that masks the broadcast keys.
fn derive_keystream(current_key: &MeshKey, rotation_counter: u64) -> [u8; 32] {
    let mut mac = HmacSha256::new_from_slice(current_key.as_bytes())
        .expect("HMAC-SHA256 accepts any key length");
    mac.update(KEYSTREAM_INFO);
    mac.update(&rotation_counter.to_le_bytes());
    let result = mac.finalize().into_bytes();
    let mut mask = [0u8; 32];
    mask.copy_from_slice(&result);
    mask
}

/// A per-node key state suitable for driving the 3-node integration test
/// and for use by `MeshNode` (Flutter/Tauri) callers that already track
/// their own counter.
#[derive(Debug, Clone)]
pub struct OtaNodeState {
    /// Node identifier (for logging only).
    pub node_id: NodeId,
    /// Currently installed PSK.
    pub current_psk: MeshKey,
    /// Currently installed SipHash key.
    pub current_siphash: SipHashKey,
    /// Highest rotation counter accepted so far. Initialized to 0.
    pub last_accepted_counter: u64,
}

impl OtaNodeState {
    /// Create a new per-node state with installed keys and counter = 0.
    pub fn new(node_id: NodeId, psk: MeshKey, siphash: SipHashKey) -> Self {
        Self {
            node_id,
            current_psk: psk,
            current_siphash: siphash,
            last_accepted_counter: 0,
        }
    }

    /// Apply an OTA rotation to this node. On success, `current_psk`,
    /// `current_siphash`, and `last_accepted_counter` are updated.
    pub fn apply_rotation(&mut self, wire: &[u8]) -> Result<(), OtaError> {
        let decoded =
            OtaRotationMessage::deserialize(wire, &self.current_psk, self.last_accepted_counter)?;
        self.current_psk = decoded.new_psk;
        self.current_siphash = decoded.new_siphash;
        self.last_accepted_counter = decoded.rotation_counter;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn make_psk(byte: u8) -> MeshKey {
        MeshKey::from_bytes(&[byte; MESH_PSK_SIZE]).unwrap()
    }

    fn make_siphash(byte: u8) -> SipHashKey {
        SipHashKey::from_bytes(&[byte; SIPHASH_KEY_SIZE]).unwrap()
    }

    fn node_id(byte: u8) -> NodeId {
        [byte; 16]
    }

    #[test]
    fn roundtrip_serialize_deserialize() {
        let current = make_psk(0x11);
        let new_psk = make_psk(0x22);
        let new_sip = make_siphash(0x33);
        let msg = OtaRotationMessage::new(node_id(0xAA), 1, 1_700_000_000_000, &new_psk, &new_sip);
        let wire = msg.serialize(&current);
        assert_eq!(wire.len(), OTA_WIRE_SIZE);

        let decoded = OtaRotationMessage::deserialize(&wire, &current, 0).unwrap();
        assert_eq!(decoded.sender_node_id, node_id(0xAA));
        assert_eq!(decoded.rotation_counter, 1);
        assert_eq!(decoded.timestamp_ms, 1_700_000_000_000);
        assert_eq!(decoded.new_psk, new_psk);
        assert_eq!(decoded.new_siphash, new_sip);
    }

    #[test]
    fn wire_size_constant_is_correct() {
        let current = make_psk(0xAA);
        let msg = OtaRotationMessage::new(
            node_id(1),
            7,
            42,
            &make_psk(0xBB),
            &make_siphash(0xCC),
        );
        let wire = msg.serialize(&current);
        assert_eq!(wire.len(), OTA_WIRE_SIZE);
        assert_eq!(wire.len(), 101);
    }

    #[test]
    fn wrong_key_rejected() {
        let current = make_psk(0x11);
        let wrong = make_psk(0x99);
        let msg = OtaRotationMessage::new(
            node_id(1),
            1,
            0,
            &make_psk(0x22),
            &make_siphash(0x33),
        );
        let wire = msg.serialize(&current);

        let result = OtaRotationMessage::deserialize(&wire, &wrong, 0);
        assert_eq!(result.unwrap_err(), OtaError::HmacVerifyFailed);
    }

    #[test]
    fn tamper_detected() {
        let current = make_psk(0x11);
        let msg = OtaRotationMessage::new(
            node_id(1),
            1,
            0,
            &make_psk(0x22),
            &make_siphash(0x33),
        );
        let mut wire = msg.serialize(&current);
        // Flip a byte in the encrypted PSK region.
        wire[40] ^= 0x55;

        let result = OtaRotationMessage::deserialize(&wire, &current, 0);
        assert_eq!(result.unwrap_err(), OtaError::HmacVerifyFailed);
    }

    #[test]
    fn replay_rejected() {
        let current = make_psk(0x11);
        let msg = OtaRotationMessage::new(
            node_id(1),
            5,
            0,
            &make_psk(0x22),
            &make_siphash(0x33),
        );
        let wire = msg.serialize(&current);

        // last_accepted = 5; incoming = 5 => replay
        let result = OtaRotationMessage::deserialize(&wire, &current, 5);
        match result {
            Err(OtaError::ReplayDetected { got, last_accepted }) => {
                assert_eq!(got, 5);
                assert_eq!(last_accepted, 5);
            }
            other => panic!("expected ReplayDetected, got {other:?}"),
        }
    }

    #[test]
    fn invalid_magic_rejected() {
        let current = make_psk(0x11);
        let msg = OtaRotationMessage::new(
            node_id(1),
            1,
            0,
            &make_psk(0x22),
            &make_siphash(0x33),
        );
        let mut wire = msg.serialize(&current);
        wire[0] = b'X';
        assert_eq!(
            OtaRotationMessage::deserialize(&wire, &current, 0).unwrap_err(),
            OtaError::InvalidMagic
        );
    }

    #[test]
    fn version_mismatch_rejected() {
        let current = make_psk(0x11);
        let msg = OtaRotationMessage::new(
            node_id(1),
            1,
            0,
            &make_psk(0x22),
            &make_siphash(0x33),
        );
        let mut wire = msg.serialize(&current);
        wire[4] = 99;
        let result = OtaRotationMessage::deserialize(&wire, &current, 0);
        assert!(matches!(result, Err(OtaError::UnsupportedVersion { got: 99 })));
    }

    #[test]
    fn truncated_message_rejected() {
        let current = make_psk(0x11);
        let result = OtaRotationMessage::deserialize(&[0u8; 10], &current, 0);
        assert!(matches!(result, Err(OtaError::TooShort { got: 10 })));
    }

    /// Happy-path 3-node OTA rotation: A broadcasts a new key, B and C apply.
    /// After rotation, all 3 nodes share identical PSK + SipHash keys, and
    /// any two of them can authenticate each other under the new key.
    #[test]
    fn three_node_rotation_happy_path() {
        // Bootstrap: all 3 nodes share an initial key set.
        let initial_psk = make_psk(0x10);
        let initial_sip = make_siphash(0x20);

        let mut node_a = OtaNodeState::new(node_id(0xA0), initial_psk.clone(), initial_sip.clone());
        let mut node_b = OtaNodeState::new(node_id(0xB0), initial_psk.clone(), initial_sip.clone());
        let mut node_c = OtaNodeState::new(node_id(0xC0), initial_psk, initial_sip);

        // A is the coordinator; it generates fresh keys (in real life, from QRNG).
        let new_psk = make_psk(0x77);
        let new_sip = make_siphash(0x88);

        let msg = OtaRotationMessage::new(
            node_a.node_id,
            node_a.last_accepted_counter + 1,
            1_700_000_000_000,
            &new_psk,
            &new_sip,
        );
        let wire = msg.serialize(&node_a.current_psk);

        // A applies the rotation locally, just like B and C will.
        node_a.apply_rotation(&wire).unwrap();
        // B receives the broadcast.
        node_b.apply_rotation(&wire).unwrap();
        // C receives the broadcast.
        node_c.apply_rotation(&wire).unwrap();

        // All 3 nodes now share the new PSK.
        assert_eq!(node_a.current_psk, new_psk);
        assert_eq!(node_b.current_psk, new_psk);
        assert_eq!(node_c.current_psk, new_psk);

        assert_eq!(node_a.current_siphash, new_sip);
        assert_eq!(node_b.current_siphash, new_sip);
        assert_eq!(node_c.current_siphash, new_sip);

        // All 3 nodes have the same accepted counter (1).
        assert_eq!(node_a.last_accepted_counter, 1);
        assert_eq!(node_b.last_accepted_counter, 1);
        assert_eq!(node_c.last_accepted_counter, 1);

        // After rotation, A→B→C can still authenticate each other under the new key:
        // we round-trip a follow-up rotation (counter=2) and confirm B and C accept.
        let next_psk = make_psk(0xAA);
        let next_sip = make_siphash(0xBB);
        let msg2 = OtaRotationMessage::new(
            node_a.node_id,
            node_a.last_accepted_counter + 1,
            1_700_000_001_000,
            &next_psk,
            &next_sip,
        );
        let wire2 = msg2.serialize(&node_a.current_psk);

        node_a.apply_rotation(&wire2).unwrap();
        node_b.apply_rotation(&wire2).unwrap();
        node_c.apply_rotation(&wire2).unwrap();

        assert_eq!(node_a.current_psk, next_psk);
        assert_eq!(node_b.current_psk, next_psk);
        assert_eq!(node_c.current_psk, next_psk);
        assert_eq!(node_a.last_accepted_counter, 2);
        assert_eq!(node_b.last_accepted_counter, 2);
        assert_eq!(node_c.last_accepted_counter, 2);
    }

    /// If the coordinator's old key has been compromised AFTER rotation, the
    /// attacker still cannot impersonate the coordinator (replay rejected
    /// because counter is no longer fresh).
    #[test]
    fn three_node_rotation_old_message_rejected_post_rotation() {
        let initial_psk = make_psk(0x10);
        let initial_sip = make_siphash(0x20);

        let mut node_a = OtaNodeState::new(node_id(0xA0), initial_psk.clone(), initial_sip.clone());
        let mut node_b = OtaNodeState::new(node_id(0xB0), initial_psk.clone(), initial_sip.clone());

        let new_psk = make_psk(0x77);
        let new_sip = make_siphash(0x88);

        // Coordinator broadcasts message with counter=1.
        let msg = OtaRotationMessage::new(
            node_a.node_id,
            1,
            1_700_000_000_000,
            &new_psk,
            &new_sip,
        );
        let wire1 = msg.serialize(&node_a.current_psk);

        // Both nodes apply the rotation.
        node_a.apply_rotation(&wire1).unwrap();
        node_b.apply_rotation(&wire1).unwrap();

        // An attacker captures wire1 and replays it to a fresh-yet-rotated node.
        // Node B already has last_accepted_counter = 1, so the replay is rejected.
        // Note: we need to deserialize against the *new* key now, since B has rotated.
        // However the replayed message was signed with the OLD key, so the HMAC
        // will fail rather than the replay check. Either way, it must not succeed.
        let replay_result = node_b.apply_rotation(&wire1);
        assert!(replay_result.is_err());
    }
}
