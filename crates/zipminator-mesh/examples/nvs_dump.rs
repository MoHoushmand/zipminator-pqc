//! Cross-language parity helper: emit a V1 NVS binary from the Rust
//! `MeshProvisioner` to stdout. Used by `tests/test_integrate_ruview.py`
//! to confirm that the Python `scripts/integrate_ruview.py` script
//! produces a byte-identical blob given the same inputs.
//!
//! Usage:
//!     cargo run --example nvs_dump --quiet -- <pool_path> <mesh_id> [epoch]

use std::env;
use std::io::Write;
use std::process::ExitCode;

use zipminator_mesh::MeshProvisioner;

fn main() -> ExitCode {
    let args: Vec<String> = env::args().collect();
    if args.len() < 3 || args.len() > 4 {
        eprintln!("usage: nvs_dump <pool_path> <mesh_id> [epoch]");
        return ExitCode::from(2);
    }

    let pool_path = &args[1];
    let mesh_id = &args[2];
    let epoch: u64 = args
        .get(3)
        .map(|s| s.parse().expect("epoch must be u64"))
        .unwrap_or(0);

    let mut prov = match MeshProvisioner::new(pool_path, mesh_id) {
        Ok(p) => p,
        Err(e) => {
            eprintln!("MeshProvisioner::new failed: {e}");
            return ExitCode::from(1);
        }
    };

    // Advance to the requested epoch by repeated rotation.
    for _ in 0..epoch {
        if let Err(e) = prov.rotate_keys() {
            eprintln!("rotate_keys failed: {e}");
            return ExitCode::from(1);
        }
    }

    let blob = match prov.provision_nvs_binary(mesh_id) {
        Ok(b) => b,
        Err(e) => {
            eprintln!("provision_nvs_binary failed: {e}");
            return ExitCode::from(1);
        }
    };

    let mut stdout = std::io::stdout().lock();
    if let Err(e) = stdout.write_all(&blob) {
        eprintln!("write failed: {e}");
        return ExitCode::from(1);
    }
    ExitCode::SUCCESS
}
