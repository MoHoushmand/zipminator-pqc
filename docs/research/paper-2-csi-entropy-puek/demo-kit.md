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
| 5 | **RuView mesh** (existing ESP32-S3 nodes, `crates/zipminator-mesh/src/csi_entropy.rs`) | RF multipath, ambient | Local, already deployed | n/a (in place) | 0 |
| 6 | Raspberry Pi 4, BCM43455c0, Nexmon CSI (second independent CSI chain) | RF multipath, distinct chipset from RuView | Local | Komplett.no / Kjell | ~1,200 |
| 7 | Intel RDSEED (host CPU) | Thermal noise, on-die | Local x86 laptop | existing hardware | 0 |
| 8 | Infineon OPTIGA TPM 2.0 SLB 9670 | Ring oscillator, secure element | Local header | Elfa Distrelec / Mouser | ~350 |
| 9 | Linux getrandom() | Kernel entropy pool | Local OS | built in | 0 |

**Independence argument:** sources 1, 2, 3 are three distinct quantum vendors running two distinct physical platforms (superconducting, trapped-ion). Source 4 adds a photonic quantum source under local operator custody. Sources 5 (RuView ESP32-S3) and 6 (Pi BCM43455c0) use two independent Broadcom/Espressif chipset lines with independent firmware patches, giving two CSI streams from the same physical room that cannot collude. Sources 7 and 8 are separate silicon dies. Source 9 is the always-on kernel floor. No single-physics failure drops the system below L8.

**RuView integration:** source 5 is read through `crates/zipminator-mesh/src/entropy_bridge.rs`. Provisioning uses `scripts/provision_ruview_mesh.py` which HKDFs node PSKs from the QRNG pool, so RuView nodes are already cryptographically tied to source 1. For the L10 demo the mesh feeds raw CSI into `csi_entropy.rs` and the fused byte stream reaches the CHE protocol via `entropy_bridge`.

## Ambient RF source (drives sources 5 and 6)

RuView mesh already provides 2.4 / 5 GHz ambient emission between nodes. For source 6 (independent Pi chain) you want a third RF emitter so the Pi measurement is not a trivial rotation of what RuView already sees:

- ASUS RT-AC86U, Broadcom BCM4366c0, Nexmon CSI patched. Buy used on Finn.no (~1,500 NOK) or borrow from Bitraf.

## Budget (new hardware only, assumes RuView mesh is already deployed)

| Item | NOK |
|------|----:|
| ID Quantique Quantis USB-4M | 15,000 |
| Raspberry Pi 4 8GB kit (case, PSU, 64GB SD) | 1,500 |
| ASUS RT-AC86U (used, third RF emitter) | 1,500 |
| Infineon TPM 2.0 module + LPC cable | 450 |
| USB-C hub, spare SD, antennas, cables | 500 |
| **Full L10 kit** | **~18,950** |

**Optional, only if expanding RuView coverage:** 2-3 spare ESP32-S3 DevKitC units at ~250 NOK each, provisioned via `scripts/provision_ruview_mesh.py --mesh-id <N>`. Not required for the L10 demo.

**L10 is non-negotiable for this demo.** The Quantis USB-4M is what gives you a locally-custodied photonic quantum source and the sovereignty story that cloud-only quantum (IBM, Rigetti, IonQ) cannot provide. Budget the full 18,950 NOK and the 10-14 day Quantis lead time into the schedule. No cheaper tier is accepted.

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
- [ ] RuView mesh online, `entropy_bridge` streaming into pool (verify with `cargo test -p zipminator-mesh csi_entropy`)
- [ ] Any new RuView nodes provisioned via `provision_ruview_mesh.py`
- [ ] Pi 4 running Nexmon CSI tool against ASUS RT-AC86U (independent of RuView)
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
