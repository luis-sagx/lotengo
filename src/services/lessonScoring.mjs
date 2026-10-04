// saflash — Pure lesson scoring helpers.

// `results` holds one boolean per card: answered right on the first try.
export function accuracyFromResults(results) {
  if (!results.length) return 0;
  return results.filter(Boolean).length / results.length;
}

export function starsFromAccuracy(accuracy) {
  if (accuracy >= 0.8) return 3;
  if (accuracy >= 0.5) return 2;
  return 1;
}

export function scoreLesson(results) {
  const accuracy = accuracyFromResults(results);
  return {
    accuracy,
    stars: starsFromAccuracy(accuracy),
  };
}
