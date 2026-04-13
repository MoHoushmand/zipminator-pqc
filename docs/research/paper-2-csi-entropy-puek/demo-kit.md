# Zipminator Demo Kit: 9-Source Heterogeneous Entropy Fusion

**Target:** Q-Mesh L10 Military Grade, τ=0.98 decorrelation threshold
**Papers backed:** Paper 2 (CSI-Entropy-PUEK), Paper 3 (CHE-ARE-Provenance)
**Lead time:** 2-3 weeks (driven by ID Quantique Quantis USB shipment)

## 9 entropy sources for L10

| # | Source | Physics | Access | Oslo supplier | Cost (NOK) |
|---|--------|---------|--------|---------------|-----------:|
| 1 | IBM Quantum (ibm_kingston, 156 qubits) | Superconducting qubit measurement | Cloud, IBM Quantum account | Remote (free tier) | 0 |
| 2 | Rigetti Aspen-M via QBraid | Superconducting, second vendor | Cloud, QBraid account | Remote | ~500/mo |
| 3 | IonQ via AWS Braket | Trapped-ion (distinct physics) | Cloud, AWS account | Remote | ~300/run |
| 4 | ID Quantique Quantis USB-4M | Photon beam-splitter (optical) | Local USB | Elfa Distrelec Norge / Digikey | ~15,000 |
| 5 | ESP32-S3 WiFi CSI (phase LSB + Von Neumann) | RF multipath, ambient | Local | Kjell & Company / Elfa | ~250 |
| 6 | Raspberry Pi 4, BCM43455c0, Nexmon CSI | RF multipath, distinct chipset | Local | Komplett.no / Kjell | ~1,200 |
| 7 | Intel RDSEED (host CPU) | Thermal noise, on-die | Local x86 laptop | existing hardware | 0 |
| 8 | Infineon OPTIGA TPM 2.0 SLB 9670 | Ring oscillator, secure element | Local header | Elfa Distrelec / Mouser | ~350 |
| 9 | Linux getrandom() | Kernel entropy pool | Local OS | built in | 0 |

**Independence argument:** sources 1, 2, 3 are three distinct quantum vendors running two distinct physical platforms (superconducting, trapped-ion). Source 4 adds a photonic quantum source under local operator custody. Sources 5 and 6 use two Broadcom chipset lines with independent firmware patches. Sources 7 and 8 are separate silicon dies. Source 9 is the always-on kernel floor. No single-physics failure drops the system below L8.

## Ambient RF source (drives sources 5 and 6)

One Nexmon-compatible router as the 5 GHz ambient emitter:

- ASUS RT-AC86U, Broadcom BCM4366c0, Nexmon CSI patched. Buy used on Finn.no (~1,500 NOK) or from Bitraf inventory.

## Budget

| Item | NOK |
|------|----:|
| ID Quantique Quantis USB-4M | 15,000 |
| Raspberry Pi 4 8GB kit (case, PSU, 64GB SD) | 1,500 |
| ASUS RT-AC86U (used) | 1,500 |
| ESP32-S3 DevKitC + breadboard + cables | 400 |
| Infineon TPM 2.0 module + LPC cable | 450 |
| USB-C hub, spare SD, antennas, cables | 500 |
| **Full L10 kit** | **~19,350** |

Fallback without Quantis USB: drop to 3 cloud quantum sources, demo reads as L9, total **~4,350 NOK**.

## Test plan

**Phase 1, per-source NIST SP 800-90B validation**
1. Collect 1 MB from each source
2. Run `ea_non_iid` from NIST SP 800-90B toolkit
3. Record min-entropy bound (bits/byte, MCV estimator, 99% confidence)
4. Expected floors (from Paper 2 + public benchmarks): IBM ~6.35, Quantis ~7.9, RDSEED ~7.8, TPM ~7.5, os.urandom ~6.36, IonQ ~6.3, Rigetti ~6.2, ESP32 CSI ~5.50, Pi CSI ~5.45

**Phase 2, independence**
1. Pairwise mutual information test across all 9 sources
2. Flag pairs where MI > 2^-32 bits per byte
3. Fail the demo if any pair flags

**Phase 3, fusion and provenance (Paper 3 CHE protocol)**
1. XOR-fuse each byte position across the 9 streams
2. Build Merkle tree, leaf = per-source raw contribution hash
3. Sign Merkle root with ML-DSA (FIPS 204), key derived from the fused stream
4. Emit provenance certificate: per-source min-entropy claim + leaf hashes + ML-DSA signature

**Phase 4, graceful degradation**
1. Kill source N (e.g. unplug Quantis USB mid-run)
2. System must detect within 1 second, reclassify output to L(10 minus k) where k = lost sources, emit signed demotion certificate
3. Repeat for each of the 9 sources

**Phase 5, live demo**
1. Generate ML-KEM-768 keypair from fused stream
2. Encrypt a 1 MB file
3. Pull one source, regenerate, re-encrypt
4. Show the two provenance certificates side by side

## Pre-demo checklist (2 weeks out)

- [ ] Quantis USB-4M ordered (10-14 day lead, Elfa DK warehouse)
- [ ] IBM Quantum account with ibm_kingston access confirmed
- [ ] QBraid credits topped up (Rigetti)
- [ ] AWS Braket IonQ queue tested (one shot, latency < 2 min)
- [ ] ESP32-S3 flashed with CSI extraction firmware
- [ ] Pi 4 running Nexmon CSI tool against ASUS RT-AC86U
- [ ] TPM 2.0 attached, `tpm2_getrandom 32` working
- [ ] RDSEED confirmed: `grep rdseed /proc/cpuinfo`
- [ ] NIST SP 800-90B toolkit compiled (ea_non_iid binary)
- [ ] CHE reference implementation running (from Paper 3 repo)
- [ ] Merkle + ML-DSA pipeline tested end-to-end
- [ ] Dry-run of all 5 test phases on a spare machine

## Bitraf walk-in script

"Nexmon CSI, anyone running it? Looking for a BCM4366c0 router that is actually shipping firmware that works this month." Show them the BOM table. Ask if the RT-AC86U on their shelf is lendable. Save 1,500 NOK and get a known-working unit instead of a Finn.no gamble.

## File locations after demo

- `docs/research/paper-2-csi-entropy-puek/demo-runs/YYYY-MM-DD/` raw captures per source
- `docs/research/paper-2-csi-entropy-puek/demo-runs/YYYY-MM-DD/nist-reports/` ea_non_iid output
- `docs/research/paper-2-csi-entropy-puek/demo-runs/YYYY-MM-DD/provenance-certificates/` signed Merkle roots
