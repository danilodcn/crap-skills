import json
import subprocess
from dataclasses import dataclass


class RadonError(RuntimeError):
    pass


@dataclass(frozen=True)
class Block:
    name: str
    file: str
    start_line: int
    end_line: int
    complexity: int


def parse_radon_report(payload: dict) -> list[Block]:
    blocks: list[Block] = []
    for path, items in payload.items():
        if not isinstance(items, list):
            continue
        for item in items:
            blocks.extend(_expand(path, item, parent=""))
    return blocks


def _expand(path: str, item: dict, parent: str) -> list[Block]:
    if item.get("type") == "class":
        return []
    name = _qualified_name(item, parent)
    blocks = [
        Block(
            name=name,
            file=path,
            start_line=item["lineno"],
            end_line=item["endline"],
            complexity=item["complexity"],
        )
    ]
    for closure in item.get("closures", []):
        blocks.extend(_expand(path, closure, parent=name))
    return blocks


def _qualified_name(item: dict, parent: str) -> str:
    if parent:
        return f"{parent}.{item['name']}"
    if item.get("classname"):
        return f"{item['classname']}.{item['name']}"
    return item["name"]


def run_radon(paths: list[str]) -> list[Block]:
    if not paths:
        return []
    try:
        result = subprocess.run(
            ["radon", "cc", "-j", *paths],
            capture_output=True,
            text=True,
        )
    except FileNotFoundError as missing:
        raise RadonError(
            'radon is not installed; run: pip install "radon>=6.0"'
        ) from missing
    if result.returncode != 0:
        raise RadonError(result.stderr.strip() or "radon failed")
    return parse_radon_report(json.loads(result.stdout))
