import pytest

from crapkit.coverage_data import (
    CoverageFormatError,
    FunctionCoverage,
    normalize_path,
    parse_coverage_report,
)

COVERAGE_PAYLOAD = {
    "files": {
        "./sample.py": {
            "functions": {
                "Order.process": {
                    "start_line": 16,
                    "summary": {
                        "num_statements": 3,
                        "covered_lines": 2,
                        "percent_covered": 66.66666666666667,
                    },
                },
                "": {
                    "start_line": 1,
                    "summary": {
                        "num_statements": 10,
                        "covered_lines": 10,
                        "percent_covered": 100.0,
                    },
                },
            }
        }
    }
}


def test_functions_are_indexed_by_file_and_start_line():
    report = parse_coverage_report(COVERAGE_PAYLOAD)

    assert report["sample.py"][16] == FunctionCoverage(
        percent=pytest.approx(66.66666666666667), statements=3, covered=2
    )


def test_module_level_block_is_discarded():
    report = parse_coverage_report(COVERAGE_PAYLOAD)

    assert 1 not in report["sample.py"]


def test_leading_dot_slash_is_stripped():
    assert normalize_path("./src/a.py") == "src/a.py"


def test_backslashes_are_normalized():
    assert normalize_path("src\\a.py") == "src/a.py"


def test_missing_functions_key_is_rejected():
    with pytest.raises(CoverageFormatError):
        parse_coverage_report({"files": {"sample.py": {}}})
