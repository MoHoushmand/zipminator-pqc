pub trait CsiSource {
    fn next_frame(&mut self) -> Option<CsiFrame>;
}

#[derive(Debug, Clone)]
pub struct CsiFrame {
    pub timestamp_ns: u128,
    pub subcarriers: Vec<i16>,
}

pub struct MockCsiSource {
    subcarrier_count: usize,
    counter: u64,
    seed: u64,
}

impl MockCsiSource {
    pub fn new(subcarrier_count: usize) -> Self {
        Self {
            subcarrier_count,
            counter: 0,
            seed: 1,
        }
    }

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
