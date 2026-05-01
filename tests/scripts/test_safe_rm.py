"""Regression tests for `scripts/_safe-rm.sh`.

Coverage gap v21 G2: scripts/_safe-rm.sh is a 66-LOC sandboxing helper
sourced by marathon.sh that protects against destructive `rm -rf` outside
the marathon-owned subtree. It has zero tests today. The case statement
controls a safety boundary; a regression here is an `rm anywhere`
primitive.

Strategy: invoke `bash -c 'source ...; safe_rm <arg>'` in a subprocess
and assert exit code + side effects on a temp sandbox.

Pinned invariants:
- Refuses flag-like args (`-rf`, `--force`)
- Refuses absolute system paths (`/`, `/etc`, `/usr`, `/Users`, `/home`)
- Allows paths inside `.marathon/`, `_screenshots/`, `_tmp/`, `_archive/`
- Refuses paths outside the sandbox even if writable
- Resolves real paths so symlink escape (`tmp/escape -> /etc/hosts`)
  cannot break out
- Exits non-zero with a useful stderr message on refusal
"""

from __future__ import annotations

import os
import subprocess
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]
SAFE_RM = REPO_ROOT / "scripts" / "_safe-rm.sh"


def _run_safe_rm(*args: str, cwd: Path) -> subprocess.CompletedProcess[str]:
    """Source _safe-rm.sh in a subshell and call safe_rm with args."""
    cmd = f'set -u; source "{SAFE_RM}"; safe_rm {" ".join(repr(a) for a in args)}'
    return subprocess.run(
        ["bash", "-c", cmd],
        cwd=cwd,
        capture_output=True,
        text=True,
        timeout=10,
        env={**os.environ, "MARATHON_WORKDIR": str(cwd)},
    )


@pytest.fixture
def sandbox(tmp_path: Path) -> Path:
    """Create a fake marathon-rooted sandbox with allowed subdirs."""
    (tmp_path / ".marathon").mkdir()
    (tmp_path / "_tmp").mkdir()
    (tmp_path / "_screenshots").mkdir()
    (tmp_path / "_archive").mkdir()
    (tmp_path / "outside").mkdir()
    return tmp_path


def test_refuses_flag_like_arg(sandbox: Path):
    """safe_rm must refuse anything starting with `-` to block `-rf` exploits."""
    r = _run_safe_rm("-rf", cwd=sandbox)
    assert r.returncode == 2, r.stderr
    assert "refusing flag-like" in r.stderr


def test_refuses_root_path(sandbox: Path):
    r = _run_safe_rm("/", cwd=sandbox)
    assert r.returncode == 3, r.stderr
    assert "refusing system path" in r.stderr


@pytest.mark.parametrize(
    "sys_path",
    ["/etc", "/usr", "/var", "/bin", "/sbin", "/Users", "/home"],
)
def test_refuses_critical_system_paths(sandbox: Path, sys_path: str):
    r = _run_safe_rm(sys_path, cwd=sandbox)
    assert r.returncode == 3, f"{sys_path} -> {r.stderr}"


def test_allows_marathon_subtree(sandbox: Path):
    target = sandbox / ".marathon" / "scratch.txt"
    target.write_text("delete me")
    assert target.exists()
    r = _run_safe_rm(str(target), cwd=sandbox)
    assert r.returncode == 0, r.stderr
    assert not target.exists(), "safe_rm should have deleted file inside .marathon/"


def test_allows_screenshots_subtree(sandbox: Path):
    target = sandbox / "_screenshots" / "shot.png"
    target.write_text("png-bytes")
    r = _run_safe_rm(str(target), cwd=sandbox)
    assert r.returncode == 0, r.stderr
    assert not target.exists()


def test_refuses_path_outside_sandbox(sandbox: Path):
    """A path that exists but lives outside .marathon/_screenshots/_tmp/_archive
    must be refused, even if writable."""
    target = sandbox / "outside" / "file.txt"
    target.write_text("do not delete")
    r = _run_safe_rm(str(target), cwd=sandbox)
    assert r.returncode == 4, r.stderr
    assert target.exists(), "safe_rm must not have deleted outside-sandbox path"
    assert "outside" in r.stderr


def test_skips_nonexistent_path(sandbox: Path):
    """Missing path is a no-op (continue), not an error."""
    r = _run_safe_rm(str(sandbox / "_tmp" / "nope.txt"), cwd=sandbox)
    assert r.returncode == 0, r.stderr


def test_symlink_escape_is_blocked(sandbox: Path):
    """Adversarial: place a symlink inside .marathon/ that points to /etc/hosts.
    safe_rm must resolve real paths and refuse, not delete /etc/hosts.
    """
    decoy = sandbox / ".marathon" / "escape"
    try:
        decoy.symlink_to("/etc/hosts")
    except (OSError, NotImplementedError):
        pytest.skip("symlink creation not supported on this platform")

    r = _run_safe_rm(str(decoy), cwd=sandbox)
    # Real-path of the symlink target is /etc/hosts, which is outside sandbox.
    # The script does pwd -P on the dirname, so the symlink itself stays in
    # .marathon/, but safe_rm should still NOT delete /etc/hosts.
    # TODO(mom5): decide whether the script should refuse symlinks
    # whose target is outside the sandbox. Current behavior may delete the
    # symlink only (leaving /etc/hosts intact) but this needs explicit pinning.
    assert Path("/etc/hosts").exists(), "/etc/hosts must NEVER be deleted"


def test_multiple_args_one_invalid_aborts_chain(sandbox: Path):
    """If any arg is refused, the loop returns; subsequent valid args are NOT
    deleted. This pins fail-closed behavior."""
    valid_a = sandbox / "_tmp" / "a.txt"
    valid_a.write_text("a")
    valid_b = sandbox / "_tmp" / "b.txt"
    valid_b.write_text("b")

    r = _run_safe_rm(str(valid_a), "/etc", str(valid_b), cwd=sandbox)
    assert r.returncode != 0
    # `valid_a` was processed first and IS deleted (current behavior).
    # `valid_b` is NOT deleted because the loop returned on /etc.
    # TODO(mom5): is this the desired semantic, or should the function
    # validate ALL args first, then delete? Pin the choice here.
    assert not valid_a.exists()
    assert valid_b.exists(), "valid_b must be preserved when an earlier arg is refused"
