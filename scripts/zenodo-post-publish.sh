#!/usr/bin/env bash
# zenodo-post-publish.sh
# Post-publish patcher for the 3-paper Zenodo patent family.
# Run after all three papers are published on zenodo.org and you have their DOIs.
#
# Usage:
#   ./scripts/zenodo-post-publish.sh <paper1-doi> <paper2-doi> <paper3-doi>
#
# Example:
#   ./scripts/zenodo-post-publish.sh 10.5281/zenodo.1234567 10.5281/zenodo.1234568 10.5281/zenodo.1234569
#
# Effects:
#   - Injects 3 DOIs into CITATION.cff under identifiers:
#   - Appends a Published DOI block to each zenodo-paper{1,2,3}.md
#   - Stamps each PDF with OpenTimestamps (if `ots` is on PATH)
#   - Stages and commits the diff (does not push)
#
# Does NOT patch main.tex \thanks{}; do that manually per paper.

set -euo pipefail

if [[ $# -ne 3 ]]; then
  echo "Usage: $0 <paper1-doi> <paper2-doi> <paper3-doi>" >&2
  echo "Example: $0 10.5281/zenodo.1234567 10.5281/zenodo.1234568 10.5281/zenodo.1234569" >&2
  exit 1
fi

DOI1="$1"
DOI2="$2"
DOI3="$3"

REPO="/Users/mom5/dev/qdaria/products/zipminator"
EPRINT_DIR="$REPO/docs/research/eprint"

cd "$REPO"

for d in "$DOI1" "$DOI2" "$DOI3"; do
  if [[ ! "$d" =~ ^10\.5281/zenodo\.[0-9]+$ ]]; then
    echo "Invalid DOI format: $d (expected 10.5281/zenodo.NNNNNNN)" >&2
    exit 2
  fi
done

if [[ ! -d "$EPRINT_DIR" ]]; then
  echo "Missing directory: $EPRINT_DIR" >&2
  exit 3
fi

echo "Repo: $REPO"
echo "Paper 1 DOI: $DOI1"
echo "Paper 2 DOI: $DOI2"
echo "Paper 3 DOI: $DOI3"
echo

echo "[1/5] Patching CITATION.cff"
if [[ ! -f CITATION.cff ]]; then
  echo "  WARNING: CITATION.cff not found; skipping." >&2
else
  DOI1="$DOI1" DOI2="$DOI2" DOI3="$DOI3" python3 - <<'PY'
import os, pathlib, re
p = pathlib.Path("CITATION.cff")
src = p.read_text()
d1, d2, d3 = os.environ["DOI1"], os.environ["DOI2"], os.environ["DOI3"]
if d1 in src and d2 in src and d3 in src:
    print("  (all three DOIs already present, skipping)")
else:
    block = (
        f'  - type: doi\n'
        f'    value: "{d1}"\n'
        f'    description: "Paper 1: Quantum-Certified Anonymization (Zenodo preprint)"\n'
        f'  - type: doi\n'
        f'    value: "{d2}"\n'
        f'    description: "Paper 2: Unilateral WiFi CSI Entropy Source (Zenodo preprint)"\n'
        f'  - type: doi\n'
        f'    value: "{d3}"\n'
        f'    description: "Paper 3: Certified Heterogeneous Entropy with ARE (Zenodo preprint)"\n'
    )
    if re.search(r"^identifiers:\s*$", src, flags=re.M):
        src = re.sub(r"^(identifiers:\s*\n)", r"\1" + block, src, count=1, flags=re.M)
    else:
        if not src.endswith("\n"):
            src += "\n"
        src += "identifiers:\n" + block
    p.write_text(src)
    print("  patched CITATION.cff")
PY
fi

echo "[2/5] Cross-linking sibling deposit docs"
apply_doi_block() {
  local file="$1" own="$2" sib1="$3" sib2="$4"
  if [[ ! -f "$file" ]]; then
    echo "  WARNING: $file missing, skipping" >&2
    return
  fi
  if grep -q '^## Published DOI' "$file"; then
    echo "  $(basename "$file"): already has Published DOI block, skipping"
    return
  fi
  cat >> "$file" <<EOF

## Published DOI

- Own DOI: $own
- Record: https://doi.org/$own
- Sibling (patent family): $sib1
- Sibling (patent family): $sib2
- Anchored: $(date -u +%Y-%m-%dT%H:%M:%SZ)
EOF
  echo "  appended Published DOI block to $(basename "$file")"
}

apply_doi_block "$EPRINT_DIR/zenodo-paper1.md" "$DOI1" "$DOI2" "$DOI3"
apply_doi_block "$EPRINT_DIR/zenodo-paper2.md" "$DOI2" "$DOI1" "$DOI3"
apply_doi_block "$EPRINT_DIR/zenodo-paper3.md" "$DOI3" "$DOI1" "$DOI2"

echo "[3/5] OpenTimestamps anchoring"
if command -v ots >/dev/null 2>&1; then
  for pdf in paper1-quantum-anonymization.pdf \
             paper2-csi-entropy-puek.pdf \
             paper3-che-are-provenance.pdf; do
    if [[ ! -f "$EPRINT_DIR/$pdf" ]]; then
      echo "  WARNING: $pdf not found, skipping"
      continue
    fi
    if [[ -f "$EPRINT_DIR/$pdf.ots" ]]; then
      echo "  $pdf.ots exists, skipping stamp"
    else
      (cd "$EPRINT_DIR" && ots stamp "$pdf")
      echo "  stamped $pdf"
    fi
  done
  echo "  Upgrade in ~1h: ots upgrade $EPRINT_DIR/*.ots"
else
  echo "  ots CLI not on PATH; install with:"
  echo "    micromamba activate zip-pqc && uv pip install opentimestamps-client"
fi

echo "[4/5] Staging diff"
git add CITATION.cff \
        "$EPRINT_DIR/zenodo-paper1.md" \
        "$EPRINT_DIR/zenodo-paper2.md" \
        "$EPRINT_DIR/zenodo-paper3.md" 2>/dev/null || true
# .ots files, if present
for ots_file in "$EPRINT_DIR"/paper1-quantum-anonymization.pdf.ots \
                "$EPRINT_DIR"/paper2-csi-entropy-puek.pdf.ots \
                "$EPRINT_DIR"/paper3-che-are-provenance.pdf.ots; do
  [[ -f "$ots_file" ]] && git add "$ots_file"
done
git status --short

echo "[5/5] Commit"
if git diff --cached --quiet; then
  echo "  nothing staged, skipping commit"
else
  git commit -m "docs(eprint): record Zenodo DOIs for 3-paper patent family

Paper 1 (Quantum-Certified Anonymization): $DOI1
Paper 2 (WiFi CSI Entropy / PUEK):        $DOI2
Paper 3 (CHE with ARE):                   $DOI3

Adds DOIs to CITATION.cff, appends Published DOI blocks to
sibling deposit docs, anchors PDFs via OpenTimestamps."
fi

echo
echo "Done. Manual follow-ups:"
echo "  1. Patch main.tex \\thanks{} in each paper's LaTeX source with its DOI."
echo "  2. In ~1h run: ots upgrade $EPRINT_DIR/*.ots"
echo "  3. git push when ready."
echo "  4. Submit each record to the 'open-science' Zenodo community if not already done."
