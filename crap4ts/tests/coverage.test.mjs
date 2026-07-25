import assert from "node:assert/strict";
import test from "node:test";

import { coverageForRange, parseCoverageReport } from "../scripts/lib/coverage.mjs";

const REPORT = {
  "/project/src/orders.ts": {
    path: "/project/src/orders.ts",
    statementMap: {
      0: { start: { line: 2 }, end: { line: 2 } },
      1: { start: { line: 3 }, end: { line: 3 } },
      2: { start: { line: 8 }, end: { line: 8 } },
    },
    s: { 0: 1, 1: 0, 2: 5 },
  },
};

test("statements are indexed by project relative path", () => {
  const parsed = parseCoverageReport(REPORT, "/project");

  assert.ok(parsed.has("src/orders.ts"));
  assert.equal(parsed.get("src/orders.ts").length, 3);
});

test("coverage is the share of covered statements in range", () => {
  const statements = parseCoverageReport(REPORT, "/project").get("src/orders.ts");

  const result = coverageForRange(statements, 1, 5, []);

  assert.equal(result.statements, 2);
  assert.equal(result.covered, 1);
  assert.equal(result.coverage, 50);
});

test("a range without statements reports zero", () => {
  const statements = parseCoverageReport(REPORT, "/project").get("src/orders.ts");

  assert.deepEqual(coverageForRange(statements, 20, 30, []), {
    coverage: 0,
    statements: 0,
    covered: 0,
  });
});

test("statements inside nested functions are excluded from the parent", () => {
  const statements = parseCoverageReport(REPORT, "/project").get("src/orders.ts");

  const result = coverageForRange(statements, 1, 10, [[3, 8]]);

  assert.equal(result.statements, 1);
  assert.equal(result.covered, 1);
  assert.equal(result.coverage, 100);
});
