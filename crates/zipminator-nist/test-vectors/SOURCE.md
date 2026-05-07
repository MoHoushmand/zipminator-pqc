# NIST ACVP ML-KEM Test Vector Provenance

**Fetched:** 2026-05-07
**Algorithm:** ML-KEM (FIPS 203 final)
**Parameter set focus:** ML-KEM-768 (security category 3)

## Source

Fetched directly from the NIST CAVP ACVP-Server reference repository:

- https://raw.githubusercontent.com/usnistgov/ACVP-Server/master/gen-val/json-files/ML-KEM-keyGen-FIPS203/prompt.json
- https://raw.githubusercontent.com/usnistgov/ACVP-Server/master/gen-val/json-files/ML-KEM-keyGen-FIPS203/expectedResults.json
- https://raw.githubusercontent.com/usnistgov/ACVP-Server/master/gen-val/json-files/ML-KEM-encapDecap-FIPS203/prompt.json
- https://raw.githubusercontent.com/usnistgov/ACVP-Server/master/gen-val/json-files/ML-KEM-encapDecap-FIPS203/expectedResults.json

License: NIST is a US Government agency; the JSON test vectors are public-domain per 17 USC 105.

## Integrity verification

```bash
cd crates/zipminator-nist/test-vectors
shasum -a 256 -c SHA256SUMS
```

Every line must end `OK`. Any FAIL means the file was modified post-download; re-fetch from the URL above and re-hash.

## Files

| File | Bytes | Contents |
|---|---|---|
| `ML-KEM-keyGen-prompt.json` | 16,066 | KeyGen test inputs: `(d, z)` 32-byte seeds for ML-KEM-{512,768,1024} |
| `ML-KEM-keyGen-expected.json` | 544,032 | KeyGen expected outputs: `(ek, dk)` encapsulation/decapsulation keys |
| `ML-KEM-encapDecap-prompt.json` | 636,669 | Encap/Decap test inputs: ek+m (encap), dk+c (decap), and key-check tests |
| `ML-KEM-encapDecap-expected.json` | 190,940 | Encap/Decap expected: c+k (encap), k (decap) |

## Test counts (ML-KEM-768 only)

- KeyGen tests: 25
- EncapDecap tests across 4 functions: 55
  - encapsulation (tgId=2)
  - decapsulation (tgId=5)
  - decapsulationKeyCheck (tgId=8)
  - encapsulationKeyCheck (tgId=11)

The spike validates only the first two functions (encapsulation, decapsulation) which exercise the actual KEM operations; key-check tests are negative-validation tests for malformed keys.

## Expected groups

KeyGen prompt has three `parameterSet` testGroups (ML-KEM-512, ML-KEM-768, ML-KEM-1024). The expected file's testGroups carry only `tgId` (no parameterSet); join by tgId.

EncapDecap prompt has 12 testGroups across {512,768,1024} × {encapsulation, decapsulation, encapsulationKeyCheck, decapsulationKeyCheck}.

Per-test field naming used in this test suite:
- KeyGen prompt test: `tcId`, `d` (32-byte hex), `z` (32-byte hex)
- KeyGen expected test: `tcId`, `ek` (encapsulation key hex), `dk` (decapsulation key hex)
- Encap prompt test: `tcId`, `ek`, `m` (32-byte entropy hex)
- Encap expected test: `tcId`, `c` (ciphertext hex), `k` (shared secret hex)
- Decap prompt test: `tcId`, `dk`, `c`
- Decap expected test: `tcId`, `k`
