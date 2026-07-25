export const CRAPPY_THRESHOLD = 30;

export function crapScore(complexity, coverage) {
  if (coverage === null || coverage === undefined) {
    return null;
  }
  const uncovered = 1 - coverage / 100;
  return complexity ** 2 * uncovered ** 3 + complexity;
}

export function sortEntries(entries) {
  return [...entries].sort((left, right) => {
    const leftScore = crapScore(left.complexity, left.coverage);
    const rightScore = crapScore(right.complexity, right.coverage);
    if (leftScore === null && rightScore === null) {
      return left.name.localeCompare(right.name);
    }
    if (leftScore === null) return 1;
    if (rightScore === null) return -1;
    if (leftScore !== rightScore) return rightScore - leftScore;
    return left.name.localeCompare(right.name);
  });
}
