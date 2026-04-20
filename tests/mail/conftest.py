"""Shared fixtures for tests/mail/.

Locates the non-owned mail server configs under email/mailserver/config/ and
the owned docker-compose manifest under docker/mail/.
"""
from __future__ import annotations

import os
from pathlib import Path

import pytest


@pytest.fixture(scope="session")
def repo_root() -> Path:
    """Project root (parent of tests/)."""
    return Path(__file__).resolve().parents[2]


@pytest.fixture(scope="session")
def mail_config_dir(repo_root: Path) -> Path:
    """Non-owned existing Postfix/Dovecot config directory."""
    p = repo_root / "email" / "mailserver" / "config"
    if not p.is_dir():
        pytest.skip(f"mail config dir missing: {p}")
    return p


@pytest.fixture(scope="session")
def postfix_main_cf(mail_config_dir: Path) -> Path:
    p = mail_config_dir / "postfix" / "main.cf"
    if not p.is_file():
        pytest.skip(f"postfix main.cf missing: {p}")
    return p


@pytest.fixture(scope="session")
def dovecot_ssl_conf(mail_config_dir: Path) -> Path:
    p = mail_config_dir / "dovecot" / "10-ssl.conf"
    if not p.is_file():
        pytest.skip(f"dovecot 10-ssl.conf missing: {p}")
    return p


@pytest.fixture(scope="session")
def docker_mail_compose(repo_root: Path) -> Path:
    """Owned docker-compose manifest, target of iter 1."""
    return repo_root / "docker" / "mail" / "docker-compose.yml"
