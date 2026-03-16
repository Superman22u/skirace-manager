"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scoreTip = scoreTip;
function normalizeName(name) {
    return name.trim().toLowerCase();
}
function scoreTip(picks, resultTop5) {
    const normalizedResult = resultTop5.map(normalizeName);
    let total = 0;
    for (let i = 0; i < 5; i++) {
        const pick = picks[i] ?? "";
        const pickNorm = normalizeName(pick);
        if (!pickNorm)
            continue;
        const resultIndex = normalizedResult.indexOf(pickNorm);
        if (resultIndex < 0) {
            total += 0;
        }
        else if (resultIndex === i) {
            total += 3;
        }
        else {
            total += 1;
        }
    }
    return total;
}
//# sourceMappingURL=scoring.js.map