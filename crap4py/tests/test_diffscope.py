from types import SimpleNamespace

import pytest

from crapkit.diffscope import GitError, changed_ranges, parse_hunks, touches

DIFF = """diff --git a/src/a.py b/src/a.py
--- a/src/a.py
+++ b/src/a.py
@@ -41 +41 @@ def run():
-    old
+    new
@@ -62,0 +63,14 @@ def other():
+    added
diff --git a/src/b.py b/src/b.py
--- a/src/b.py
+++ b/src/b.py
@@ -10,4 +10,0 @@ def gone():
-    removed
"""


def test_omitted_count_means_one_line():
    assert (41, 41) in parse_hunks(DIFF)["src/a.py"]


def test_explicit_count_spans_the_range():
    assert (63, 76) in parse_hunks(DIFF)["src/a.py"]


def test_pure_deletion_collapses_to_a_point():
    assert parse_hunks(DIFF)["src/b.py"] == [(10, 10)]


def test_deleted_files_are_ignored():
    diff = "--- a/gone.py\n+++ /dev/null\n@@ -1,3 +0,0 @@\n-x\n"

    assert parse_hunks(diff) == {}


def test_function_overlapping_a_hunk_is_touched():
    assert touches([(63, 76)], 60, 70) is True


def test_function_outside_every_hunk_is_not_touched():
    assert touches([(63, 76)], 10, 20) is False


def test_function_containing_a_hunk_is_touched():
    assert touches([(65, 65)], 60, 90) is True


def test_changed_ranges_builds_correct_command(monkeypatch):
    captured_args = None

    def fake_run(args, **kwargs):
        nonlocal captured_args
        captured_args = args
        diff_output = (
            "diff --git a/example.py b/example.py\n"
            "--- a/example.py\n"
            "+++ b/example.py\n"
            "@@ -10,3 +10,5 @@\n"
            " context\n"
            "-old\n"
            "+new\n"
            " context\n"
        )
        return SimpleNamespace(returncode=0, stdout=diff_output, stderr="")

    monkeypatch.setattr("subprocess.run", fake_run)

    result = changed_ranges("main", [".py"])

    assert "git" in captured_args
    assert "diff" in captured_args
    assert "--unified=0" in captured_args
    assert "main...HEAD" in captured_args
    assert "--" in captured_args
    assert "*.py" in captured_args

    assert "example.py" in result
    assert (10, 14) in result["example.py"]


def test_changed_ranges_raises_on_git_error(monkeypatch):
    def fake_run(args, **kwargs):
        return SimpleNamespace(returncode=1, stdout="", stderr="error message")

    monkeypatch.setattr("subprocess.run", fake_run)

    with pytest.raises(GitError):
        changed_ranges("main", [".py"])
