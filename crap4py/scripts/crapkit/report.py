from decimal import ROUND_HALF_UP, Decimal

from crapkit.score import CRAPPY_THRESHOLD, Entry, sort_entries

HEADER = f"{'Function':<30} {'Module':<35} {'CC':>4} {'Cov%':>7} {'CRAP':>8}"
ONE_DECIMAL = Decimal("0.1")


def round_half_up(value: float) -> float:
    return float(Decimal(str(value)).quantize(ONE_DECIMAL, rounding=ROUND_HALF_UP))


def format_table(entries: list[Entry]) -> str:
    lines = ["CRAP Report", "===========", HEADER, "-" * len(HEADER)]
    for entry in sort_entries(entries):
        lines.append(
            f"{entry.name:<30} {entry.module:<35} {entry.complexity:>4} "
            f"{_format_coverage(entry.coverage):>7} {_format_score(entry.crap):>8}"
        )
    lines.append("")
    return "\n".join(lines)


def _format_coverage(coverage: float | None) -> str:
    return "N/A" if coverage is None else f"{round_half_up(coverage):.1f}%"


def _format_score(score: float | None) -> str:
    return "N/A" if score is None else f"{round_half_up(score):.1f}"


def build_document(
    entries: list[Entry],
    language: str,
    paths: list[str],
    diff_base: str | None,
    generated_at: str,
) -> dict:
    ordered = sort_entries(entries)
    scores = [entry.crap for entry in ordered if entry.crap is not None]
    return {
        "version": 1,
        "language": language,
        "generated_at": generated_at,
        "filters": {"paths": paths, "diff_base": diff_base},
        "summary": {
            "functions": len(ordered),
            "crappy": sum(1 for score in scores if score >= CRAPPY_THRESHOLD),
            "max_crap": round_half_up(max(scores)) if scores else None,
        },
        "entries": [_serialize(entry) for entry in ordered],
    }


def _serialize(entry: Entry) -> dict:
    return {
        "name": entry.name,
        "module": entry.module,
        "file": entry.file,
        "start_line": entry.start_line,
        "end_line": entry.end_line,
        "complexity": entry.complexity,
        "coverage": None if entry.coverage is None else round_half_up(entry.coverage),
        "crap": None if entry.crap is None else round_half_up(entry.crap),
        "statements": entry.statements,
        "covered_statements": entry.covered_statements,
    }
