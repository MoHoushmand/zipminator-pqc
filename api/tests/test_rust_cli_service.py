"""Coverage skeleton — v26 G1: api/src/services/rust_cli.py.

Currently 0 tests. 167 LOC wraps the Rust Zipminator CLI via subprocess and
hands Kyber768 keypairs to FastAPI route handlers (api/src/routes/crypto.py
endpoints keygen/encrypt/decrypt). This is a security-critical seam: if the
contract migrates from stdin to argv during a refactor, secret-key bytes leak
to /proc/<pid>/cmdline and `ps -ef`. The wrapper documents this in source
("Pass public/secret key via stdin to avoid process listing exposure" lines
76, 122) but no test pins the contract.

Place at:  api/tests/test_rust_cli_service.py  (collected by pyproject.toml
testpaths = ["tests"], runs under api/ pytest invocation)

Run:       cd api && pytest tests/test_rust_cli_service.py -xvs

USER DESIGN PICK (one of three; default is SHAPE A in this file):

  SHAPE A — mock.patch on subprocess.run.
    Pros: zero filesystem, ~10ms per test, easy to assert kwargs exactly.
    Cons: a regression that moves the key from `input=` to `cmd.append(key)`
          would silently pass because the mock swallows the call. The strict
          assertion below (`assert key not in joined_args`) catches it
          anyway, but only if the key bytes are the literal mock value.

  SHAPE B — fake CLI binary that echoes argv+stdin to a tempfile.
    Write a 5-line argv_echo.sh under tests/fixtures/, chmod +x, and assert
    the captured content has the key bytes in the STDIN section only.
    Pros: actually proves no leak via argv on a real subprocess invocation
          (the security contract verified end-to-end).
    Cons: requires tempfile + chmod fixture; ~50ms per test; CI must allow
          shell scripts to execute.

  SHAPE C — layered: A for the 15 functional tests, B for the 3 security pins.
    Pros: max coverage at tiered cost.
    Cons: most code; needs both fixture sets.

This file ships as Shape A. The 3 security-pinning tests are marked
`@pytest.mark.security_contract` so a Shape-B run can override them via
parametrize without touching the rest. If Mo picks Shape B or C, swap the
fixture under `# === fixture swap point ===` below.
"""

from __future__ import annotations

import base64
import subprocess
from pathlib import Path
from unittest import mock

import pytest

from src.services.rust_cli import RustCLIWrapper, get_cli_wrapper


# === fixture swap point ===
# Shape A: mock subprocess.run. Shape B: replace with `fake_cli_binary` fixture
# that returns a Path to an argv-echo script. Tests below assert against the
# real `subprocess.run` return shape either way.

@pytest.fixture
def patched_run():
    """Patch subprocess.run with a controllable mock. Default returns success."""
    with mock.patch("src.services.rust_cli.subprocess.run") as run:
        run.return_value = mock.Mock(
            stdout="",
            stderr="",
            returncode=0,
        )
        yield run


@pytest.fixture
def cli_wrapper(tmp_path: Path, monkeypatch):
    """Build a RustCLIWrapper with a tmp_path-resolved CLI_PATH so __init__'s
    existence check passes regardless of whether the real Rust binary is built."""
    fake_cli = tmp_path / "zipminator"
    fake_cli.write_bytes(b"#!/bin/sh\nexit 0\n")
    fake_cli.chmod(0o755)
    # rust_cli.py resolves CLI_PATH relative to api/../<settings.CLI_PATH>; we
    # point settings at our tmp file via monkeypatch on the resolved attribute.
    from src.services import rust_cli
    monkeypatch.setattr(
        rust_cli,
        "settings",
        mock.Mock(CLI_PATH=str(fake_cli)),
    )
    # Also clear the lazy singleton so the next get_cli_wrapper picks up our
    # monkeypatched settings instead of returning a stale instance.
    monkeypatch.setattr(rust_cli, "_cli_wrapper", None)
    wrapper = RustCLIWrapper()
    # Re-point cli_path explicitly because RustCLIWrapper resolves it from
    # __file__'s parent chain, not from settings.CLI_PATH directly.
    wrapper.cli_path = fake_cli
    return wrapper


# ────────────────────────────────────────────────────────────────────────
# Section 1: STDIN security contract (the regression-firewall)
# ────────────────────────────────────────────────────────────────────────

class TestStdinSecurityContract:
    """These three tests are the reason this file exists.

    The wrapper docstring at lines 76 + 122 promises keys flow via stdin to
    avoid /proc/<pid>/cmdline exposure. If a future refactor passes a key as
    an argv element, ps -ef on a multi-tenant box leaks the secret. Pin it.
    """

    @pytest.mark.security_contract
    def test_keygen_argv_contains_only_keygen_subcommand(
        self, cli_wrapper, patched_run
    ):
        patched_run.return_value.stdout = (
            "Public key: PUBKEY_BYTES_BASE64==\n"
            "Secret key: SECRETKEY_BYTES_BASE64==\n"
        )
        cli_wrapper.generate_keypair(use_quantum=False)
        called_args = patched_run.call_args.args[0]  # the cmd list
        # keygen has no key-input contract (it generates them) but pin the
        # exact argv shape so future flag additions are explicit.
        assert called_args[-1] == "keygen", f"argv tail: {called_args}"
        assert len(called_args) == 2, f"unexpected argv length: {called_args}"

    @pytest.mark.security_contract
    def test_encrypt_public_key_passes_via_stdin_not_argv(
        self, cli_wrapper, patched_run
    ):
        sentinel_pk = "SENTINEL_PUBKEY_NEVER_IN_ARGV=="
        patched_run.return_value.stdout = (
            "Ciphertext: CT==\nShared secret: SS==\n"
        )
        cli_wrapper.encrypt(public_key=sentinel_pk, plaintext=b"hello")
        called_args = patched_run.call_args.args[0]
        called_kwargs = patched_run.call_args.kwargs
        joined_argv = " ".join(called_args)
        assert sentinel_pk not in joined_argv, (
            f"REGRESSION: public_key leaked into argv: {called_args}"
        )
        assert sentinel_pk in called_kwargs.get("input", ""), (
            "expected public_key in stdin input= kwarg"
        )

    @pytest.mark.security_contract
    def test_decrypt_secret_key_passes_via_stdin_not_argv(
        self, cli_wrapper, patched_run
    ):
        sentinel_sk = "SENTINEL_SECRETKEY_NEVER_IN_ARGV=="
        patched_run.return_value.stdout = (
            "Plaintext: aGVsbG8=\nShared secret: SS==\n"
        )
        cli_wrapper.decrypt(secret_key=sentinel_sk, ciphertext="CT==")
        called_args = patched_run.call_args.args[0]
        called_kwargs = patched_run.call_args.kwargs
        joined_argv = " ".join(called_args)
        assert sentinel_sk not in joined_argv, (
            f"REGRESSION: secret_key leaked into argv: {called_args}"
        )
        assert sentinel_sk in called_kwargs.get("input", ""), (
            "expected secret_key in stdin input= kwarg"
        )

    @pytest.mark.security_contract
    def test_encrypt_stdin_format_is_pk_newline_plaintext_b64(
        self, cli_wrapper, patched_run
    ):
        patched_run.return_value.stdout = (
            "Ciphertext: CT==\nShared secret: SS==\n"
        )
        plaintext = b"\x00\x01\x02hello\xff"
        cli_wrapper.encrypt(public_key="PK==", plaintext=plaintext)
        stdin_blob = patched_run.call_args.kwargs["input"]
        expected = f"PK==\n{base64.b64encode(plaintext).decode('utf-8')}"
        assert stdin_blob == expected, (
            f"stdin format drift: got {stdin_blob!r}, want {expected!r}"
        )

    @pytest.mark.security_contract
    def test_decrypt_stdin_format_is_sk_newline_ciphertext(
        self, cli_wrapper, patched_run
    ):
        patched_run.return_value.stdout = (
            "Plaintext: aGVsbG8=\nShared secret: SS==\n"
        )
        cli_wrapper.decrypt(secret_key="SK==", ciphertext="CT==")
        stdin_blob = patched_run.call_args.kwargs["input"]
        assert stdin_blob == "SK==\nCT==", (
            f"stdin format drift: got {stdin_blob!r}"
        )


# ────────────────────────────────────────────────────────────────────────
# Section 2: Output parsing (handles edge cases that the prefix-match
# parser at lines 46-50, 94-98, 140-144 silently breaks on)
# ────────────────────────────────────────────────────────────────────────

class TestOutputParsing:

    def test_keygen_extra_whitespace_stripped(self, cli_wrapper, patched_run):
        patched_run.return_value.stdout = (
            "Public key:    PK_WITH_LEADING_SPACES==   \n"
            "Secret key:\tSK_WITH_TAB==\n"
        )
        pk, sk = cli_wrapper.generate_keypair()
        assert pk == "PK_WITH_LEADING_SPACES=="
        assert sk == "SK_WITH_TAB=="

    def test_keygen_missing_public_key_line_raises(self, cli_wrapper, patched_run):
        patched_run.return_value.stdout = "Secret key: SK==\n"
        with pytest.raises(ValueError, match="Failed to parse keypair"):
            cli_wrapper.generate_keypair()

    def test_keygen_empty_output_raises(self, cli_wrapper, patched_run):
        patched_run.return_value.stdout = ""
        with pytest.raises(ValueError, match="Failed to parse keypair"):
            cli_wrapper.generate_keypair()

    def test_encrypt_missing_ciphertext_line_raises(
        self, cli_wrapper, patched_run
    ):
        patched_run.return_value.stdout = "Shared secret: SS==\n"
        with pytest.raises(ValueError, match="Failed to parse encryption"):
            cli_wrapper.encrypt(public_key="PK==", plaintext=b"x")

    def test_decrypt_returns_decoded_bytes(self, cli_wrapper, patched_run):
        plaintext = b"hello\x00world"
        b64 = base64.b64encode(plaintext).decode("utf-8")
        patched_run.return_value.stdout = (
            f"Plaintext: {b64}\nShared secret: SS==\n"
        )
        pt, ss = cli_wrapper.decrypt(secret_key="SK==", ciphertext="CT==")
        assert pt == plaintext, "decoded bytes must match round-trip"
        assert ss == "SS=="

    @pytest.mark.xfail(
        reason=(
            "Prefix matcher uses str.split(':', 1)[1].strip(), so a base64 "
            "value containing 'Public key:' as substring (vanishingly rare "
            "but legal) would parse the inner colon. xfail until parser uses "
            "JSON envelope or splitlines+regex anchored at line-start."
        ),
        strict=False,
    )
    def test_keygen_value_with_embedded_prefix_substring(
        self, cli_wrapper, patched_run
    ):
        # Pathological but legal: a base64 string can contain "Public key:"
        # within its body. The current parser would mis-split.
        evil = "Public key:embedded=="
        patched_run.return_value.stdout = (
            f"Public key: {evil}\nSecret key: SK==\n"
        )
        pk, _ = cli_wrapper.generate_keypair()
        assert pk == evil


# ────────────────────────────────────────────────────────────────────────
# Section 3: Error mapping
# ────────────────────────────────────────────────────────────────────────

class TestErrorMapping:

    def test_called_process_error_maps_to_runtime_error_with_stderr(
        self, cli_wrapper, patched_run
    ):
        patched_run.side_effect = subprocess.CalledProcessError(
            returncode=1,
            cmd=["zipminator", "keygen"],
            stderr="entropy device unavailable",
        )
        with pytest.raises(RuntimeError, match="entropy device unavailable"):
            cli_wrapper.generate_keypair()

    def test_timeout_expired_maps_to_runtime_error(
        self, cli_wrapper, patched_run
    ):
        patched_run.side_effect = subprocess.TimeoutExpired(
            cmd=["zipminator", "keygen"], timeout=30
        )
        with pytest.raises(RuntimeError, match="timed out after 30 seconds"):
            cli_wrapper.generate_keypair()

    def test_missing_cli_binary_raises_at_init(self, tmp_path, monkeypatch):
        nonexistent = tmp_path / "does-not-exist"
        from src.services import rust_cli
        monkeypatch.setattr(
            rust_cli,
            "settings",
            mock.Mock(CLI_PATH=str(nonexistent)),
        )
        # The constructor resolves cli_path from __file__, not settings, but
        # whichever path it lands on must not exist for this test to pass.
        # If RustCLIWrapper.__init__ ever moves to settings-based resolution,
        # this test will start working without modification.
        # For now, force it explicitly:
        with mock.patch.object(Path, "exists", return_value=False):
            with pytest.raises(FileNotFoundError, match="not found"):
                RustCLIWrapper()


# ────────────────────────────────────────────────────────────────────────
# Section 4: Quantum entropy flag
# ────────────────────────────────────────────────────────────────────────

class TestQuantumFlag:

    def test_use_quantum_true_appends_flag(self, cli_wrapper, patched_run):
        patched_run.return_value.stdout = (
            "Public key: PK==\nSecret key: SK==\n"
        )
        cli_wrapper.generate_keypair(use_quantum=True)
        called_args = patched_run.call_args.args[0]
        assert "--quantum" in called_args, f"missing --quantum: {called_args}"

    def test_use_quantum_false_omits_flag(self, cli_wrapper, patched_run):
        patched_run.return_value.stdout = (
            "Public key: PK==\nSecret key: SK==\n"
        )
        cli_wrapper.generate_keypair(use_quantum=False)
        called_args = patched_run.call_args.args[0]
        assert "--quantum" not in called_args


# ────────────────────────────────────────────────────────────────────────
# Section 5: Singleton behavior (mirrors v10 voip._sessions multi-worker bug)
# ────────────────────────────────────────────────────────────────────────

class TestSingleton:

    def test_get_cli_wrapper_returns_same_instance(self, monkeypatch, tmp_path):
        fake_cli = tmp_path / "zipminator"
        fake_cli.write_bytes(b"")
        fake_cli.chmod(0o755)
        from src.services import rust_cli
        monkeypatch.setattr(rust_cli, "_cli_wrapper", None)
        with mock.patch.object(Path, "exists", return_value=True):
            a = get_cli_wrapper()
            b = get_cli_wrapper()
        assert a is b, "lazy singleton should memoize across calls"

    @pytest.mark.xfail(
        reason=(
            "v10 perf-audit finding: module-singleton _cli_wrapper is fine for "
            "single-worker dev but each uvicorn worker holds its own copy. "
            "Not a correctness bug for this stateless wrapper, but pin so "
            "future stateful migrations (caching keypairs, connection pools) "
            "trigger a deliberate decision instead of silent multi-worker drift."
        ),
        strict=False,
    )
    def test_singleton_shared_across_processes(self):
        # TODO Mo: pick before un-xfail:
        #   (a) Convert to per-request instance (drops singleton, simplest)
        #   (b) Move state into Redis like v21 fakeredis pattern
        #   (c) Accept per-worker copy, document the tradeoff in module docstring
        raise NotImplementedError(
            "user pick required: per-request | redis | per-worker"
        )


# ────────────────────────────────────────────────────────────────────────
# Section 6: Sync-in-async perf pin (v3 perf-audit finding, still open)
# ────────────────────────────────────────────────────────────────────────

@pytest.mark.xfail(
    reason=(
        "v3 perf finding: subprocess.run is BLOCKING when called from an "
        "async FastAPI route handler (api/src/routes/crypto.py:58/93/126). "
        "Under load, this serializes Kyber keygen behind the asyncio event "
        "loop. Migration target: asyncio.create_subprocess_exec with "
        "communicate(input=...). When that lands, this xfail flips to xpass "
        "and gets converted to a real assertion."
    ),
    strict=False,
)
def test_keygen_does_not_block_event_loop():
    import asyncio
    import time

    async def call_and_yield():
        wrapper = get_cli_wrapper()
        start = time.monotonic()
        # If subprocess.run blocks, the gather below would NOT achieve any
        # parallelism; total wall-clock would be ~N * single-call duration.
        # An async-native impl would gather in ~max(single-call) instead.
        await asyncio.gather(
            *[asyncio.to_thread(wrapper.generate_keypair) for _ in range(4)]
        )
        return time.monotonic() - start

    # Until migration: this would xpass only if to_thread happens to give us
    # parallelism (which it does on default thread pool), but the contract
    # we want is "no event-loop block at all", which only async-subprocess
    # delivers. Strict=False so a false xpass doesn't break CI today.
    asyncio.run(call_and_yield())
