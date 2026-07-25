#!/usr/bin/env python3
import json
import shutil
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

from crapkit.analyzer import build_entries
from crapkit.cli import HELP_MESSAGE, Options, parse_args
from crapkit.complexity import RadonError, run_radon
from crapkit.coverage_data import CoverageFormatError, load_coverage_report
from crapkit.diffscope import GitError, changed_ranges, touches
from crapkit.report import build_document, format_table
from crapkit.score import Entry

OUTPUT_DIR = Path("target/crap")
COVERAGE_JSON = OUTPUT_DIR / "coverage.json"
REPORT_JSON = OUTPUT_DIR / "report.json"
DEFAULT_TEST_COMMAND = "coverage run -m pytest"
EXCLUDED_DIRECTORIES = {".git", ".venv", "venv", "target", "node_modules", "__pycache__"}


def main(argv: list[str]) -> int:
    options = parse_args(argv)
    if options.help_requested:
        print(HELP_MESSAGE)
        return 0
    if options.error:
        print(f"{options.error}\n\n{HELP_MESSAGE}", file=sys.stderr)
        return 1
    try:
        return run(options)
    except (RadonError, CoverageFormatError, GitError) as failure:
        print(str(failure), file=sys.stderr)
        return 1


def run(options: Options) -> int:
    shutil.rmtree(OUTPUT_DIR, ignore_errors=True)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    run_tests(options.test_command or DEFAULT_TEST_COMMAND)
    export_coverage()
    if not COVERAGE_JSON.exists():
        print("the test suite produced no coverage report", file=sys.stderr)
        return 1
    entries = collect_entries(options)
    document = build_document(
        entries=entries,
        language="python",
        paths=options.paths,
        diff_base=options.diff_base,
        generated_at=datetime.now(timezone.utc).isoformat(timespec="seconds"),
    )
    REPORT_JSON.write_text(json.dumps(document, indent=2) + "\n")
    if not options.json_only:
        print(format_table(entries), end="")
    print(f"JSON report written to {REPORT_JSON}", file=sys.stderr)
    return 0


def run_tests(command: str) -> None:
    result = subprocess.run(command, shell=True)
    if result.returncode != 0:
        print(
            "the test suite failed; coverage numbers may be understated",
            file=sys.stderr,
        )


def export_coverage() -> None:
    try:
        subprocess.run(
            ["coverage", "json", "-o", str(COVERAGE_JSON)],
            capture_output=True,
            text=True,
        )
    except FileNotFoundError as missing:
        raise CoverageFormatError(
            'coverage is not installed; run: pip install "coverage>=7.15"'
        ) from missing


def collect_entries(options: Options) -> list[Entry]:
    sources = find_sources(options.paths)
    entries = build_entries(run_radon(sources), load_coverage_report(COVERAGE_JSON))
    if options.diff_base is None:
        return entries
    ranges = changed_ranges(options.diff_base, [".py"])
    return [
        entry
        for entry in entries
        if touches(ranges.get(entry.file, []), entry.start_line, entry.end_line)
    ]


def find_sources(filters: list[str]) -> list[str]:
    sources = []
    for path in sorted(Path(".").rglob("*.py")):
        parts = set(path.parts)
        if parts & EXCLUDED_DIRECTORIES or path.name.startswith("test_"):
            continue
        text = path.as_posix()
        if filters and not any(fragment in text for fragment in filters):
            continue
        sources.append(text)
    return sources


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
