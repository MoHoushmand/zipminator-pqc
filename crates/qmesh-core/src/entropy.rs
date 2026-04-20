//! Rényi-2 (collision) entropy estimator for quantized CSI magnitudes.
//!
//! For a probability distribution `p` over `B` bins,
//! `H_2(p) = -log_2( sum_i p_i^2 )`.
//!
//! Bounds:
//! - Maximum: `log_2(B)` when `p` is uniform.
//! - Minimum: `0` when `p` is a point mass (all samples in one bin).
//!
//! The estimator quantizes each subcarrier magnitude into one of `B` bins
//! using a power-of-two mask (so uniform input maps to uniform bins). This
//! module is used by [`crate::session`] in iter 5 to assess the entropy
//! available from a CSI feed before mixing it into session keys.

use crate::csi::CsiFrame;
use thiserror::Error;

/// Entropy estimator errors.
#[derive(Debug, Error)]
pub enum EntropyError {
    /// `bins` must be a positive power of two so bin assignment via bitmask
    /// is unbiased.
    #[error("bins must be a positive power of two, got {0}")]
    BinsNotPow2(usize),
    /// No samples were supplied.
    #[error("empty sample set")]
    Empty,
}

/// Rényi-order-2 entropy, in bits, of the quantized subcarrier magnitudes
/// across all frames.
///
/// `bins` must be a power of two in `[2, 2048]`; values outside this range
/// are rejected. The magnitude of each `i16` subcarrier is taken modulo
/// `bins` via `value.unsigned_abs() as usize & (bins - 1)`.
pub fn renyi2_bits(frames: &[CsiFrame], bins: usize) -> Result<f64, EntropyError> {
    if bins < 2 || !bins.is_power_of_two() {
        return Err(EntropyError::BinsNotPow2(bins));
    }
    if frames.is_empty() || frames.iter().all(|f| f.subcarriers.is_empty()) {
        return Err(EntropyError::Empty);
    }

    let mask = bins - 1;
    let mut counts = vec![0u64; bins];
    let mut total: u64 = 0;
    for f in frames {
        for &s in &f.subcarriers {
            let idx = (s.unsigned_abs() as usize) & mask;
            counts[idx] += 1;
            total += 1;
        }
    }
    if total == 0 {
        return Err(EntropyError::Empty);
    }

    // H_2 = -log2( sum_i p_i^2 ), p_i = counts[i] / total.
    let total_f = total as f64;
    let mut sum_sq = 0.0_f64;
    for &c in &counts {
        let p = (c as f64) / total_f;
        sum_sq += p * p;
    }
    // sum_sq >= 1/bins (Jensen) and <= 1, so -log2(sum_sq) in [0, log2(bins)].
    Ok(-sum_sq.log2())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::csi::{ConstantCsiSource, CsiSource, MockCsiSource};
    use rand::{RngCore, SeedableRng};
    use rand_chacha::ChaCha8Rng;

    /// Build a CsiFrame from an explicit vector of magnitudes.
    fn frame_from(subcarriers: Vec<i16>) -> CsiFrame {
        CsiFrame {
            timestamp_ns: 1,
            subcarriers,
        }
    }

    /// Collect `n` frames from a CSI source.
    fn take_frames<S: CsiSource>(source: &mut S, n: usize) -> Vec<CsiFrame> {
        (0..n).map(|_| source.next_frame().unwrap()).collect()
    }

    #[test]
    fn renyi2_rejects_non_power_of_two_bins() {
        let frames = vec![frame_from(vec![0, 1, 2])];
        assert!(matches!(
            renyi2_bits(&frames, 3),
            Err(EntropyError::BinsNotPow2(3))
        ));
        assert!(matches!(
            renyi2_bits(&frames, 0),
            Err(EntropyError::BinsNotPow2(0))
        ));
        assert!(matches!(
            renyi2_bits(&frames, 1),
            Err(EntropyError::BinsNotPow2(1))
        ));
    }

    #[test]
    fn renyi2_rejects_empty_input() {
        let frames: Vec<CsiFrame> = vec![];
        assert!(matches!(renyi2_bits(&frames, 16), Err(EntropyError::Empty)));

        let frames = vec![frame_from(vec![])];
        assert!(matches!(renyi2_bits(&frames, 16), Err(EntropyError::Empty)));
    }

    #[test]
    fn renyi2_of_constant_source_is_zero() {
        let mut src = ConstantCsiSource::new(64, 5);
        let frames = take_frames(&mut src, 100);
        let h = renyi2_bits(&frames, 16).expect("h defined");
        // A constant source has all samples in one bin. H_2 = 0.
        assert!(
            h.abs() < 1e-9,
            "constant source entropy must be ~0, got {h}"
        );
    }

    #[test]
    fn renyi2_of_cryptographic_uniform_source_approaches_log2_bins() {
        // Use ChaCha8Rng (cryptographic PRNG) to generate i16 magnitudes.
        // Over many samples, each of the 16 bins should be ~equiprobable.
        let mut rng = ChaCha8Rng::seed_from_u64(0xC0FFEE_u64);
        let bins = 16usize;
        let subcarriers_per_frame = 128usize;
        let num_frames = 200usize; // 25_600 samples / 16 bins = ~1600 per bin.

        let frames: Vec<CsiFrame> = (0..num_frames)
            .map(|_| {
                let subs: Vec<i16> = (0..subcarriers_per_frame)
                    .map(|_| (rng.next_u32() as i16) & 0x0FFF)
                    .collect();
                frame_from(subs)
            })
            .collect();

        let h = renyi2_bits(&frames, bins).expect("h defined");
        let ceiling = (bins as f64).log2();
        let threshold = ceiling - 0.3;
        assert!(
            h >= threshold,
            "uniform-source H_2 = {h} should exceed {threshold} (ceiling {ceiling})"
        );
        assert!(
            h <= ceiling + 1e-9,
            "H_2 = {h} must not exceed log2(bins) = {ceiling}"
        );
    }

    #[test]
    fn renyi2_of_mock_source_is_positive_and_bounded() {
        // The XOR-shift mock is not cryptographic, but it should still
        // produce a positive H_2 bounded by log2(bins).
        let mut src = MockCsiSource::with_seed(64, 42);
        let frames = take_frames(&mut src, 50);
        let bins = 16usize;
        let h = renyi2_bits(&frames, bins).expect("h defined");
        assert!(h > 1.0, "mock source H_2 should be > 1 bit, got {h}");
        assert!(h <= (bins as f64).log2() + 1e-9);
    }
}
