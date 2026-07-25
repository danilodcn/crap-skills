import json
from dataclasses import dataclass
from pathlib import Path


class CoverageFormatError(RuntimeError):
    pass


@dataclass(frozen=True)
class FunctionCoverage:
    percent: float
    statements: int
    covered: int


def normalize_path(path: str) -> str:
    return path.replace("\\", "/").removeprefix("./")


def parse_coverage_report(payload: dict) -> dict[str, dict[int, FunctionCoverage]]:
    report: dict[str, dict[int, FunctionCoverage]] = {}
    for path, data in payload.get("files", {}).items():
        if "functions" not in data:
            raise CoverageFormatError(
                "coverage report has no per-function data; "
                "coverage>=7.15 is required"
            )
        by_line: dict[int, FunctionCoverage] = {}
        for name, function in data["functions"].items():
            if name == "":
                continue
            summary = function["summary"]
            by_line[function["start_line"]] = FunctionCoverage(
                percent=summary["percent_covered"],
                statements=summary["num_statements"],
                covered=summary["covered_lines"],
            )
        report[normalize_path(path)] = by_line
    return report


def load_coverage_report(path: Path) -> dict[str, dict[int, FunctionCoverage]]:
    return parse_coverage_report(json.loads(path.read_text()))
