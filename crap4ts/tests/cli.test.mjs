import assert from "node:assert/strict";
import test from "node:test";

import { parseArgs } from "../scripts/lib/cli.mjs";

test("bare paths become filters", () => {
  assert.deepEqual(parseArgs(["src", "lib"]).paths, ["src", "lib"]);
});

test("test command is captured", () => {
  assert.equal(parseArgs(["--test-command", "vitest run"]).testCommand, "vitest run");
});

test("diff base is captured", () => {
  assert.equal(parseArgs(["--diff", "main"]).diffBase, "main");
});

test("json only is a flag", () => {
  assert.equal(parseArgs(["--json-only"]).jsonOnly, true);
});

test("help is requested", () => {
  assert.equal(parseArgs(["-h"]).helpRequested, true);
});

test("missing values are errors", () => {
  assert.equal(parseArgs(["--diff"]).error, "--diff requires a base revision");
  assert.equal(parseArgs(["--test-command"]).error, "--test-command requires a command");
});

test("defaults are empty", () => {
  const options = parseArgs([]);

  assert.deepEqual(options.paths, []);
  assert.equal(options.testCommand, null);
  assert.equal(options.diffBase, null);
  assert.equal(options.jsonOnly, false);
  assert.equal(options.error, null);
});
