"""Conftest for email_transport tests.

The transport modules optionally depend on `aiosmtpd` (SMTP server) and
`asyncpg` (PostgreSQL pool).  Collect-time imports of those modules will
fail when the deps aren't installed in the active env, which causes the
whole suite to error.  This conftest hooks pytest_collectstart so each
test module can rely on the deps being present *or* be skipped cleanly
without aborting collection.
"""

from __future__ import annotations

import os
import sys

import pytest


# Make `transport.*` importable regardless of CWD
EMAIL_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "email"))
if EMAIL_DIR not in sys.path:
    sys.path.insert(0, EMAIL_DIR)


def collect_ignore_glob_for_missing(modname: str) -> bool:
    """Return True if *modname* cannot be imported in the current env."""
    try:
        __import__(modname)
        return False
    except ImportError:
        return True


# pytest collect_ignore_glob: skip files that require missing infra deps
collect_ignore_glob: list[str] = []

if collect_ignore_glob_for_missing("asyncpg"):
    # storage.py imports asyncpg at module level
    collect_ignore_glob.extend([
        "test_imap_serve.py",
        "test_smtp_receive.py",
    ])

if collect_ignore_glob_for_missing("aiosmtpd"):
    # smtp_server.py imports aiosmtpd at module level
    if "test_smtp_receive.py" not in collect_ignore_glob:
        collect_ignore_glob.append("test_smtp_receive.py")
