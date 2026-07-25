from crapkit.complexity import Block
from crapkit.coverage_data import FunctionCoverage, normalize_path
from crapkit.score import Entry


def module_name(path: str) -> str:
    return normalize_path(path).removesuffix(".py").replace("/", ".")


def build_entries(
    blocks: list[Block],
    coverage: dict[str, dict[int, FunctionCoverage]],
) -> list[Entry]:
    entries: list[Entry] = []
    for block in blocks:
        path = normalize_path(block.file)
        functions = coverage.get(path)
        measured = None if functions is None else functions.get(block.start_line)
        entries.append(
            Entry(
                name=block.name,
                module=module_name(path),
                file=path,
                start_line=block.start_line,
                end_line=block.end_line,
                complexity=block.complexity,
                coverage=_coverage_of(functions, measured),
                statements=measured.statements if measured else 0,
                covered_statements=measured.covered if measured else 0,
            )
        )
    return entries


def _coverage_of(
    functions: dict[int, FunctionCoverage] | None,
    measured: FunctionCoverage | None,
) -> float | None:
    if functions is None:
        return None
    if measured is None:
        return 0.0
    return measured.percent
