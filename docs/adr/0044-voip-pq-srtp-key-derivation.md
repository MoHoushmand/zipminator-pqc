# ADR 0044: PQ-VoIP SRTP Key Derivation and TURN Relay

Status: Accepted
Date: 2026-04-26
Pillar: Quantum VoIP (Pillar 3)

## Context

Classical WebRTC media security relies on DTLS-SRTP: peers exchange SRTP master keys inside a DTLS 1.2 handshake, then the negotiated keys protect RTP packets via SRTP. The DTLS handshake is X25519/ECDHE today, which is store-now-decrypt-later vulnerable when a CRQC arrives.

Zipminator's threat model treats CRQC as imminent for any media that may be archived (voicemail, recordings, lawful-intercept logs). All call media must be protected by post-quantum primitives end-to-end.

## Decision

SRTP master keys are derived from ML-KEM-768 shared secrets at the application layer, not from DTLS. The relay path (coturn) sees only opaque SRTP ciphertext.

### Key derivation chain

```
ML-KEM-768 shared secret  (32 bytes, FIPS 203)
        |
        |   HKDF-SHA-256
        |   info = "zipminator-srtp-master-key", L = 16
        v
   SRTP master key  (16 bytes, AES-128 base for AES-256 expansion)
        |
        |   HKDF-SHA-256
        |   info = "zipminator-srtp-master-salt", L = 14
        v
   SRTP master salt  (14 bytes, RFC 3711 § 4.1.2 salt size)
```

Voicemail leg derives an independent key from the same shared secret:

```
ML-KEM-768 shared secret  (32 bytes)
        |
        |   HKDF-SHA-256
        |   info = "zipminator-voicemail-key", L = 32
        v
   Voicemail key  (32 bytes, AES-256-GCM)
```

Domain-separated info strings ensure the voicemail key cannot be derived from the SRTP master key alone, and vice versa, even though both descend from the same kyber768 shared secret.

### Implementation reference

- `crates/zipminator-core/src/srtp.rs` — Rust source of truth: `derive_srtp_keys`, `derive_voicemail_key`
- `mobile/src/services/PqSrtpService.ts` — TypeScript mirror for mobile clients
- `mobile/src/services/VoipService.ts` — call-state machine; emits `liveSharedSecret` to PqSrtpService at the `connecting → connected` transition

KAT vectors are pinned in `srtp.rs` tests (`kat_master_key_matches_reference`, `kat_voicemail_key_matches_reference`) so any drift in the derivation breaks CI.

### Relay path (coturn)

The TURN server in `infra/coturn/turnserver.conf` provides UDP/TCP relay for NAT'd peers via RFC 5766. Configuration highlights:

- `listening-port=3478` (TURN/STUN), `tls-listening-port=5349` (TURNS)
- `lt-cred-mech` long-term credentials with shared secret rotation
- `realm=turn.zipminator.zip` — DNS only, no production deploy yet
- `min-port=49152 max-port=65535` — IANA dynamic range
- No data inspection: coturn relays opaque SRTP frames; the PQ-derived keys never traverse the relay

Docker compose adds the service in `docker-compose.yml`. Production deployment requires a public IP, TLS cert via certbot, and DTLS disabled (we don't use it).

## Consequences

### Positive
- ML-KEM-768 (FIPS 203) replaces X25519 in the call-key path; HNDL risk removed for media at rest and in transit
- Voicemail and live SRTP use independent keys with the same root secret, simplifying key management
- Relay (coturn) is fully ignorant of plaintext media or keys

### Negative
- Two parallel handshakes during call setup: one for signaling (PQ-double-ratchet via Track C) and one for SRTP master derivation. Adds ~1 RTT.
- DTLS-SRTP browser fallback is disabled, so non-Zipminator endpoints cannot interop. This is intentional: Zipminator-to-Zipminator only.
- coturn does not natively understand PQ-SRTP. Operators see opaque SRTP frames; existing NAT-traversal logic still works because TURN is media-agnostic.

### Neutral
- No change to RTP packetization, jitter buffer, or congestion control. SRTP framing is identical to RFC 3711.
- AES-256-GCM for both SRTP frames (via SRTCP-AES-256-GCM-SRTP) and voicemail blobs. Single AEAD across the pillar simplifies audit.

## Test coverage

- 33 baseline VoipService tests + 2 new lifecycle tests covering `idle → outgoing → ringing → connecting → connected → media-flow → hangup → encrypted_voicemail`
- HKDF KAT vectors pinned in Rust source; TS mirror tested via `__tests__/PqSrtpService.test.ts`
- Voicemail key roundtrip: derive on sender, derive on recipient, encrypt with sender key, decrypt with recipient key, plaintext bytes match

## References

- FIPS 203 (ML-KEM): https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.203.pdf
- RFC 3711 (SRTP)
- RFC 5766 (TURN)
- RFC 5869 (HKDF)
- ADR 0042 (System WebView limitation, ZipBrowser pillar)
- ADR 0043 (Q-Mesh attestation wire format)
