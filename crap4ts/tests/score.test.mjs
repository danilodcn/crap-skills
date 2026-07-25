import assert from "node:assert/strict";
import test from "node:test";

import { CRAPPY_THRESHOLD, crapScore, sortEntries } from "../scripts/lib/score.mjs";

const makeEntry = (name, complexity, coverage) => ({
  name,
  module: "src/sample",
  file: "src/sample.ts",
  startLine: 1,
  endLine: 9,
  complexity,
  coverage,
  statements: 4,
  coveredStatements: 2,
});

test("crap score matches the reference table", () => {
  const cases = [
    [1, 100, 1.0],
    [3, 100, 3.0],
    [10, 80, 10.8],
    [12, 45, 36.0],
    [5, 0, 30.0],
    [12, 0, 156.0],
  ];
  for (const [complexity, coverage, expected] of cases) {
    assert.ok(Math.abs(crapScore(complexity, coverage) - expected) < 0.05);
  }
});

test("crap score is null without coverage", () => {
  assert.equal(crapScore(5, null), null);
});

test("sort puts worst first and unmeasured last", () => {
  const entries = [
    makeEntry("clean", 1, 100),
    makeEntry("unmeasured", 9, null),
    makeEntry("crappy", 12, 0),
  ];

  assert.deepEqual(sortEntries(entries).map((entry) => entry.name), [
    "crappy",
    "clean",
    "unmeasured",
  ]);
});

test("sort breaks ties by name", () => {
  const entries = [makeEntry("beta", 5, 0), makeEntry("alpha", 5, 0)];

  assert.deepEqual(sortEntries(entries).map((entry) => entry.name), ["alpha", "beta"]);
});

test("crappy threshold is thirty", () => {
  assert.equal(CRAPPY_THRESHOLD, 30);
});

test("sort breaks ties by code-point name order, not locale order", () => {
  const entries = [
    makeEntry("Order.process", 5, 0),
    makeEntry("order.other", 5, 0),
    makeEntry("_private", 5, 0),
    makeEntry("abc", 5, 0),
    makeEntry("ABC", 5, 0),
  ];

  assert.deepEqual(sortEntries(entries).map((entry) => entry.name), [
    "ABC",
    "Order.process",
    "_private",
    "abc",
    "order.other",
  ]);
});
