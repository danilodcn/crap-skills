import assert from "node:assert/strict";
import test from "node:test";

import { buildEntries, moduleName } from "../scripts/lib/analyzer.mjs";

const functions = [
  { name: "outer", file: "src/orders.ts", startLine: 1, endLine: 10, complexity: 1 },
  { name: "<anonymous>:3", file: "src/orders.ts", startLine: 3, endLine: 6, complexity: 2 },
];

const statements = [
  { line: 2, covered: true },
  { line: 4, covered: false },
  { line: 8, covered: true },
];

test("module name drops the extension", () => {
  assert.equal(moduleName("src/billing/order.ts"), "src/billing/order");
});

test("module name drops the .vue extension", () => {
  assert.equal(moduleName("src/billing/Invoice.vue"), "src/billing/Invoice");
});

test("parent coverage excludes statements of nested functions", () => {
  const entries = buildEntries(functions, new Map([["src/orders.ts", statements]]));
  const outer = entries.find((entry) => entry.name === "outer");

  assert.equal(outer.statements, 2);
  assert.equal(outer.coverage, 100);
});

test("nested function keeps its own statements", () => {
  const entries = buildEntries(functions, new Map([["src/orders.ts", statements]]));
  const nested = entries.find((entry) => entry.name === "<anonymous>:3");

  assert.equal(nested.statements, 1);
  assert.equal(nested.coverage, 0);
});

test("file missing from the coverage report yields null coverage", () => {
  const entries = buildEntries(functions, new Map());

  assert.equal(entries[0].coverage, null);
});
