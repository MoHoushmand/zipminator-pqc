#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
SOURCE_DIR="${SVG_SOURCE_DIR:-/Users/mom5/Downloads/thqai-svgs}"
DATE_STAMP="2026-04-13"

export REPO_ROOT SOURCE_DIR DATE_STAMP

python3 - <<'PY'
import hashlib, json, os, shutil, sys
from pathlib import Path

repo = Path(os.environ["REPO_ROOT"])
src_dir = Path(os.environ["SOURCE_DIR"])
date_stamp = os.environ["DATE_STAMP"]

archive_dir = repo / "_archive" / "svgs-source" / date_stamp
web_dir = repo / "web" / "public" / "logos" / "pillars"
mobile_dir = repo / "mobile" / "assets" / "logos" / "pillars"
browser_dir = repo / "browser" / "src-tauri" / "icons" / "pillars"
variants_dir = web_dir / "variants"

canonical = {
    "q-ai.svg":            "406c87ac9e963c21732e77bb649938853578c768d8c6df46748facbc510a9e54",
    "qanonymizer.svg":     "5fd2fc54ba0397fe5350b805d15ead77608064c0b4ffbe43ea265ba749978480",
    "qbrowser.svg":        "391535ccf54fb387743dfe37783cba8cdbadaae183daa2eab4dd4716167f765e",
    "qmesh.svg":           "7aeca6ad0fe8b3674accf72eaa7ebfb2397e3bd9ddf8207c664374d8f8556ff1",
    "qmessenger.svg":      "c3cd5afdf911347c4f64c5c289c4f3d6a8f3783097ec4bfd362ff8e416053d79",
    "qvault.svg":          "183b3cfec2e8be0eee034f80a459b21866bf1a41dc9815df671c3ae577325a0b",
    "qvoip.svg":           "3fd4628c0c444828a7cc3d0de15ccaf1c79443aeae668e979e198b325ede0874",
    "qvpn.svg":            "71f7a9b50eb9ef550cffca823daeddf4a49e795cc1e7fc540958b46cf5e12888",
    "settings.svg":        "eacafd480370265e0e2979661c1a90d8dd2cb0f08eda7dffd501f8c339b6bc78",
    "thqai_black.svg":     "db1abe3aab986a61733072e2f8401385f0916beec5d2d0f885f990483ed47843",
    "thqai_pink.svg":      "a77b25e80e9bcd022c7aca202ee439663f96dd83d94f9ff67e30094635c50d0a",
    "thqai_pink_purple.svg": "3505a4a24067d52c57da2a7f70214e2a3f7c8af64cfbee50f30f411a1490d870",
    "thqai_white.svg":     "7072ca5da945dcafb2f1f7a18d1378b3050b20630025b9da45368b742c990e80",
}

slug_map = {
    "qvault.svg": "qvault.svg",
    "qmessenger.svg": "qmessenger.svg",
    "qvoip.svg": "qvoip.svg",
    "qvpn.svg": "qvpn.svg",
    "qanonymizer.svg": "qanonymizer.svg",
    "q-ai.svg": "qai.svg",
    "qbrowser.svg": "qbrowser.svg",
    "qmesh.svg": "qmesh.svg",
}

variant_files = ["thqai_pink.svg", "thqai_pink_purple.svg", "thqai_white.svg"]

qmail_placeholder = '''<?xml version="1.0" encoding="UTF-8"?>
<!-- marathon:placeholder -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024" role="img" aria-label="qmail">
  <g fill="none" stroke="currentColor" stroke-width="24" stroke-linejoin="round" stroke-linecap="round">
    <rect x="152" y="280" width="720" height="464" rx="32" ry="32"/>
    <path d="M152 320 L512 600 L872 320"/>
    <path d="M152 744 L420 520"/>
    <path d="M872 744 L604 520"/>
    <circle cx="512" cy="160" r="48"/>
    <path d="M512 208 L512 272" />
  </g>
</svg>
'''

def log(msg):
    print(f"[svg-pillar-install] {msg}", flush=True)

def sha256(p: Path) -> str:
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()

def verify_source():
    log(f"Verifying source SVG hashes in {src_dir}")
    failures = []
    for name, expected in canonical.items():
        p = src_dir / name
        if not p.is_file():
            failures.append(f"MISSING: {p}")
            continue
        actual = sha256(p)
        if actual != expected:
            failures.append(f"HASH MISMATCH: {name}\n  expected: {expected}\n  actual:   {actual}")
    if failures:
        for f in failures:
            print(f, file=sys.stderr)
        print("svg-pillar-install: abort, canonical hash check failed", file=sys.stderr)
        sys.exit(1)
    log(f"{len(canonical)}/{len(canonical)} source hashes match")

def archive_sources():
    archive_dir.mkdir(parents=True, exist_ok=True)
    copied = 0
    for name in canonical:
        src = src_dir / name
        dst = archive_dir / name
        if not dst.exists():
            shutil.copy2(src, dst)
            copied += 1
    sums = archive_dir / "SHA256SUMS"
    with open(sums, "w") as f:
        for name in sorted(canonical):
            p = archive_dir / name
            if p.exists():
                f.write(f"{sha256(p)}  {name}\n")
    log(f"Archived {copied} new SVGs ({archive_dir})")

def write_surface(src: Path, dst: Path):
    dst.parent.mkdir(parents=True, exist_ok=True)
    if dst.exists() and sha256(dst) == sha256(src):
        return False
    shutil.copy2(src, dst)
    return True

def write_pillars():
    written = 0
    for src_name, slug in slug_map.items():
        src = src_dir / src_name
        for surface in (web_dir, mobile_dir, browser_dir):
            if write_surface(src, surface / slug):
                written += 1
    log(f"Wrote {len(slug_map)} pillar SVGs across 3 surfaces ({written} new writes)")

def write_variants():
    variants_dir.mkdir(parents=True, exist_ok=True)
    for vf in variant_files:
        write_surface(src_dir / vf, variants_dir / vf)
    log(f"Wrote {len(variant_files)} variant SVGs to {variants_dir}")

def write_qmail():
    for surface in (web_dir, mobile_dir, browser_dir):
        dst = surface / "qmail.svg"
        surface.mkdir(parents=True, exist_ok=True)
        if dst.exists():
            with open(dst) as f:
                if "marathon:placeholder" in f.read():
                    continue
            continue
        with open(dst, "w") as f:
            f.write(qmail_placeholder)
    log("qmail.svg placeholder written to 3 surfaces")

def seed_state():
    iter_dir = repo / "_archive" / "iterations"
    iter_dir.mkdir(parents=True, exist_ok=True)
    gitkeep = iter_dir / ".gitkeep"
    if not gitkeep.exists():
        gitkeep.touch()
    state = iter_dir / ".marathon-state.json"
    if not state.exists():
        state.write_text(json.dumps({
            "schema_version": 1,
            "run_id": None,
            "preset": None,
            "status": "idle",
            "iteration": 0,
            "max_iterations": 200,
        }, indent=2) + "\n")
    log("Seeded .marathon/.marathon-state.json")

def verify_counts():
    for surface in (web_dir, mobile_dir, browser_dir):
        n = len(list(surface.glob("*.svg")))
        if n < 9:
            print(f"svg-pillar-install: surface {surface} has {n} SVGs, expected >= 9", file=sys.stderr)
            sys.exit(1)
    log("All 3 surfaces have 9/9 pillar SVGs")

def main():
    verify_source()
    archive_sources()
    write_pillars()
    write_variants()
    write_qmail()
    seed_state()
    verify_counts()
    log("Complete. 9/9 pillar SVGs match canonical hashes.")

main()
PY
