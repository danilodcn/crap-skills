import assert from "node:assert/strict";
import test from "node:test";

import { changedRanges, parseHunks, touches } from "../scripts/lib/diffscope.mjs";

const DIFF = `diff --git a/src/a.ts b/src/a.ts
--- a/src/a.ts
+++ b/src/a.ts
@@ -41 +41 @@ function run() {
-    old
+    new
@@ -62,0 +63,14 @@ function other() {
+    added
diff --git a/src/b.ts b/src/b.ts
--- a/src/b.ts
+++ b/src/b.ts
@@ -10,4 +10,0 @@ function gone() {
-    removed
`;

test("omitted count means one line", () => {
  assert.deepEqual(parseHunks(DIFF).get("src/a.ts")[0], [41, 41]);
});

test("explicit count spans the range", () => {
  assert.deepEqual(parseHunks(DIFF).get("src/a.ts")[1], [63, 76]);
});

test("pure deletion collapses to a point", () => {
  assert.deepEqual(parseHunks(DIFF).get("src/b.ts"), [[10, 10]]);
});

test("deleted files are ignored", () => {
  const diff = "--- a/gone.ts\n+++ /dev/null\n@@ -1,3 +0,0 @@\n-x\n";

  assert.equal(parseHunks(diff).size, 0);
});

test("overlap detection", () => {
  assert.equal(touches([[63, 76]], 60, 70), true);
  assert.equal(touches([[63, 76]], 10, 20), false);
  assert.equal(touches([[65, 65]], 60, 90), true);
});

test("changed ranges builds the three dot command and parses the output", () => {
  const calls = [];
  const run = (file, args) => {
    calls.push({ file, args });
    return "--- a/src/a.ts\n+++ b/src/a.ts\n@@ -1 +5,2 @@\n+added\n";
  };

  const ranges = changedRanges("main", [".ts"], run);

  assert.deepEqual(calls[0].args, [
    "diff",
    "--unified=0",
    "main...HEAD",
    "--",
    "*.ts",
  ]);
  assert.deepEqual(ranges.get("src/a.ts"), [[5, 6]]);
});
