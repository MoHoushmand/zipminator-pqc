# Human-action runbook — Track HW: Q-Mesh / L10 hardware demo

_You execute the physical steps; the software side is ready and verified. Local script details below are confirmed against `scripts/provision_ruview_mesh.py` + `crates/zipminator-mesh/src/provisioner.rs`. Steps that touch the external `ruvnet/RuView` repo are marked **[verify in RuView]** — confirm exact paths there + ADR-069 before flashing._

## What you have → what it is
| Kit (photos) | Role in the demo |
|---|---|
| **ESP32-S3-DevKitC-1** ×N | Q-Mesh sensing nodes (WiFi CSI). Target 4–6 nodes for a mesh. |
| **Cognitum Seed** (ruvnet Pi Zero 2 W edge appliance, RVF witness-chain store) | Aggregator-class node: receives CSI over QUIC TLS 1.3, verifies presence proofs, keeps a tamper-evident audit log. |
| **20-port USB charging station** | Powers the node fleet (each ESP32-S3 + the Seed). |

## Prerequisites (one-time, on this Mac)
```bash
micromamba activate zip-pqc          # entropy script runs in zip-pqc
# ESP-IDF toolchain for ESP32-S3 (Espressif):
#   https://docs.espressif.com/projects/esp-idf/en/latest/esp32s3/get-started/
#   (install ESP-IDF v5.x, then `. $HOME/esp/esp-idf/export.sh`)
```

## Step 1 — Flash the CSI firmware to each ESP32-S3  **[verify in RuView]**
The CSI-collector firmware lives in the external `ruvnet/RuView` repo (reported: `firmware/esp32-csi-node/`, with `csi_collector.c` doing the SipHash frame MAC). Confirm the path + build instructions in that repo and **ADR-069 (cognitum-seed CSI pipeline)** first.
```bash
# in the RuView firmware dir, per node (USB cable to a hub port):
idf.py set-target esp32s3
idf.py build
idf.py -p /dev/cu.usbserial-XXXX flash monitor   # XXXX = the node's serial port
```

## Step 2 — Generate a QRNG-derived mesh key per node  (LOCAL, verified)
Uses the 46 MB quantum entropy pool → HKDF-SHA256 → 16B PSK + 16B SipHash key → 73-byte NVS blob (`RVMK` magic, mesh_id LE, SHA-256 checksum), matching `MeshProvisioner::provision_nvs_binary()`.
```bash
cd /Users/mos/dev/qdaria/zipminator
# one mesh, N nodes share the same mesh-id (same PSK); use distinct --mesh-id per separate mesh
python scripts/provision_ruview_mesh.py --mesh-id 1 --output mesh_key_node1.bin
python scripts/provision_ruview_mesh.py --mesh-id 1 --output mesh_key_node2.bin
# ... (same mesh-id = same key; the script reads 64B from quantum_entropy/quantum_entropy_pool.bin)
python scripts/provision_ruview_mesh.py --mesh-id 1 --hex      # inspect derived key material (no file)
```
Salt = `zipminator-mesh-<mesh_id>`; info = `mesh-psk` / `siphash-frame`. The 16B PSK authenticates the mesh; the SipHash key MACs frames.

## Step 3 — Flash the NVS key blob to each node  **[verify in RuView]**
Write the 73-byte blob into the node's NVS partition (RuView firmware reads it as the mesh key). Typical ESP-IDF path:
```bash
# offset/partition per RuView's partitions.csv — VERIFY there:
esptool.py -p /dev/cu.usbserial-XXXX write_flash <nvs_offset> mesh_key_node1.bin
```

## Step 4 — Stand up the Cognitum Seed as aggregator  **[verify in RuView ADR-069]**
- Boot the Cognitum Seed (Pi Zero 2 W); it runs the RVF append-only vector store + SHA-256 witness chain.
- Configure it as the QUIC TLS 1.3 uplink target for the ESP32-S3 nodes; it verifies HMAC-SHA256 beacon attestation + presence proofs and logs every security event to the witness chain.
- Reference: `ruvnet/RuView/docs/adr/ADR-069-cognitum-seed-csi-pipeline.md`.

## Step 5 — Power, run, verify
1. Plug all nodes + the Seed into the 20-port hub.
2. Bring up the mesh; confirm nodes authenticate (shared mesh-id PSK) and frames pass the SipHash MAC.
3. Observe CSI collection → presence proofs (CSI fingerprint + vital signs + timestamp).
4. Verify on the Seed: beacon HMAC-SHA256 attestation valid, nonce replay-window enforced, audit entries appended to the RVF witness chain.

## Verification checklist
- [ ] `python scripts/provision_ruview_mesh.py --mesh-id 1 --hex` prints PSK + SipHash key (entropy pool readable)
- [ ] NVS blob is 73 bytes, begins `RVMK`
- [ ] Each ESP32-S3 boots the CSI firmware and joins the mesh
- [ ] Cognitum Seed receives CSI over QUIC and appends to the witness chain
- [ ] Presence proof verifies (HMAC-SHA256 beacon + SipHash frame MAC + nonce window)

## Notes
- Local software is done: `zipminator-mesh` (106 tests), `qmesh-core` (25 tests), `provision_ruview_mesh.py`, entropy pool 46 MB. The gaps are all physical (flash + wire + aggregator), hence this runbook.
- This is Pillar 9 (Q-Mesh) — code-complete; the hardware demo was deferred from the beta and is independent of the merge/release tracks.
- Do NOT commit generated `mesh_key_*.bin` files (they contain real key material) — they are key blobs; keep them out of git.
