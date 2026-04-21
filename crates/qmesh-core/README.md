# qmesh-core

Core library for **Q-Mesh (Pillar 9): Quantum-Secured WiFi Sensing**.

## Scope

Software-only building blocks for the Q-Mesh session layer:

- **Software CSI mock.** `csi::MockCsiSource` emits deterministic
  `CsiFrame` values so the entropy estimator and session layer can be
  developed without ESP32 / Intel / Atheros hardware.
- **ML-KEM-768 handshake wrapper.** `handshake::QMeshHandshake`
  re-exports the NIST FIPS 203 (ML-KEM-768) KEM from `zipminator-core`.
  Implements NIST FIPS 203 (ML-KEM-768); verified against NIST KAT test
  vectors in the underlying core crate.
- **HKDF-SHA256 key derivation.** `kdf::derive_session_keys` turns a
  32-byte ML-KEM shared secret into a directional `SessionKeys { tx, rx }`
  pair via HKDF-Extract and two domain-separated HKDF-Expand calls.
  Implements FIPS 198 HMAC + FIPS 180-4 SHA-256. Keys zeroize on drop.
- **Rényi-2 entropy estimator.** `entropy::renyi2_bits` returns
  `H_2 = -log_2(sum p_i^2)` in bits for a window of quantized CSI
  magnitudes. Power-of-two bin counts guarantee unbiased mapping.
- **Session facade.** `session::QMeshSession` ties the above together:
  keypair generation, encapsulate / decapsulate, derived session keys,
  and CSI entropy ingestion.

## Usage

```rust
use qmesh_core::session::QMeshSession;

let alice = QMeshSession::new();
let bob = QMeshSession::new();

// Bob encapsulates to Alice's public key and keeps his session keys.
let (ct, bob_keys) = bob.encapsulate_to(alice.public_key()).unwrap();

// Alice decapsulates the ciphertext and derives matching session keys.
let alice_keys = alice.accept(&ct).unwrap();

assert!(alice_keys.ct_eq(&bob_keys));
```

## Testing

```bash
cargo test -p qmesh-core
cargo clippy -p qmesh-core --all-targets -- -D warnings
```

## Hardware

This crate is hardware-free by design. Real CSI capture (ESP32,
Intel 5300, Atheros QCA) will land in a separate `qmesh-hw` crate.

## Status

Pillar 9: Q-Mesh software skeleton complete. Hardware integration, key
rotation policy, and on-chain attestation are tracked in
`docs/guides/implementation_plan.md`.
