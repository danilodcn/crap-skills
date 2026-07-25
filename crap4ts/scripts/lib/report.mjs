import { CRAPPY_THRESHOLD, crapScore, sortEntries } from "./score.mjs";

const padRight = (text, width) => String(text).padEnd(width);
const padLeft = (text, width) => String(text).padStart(width);

const HEADER =
  `${padRight("Function", 30)} ${padRight("Module", 35)} ` +
  `${padLeft("CC", 4)} ${padLeft("Cov%", 7)} ${padLeft("CRAP", 8)}`;

const formatCoverage = (coverage) =>
  coverage === null ? "N/A" : `${coverage.toFixed(1)}%`;

const formatScore = (score) => (score === null ? "N/A" : score.toFixed(1));

export function formatTable(entries) {
  const lines = ["CRAP Report", "===========", HEADER, "-".repeat(HEADER.length)];
  for (const entry of sortEntries(entries)) {
    const score = crapScore(entry.complexity, entry.coverage);
    lines.push(
      `${padRight(entry.name, 30)} ${padRight(entry.module, 35)} ` +
        `${padLeft(entry.complexity, 4)} ${padLeft(formatCoverage(entry.coverage), 7)} ` +
        `${padLeft(formatScore(score), 8)}`,
    );
  }
  lines.push("");
  return lines.join("\n");
}

const round = (value) => (value === null ? null : Math.round(value * 10) / 10);

export function buildDocument({ entries, language, paths, diffBase, generatedAt }) {
  const ordered = sortEntries(entries);
  const scores = ordered
    .map((entry) => crapScore(entry.complexity, entry.coverage))
    .filter((score) => score !== null);
  return {
    version: 1,
    language,
    generated_at: generatedAt,
    filters: { paths, diff_base: diffBase },
    summary: {
      functions: ordered.length,
      crappy: scores.filter((score) => score >= CRAPPY_THRESHOLD).length,
      max_crap: scores.length ? round(Math.max(...scores)) : null,
    },
    entries: ordered.map((entry) => ({
      name: entry.name,
      module: entry.module,
      file: entry.file,
      start_line: entry.startLine,
      end_line: entry.endLine,
      complexity: entry.complexity,
      coverage: round(entry.coverage),
      crap: round(crapScore(entry.complexity, entry.coverage)),
      statements: entry.statements,
      covered_statements: entry.coveredStatements,
    })),
  };
}
