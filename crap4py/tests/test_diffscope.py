from crapkit.diffscope import parse_hunks, touches

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
