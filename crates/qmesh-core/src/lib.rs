pub mod csi;

#[cfg(test)]
mod tests {
    use super::csi::{CsiSource, MockCsiSource};

    #[test]
    fn mock_csi_source_produces_frame() {
        let mut src = MockCsiSource::new(64);
        let frame = src.next_frame().expect("frame available");
        assert_eq!(frame.subcarriers.len(), 64);
        assert!(frame.timestamp_ns > 0);
    }

    #[test]
    fn mock_csi_source_is_deterministic_when_seeded() {
        let mut a = MockCsiSource::with_seed(64, 42);
        let mut b = MockCsiSource::with_seed(64, 42);
        let fa = a.next_frame().unwrap();
        let fb = b.next_frame().unwrap();
        assert_eq!(fa.subcarriers, fb.subcarriers);
    }
}
