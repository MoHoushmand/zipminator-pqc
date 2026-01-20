//! Number Theoretic Transform (NTT) implementation
//!
//! This is the performance-critical component (~30% of total execution time).
//! Optimizations:
//! - In-place Cooley-Tukey butterfly operations
//! - Montgomery reduction for modular arithmetic
//! - Constant-time operations using subtle crate
//! - SIMD optimization potential (AVX2 for x86_64)

use crate::constants::*;

/// Montgomery reduction: compute a * R^(-1) mod q where R = 2^16
/// CRITICAL: Must be constant-time
/// Reference: NIST FIPS 203 / PQ-Crystals Kyber
#[inline(always)]
fn montgomery_reduce(a: i32) -> i16 {
    // t = a * QINV mod 2^16 (signed truncation like C's (int16_t)a * QINV)
    let t = (a as i16).wrapping_mul(QINV as i16) as i32;
    // (a - t*q) >> 16
    ((a - t * KYBER_Q as i32) >> 16) as i16
}

/// Public wrapper for montgomery_reduce (for poly.rs access)
#[inline(always)]
pub fn montgomery_reduce_pub(a: i32) -> i16 {
    montgomery_reduce(a)
}

/// Barrett reduction: reduce a mod q
/// CRITICAL: Must be constant-time
#[inline(always)]
fn barrett_reduce(a: i16) -> i16 {
    let v = ((1u32 << 26) + (KYBER_Q as u32) / 2) / (KYBER_Q as u32);
    let t = ((v as i32 * a as i32) >> 26) as i16;
    let t = a.wrapping_sub(t.wrapping_mul(KYBER_Q));
    t
}

/// Conditional subtraction: subtract q if a >= q
/// CRITICAL: Must be constant-time
#[inline(always)]
fn csubq(a: i16) -> i16 {
    let a = a.wrapping_sub(KYBER_Q);
    let mask = a >> 15; // -1 if a was < 0, 0 otherwise
    a.wrapping_add(mask & KYBER_Q)
}

/// Forward NTT transformation
/// Input: polynomial coefficients in normal order
/// Output: polynomial coefficients in NTT representation (Montgomery domain)
/// Reference: NIST FIPS 203 / PQ-Crystals Kyber
pub fn ntt(poly: &mut [i16; KYBER_N]) {
    let mut k = 1;
    let mut len = 128;

    while len >= 2 {
        let mut start = 0;
        while start < KYBER_N {
            let zeta = ZETAS[k];
            k += 1;

            for j in start..start + len {
                let t = fqmul(zeta, poly[j + len]);
                poly[j + len] = poly[j] - t;
                poly[j] = poly[j] + t;
            }
            start += 2 * len;
        }
        len >>= 1;
    }
}

/// Multiplication followed by Montgomery reduction
#[inline(always)]
fn fqmul(a: i16, b: i16) -> i16 {
    montgomery_reduce(a as i32 * b as i32)
}

/// Inverse NTT transformation
/// Input: polynomial coefficients in NTT representation (Montgomery domain)
/// Output: polynomial coefficients in normal order, multiplied by Montgomery factor 2^16
/// Reference: NIST FIPS 203 / PQ-Crystals Kyber ref/ntt.c
pub fn invntt(poly: &mut [i16; KYBER_N]) {
    let mut k: usize = 127;
    let mut len = 2;

    while len <= 128 {
        let mut start = 0;
        while start < KYBER_N {
            // Use same ZETAS array as forward NTT, accessed in reverse order
            let zeta = ZETAS[k];
            k = k.wrapping_sub(1);

            for j in start..start + len {
                let t = poly[j];
                poly[j] = barrett_reduce(t + poly[j + len]);
                poly[j + len] = poly[j + len] - t;
                poly[j + len] = fqmul(zeta, poly[j + len]);
            }
            start += 2 * len;
        }
        len <<= 1;
    }

    // Multiply by f = mont^2/128 to complete inverse NTT
    const F: i16 = 1441;
    for i in 0..KYBER_N {
        poly[i] = fqmul(poly[i], F);
    }
}

/// Multiplication of polynomials in Zq[X]/(X^2-zeta)
/// Used for pointwise multiplication in NTT domain
/// Reference: NIST FIPS 203 / PQ-Crystals Kyber ref/ntt.c basemul()
fn basemul(r: &mut [i16], a: &[i16], b: &[i16], zeta: i16) {
    r[0] = fqmul(a[1], b[1]);
    r[0] = fqmul(r[0], zeta);
    r[0] = r[0].wrapping_add(fqmul(a[0], b[0]));
    r[1] = fqmul(a[0], b[1]);
    r[1] = r[1].wrapping_add(fqmul(a[1], b[0]));
}

/// Pointwise multiplication in NTT domain
/// Computes c = a * b in NTT representation
/// Reference: polyvec_basemul_acc_montgomery
pub fn basemul_ntt(c: &mut [i16; KYBER_N], a: &[i16; KYBER_N], b: &[i16; KYBER_N]) {
    for i in (0..KYBER_N).step_by(4) {
        let zeta_idx = 64 + i / 4;
        basemul(&mut c[i..i+2], &a[i..i+2], &b[i..i+2], ZETAS[zeta_idx]);
        basemul(&mut c[i+2..i+4], &a[i+2..i+4], &b[i+2..i+4], -ZETAS[zeta_idx]);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Helper: convert from Montgomery domain to standard domain
    fn from_mont(a: i16) -> i16 {
        montgomery_reduce(a as i32)
    }

    /// Helper: normalize to [0, q-1] range
    fn reduce_mod_q(a: i16) -> i16 {
        let mut r = a % KYBER_Q;
        if r < 0 {
            r += KYBER_Q;
        }
        r
    }

    #[test]
    fn test_ntt_invntt_tomont() {
        // Reference: invntt outputs values multiplied by Montgomery factor 2^16
        // So NTT->INVNTT gives: original * MONT mod q
        let mut poly = [0i16; KYBER_N];
        for i in 0..KYBER_N {
            poly[i] = (i as i16) % KYBER_Q;
        }
        let original = poly;

        ntt(&mut poly);
        invntt(&mut poly);

        // After invntt, values are in Montgomery form (original * 2^16 mod q)
        // Convert back using from_mont to verify correctness
        for i in 0..KYBER_N {
            let recovered = from_mont(poly[i]);
            let expected = reduce_mod_q(original[i]);
            let got = reduce_mod_q(recovered);
            assert_eq!(
                got, expected,
                "NTT->INVNTT->from_mont failed at index {}: got {}, expected {}",
                i, got, expected
            );
        }
    }

    #[test]
    fn test_montgomery_reduce() {
        let a = 12345i32;
        let reduced = montgomery_reduce(a);
        assert!(reduced < KYBER_Q && reduced >= -KYBER_Q);
    }

    #[test]
    fn test_barrett_reduce() {
        let a = KYBER_Q + 100;
        let reduced = barrett_reduce(a);
        assert!(reduced < KYBER_Q);
    }

    #[test]
    fn test_fqmul_mont_identity() {
        // MONT = 2^16 mod q = 2285 = -1044 (signed)
        // fqmul(a, MONT) should give a (since MONT is Montgomery representation of 1)
        const MONT: i16 = -1044;
        for i in 0..100 {
            let a = (i * 33) as i16 % KYBER_Q;
            let result = fqmul(a, MONT);
            let normalized = reduce_mod_q(result);
            let expected = reduce_mod_q(a);
            assert_eq!(normalized, expected, "fqmul({}, MONT) = {} != {}", a, result, a);
        }
    }
}
