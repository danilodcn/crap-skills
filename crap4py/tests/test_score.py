import pytest

from crapkit.score import CRAPPY_THRESHOLD, Entry, crap_score, sort_entries


def make_entry(name, complexity, coverage):
    return Entry(
        name=name,
        module="sample",
        file="sample.py",
        start_line=1,
        end_line=2,
        complexity=complexity,
        coverage=coverage,
        statements=0,
        covered_statements=0,
    )


@pytest.mark.parametrize(
    "complexity,coverage,expected",
    [
        (1, 100.0, 1.0),
        (3, 100.0, 3.0),
        (10, 80.0, 10.8),
        (12, 45.0, 36.0),
        (5, 0.0, 30.0),
        (12, 0.0, 156.0),
    ],
)
def test_crap_score_matches_formula(complexity, coverage, expected):
    assert crap_score(complexity, coverage) == pytest.approx(expected, abs=0.05)


def test_crap_score_is_none_without_coverage():
    assert crap_score(5, None) is None


def test_entry_exposes_crap():
    assert make_entry("a", 5, 0.0).crap == pytest.approx(30.0)


def test_sort_puts_worst_first_and_missing_last():
    entries = [
        make_entry("clean", 1, 100.0),
        make_entry("unmeasured", 9, None),
        make_entry("crappy", 12, 0.0),
    ]

    assert [entry.name for entry in sort_entries(entries)] == [
        "crappy",
        "clean",
        "unmeasured",
    ]


def test_sort_breaks_ties_by_name():
    entries = [make_entry("beta", 5, 0.0), make_entry("alpha", 5, 0.0)]

    assert [entry.name for entry in sort_entries(entries)] == ["alpha", "beta"]


def test_crappy_threshold_is_thirty():
    assert CRAPPY_THRESHOLD == 30.0
