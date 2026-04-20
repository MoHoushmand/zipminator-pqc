//! PQ-WireGuard on-the-wire message layout.
//!
//! Intentionally narrow: iter 2 defines byte layout and (de)serialization.
//! Authentication tags (MAC1/MAC2 from WireGuard's Noise_IK) are a later
//! concern handled alongside the HKDF chain in iter 3.
//!
//! Byte layout (little-endian, no padding beyond the explicit reserved field):
//!
//! INITIATION (`message_type = 1`):
//!
//! | offset | length | field                                   |
//! |--------|--------|-----------------------------------------|
//! | 0      | 1      | message_type                            |
//! | 1      | 3      | reserved (zero)                         |
//! | 4      | 4      | sender_index (u32 LE)                   |
//! | 8      | 4      | receiver_index (u32 LE, zero on init)   |
//! | 12     | 1088   | ML-KEM-768 ciphertext                   |
//! Total: `INITIATION_WIRE_LEN = 1100` bytes.
//!
//! RESPONSE (`message_type = 2`):
//!
//! | offset | length | field                                   |
//! |--------|--------|-----------------------------------------|
//! | 0      | 1      | message_type                            |
//! | 1      | 3      | reserved (zero)                         |
//! | 4      | 4      | sender_index (u32 LE)                   |
//! | 8      | 4      | receiver_index (u32 LE)                 |
//! Total: `RESPONSE_WIRE_LEN = 12` bytes.
//!
//! This layout is stable across language bindings. The fixture at
//! `tests/vpn/fixtures/initiation.hex` is the single source of truth; the
//! Dart iter-5 test loads it verbatim.

use crate::handshake::{MSG_TYPE_INITIATION, MSG_TYPE_RESPONSE};
use pqcrypto_kyber::kyber768;

/// Byte length of a fully serialized initiation message.
pub const INITIATION_WIRE_LEN: usize = 12 + 1088; // header + KEM ciphertext
/// Byte length of a serialized response message (iter 2 has no payload).
pub const RESPONSE_WIRE_LEN: usize = 12;

const HEADER_LEN: usize = 12;
const KEM_CT_LEN: usize = 1088; // ML-KEM-768 ciphertext size (FIPS 203).

/// On-the-wire message type. `#[repr(u8)]` pins the discriminant so the
/// in-memory tag matches the byte on the wire.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
#[repr(u8)]
pub enum MessageType {
    Initiation = MSG_TYPE_INITIATION, // 1
    Response = MSG_TYPE_RESPONSE,     // 2
}

impl MessageType {
    fn from_u8(v: u8) -> Result<Self, &'static str> {
        match v {
            MSG_TYPE_INITIATION => Ok(Self::Initiation),
            MSG_TYPE_RESPONSE => Ok(Self::Response),
            _ => Err("unknown message type"),
        }
    }
}

/// Framed PQ-WireGuard message ready for (de)serialization.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct WireMessage {
    pub message_type: MessageType,
    pub sender_index: u32,
    pub receiver_index: u32,
    /// ML-KEM-768 ciphertext (1088 bytes) for `Initiation`; empty for
    /// `Response`.
    pub kem_ciphertext: Vec<u8>,
}

impl WireMessage {
    /// Serialize to the canonical little-endian on-wire layout.
    pub fn to_bytes(&self) -> Vec<u8> {
        let len = match self.message_type {
            MessageType::Initiation => INITIATION_WIRE_LEN,
            MessageType::Response => RESPONSE_WIRE_LEN,
        };
        let mut out = Vec::with_capacity(len);
        out.push(self.message_type as u8);
        out.extend_from_slice(&[0u8; 3]); // reserved
        out.extend_from_slice(&self.sender_index.to_le_bytes());
        out.extend_from_slice(&self.receiver_index.to_le_bytes());
        match self.message_type {
            MessageType::Initiation => {
                debug_assert_eq!(self.kem_ciphertext.len(), KEM_CT_LEN);
                out.extend_from_slice(&self.kem_ciphertext);
            }
            MessageType::Response => {
                debug_assert!(self.kem_ciphertext.is_empty());
            }
        }
        debug_assert_eq!(out.len(), len);
        out
    }

    /// Parse from the canonical on-wire layout. Rejects any length mismatch,
    /// unknown message type, or non-zero reserved bytes.
    pub fn from_bytes(bytes: &[u8]) -> Result<Self, &'static str> {
        if bytes.len() < HEADER_LEN {
            return Err("frame shorter than header");
        }
        let msg_type = MessageType::from_u8(bytes[0])?;
        if bytes[1..4] != [0u8; 3] {
            return Err("reserved bytes must be zero");
        }
        let sender_index = u32::from_le_bytes([bytes[4], bytes[5], bytes[6], bytes[7]]);
        let receiver_index = u32::from_le_bytes([bytes[8], bytes[9], bytes[10], bytes[11]]);

        let kem_ciphertext = match msg_type {
            MessageType::Initiation => {
                if bytes.len() != INITIATION_WIRE_LEN {
                    return Err("initiation wrong length");
                }
                bytes[HEADER_LEN..].to_vec()
            }
            MessageType::Response => {
                if bytes.len() != RESPONSE_WIRE_LEN {
                    return Err("response wrong length");
                }
                Vec::new()
            }
        };

        Ok(Self {
            message_type: msg_type,
            sender_index,
            receiver_index,
            kem_ciphertext,
        })
    }
}

// Sanity check at compile time: our length constants match the KEM size.
// (`const` assert via a zero-sized array whose size is non-negative only when
// the equality holds.)
#[allow(dead_code)]
const _: [(); 0] = [(); (KEM_CT_LEN == kyber768::ciphertext_bytes()) as usize - 1];
