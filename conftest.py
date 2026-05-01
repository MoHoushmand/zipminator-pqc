"""Root conftest for Zipminator test suite.

Skips test directories conditionally:
- tests/mcp: always skipped (requires running MCP server context)
- tests/email_kms: skipped ONLY when fakeredis is unavailable. test_kms.py
  prefers fakeredis and falls back to real Redis on localhost:6380, so the
  suite is collectable on any machine that has either available.
"""

collect_ignore_glob = ["tests/mcp/*"]

try:
    import fakeredis  # noqa: F401
except ImportError:
    collect_ignore_glob.append("tests/email_kms/*")
