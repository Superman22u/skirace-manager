function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

export function scoreTip(picks: string[], resultTop5: string[]): number {
  const normalizedResult = resultTop5.map(normalizeName);
  let total = 0;

  for (let i = 0; i < 5; i++) {
    const pick = lotski[i] ?? "";
    const pickNorm = normalizeName(pick);
    if (!pickNorm) continue;

    const resultIndex = normalizedResult.indexOf(pickNorm);
    if (resultIndex < 0) {
      total += 0;
    } else if (resultIndex === i) {
      total += 3;
    } else {
      total += 1;
    }
  }

  return total;
}

