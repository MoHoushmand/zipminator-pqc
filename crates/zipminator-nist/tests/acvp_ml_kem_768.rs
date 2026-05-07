//! NIST ACVP ML-KEM-768 test vector validation.
//!
//! Implements NIST FIPS 203 (Module-Lattice-Based KEM Standard) verification:
//! drives the `ml-kem 0.3` crate against official ACVP-Server vectors fetched
//! 2026-05-07 from `usnistgov/ACVP-Server`. Vectors live in
//! `crates/zipminator-nist/test-vectors/` and are sha256-pinned in `SHA256SUMS`.

#![allow(deprecated)]

use ml_kem::array::Array;
use ml_kem::{
    DecapsulationKey, Decapsulate, EncapsulationKey, ExpandedKeyEncoding, KeyExport, MlKem768,
    Seed, B32,
};
use serde_json::Value;
use std::fs;
use std::path::PathBuf;

fn vectors_dir() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("test-vectors")
}

fn load_json(name: &str) -> Value {
    let path = vectors_dir().join(name);
    let s = fs::read_to_string(&path)
        .unwrap_or_else(|e| panic!("missing {}: {}", path.display(), e));
    serde_json::from_str(&s)
        .unwrap_or_else(|e| panic!("invalid json {}: {}", path.display(), e))
}

fn b32(hex_str: &str) -> B32 {
    let v = hex::decode(hex_str).expect("hex decode B32");
    assert_eq!(v.len(), 32, "expected 32 bytes, got {}", v.len());
    let mut arr = [0u8; 32];
    arr.copy_from_slice(&v);
    Array(arr)
}

#[test]
fn acvp_ml_kem_768_keygen() {
    let prompt = load_json("ML-KEM-keyGen-prompt.json");
    let expected = load_json("ML-KEM-keyGen-expected.json");

    let prompt_groups = prompt["testGroups"].as_array().expect("prompt testGroups");
    let expected_groups = expected["testGroups"].as_array().expect("expected testGroups");

    let prompt_group = prompt_groups
        .iter()
        .find(|g| g["parameterSet"].as_str() == Some("ML-KEM-768"))
        .expect("ML-KEM-768 group in prompt");
    let tg_id = prompt_group["tgId"].as_u64().expect("tgId");
    let expected_group = expected_groups
        .iter()
        .find(|g| g["tgId"].as_u64() == Some(tg_id))
        .expect("matching tgId in expected");

    let prompt_tests = prompt_group["tests"].as_array().expect("tests");
    let expected_tests = expected_group["tests"].as_array().expect("expected tests");
    assert_eq!(prompt_tests.len(), expected_tests.len(), "test count mismatch");
    assert!(
        prompt_tests.len() >= 25,
        "expected ≥25 ML-KEM-768 keygen tests, got {}",
        prompt_tests.len()
    );

    let mut pass = 0usize;
    let mut fail = 0usize;
    for (p, e) in prompt_tests.iter().zip(expected_tests.iter()) {
        let tc_id = p["tcId"].as_u64().expect("tcId");
        let d = b32(p["d"].as_str().expect("d hex"));
        let z = b32(p["z"].as_str().expect("z hex"));
        let exp_ek = hex::decode(e["ek"].as_str().expect("ek hex")).expect("ek decode");
        let exp_dk = hex::decode(e["dk"].as_str().expect("dk hex")).expect("dk decode");

        // FIPS 203 KeyGen takes (d, z) ∈ {0,1}^32 × {0,1}^32. ml-kem 0.3 expects them
        // concatenated into a 64-byte Seed.
        let mut seed_bytes = [0u8; 64];
        seed_bytes[..32].copy_from_slice(d.as_ref());
        seed_bytes[32..].copy_from_slice(z.as_ref());
        let seed: Seed = Array(seed_bytes);
        let dk = DecapsulationKey::<MlKem768>::from_seed(seed);
        let ek = dk.encapsulation_key();

        let actual_ek = KeyExport::to_bytes(ek);
        let actual_dk = dk.to_expanded_bytes();

        let actual_ek_slice: &[u8] = &actual_ek[..];
        let actual_dk_slice: &[u8] = &actual_dk[..];

        let ek_match = actual_ek_slice == exp_ek.as_slice();
        let dk_match = actual_dk_slice == exp_dk.as_slice();
        if ek_match && dk_match {
            pass += 1;
        } else {
            fail += 1;
            eprintln!(
                "FAIL keygen tcId={} ek_match={} dk_match={} ek_len={}/{} dk_len={}/{}",
                tc_id,
                ek_match,
                dk_match,
                actual_ek_slice.len(),
                exp_ek.len(),
                actual_dk_slice.len(),
                exp_dk.len()
            );
        }
    }

    assert_eq!(
        fail,
        0,
        "{}/{} ACVP ML-KEM-768 keygen vectors failed",
        fail,
        pass + fail
    );
    eprintln!("ACVP ML-KEM-768 keygen: {} vectors passed", pass);
}

#[test]
fn acvp_ml_kem_768_encap_decap() {
    let prompt = load_json("ML-KEM-encapDecap-prompt.json");
    let expected = load_json("ML-KEM-encapDecap-expected.json");

    let prompt_groups = prompt["testGroups"].as_array().expect("prompt testGroups");
    let expected_groups = expected["testGroups"].as_array().expect("expected testGroups");

    let mut total_pass = 0usize;
    let mut total_fail = 0usize;

    // Encapsulation
    {
        let pg = prompt_groups
            .iter()
            .find(|g| {
                g["parameterSet"].as_str() == Some("ML-KEM-768")
                    && g["function"].as_str() == Some("encapsulation")
            })
            .expect("ML-KEM-768 encapsulation group");
        let tg_id = pg["tgId"].as_u64().unwrap();
        let eg = expected_groups
            .iter()
            .find(|g| g["tgId"].as_u64() == Some(tg_id))
            .expect("matching expected encap group");

        let pt = pg["tests"].as_array().unwrap();
        let et = eg["tests"].as_array().unwrap();
        for (p, e) in pt.iter().zip(et.iter()) {
            let tc_id = p["tcId"].as_u64().unwrap();
            let ek_bytes = hex::decode(p["ek"].as_str().unwrap()).unwrap();
            let m = b32(p["m"].as_str().unwrap());
            let exp_c = hex::decode(e["c"].as_str().unwrap()).unwrap();
            let exp_k = hex::decode(e["k"].as_str().unwrap()).unwrap();

            let ek_arr = Array::try_from(ek_bytes.as_slice()).expect("ek size");
            let ek = EncapsulationKey::<MlKem768>::new(&ek_arr).expect("ek decode");

            let (ct, k) = ek.encapsulate_deterministic(&m);

            let ct_slice: &[u8] = &ct[..];
            let k_slice: &[u8] = &k[..];
            let ct_match = ct_slice == exp_c.as_slice();
            let k_match = k_slice == exp_k.as_slice();
            if ct_match && k_match {
                total_pass += 1;
            } else {
                total_fail += 1;
                eprintln!(
                    "FAIL encap tcId={} ct_match={} k_match={}",
                    tc_id, ct_match, k_match
                );
            }
        }
    }

    // Decapsulation
    {
        let pg = prompt_groups
            .iter()
            .find(|g| {
                g["parameterSet"].as_str() == Some("ML-KEM-768")
                    && g["function"].as_str() == Some("decapsulation")
            })
            .expect("ML-KEM-768 decapsulation group");
        let tg_id = pg["tgId"].as_u64().unwrap();
        let eg = expected_groups
            .iter()
            .find(|g| g["tgId"].as_u64() == Some(tg_id))
            .expect("matching expected decap group");

        let pt = pg["tests"].as_array().unwrap();
        let et = eg["tests"].as_array().unwrap();
        for (p, e) in pt.iter().zip(et.iter()) {
            let tc_id = p["tcId"].as_u64().unwrap();
            let dk_bytes = hex::decode(p["dk"].as_str().unwrap()).unwrap();
            let c_bytes = hex::decode(p["c"].as_str().unwrap()).unwrap();
            let exp_k = hex::decode(e["k"].as_str().unwrap()).unwrap();

            let dk_arr = Array::try_from(dk_bytes.as_slice()).expect("dk size");
            let dk = DecapsulationKey::<MlKem768>::from_expanded_bytes(&dk_arr)
                .expect("dk decode");
            let ct_arr = Array::try_from(c_bytes.as_slice()).expect("ct size");

            let k = dk.decapsulate(&ct_arr);
            let k_slice: &[u8] = &k[..];
            let k_match = k_slice == exp_k.as_slice();
            if k_match {
                total_pass += 1;
            } else {
                total_fail += 1;
                eprintln!("FAIL decap tcId={}", tc_id);
            }
        }
    }

    assert_eq!(
        total_fail, 0,
        "{}/{} ACVP ML-KEM-768 encap/decap vectors failed",
        total_fail,
        total_pass + total_fail
    );
    assert!(
        total_pass > 0,
        "expected at least one encap/decap vector, got 0"
    );
    eprintln!("ACVP ML-KEM-768 encap+decap: {} vectors passed", total_pass);
}
