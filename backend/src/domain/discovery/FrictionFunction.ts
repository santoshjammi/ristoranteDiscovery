// Domain value object — pure friction function
// Transforms raw scores to final scores using progressive difficulty curve

export class FrictionFunction {
  /**
   * Applies progressive difficulty friction to raw score progressions.
   *
   * Segments:
   *   0-40:   100% value (easy gains)
   *   40-70:   80% value (moderate effort)
   *   70-85:   60% value (significant effort)
   *   85-100:  40% value (exceptional effort)
   *
   * Maximum achievable final score: 79
   */
  static apply(rawScore: number | null): number | null {
    if (rawScore === null) return null;
    if (rawScore <= 0) return 0;
    if (rawScore <= 40) return Math.round(rawScore);

    let score = 40;
    let remaining = rawScore - 40;

    // 40 to 70 range (30 pts max)
    if (remaining <= 30) {
      score += remaining * 0.8;
      return Math.round(score);
    }
    score += 30 * 0.8; // +24 pts (total 64)
    remaining -= 30;

    // 70 to 85 range (15 pts max)
    if (remaining <= 15) {
      score += remaining * 0.6;
      return Math.round(score);
    }
    score += 15 * 0.6; // +9 pts (total 73)
    remaining -= 15;

    // 85 to 100 range (15 pts max)
    score += remaining * 0.4; // +6 pts max (total 79)
    return Math.round(score);
  }
}
