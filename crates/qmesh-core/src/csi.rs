//! Channel State Information (CSI) abstraction for Q-Mesh WiFi sensing.
//!
//! This module is deliberately hardware-free: all sources implementing
//! [`CsiSource`] are software stand-ins. The real ESP32 / Intel / Atheros
//! CSI feeds land in a separate `qmesh-hw` crate and are out of scope here.

/// A producer of raw CSI frames.
pub trait CsiSource {
    /// Pull the next available CSI frame. `None` means the source is drained
    /// (finite-source semantics). Infinite sources like [`MockCsiSource`]
    /// never return `None`.
    fn next_frame(&mut self) -> Option<CsiFrame>;
}

/// A single CSI measurement at one instant in time.
///
/// `subcarriers` holds per-subcarrier magnitude samples. Production
/// hardware typically reports complex I/Q pairs; `i16` magnitudes here
/// match the quantization the ESP32 CSI toolkit produces and are
/// sufficient for the Q-Mesh entropy estimator.
#[derive(Debug, Clone)]
pub struct CsiFrame {
    /// Monotonic capture timestamp in nanoseconds since Unix epoch.
    pub timestamp_ns: u128,
    /// Per-subcarrier magnitude samples.
    pub subcarriers: Vec<i16>,
}

/// Software mock CSI source seeded with a deterministic PRNG.
///
/// Uses XOR-shift to advance state per sample. Same `(subcarrier_count,
/// seed)` pair yields identical frame streams across runs, which lets
/// tests reason about entropy estimator behaviour without hardware.
pub struct MockCsiSource {
    subcarrier_count: usize,
    counter: u64,
    seed: u64,
}

impl MockCsiSource {
    /// Create a new mock source with the default seed (1).
    #[must_use]
    pub fn new(subcarrier_count: usize) -> Self {
        Self::with_seed(subcarrier_count, 1)
    }

    /// Create a mock source with an explicit seed.
    #[must_use]
    pub fn with_seed(subcarrier_count: usize, seed: u64) -> Self {
        Self {
            subcarrier_count,
            counter: 0,
            seed,
        }
    }
}

impl CsiSource for MockCsiSource {
    fn next_frame(&mut self) -> Option<CsiFrame> {
        self.counter = self.counter.wrapping_add(1);
        let mut state = self.seed.wrapping_add(self.counter);
        let subcarriers = (0..self.subcarrier_count)
            .map(|_| {
                // XOR-shift64. Period 2^64 - 1 and good uniformity for
                // a mock feed. Not cryptographic.
                state ^= state << 13;
                state ^= state >> 7;
                state ^= state << 17;
                (state as i16) & 0x0FFF
            })
            .collect();
        Some(CsiFrame {
            timestamp_ns: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .map(|d| d.as_nanos())
                .unwrap_or(1),
            subcarriers,
        })
    }
}

/// A test-only CSI source that emits the same constant frame forever.
///
/// Useful for proving that the entropy estimator drops to zero when the
/// input has no variability.
#[cfg(test)]
pub(crate) struct ConstantCsiSource {
    subcarrier_count: usize,
    value: i16,
}

#[cfg(test)]
impl ConstantCsiSource {
    pub(crate) fn new(subcarrier_count: usize, value: i16) -> Self {
        Self {
            subcarrier_count,
            value,
        }
    }
}

#[cfg(test)]
impl CsiSource for ConstantCsiSource {
    fn next_frame(&mut self) -> Option<CsiFrame> {
        Some(CsiFrame {
            timestamp_ns: 1,
            subcarriers: vec![self.value; self.subcarrier_count],
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn mock_csi_source_determinism_holds_over_many_frames() {
        let mut a = MockCsiSource::with_seed(64, 1337);
        let mut b = MockCsiSource::with_seed(64, 1337);
        for i in 0..100 {
            let fa = a.next_frame().expect("a frame");
            let fb = b.next_frame().expect("b frame");
            assert_eq!(
                fa.subcarriers, fb.subcarriers,
                "frame {i} must match across identically-seeded sources"
            );
        }
    }

    #[test]
    fn mock_csi_source_varies_across_frames() {
        let mut src = MockCsiSource::with_seed(32, 7);
        let f1 = src.next_frame().unwrap();
        let f2 = src.next_frame().unwrap();
        assert_ne!(
            f1.subcarriers, f2.subcarriers,
            "consecutive frames must differ (PRNG state advances)"
        );
    }

    #[test]
    fn constant_csi_source_emits_identical_frames() {
        let mut src = ConstantCsiSource::new(16, 42);
        let f1 = src.next_frame().unwrap();
        let f2 = src.next_frame().unwrap();
        assert_eq!(f1.subcarriers, f2.subcarriers);
        assert!(f1.subcarriers.iter().all(|&v| v == 42));
    }
}
