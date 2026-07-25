import { execFileSync } from "node:child_process";

const FILE_HEADER = /^\+\+\+ (?:b\/)?(.+)$/;
const HUNK_HEADER = /^@@ -\S+ \+(\d+)(?:,(\d+))? @@/;

export function parseHunks(diffText) {
  const ranges = new Map();
  let current = null;
  for (const line of diffText.split("\n")) {
    const header = line.match(FILE_HEADER);
    if (header) {
      const filePath = header[1].trim();
      current = filePath === "/dev/null" ? null : filePath;
      continue;
    }
    const hunk = line.match(HUNK_HEADER);
    if (hunk && current) {
      const start = Number(hunk[1]);
      const count = hunk[2] === undefined ? 1 : Number(hunk[2]);
      const end = count === 0 ? start : start + count - 1;
      if (!ranges.has(current)) ranges.set(current, []);
      ranges.get(current).push([start, end]);
    }
  }
  return ranges;
}

export function touches(ranges, startLine, endLine) {
  return ranges.some(([start, end]) => start <= endLine && end >= startLine);
}

const runGit = (file, args) => execFileSync(file, args, { encoding: "utf8" });

export function changedRanges(base, extensions, run = runGit) {
  const patterns = extensions.map((extension) => `*${extension}`);
  const diff = run("git", [
    "diff",
    "--unified=0",
    `${base}...HEAD`,
    "--",
    ...patterns,
  ]);
  return parseHunks(diff);
}
