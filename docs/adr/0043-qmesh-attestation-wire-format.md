# ADR-0043: Q-Mesh Wave 2 Attestation Wire Format

- Status: Accepted
- Date: 2026-04-26
- Pillar: 9 (Q-Mesh)
- Supersedes / supplements: ADR-032 (RuView TDM Sync Beacon Wire Format)
- Related code: `crates/zipminator-mesh/src/attestation.rs`, `crates/zipminator-mesh/src/ota.rs`, `crates/zipminator-mesh/src/provisioner.rs`

## Context

RuView ESP32-S3 mesh nodes harvest physical-layer signals (CSI, vital signs,
EM noise, topology) and need to transmit attestations of those measurements
back to the Zipminator aggregator. ADR-032 covered the TDM sync beacon and
SipHash frame integrity for the *control plane*. This ADR specifies the
*data plane* wire format used for higher-bandwidth attestation messages
flowing **RuView → Zipminator**, plus the OTA mesh-key rotation message
flowing **Zipminator → RuView**.

The Wave-1 modules (CSI Entropy, PUEK, EM Canary, Vital Auth, Topology
Auth, Spatiotemporal) generate seven distinct payload types that must be
serialised, authenticated, and recovered without prior schema negotiation
on the constrained ESP32-S3 path.

## Decision

Adopt a single binary wire format for all Wave-2 attestation traffic with a
fixed 8-byte header, variable-length typed payload, and a 32-byte HMAC-SHA256
tag computed under the current `MeshKey` (16-byte PSK).

### Attestation message layout (`attestation.rs`)

```text
[0..4]            magic bytes        b"RVAT"
[4]               version            0x01
[5]               type               u8 discriminator (see table below)
[6..8]            payload_len        u16 LE (payload bytes only)
[8..8+N]          payload            N bytes, format per type
[8+N..8+N+32]     hmac_tag           HMAC-SHA256(MeshKey, header || payload)
```

| Type byte | Variant                  | Payload format                                                                                                                  |
| --------: | :----------------------- | :------------------------------------------------------------------------------------------------------------------------------ |
|      0x01 | `CsiEigenstructure`      | `K × f64 LE` (top-K eigenvalues; K inferred from `payload_len / 8`)                                                             |
|      0x02 | `VitalSigns`             | `f32 br` ‖ `f32 hr` ‖ `f32[8] micro_movement` (40 bytes)                                                                        |
|      0x03 | `AnomalyEvent`           | `f64 deviation` ‖ `u64 timestamp_ms` (16 bytes)                                                                                 |
|      0x04 | `TopologyUpdate`         | `u16 node_count` ‖ `u16 edge_count` ‖ `node_count × NodeId(16B)` ‖ `edge_count × (NodeId, NodeId)` (variable)                   |
|      0x05 | `PresenceProof`          | `NodeId(16B)` ‖ `f64 lat` ‖ `f64 lon` ‖ `u64 ts_ms` ‖ `signature[64]` (104 bytes)                                                |
|      0x06 | `VitalAuthChallenge`     | `NodeId(16B)` ‖ `[u8; 32] nonce` ‖ `f32 br` ‖ `f32 hr` (56 bytes)                                                                |
|      0x07 | `EmCanaryAlert`          | `NodeId(16B)` ‖ `u8 alert_level` ‖ `f64 freq_hz` ‖ `f64 power_dbm` ‖ `u64 ts_ms` (41 bytes)                                       |

All multi-byte integers and floats are **little-endian** (matches ESP32
native order; ARM64 also LE; portability is achieved by always writing LE).

`NodeId` is a 16-byte opaque identifier, identical to the `topology_auth::NodeId`
type alias.

`payload_len` is the size of the payload region only. Total wire size is
`8 + payload_len + 32`. Maximum `payload_len` = 65535 (u16 limit), so the
maximum wire-size is 65 575 bytes.

### OTA rotation message layout (`ota.rs`)

```text
[0..4]    magic bytes        b"OTA1"
[4]       version            0x01
[5..21]   sender_node_id     NodeId(16B)
[21..29]  rotation_counter   u64 LE (monotonic per node-pair)
[29..37]  timestamp_ms       u64 LE (UNIX ms, replay window)
[37..53]  encrypted_psk      16B; new MeshKey XORed with HMAC keystream
[53..69]  encrypted_siphash  16B; new SipHashKey XORed with HMAC keystream
[69..101] hmac_tag           HMAC-SHA256(current_key, magic..encrypted_siphash)
```

Total wire size: **101 bytes** (constant).

The XOR mask is `HMAC-SHA256(current_key, b"ota-mask-v1" || rotation_counter LE)`,
truncated to 32 bytes; the first 16 mask the PSK, the next 16 mask the
SipHash key. This avoids broadcasting raw new-key material while keeping
the wire format constant-size.

### NVS V3 binary layout (`provisioner.rs`)

The V3 NVS provisioning binary extends V2 to carry per-module Wave-1 keys.
This is what `MeshProvisioner::provision_nvs_v3_binary` and
`scripts/integrate_ruview.py` emit (V3 uses the same headers + a module-key
section appended before the checksum):

```text
[0..6]            "ZMESH\x03"                         magic header v3
[6..8]            mesh_id_len (u16 LE)                length of mesh_id
[8..8+N]          mesh_id (UTF-8 bytes)               network identifier
[8+N..8+N+16]     PSK (16B)                           HMAC beacon PSK
[8+N+16..8+N+32]  SipHash key (16B)                   frame-integrity key
[has_puek (1B)] [puek_data (variable if 1)]
[has_canary (1B)] [canary_data (variable if 1)]
[module_count (1B = 6)]
[csi_entropy_key (16B)]
[puek_key (16B)]
[em_canary_key (16B)]
[vital_auth_key (16B)]
[topo_auth_key (16B)]
[spatiotemporal_key (16B)]
[sha256_checksum (32B)]                               over all preceding bytes
```

The V1 binary (no PUEK/canary/module keys) is the format produced by the
canonical Python script `scripts/integrate_ruview.py`; V3 is reachable from
the Rust `MeshProvisioner` only.

## Authentication

* **Confidentiality**: NOT a goal of the attestation messages — they are
  intended to be readable by aggregators on the local mesh. Confidentiality
  is provided by an outer ML-KEM-768 transport (PQCTunnel) when leaving
  the trust boundary.
* **Integrity & Authenticity**: HMAC-SHA256 under a 16-byte `MeshKey`
  derived from QRNG via HKDF. Constant-time comparison via `subtle::ConstantTimeEq`.
* **Key separation**: `attestation` uses the `MeshKey` (PSK) directly;
  `ota` uses the *current* PSK to authenticate rotation to the *new* PSK,
  with explicit replay protection through `rotation_counter`.

## Replay & Replay-after-Rotation

* Attestation messages do **not** carry a counter. Replay protection is
  delegated to the outer transport (QUIC stream IDs in the aggregator
  path, sliding nonce window in the manual UDP path described by ADR-032).
* OTA messages carry a strict `rotation_counter`; nodes track the highest
  counter accepted (`OtaNodeState::last_accepted_counter`). Any
  `counter ≤ last_accepted` is rejected with `OtaError::ReplayDetected`.
* After rotation, the old PSK is replaced; replays of the *previous* OTA
  message therefore also fail HMAC under the new key (defence-in-depth).

## Per-module HKDF info strings (V3)

```text
csi_entropy:    b"zipminator-mesh-module-csi_entropy-v1"
puek:           b"zipminator-mesh-module-puek-v1"
em_canary:      b"zipminator-mesh-module-em_canary-v1"
vital_auth:     b"zipminator-mesh-module-vital_auth-v1"
topo_auth:      b"zipminator-mesh-module-topo_auth-v1"
spatiotemporal: b"zipminator-mesh-module-spatiotemporal-v1"
```

The HKDF salt is `f"{mesh_id}:epoch:{epoch}"` (matches
`MeshProvisioner::epoch_salt`).

## Threat model

### In scope
- Attacker eavesdropping on the unencrypted radio control plane.
- Attacker tampering with attestation payloads (HMAC fails).
- Attacker replaying captured OTA rotations (counter check fails).
- Attacker recovering an old MeshKey *after* a rotation (forward secrecy
  on rotated keys via OTA XOR mask).
- Cross-module key leakage — distinct HKDF info strings per module ensure
  compromise of one module key does not yield another.

### Out of scope
- Confidentiality of attestation payloads — addressed by outer transport.
- Side-channel attacks on the ESP32-S3 implementation — relies on
  constant-time comparison only at the Zipminator aggregator side.
- Compromise of the QRNG source — failure of liveness, not attestation.

## Validation

| Check                                              | Where                                               |
| -------------------------------------------------- | --------------------------------------------------- |
| Attestation roundtrip per type                     | `attestation::tests::roundtrip_*`                   |
| Wrong-key rejected                                 | `attestation::tests::hmac_wrong_key_fails`          |
| Tamper rejected                                    | `attestation::tests::hmac_tampered_payload_fails`   |
| Bad version / magic / size rejected                | `attestation::tests::*_rejected`                    |
| OTA roundtrip                                      | `ota::tests::roundtrip_serialize_deserialize`       |
| OTA wrong-key rejected                             | `ota::tests::wrong_key_rejected`                    |
| OTA replay rejected                                | `ota::tests::replay_rejected`                       |
| 3-node OTA happy path                              | `ota::tests::three_node_rotation_happy_path`        |
| 3-node post-rotation replay rejected               | `ota::tests::three_node_rotation_old_message_…`     |
| V3 NVS emits 6 module keys                         | `provisioner::tests::test_nvs_v3_emits_six_module…` |
| V3 NVS module keys distinct from PSK / SipHash     | `provisioner::tests::test_nvs_v3_module_keys_dist…` |
| V3 NVS checksum corruption rejected                | `provisioner::tests::test_nvs_v3_checksum_validat…` |
| Cross-language byte parity (Rust ↔ Python)         | `tests/test_integrate_ruview.py::test_byte_parity` |
| HKDF KAT (RFC 5869 Test Case 1)                    | `tests/test_integrate_ruview.py::test_hkdf_…rfc5869` |

## Consequences

- **Positive**: a single typed schema covers all Wave-2 attestation traffic
  and the V3 NVS provisioning binary, with one HMAC primitive across both.
- **Positive**: cross-language parity between the Rust crate and the
  Python provisioner is enforced by a runtime byte-equality test, so
  RuView's `scripts/provision.py` (in the sister repo) can adopt either
  implementation interchangeably.
- **Negative**: the wire format is binary, not self-describing — debugging
  requires the layout reference in this ADR.
- **Negative**: `payload_len` is u16, capping any single attestation at
  ~64 KiB. Larger payloads (e.g., a topology update with > 4000 nodes) must
  be chunked at the application layer. This is an explicit design choice;
  the constraint matches the ESP32-S3 scratch buffer.

## Future work (out of scope for ADR-0043)

- Wave-3: ML-KEM-768 wrapping of the MeshKey for full transport-layer
  forward secrecy on the data plane.
- Add a CBOR variant for off-mesh consumers (Zipminator dashboards) once
  the on-mesh format is frozen.
