"""Conftest for the messenger pillar tests.

Forces the in-tree `src/` path to take precedence over any stale
`zipminator` wheel that may be installed in the active environment.
Without this, full-suite pytest runs (when other modules trigger
`import zipminator.*` first) end up loading a frozen site-packages
copy and the marathon-spec route `/ws/signal/{user_id}` is missing.

This file is collected before any test module in `tests/messenger/`,
so doing the path manipulation + (re)load here guarantees every
messenger test sees the current source.
"""

from __future__ import annotations

import importlib
import sys
from pathlib import Path


_REPO_ROOT = Path(__file__).resolve().parent.parent.parent
_SRC = _REPO_ROOT / "src"


def _ensure_src_on_path() -> None:
    """Prepend `<repo>/src` to sys.path so the in-tree zipminator wins
    over any installed wheel."""
    src_str = str(_SRC)
    if src_str in sys.path:
        sys.path.remove(src_str)
    sys.path.insert(0, src_str)


def _reload_signaling_server() -> None:
    """If a stale `zipminator.messenger.signaling_server` is already
    cached in `sys.modules` (because another test imported it from
    site-packages first), reload it from the in-tree source."""
    name = "zipminator.messenger.signaling_server"
    mod = sys.modules.get(name)
    target = _SRC / "zipminator" / "messenger" / "signaling_server.py"
    if mod is not None and getattr(mod, "__file__", None) != str(target):
        # Drop the stale module + any stale parents.
        for key in list(sys.modules):
            if key == name or key.startswith(name + "."):
                sys.modules.pop(key, None)
    # Also drop the parent packages so re-import resolves to in-tree.
    for parent in (
        "zipminator.messenger.signaling_server",
        "zipminator.messenger",
        "zipminator",
    ):
        cur = sys.modules.get(parent)
        if cur is not None:
            cur_file = getattr(cur, "__file__", "") or ""
            if not cur_file.startswith(str(_REPO_ROOT)):
                sys.modules.pop(parent, None)


_ensure_src_on_path()
_reload_signaling_server()
