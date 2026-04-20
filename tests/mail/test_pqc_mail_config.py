"""Iter 1: PQC mail stack config contract.

Locks the X25519MLKEM768 hybrid key-exchange contract in Postfix + Dovecot
and asserts the owned docker-compose manifest for the mail stack exists
and references the non-owned mailserver build context.

Crypto reference: NIST FIPS 203 (ML-KEM-768), X25519MLKEM768 hybrid per
IETF draft-kwiatkowski-tls-ecdhe-mlkem.
"""
from __future__ import annotations

from pathlib import Path

import pytest
import yaml


PQC_CURVE = "X25519MLKEM768"


def test_postfix_main_cf_pins_x25519mlkem768(postfix_main_cf: Path) -> None:
    text = postfix_main_cf.read_text()
    assert "tls_eecdh_auto_curves" in text, "tls_eecdh_auto_curves directive missing"
    curve_line = next(
        (
            line for line in text.splitlines()
            if line.strip().startswith("tls_eecdh_auto_curves")
        ),
        None,
    )
    assert curve_line is not None, "tls_eecdh_auto_curves has no value line"
    assert PQC_CURVE in curve_line, (
        f"{PQC_CURVE} not in Postfix tls_eecdh_auto_curves: {curve_line!r}"
    )
    first_curve = curve_line.split("=", 1)[1].split(",")[0].strip()
    assert first_curve == PQC_CURVE, (
        f"{PQC_CURVE} must be first curve for PQ preference, got {first_curve!r}"
    )


def test_dovecot_ssl_conf_pins_x25519mlkem768(dovecot_ssl_conf: Path) -> None:
    text = dovecot_ssl_conf.read_text()
    curve_line = next(
        (
            line for line in text.splitlines()
            if line.strip().startswith("ssl_curve_list")
        ),
        None,
    )
    assert curve_line is not None, "ssl_curve_list directive missing"
    assert PQC_CURVE in curve_line, (
        f"{PQC_CURVE} not in Dovecot ssl_curve_list: {curve_line!r}"
    )
    first_curve = curve_line.split("=", 1)[1].split(":")[0].strip()
    assert first_curve == PQC_CURVE, (
        f"{PQC_CURVE} must be first curve for PQ preference, got {first_curve!r}"
    )


def test_dovecot_requires_tls(dovecot_ssl_conf: Path) -> None:
    text = dovecot_ssl_conf.read_text()
    ssl_line = next(
        (
            line for line in text.splitlines()
            if line.strip().startswith("ssl ") or line.strip().startswith("ssl=")
        ),
        None,
    )
    assert ssl_line is not None, "ssl directive missing"
    assert "required" in ssl_line, f"ssl must be required, got {ssl_line!r}"


def test_postfix_tls_v12_minimum(postfix_main_cf: Path) -> None:
    text = postfix_main_cf.read_text()
    assert "smtpd_tls_mandatory_protocols" in text, (
        "smtpd_tls_mandatory_protocols must be configured"
    )


def test_docker_mail_compose_exists(docker_mail_compose: Path) -> None:
    assert docker_mail_compose.is_file(), (
        f"owned docker/mail/docker-compose.yml missing: {docker_mail_compose}"
    )


def test_docker_mail_compose_defines_mailserver_service(
    docker_mail_compose: Path,
) -> None:
    if not docker_mail_compose.is_file():
        pytest.fail(
            f"docker-compose.yml missing at {docker_mail_compose}; "
            "iter 1 owned deliverable"
        )
    spec = yaml.safe_load(docker_mail_compose.read_text())
    assert isinstance(spec, dict), "compose file must be a mapping"
    services = spec.get("services", {})
    assert "mailserver" in services, "mailserver service missing"
    svc = services["mailserver"]
    build = svc.get("build")
    assert build is not None, "mailserver.build missing"
    if isinstance(build, str):
        ctx = build
    else:
        ctx = build.get("context", "")
    assert "email/mailserver" in ctx.replace("\\", "/"), (
        f"mailserver build.context must reference email/mailserver, got {ctx!r}"
    )


def test_docker_mail_compose_exposes_submission_and_imaps(
    docker_mail_compose: Path,
) -> None:
    if not docker_mail_compose.is_file():
        pytest.fail(
            f"docker-compose.yml missing at {docker_mail_compose}; "
            "iter 1 owned deliverable"
        )
    spec = yaml.safe_load(docker_mail_compose.read_text())
    mail = spec["services"]["mailserver"]
    ports = [str(p) for p in mail.get("ports", [])]
    joined = " ".join(ports)
    # 587 SMTP submission, 993 IMAPS: the PQC-hardened listeners.
    assert "587" in joined, f"port 587 (SMTP submission) missing from {ports}"
    assert "993" in joined, f"port 993 (IMAPS) missing from {ports}"
