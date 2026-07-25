import pytest

from crapkit.analyzer import build_entries, module_name
from crapkit.complexity import Block
from crapkit.coverage_data import FunctionCoverage


def test_module_name_is_derived_from_path():
    assert module_name("src/billing/order.py") == "src.billing.order"


def test_entry_takes_coverage_from_matching_start_line():
    blocks = [Block("process", "sample.py", 16, 19, 2)]
    coverage = {"sample.py": {16: FunctionCoverage(66.0, 3, 2)}}

    entry = build_entries(blocks, coverage)[0]

    assert (entry.coverage, entry.statements, entry.covered_statements) == (66.0, 3, 2)


def test_unmeasured_file_yields_null_coverage():
    blocks = [Block("process", "sample.py", 16, 19, 2)]

    entry = build_entries(blocks, {})[0]

    assert entry.coverage is None
    assert entry.crap is None


def test_measured_file_without_the_function_yields_zero():
    blocks = [Block("process", "sample.py", 16, 19, 2)]
    coverage = {"sample.py": {}}

    entry = build_entries(blocks, coverage)[0]

    assert entry.coverage == 0.0
    assert entry.crap == pytest.approx(6.0)


def test_paths_are_normalized_before_matching():
    blocks = [Block("process", "./sample.py", 16, 19, 2)]
    coverage = {"sample.py": {16: FunctionCoverage(50.0, 2, 1)}}

    assert build_entries(blocks, coverage)[0].coverage == 50.0
