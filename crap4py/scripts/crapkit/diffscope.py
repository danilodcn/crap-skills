import re
import subprocess

FILE_HEADER = re.compile(r"^\+\+\+ (?:b/)?(.+)$")
HUNK_HEADER = re.compile(r"^@@ -\S+ \+(\d+)(?:,(\d+))? @@")


class GitError(RuntimeError):
    pass


def parse_hunks(diff_text: str) -> dict[str, list[tuple[int, int]]]:
    ranges: dict[str, list[tuple[int, int]]] = {}
    current: str | None = None
    for line in diff_text.splitlines():
        header = FILE_HEADER.match(line)
        if header:
            path = header.group(1).strip()
            current = None if path == "/dev/null" else path
            continue
        hunk = HUNK_HEADER.match(line)
        if hunk and current:
            start = int(hunk.group(1))
            count = 1 if hunk.group(2) is None else int(hunk.group(2))
            end = start if count == 0 else start + count - 1
            ranges.setdefault(current, []).append((start, end))
    return ranges


def touches(ranges: list[tuple[int, int]], start_line: int, end_line: int) -> bool:
    return any(start <= end_line and end >= start_line for start, end in ranges)


def changed_ranges(base: str, extensions: list[str]) -> dict[str, list[tuple[int, int]]]:
    patterns = [f"*{extension}" for extension in extensions]
    result = subprocess.run(
        ["git", "diff", "--unified=0", f"{base}...HEAD", "--", *patterns],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        raise GitError(result.stderr.strip() or f"git diff against {base} failed")
    return parse_hunks(result.stdout)
