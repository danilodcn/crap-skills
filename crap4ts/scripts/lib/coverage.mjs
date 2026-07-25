import path from "node:path";

const toRelative = (filePath, projectRoot) =>
  path.relative(projectRoot, filePath).split(path.sep).join("/");

export function parseCoverageReport(report, projectRoot) {
  const byFile = new Map();
  for (const [filePath, data] of Object.entries(report)) {
    const statements = Object.entries(data.statementMap).map(([id, location]) => ({
      line: location.start.line,
      covered: (data.s?.[id] ?? 0) > 0,
    }));
    byFile.set(toRelative(data.path ?? filePath, projectRoot), statements);
  }
  return byFile;
}

const isExcluded = (line, excludedRanges) =>
  excludedRanges.some(([start, end]) => line >= start && line <= end);

export function coverageForRange(statements, startLine, endLine, excludedRanges) {
  const inRange = statements.filter(
    (statement) =>
      statement.line >= startLine &&
      statement.line <= endLine &&
      !isExcluded(statement.line, excludedRanges),
  );
  if (inRange.length === 0) {
    return { coverage: 0, statements: 0, covered: 0 };
  }
  const covered = inRange.filter((statement) => statement.covered).length;
  return {
    coverage: (100 * covered) / inRange.length,
    statements: inRange.length,
    covered,
  };
}
