# coturn — Zipminator PQ-VoIP TURN/STUN relay

This directory contains the configuration for the coturn TURN/STUN server that
relays media for the Quantum VoIP pillar (Pillar 3). SRTP master keys are
derived from ML-KEM-768 shared secrets at the application layer; the relay
sees only opaque ciphertext.

## Files

- `turnserver.conf` — coturn server configuration. The `static-auth-secret`
  placeholder is replaced at deploy time via env var `TURN_AUTH_SECRET`.

## Operation

Start the relay with `docker compose up coturn` (see `docker-compose.yml` at
the repo root). Clients obtain time-limited credentials from
`zipminator-api`'s `/turn/credentials` endpoint, which signs them under the
same `TURN_AUTH_SECRET`.

## Why a TURN server is needed

NAT traversal: when both peers sit behind symmetric NATs (very common on
mobile networks and corporate firewalls), peer-to-peer UDP fails. coturn
acts as a stable, internet-reachable rendezvous point; the SRTP frames flow
peer → coturn → peer, and the relay cannot decrypt them because it does not
hold the ML-KEM-768 shared secret.

## Hardening notes

- `denied-peer-ip` blocks RFC-1918 ranges so the relay cannot be used as a
  pivot to reach internal services.
- `lt-cred-mech` + `use-auth-secret` requires every relay request to be
  authenticated with a short-lived HMAC, so an unprivileged third party
  cannot squat the relay.
- TLS-only mode (`no-tlsv1`, `no-tlsv1_1`) avoids legacy cipher downgrade.
- Production must run coturn behind a reverse proxy that terminates TLS with
  the certificate corresponding to `realm=turn.zipminator.zip`.
