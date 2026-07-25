import assert from "node:assert/strict";
import test from "node:test";

import { buildDocument, formatTable } from "../scripts/lib/report.mjs";

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

test("table has header and rows", () => {
  const lines = formatTable([makeEntry("Order.process", 12, 45)]).split("\n");

  assert.equal(lines[0], "CRAP Report");
  assert.equal(lines[1], "===========");
  assert.deepEqual(lines[2].split(/\s+/).filter(Boolean), [
    "Function",
    "Module",
    "CC",
    "Cov%",
    "CRAP",
  ]);
  assert.match(lines[4], /Order\.process/);
  assert.match(lines[4], /45\.0%/);
  assert.match(lines[4], /36\.0/);
});

test("missing coverage prints not available", () => {
  const line = formatTable([makeEntry("unmeasured", 3, null)]).split("\n")[4];

  assert.equal(line.match(/N\/A/g).length, 2);
});

test("summary counts crappy entries", () => {
  const document = buildDocument({
    entries: [makeEntry("bad", 12, 0), makeEntry("good", 1, 100)],
    language: "typescript",
    paths: [],
    diffBase: null,
    generatedAt: "2026-07-24T19:40:00Z",
  });

  assert.deepEqual(document.summary, { functions: 2, crappy: 1, max_crap: 156.0 });
});

test("table and document round CRAP half up at the exact boundary", () => {
  const entry = makeEntry("boundary", 4, 75);
  const line = formatTable([entry]).split("\n")[4];

  assert.match(line, /4\.3/);

  const document = buildDocument({
    entries: [entry],
    language: "typescript",
    paths: [],
    diffBase: null,
    generatedAt: "2026-07-24T19:40:00Z",
  });

  assert.equal(document.entries[0].crap, 4.3);
});

test("entries are serialized in snake case and sorted", () => {
  const document = buildDocument({
    entries: [makeEntry("good", 1, 100), makeEntry("bad", 12, 0)],
    language: "typescript",
    paths: ["src"],
    diffBase: "main",
    generatedAt: "2026-07-24T19:40:00Z",
  });

  assert.equal(document.version, 1);
  assert.deepEqual(document.filters, { paths: ["src"], diff_base: "main" });
  assert.deepEqual(document.entries.map((entry) => entry.name), ["bad", "good"]);
  assert.equal(document.entries[0].start_line, 1);
  assert.equal(document.entries[0].covered_statements, 2);
});
