"""Scan tracked-style source files without printing secret values."""

from pathlib import Path
import re, sys

patterns = [
    r"GOCSPX-[A-Za-z0-9_-]{20,}",
    r"1//[A-Za-z0-9_-]{40,}",
    r"-----BEGIN (?:RSA |OPENSSH )?PRIVATE KEY-----",
    r"gh[pousr]_[A-Za-z0-9]{30,}",
]
skip = {
    "node_modules",
    ".git",
    ".next",
    ".venv",
    "__pycache__",
    "dist",
    ".wrangler",
    ".sites-runtime",
}
failures = []
for p in Path(".").rglob("*"):
    if (
        not p.is_file()
        or any(x in skip for x in p.parts)
        or p.suffix not in {".py", ".ts", ".tsx", ".json", ".md", ".yml", ".env"}
    ):
        continue
    text = p.read_text(errors="ignore")
    if any(re.search(pattern, text) for pattern in patterns):
        failures.append(str(p))
for name in failures:
    print("Possible credential in:", name)
sys.exit(bool(failures))
