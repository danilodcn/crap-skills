from crapkit.report import build_document, format_table
from crapkit.score import Entry


def make_entry(name, complexity, coverage):
    return Entry(
        name=name,
        module="src.sample",
        file="src/sample.py",
        start_line=1,
        end_line=9,
        complexity=complexity,
        coverage=coverage,
        statements=4,
        covered_statements=2,
    )


def test_table_has_header_and_rows():
    table = format_table([make_entry("Order.process", 12, 45.0)])
    lines = table.splitlines()

    assert lines[0] == "CRAP Report"
    assert lines[1] == "==========="
    assert lines[2].split() == ["Function", "Module", "CC", "Cov%", "CRAP"]
    assert "Order.process" in lines[4]
    assert "45.0%" in lines[4]
    assert "36.0" in lines[4]


def test_missing_coverage_prints_not_available():
    table = format_table([make_entry("unmeasured", 3, None)])

    assert table.splitlines()[4].count("N/A") == 2


def test_document_summary_counts_crappy_entries():
    document = build_document(
        entries=[make_entry("bad", 12, 0.0), make_entry("good", 1, 100.0)],
        language="python",
        paths=[],
        diff_base=None,
        generated_at="2026-07-24T19:40:00Z",
    )

    assert document["summary"] == {
        "functions": 2,
        "crappy": 1,
        "max_crap": 156.0,
    }


def test_document_entries_are_sorted_worst_first():
    document = build_document(
        entries=[make_entry("good", 1, 100.0), make_entry("bad", 12, 0.0)],
        language="python",
        paths=[],
        diff_base=None,
        generated_at="2026-07-24T19:40:00Z",
    )

    assert [entry["name"] for entry in document["entries"]] == ["bad", "good"]


def test_document_records_filters_and_version():
    document = build_document(
        entries=[],
        language="python",
        paths=["src"],
        diff_base="main",
        generated_at="2026-07-24T19:40:00Z",
    )

    assert document["version"] == 1
    assert document["filters"] == {"paths": ["src"], "diff_base": "main"}
    assert document["summary"]["max_crap"] is None
