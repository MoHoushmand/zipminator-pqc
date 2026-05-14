"""Strip Plotly-injected MathJax 2.7.5 <script> tags from built notebook HTML.

These tags overwrite the page-level MathJax 3 (loaded by jupyter-book's
sphinx_book_theme) with MathJax 2, which then fails to typeset the prose
math and throws an `insertBefore` NotFoundError. Plotly charts themselves
don't need MathJax to render their bar/line graphics."""
from pathlib import Path
import re
import sys

# Match the Plotly-emitted MathJax-2 loader and its sibling Hub.Config call.
mj2_loader = re.compile(
    r'<script src="https://cdnjs\.cloudflare\.com/ajax/libs/mathjax/2\.7\.5/MathJax\.js[^"]*"></script>'
)
mj2_hub_config = re.compile(
    r'<script>if \(window\.MathJax && window\.MathJax\.Hub && window\.MathJax\.Hub\.Config\)[^<]*</script>'
)

# Plotly also injects `window.PlotlyConfig = {MathJaxConfig: 'local'}`. That
# one is harmless (just a config flag) so we keep it.

root = Path(sys.argv[1])
total_strips = 0
files_touched = 0
for nb in sorted(root.glob("*.html")):
    src = nb.read_text(encoding="utf-8")
    new = mj2_loader.sub("", src)
    new = mj2_hub_config.sub("", new)
    if new != src:
        nb.write_text(new, encoding="utf-8")
        strips = len(mj2_loader.findall(src)) + len(mj2_hub_config.findall(src))
        total_strips += strips
        files_touched += 1
        print(f"  {nb.name}: stripped {strips} tags")
print(f"done: {files_touched} files, {total_strips} script tags removed")
