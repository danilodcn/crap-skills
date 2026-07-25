#!/usr/bin/env python3
import sys
from pathlib import Path

PYTHON_MARKERS = ("pyproject.toml", "setup.py", "setup.cfg")


def detect_languages(root: Path) -> list[str]:
    languages = []
    if any((root / marker).exists() for marker in PYTHON_MARKERS):
        languages.append("python")
    if (root / "package.json").exists() and (root / "tsconfig.json").exists():
        languages.append("typescript")
    return languages


if __name__ == "__main__":
    found = detect_languages(Path("."))
    if not found:
        print("no Python or TypeScript project detected", file=sys.stderr)
        sys.exit(1)
    print("\n".join(found))
