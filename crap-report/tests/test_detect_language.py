import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))

from detect_language import detect_languages


def test_pyproject_means_python(tmp_path):
    (tmp_path / "pyproject.toml").write_text("")

    assert detect_languages(tmp_path) == ["python"]


def test_setup_py_means_python(tmp_path):
    (tmp_path / "setup.py").write_text("")

    assert detect_languages(tmp_path) == ["python"]


def test_tsconfig_means_typescript(tmp_path):
    (tmp_path / "package.json").write_text("{}")
    (tmp_path / "tsconfig.json").write_text("{}")

    assert detect_languages(tmp_path) == ["typescript"]


def test_package_json_without_tsconfig_is_not_typescript(tmp_path):
    (tmp_path / "package.json").write_text("{}")

    assert detect_languages(tmp_path) == []


def test_monorepo_reports_both(tmp_path):
    (tmp_path / "pyproject.toml").write_text("")
    (tmp_path / "package.json").write_text("{}")
    (tmp_path / "tsconfig.json").write_text("{}")

    assert detect_languages(tmp_path) == ["python", "typescript"]


def test_empty_directory_reports_nothing(tmp_path):
    assert detect_languages(tmp_path) == []
