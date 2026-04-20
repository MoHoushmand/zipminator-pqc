# PQ-WireGuard Config Templates

Linux bring-up scaffolding for the Q-VPN pillar. These templates are the
reference deployment layout; the userspace handshake contract lives in
`crates/pq-wireguard`.

## Handshake Contract (reference)

Reproduced here so a sysadmin reading this file has the protocol-level
details without chasing Rust source:

- KEM: NIST FIPS 203 ML-KEM-768 (PQClean reference impl via `pqcrypto-kyber` `=0.8.1`).
- Sizes: public key 1184 bytes, secret key 2400 bytes, ciphertext 1088 bytes, shared secret 32 bytes.
- Wire format v1 (little-endian, no padding beyond explicit reserved):
  - Initiation (msg_type=1): 12-byte header + 1088-byte KEM ciphertext = 1100 bytes.
  - Response  (msg_type=2): 12-byte header = 12 bytes.
  - Response MAC lives in userspace state only (not on the wire); both sides derive
    it from the HKDF chain and verify in constant time via `subtle::ConstantTimeEq`.
- KDF: HKDF-SHA-256 with salt `"PQ-WireGuard v1 FIPS203 ML-KEM-768"` and four domain-separated info labels:
  - `pq-wg:chaining-key:v1`
  - `pq-wg:transport:initiator->responder:v1`
  - `pq-wg:transport:responder->initiator:v1`
  - `pq-wg:response-mac:v1`
- All 32-byte secrets are zeroized on drop (initiator and responder).

The authoritative wire-format fixture is `tests/vpn/fixtures/initiation.hex`
(1100 bytes hex-encoded, deterministic ciphertext filler = `i % 251`).

## Files in This Directory

- `server.conf.tmpl`, wg-quick-compatible responder config with PQ extensions (`PqPrivateKeyFile`, `PqPublicKey`).
- `client.conf.tmpl`, wg-quick-compatible initiator config with the same PQ extensions.
- This README.

Templates use `{{VARIABLE}}` placeholders that any standard provisioner can render: envsubst after rewriting braces, Ansible Jinja2, Terraform `templatefile()`, or a short shell sed script.

## Operator Bring-Up (Ubuntu 24.04 example)

1. Generate a responder keypair and persist the secret key with strict perms:

   ```bash
   cargo run -p pq-wireguard --example keygen -- --role responder \
       --out-priv /etc/pq-wireguard/server.priv \
       --out-pub  /etc/pq-wireguard/server.pub
   chmod 0600 /etc/pq-wireguard/server.priv
   chmod 0644 /etc/pq-wireguard/server.pub
   ```

   (The `keygen` example is not yet implemented; iter 6 adds it. For now the
   responder keypair is generated on first start of the userspace binary and
   logged.)

2. Render the server template into `/etc/wireguard/pqwg0.conf`:

   ```bash
   export SERVER_PQ_PUBKEY_B64="$(base64 -w0 < /etc/pq-wireguard/server.pub)"
   export SERVER_PQ_PRIVKEY_PATH=/etc/pq-wireguard/server.priv
   export SERVER_LISTEN_PORT=51820
   export SERVER_INTERFACE_ADDR=10.42.0.1/24
   export CLIENT_PQ_PUBKEY_B64="<base64 of first client's ML-KEM-768 pub>"
   export CLIENT_ALLOWED_IPS=10.42.0.2/32

   sed \
       -e "s#{{SERVER_PQ_PUBKEY_B64}}#${SERVER_PQ_PUBKEY_B64}#g" \
       -e "s#{{SERVER_PQ_PRIVKEY_PATH}}#${SERVER_PQ_PRIVKEY_PATH}#g" \
       -e "s#{{SERVER_LISTEN_PORT}}#${SERVER_LISTEN_PORT}#g" \
       -e "s#{{SERVER_INTERFACE_ADDR}}#${SERVER_INTERFACE_ADDR}#g" \
       -e "s#{{CLIENT_PQ_PUBKEY_B64}}#${CLIENT_PQ_PUBKEY_B64}#g" \
       -e "s#{{CLIENT_ALLOWED_IPS}}#${CLIENT_ALLOWED_IPS}#g" \
       infra/wireguard/server.conf.tmpl \
     > /etc/wireguard/pqwg0.conf
   chmod 0640 /etc/wireguard/pqwg0.conf
   ```

3. Bring up the interface with the PQ-WireGuard userspace binary (iter 6):

   ```bash
   pq-wg-quick up pqwg0
   ```

   Until that binary ships, operators run the `pq-wireguard` userspace with
   a config-file flag; the wg-quick compatibility layer is iter 6.

## What This Is NOT

- Not a drop-in replacement for stock WireGuard today. The `PqPrivateKeyFile`
  and `PqPublicKey` keys are PQ-WireGuard extensions and will be rejected by
  the upstream `wg` tool. The layout is intentionally kept close to stock
  wg-quick so operator muscle memory carries over.
- Not a hybrid (classical + PQC) config. Hybrid mode is a later iter; stock
  `PrivateKey`/`PublicKey` lines are deliberately absent from these templates
  to fail loud if an operator tries to mix worlds.
- Not a production key rotation story. Responder static keypairs live for the
  life of the interface in this iter; rotation lands in the DORA Art. 6.4
  "periodic cryptographic updates" iter.

## Verification

The committed fixture in `tests/vpn/fixtures/initiation.hex` is the
cross-language single source of truth. The Rust crate
(`cargo test -p pq-wireguard`) asserts the encoder output matches byte for
byte; the Flutter test in `app/test/vpn/` loads the same file and asserts
byte equality via channel round-trip. If either test fails, the wire format
drifted, regenerate the fixture and update this README's contract section.

## DORA Notes (for auditor spot-checks)

- Art. 6.1 (documented encryption policy): this README is the deployed
  reference for VPN traffic encryption at rest (config file) and in transit
  (ML-KEM-768 handshake).
- Art. 6.4 (periodic cryptographic updates): schema-level placeholder; track
  `pqcrypto-kyber` upstream. An advisory from NIST deprecating ML-KEM-768 is
  the trigger to re-render with ML-KEM-1024 (a compile-time constant change
  in `crates/pq-wireguard`; wire format version bumps to `v2`).
- Art. 7 (key lifecycle): responder secret-key file is mode 0600; backups
  should be encrypted at rest; destruction via secure delete (the separate
  Zipminator self-destruct pillar covers this at a file level).
