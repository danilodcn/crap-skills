import { coverageForRange } from "./coverage.mjs";

export const moduleName = (filePath) => filePath.replace(/\.[cm]?[jt]sx?$/, "");

const nestedRanges = (target, functions) =>
  functions
    .filter(
      (candidate) =>
        candidate !== target &&
        candidate.file === target.file &&
        candidate.startLine >= target.startLine &&
        candidate.endLine <= target.endLine,
    )
    .map((candidate) => [candidate.startLine, candidate.endLine]);

export function buildEntries(functions, coverageByFile) {
  return functions.map((current) => {
    const statements = coverageByFile.get(current.file);
    const measured =
      statements === undefined
        ? null
        : coverageForRange(
            statements,
            current.startLine,
            current.endLine,
            nestedRanges(current, functions),
          );
    return {
      name: current.name,
      module: moduleName(current.file),
      file: current.file,
      startLine: current.startLine,
      endLine: current.endLine,
      complexity: current.complexity,
      coverage: measured === null ? null : measured.coverage,
      statements: measured === null ? 0 : measured.statements,
      coveredStatements: measured === null ? 0 : measured.covered,
    };
  });
}
