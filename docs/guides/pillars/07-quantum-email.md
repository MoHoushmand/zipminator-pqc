# Pillar 7 (Quantum-Secure Email)

Zipminator's quantum-secure email pillar is a full Postfix + Dovecot mail
stack configured for post-quantum TLS, combined with end-to-end PQC
envelope encryption at the application layer. It targets NIST FIPS 203
(ML-KEM-768) for key encapsulation and AES-256-GCM for payload secrecy.

## Cryptographic posture

- Transport: X25519MLKEM768 hybrid key exchange (IETF draft, OpenSSL 3.5)
  pinned as the first curve in both Postfix and Dovecot. X25519,
  prime256v1, and secp384r1 remain as negotiable fallbacks.
- Application envelope: ML-KEM-768 encapsulation of a fresh 256-bit
  content-encryption key (CEK); the CEK wraps the message body with
  AES-256-GCM. The envelope carries `X-PQC-Algorithm: ML-KEM-768` and a
  base64-encoded 1088-byte `X-PQC-Ciphertext-B64` header.
- Implements NIST FIPS 203 (ML-KEM-768). The claim is algorithmic
  conformance with FIPS 203; CMVP module-level validation is out of
  scope for this pillar and is not asserted anywhere in the codebase.

## Operational components

- `email/mailserver/config/postfix/main.cf`, Postfix 3.10 with
  `tls_eecdh_auto_curves = X25519MLKEM768, ...` and TLSv1.2+ minimum.
- `email/mailserver/config/dovecot/10-ssl.conf`, Dovecot 2.3.21 with
  `ssl_curve_list = X25519MLKEM768:...` and `ssl = required`.
- `docker/mail/docker-compose.yml`, container wiring with exposed SMTP
  (25/465/587) and IMAP (993/995) ports, a healthcheck against 587/993,
  and named volumes for mail data and logs.
- `src/zipminator/mail/smtp.py`, canonical `encode_pqc_envelope`
  (PyO3-adjacent) that produces the wire envelope dict.
- `api/src/mail/envelope.py`, owned wrapper re-exporting the canonical
  encoder plus the `FIPS_STANDARD = "NIST FIPS 203"` marker.
- `email/transport/pqc_bridge.py`, `encrypt_email` / `decrypt_email`
  backed by the Rust `zipminator_core` PyO3 module (ML-KEM-768) with an
  AES-GCM-only pure-Python fallback for CI and for hosts without the
  Rust toolchain. The fallback is test-only; production deployments
  must have the Rust binding present.

## Integration tests

- `tests/mail/test_pqc_mail_config.py`, verifies Postfix and Dovecot
  pin X25519MLKEM768 as the first curve, Dovecot requires TLS, TLSv1.2
  is the floor, and `docker-compose.yml` declares the mailserver
  service with ports 587 and 993 exposed.
- `tests/mail/test_envelope_api.py`, pins the owned wrapper's import
  path, metadata constants, signature parity with the canonical encoder,
  envelope shape, and the empty-ciphertext rejection contract.
- `tests/mail/test_e2e_pqc_mail.py`, end-to-end mock-transport
  roundtrip (encrypt → wire bytes → decrypt), multi-message ordering,
  AES-GCM tamper detection via `InvalidTag`, and `docker compose config`
  validation (skipped when the docker CLI is unavailable).
- `tests/mail/test_pillar_surfaces.py`, asserts this doc and the
  `(dashboard)/mail` web stub exist and follow owned-surface
  conventions.

Run under the `zip-pqc` micromamba environment:

```
micromamba activate zip-pqc
pytest tests/mail/ -v
```

## Exit criteria

1. Postfix + Dovecot container in `docker/mail/` boots with ML-KEM-768
   transport TLS. Compose file validates via `docker compose config`.
2. Integration suite in `tests/mail/` demonstrates an E2E PQC envelope
   exchange across a mock transport, including AES-GCM authentication
   and multi-message ordering.
3. `pytest tests/mail/` is green under the `zip-pqc` micromamba env.

## DORA alignment

- Art. 6.1, encryption policy for data in transit and at rest:
  transport TLS pins X25519MLKEM768; at-rest storage uses the AES-GCM
  envelope with ML-KEM-768-wrapped CEK.
- Art. 6.4, periodic cryptographic review: the curve list and
  algorithm identifiers live in version-controlled config files so
  audits can diff updates over time.
- Art. 7, key lifecycle: per-recipient ML-KEM-768 keypairs are minted
  by `zipminator_core`, with private keys stored under the platform's
  hardware-backed keystore. CEKs are ephemeral and per-message.
