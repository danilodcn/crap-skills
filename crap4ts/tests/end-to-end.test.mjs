import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE = path.join(here, "fixtures", "sample-project");
const SCRIPT = path.join(here, "..", "scripts", "crap_ts.mjs");

test("report ranks the untested complex function first", () => {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), "crap4ts-"));
  fs.cpSync(FIXTURE, project, { recursive: true });

  const coveragePath = path.join(project, "coverage", "coverage-final.json");
  fs.writeFileSync(
    coveragePath,
    fs.readFileSync(coveragePath, "utf8").replaceAll("PROJECT_ROOT", project),
  );

  execFileSync(process.execPath, [SCRIPT, "--test-command", "true"], {
    cwd: project,
    encoding: "utf8",
  });

  const document = JSON.parse(
    fs.readFileSync(path.join(project, "target", "crap", "report.json"), "utf8"),
  );

  assert.equal(document.entries[0].name, "process");
  assert.equal(document.entries[0].complexity, 5);
  assert.equal(document.entries[0].coverage, 0);
  assert.equal(document.entries[0].crap, 30);
  assert.equal(document.entries[0].statements, 5);
  assert.equal(document.language, "typescript");
});
