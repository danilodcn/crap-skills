#!/usr/bin/env node
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import { buildEntries } from "./lib/analyzer.mjs";
import { HELP_MESSAGE, parseArgs } from "./lib/cli.mjs";
import { extractFunctions, loadTypeScript } from "./lib/complexity.mjs";
import { parseCoverageReport } from "./lib/coverage.mjs";
import { changedRanges, touches } from "./lib/diffscope.mjs";
import { buildDocument, formatTable } from "./lib/report.mjs";

const OUTPUT_DIR = "target/crap";
const REPORT_JSON = path.join(OUTPUT_DIR, "report.json");
const COVERAGE_JSON = "coverage/coverage-final.json";
const SOURCE_PATTERN = /\.(ts|tsx|mts|cts)$/;
const EXCLUDED = new Set(["node_modules", "dist", "build", "target", ".git", "coverage"]);
const TEST_PATTERN = /\.(test|spec)\.[cm]?tsx?$|\.d\.ts$/;

function detectTestCommand(projectRoot) {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(projectRoot, "package.json"), "utf8"),
  );
  const dependencies = {
    ...manifest.dependencies,
    ...manifest.devDependencies,
  };
  if (dependencies.vitest) {
    return "npx vitest run --coverage --coverage.provider=istanbul --coverage.reporter=json";
  }
  if (dependencies.jest) {
    return "npx jest --coverage --coverageProvider=babel --coverageReporters=json";
  }
  return null;
}

function findSources(projectRoot, filters) {
  const sources = [];
  const walk = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (EXCLUDED.has(entry.name)) continue;
      const full = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      if (!SOURCE_PATTERN.test(entry.name) || TEST_PATTERN.test(entry.name)) continue;
      const relative = path.relative(projectRoot, full).split(path.sep).join("/");
      if (filters.length && !filters.some((fragment) => relative.includes(fragment))) {
        continue;
      }
      sources.push(relative);
    }
  };
  walk(projectRoot);
  return sources.sort();
}

function main(argv) {
  const options = parseArgs(argv);
  if (options.helpRequested) {
    console.log(HELP_MESSAGE);
    return 0;
  }
  if (options.error) {
    console.error(`${options.error}\n\n${HELP_MESSAGE}`);
    return 1;
  }

  const projectRoot = process.cwd();
  loadTypeScript(projectRoot);
  fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const command = options.testCommand ?? detectTestCommand(projectRoot);
  if (command === null) {
    console.error("no vitest or jest found; pass --test-command");
    return 1;
  }
  try {
    execSync(command, { stdio: "inherit" });
  } catch {
    console.error("the test suite failed; coverage numbers may be understated");
  }

  if (!fs.existsSync(COVERAGE_JSON)) {
    console.error(
      `${COVERAGE_JSON} not found; the suite must run with the istanbul provider`,
    );
    return 1;
  }

  const coverage = parseCoverageReport(
    JSON.parse(fs.readFileSync(COVERAGE_JSON, "utf8")),
    projectRoot,
  );
  const functions = findSources(projectRoot, options.paths).flatMap((file) =>
    extractFunctions(file, fs.readFileSync(path.join(projectRoot, file), "utf8")),
  );
  let entries = buildEntries(functions, coverage);
  if (options.diffBase !== null) {
    const ranges = changedRanges(options.diffBase, [".ts", ".tsx", ".mts", ".cts"]);
    entries = entries.filter((entry) =>
      touches(ranges.get(entry.file) ?? [], entry.startLine, entry.endLine),
    );
  }

  const document = buildDocument({
    entries,
    language: "typescript",
    paths: options.paths,
    diffBase: options.diffBase,
    generatedAt: new Date().toISOString(),
  });
  fs.writeFileSync(REPORT_JSON, `${JSON.stringify(document, null, 2)}\n`);
  if (!options.jsonOnly) {
    process.stdout.write(formatTable(entries));
  }
  console.error(`JSON report written to ${REPORT_JSON}`);
  return 0;
}

process.exit(main(process.argv.slice(2)));
