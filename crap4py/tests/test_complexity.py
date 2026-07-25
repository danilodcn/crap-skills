import subprocess

import pytest

from crapkit.complexity import Block, RadonError, parse_radon_report, run_radon

RADON_PAYLOAD = {
    "sample.py": [
        {
            "type": "class",
            "name": "Order",
            "lineno": 15,
            "endline": 23,
            "complexity": 3,
            "methods": [
                {
                    "type": "method",
                    "name": "process",
                    "classname": "Order",
                    "lineno": 16,
                    "endline": 19,
                    "complexity": 2,
                }
            ],
        },
        {
            "type": "method",
            "name": "process",
            "classname": "Order",
            "lineno": 16,
            "endline": 19,
            "complexity": 2,
        },
        {
            "type": "function",
            "name": "outer",
            "lineno": 25,
            "endline": 30,
            "complexity": 1,
            "closures": [
                {
                    "type": "function",
                    "name": "inner",
                    "lineno": 26,
                    "endline": 29,
                    "complexity": 2,
                    "closures": [],
                }
            ],
        },
    ]
}


def test_methods_are_not_duplicated_by_the_class_block():
    blocks = parse_radon_report(RADON_PAYLOAD)

    assert [block.name for block in blocks].count("Order.process") == 1


def test_class_blocks_are_discarded():
    blocks = parse_radon_report(RADON_PAYLOAD)

    assert "Order" not in [block.name for block in blocks]


def test_methods_are_qualified_by_class():
    blocks = parse_radon_report(RADON_PAYLOAD)

    assert Block("Order.process", "sample.py", 16, 19, 2) in blocks


def test_closures_are_qualified_by_parent():
    blocks = parse_radon_report(RADON_PAYLOAD)

    assert Block("outer.inner", "sample.py", 26, 29, 2) in blocks


def test_parent_complexity_excludes_the_closure():
    blocks = parse_radon_report(RADON_PAYLOAD)
    outer = next(block for block in blocks if block.name == "outer")

    assert outer.complexity == 1


def test_files_that_failed_to_parse_are_skipped():
    blocks = parse_radon_report({"broken.py": {"error": "invalid syntax"}})

    assert blocks == []


def test_missing_radon_names_the_install_command(monkeypatch):
    def missing(*args, **kwargs):
        raise FileNotFoundError

    monkeypatch.setattr(subprocess, "run", missing)

    with pytest.raises(RadonError, match="pip install"):
        run_radon(["sample.py"])
