from crapkit.cli import parse_args


def test_bare_paths_become_filters():
    assert parse_args(["src", "lib"]).paths == ["src", "lib"]


def test_test_command_is_captured():
    assert parse_args(["--test-command", "pytest -k unit"]).test_command == "pytest -k unit"


def test_diff_base_is_captured():
    assert parse_args(["--diff", "main"]).diff_base == "main"


def test_json_only_is_a_flag():
    assert parse_args(["--json-only"]).json_only is True


def test_help_is_requested():
    assert parse_args(["-h"]).help_requested is True


def test_missing_diff_value_is_an_error():
    assert parse_args(["--diff"]).error == "--diff requires a base revision"


def test_missing_test_command_value_is_an_error():
    assert parse_args(["--test-command"]).error == "--test-command requires a command"


def test_defaults_are_empty():
    options = parse_args([])

    assert options.paths == []
    assert options.test_command is None
    assert options.diff_base is None
    assert options.json_only is False
    assert options.error is None
