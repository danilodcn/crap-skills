from dataclasses import dataclass

CRAPPY_THRESHOLD = 30.0


def crap_score(complexity: int, coverage: float | None) -> float | None:
    if coverage is None:
        return None
    uncovered = 1.0 - coverage / 100.0
    return complexity**2 * uncovered**3 + complexity


@dataclass(frozen=True)
class Entry:
    name: str
    module: str
    file: str
    start_line: int
    end_line: int
    complexity: int
    coverage: float | None
    statements: int
    covered_statements: int

    @property
    def crap(self) -> float | None:
        return crap_score(self.complexity, self.coverage)


def sort_entries(entries: list[Entry]) -> list[Entry]:
    def key(entry: Entry) -> tuple[bool, float, str]:
        score = entry.crap
        return (score is None, -score if score is not None else 0.0, entry.name)

    return sorted(entries, key=key)
