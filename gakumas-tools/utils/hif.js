import { TARGET_RATING_BY_RANK, getRank } from "@/utils/produceRank";

export { TARGET_RATING_BY_RANK, getRank };

export const MAX_PARAMS = 3200;
export const MAX_PRE_ROUND2_STAR = 1110;
export const MAX_ROUND1_SCORE = 1680000;
export const MAX_ROUND2_SCORE = 2400000;
export const MAX_TOTAL_SCORE = MAX_ROUND1_SCORE + MAX_ROUND2_SCORE;

export const STAT_MULTIPLIER = 2;
export const STAR_MULTIPLIER = 7.5;
export const ROUND2_STAR_GAIN_BOOST = 1.5;
export const RATING_OFFSET = -2000;

const HIF_RANKS = [
  "S5",
  "S4+",
  "S4",
  "SSS+",
  "SSS",
  "SS+",
  "SS",
  "S+",
  "S",
  "A+",
  "A",
];

// Each regime: { threshold, base, multiplier }
// piecewise output = base + (value - prevThreshold) * multiplier for the
// first regime whose threshold >= value. (prevThreshold = 0 for the first.)
const ROUND1_REGIMES = [
  { threshold: 300000, base: 0, multiplier: 0 },
  { threshold: 700000, base: 0, multiplier: 0.01 },
  { threshold: 1000000, base: 4000, multiplier: 0.003 },
  { threshold: 1200000, base: 4900, multiplier: 0.002 },
  { threshold: 1400000, base: 5300, multiplier: 0.001 },
  { threshold: Infinity, base: 5500, multiplier: 0 },
];

const ROUND2_REGIMES = [
  { threshold: 600000, base: 0, multiplier: 0 },
  { threshold: 900000, base: 0, multiplier: 0.004 },
  { threshold: 1500000, base: 1200, multiplier: 0.008 },
  { threshold: 2000000, base: 6000, multiplier: 0.002 },
  { threshold: 2400000, base: 7000, multiplier: 0.001 },
  { threshold: Infinity, base: 7400, multiplier: 0 },
];

const STAR_GAIN_REGIMES = [
  { threshold: 400000, base: 0, multiplier: 0.0001875 },
  { threshold: 600000, base: 75, multiplier: 0.000225 },
  { threshold: 1000000, base: 120, multiplier: 0.000075 },
  { threshold: Infinity, base: 150, multiplier: 0 },
];

function piecewise(value, regimes) {
  let prevThreshold = 0;
  for (const { threshold, base, multiplier } of regimes) {
    if (value <= threshold) return base + (value - prevThreshold) * multiplier;
    prevThreshold = threshold;
  }
  return 0;
}

function clampToRange(value, max) {
  return Math.min(max, Math.max(0, value || 0));
}

export function getRound1Rating(round1Score) {
  const adjustedScore = Math.floor((round1Score || 0) / 1.2);
  return Math.floor(piecewise(adjustedScore, ROUND1_REGIMES));
}

export function getRound2Rating(round2Score) {
  return Math.floor(piecewise(round2Score || 0, ROUND2_REGIMES));
}

export function getStarGainFromRound2(round2Score) {
  return Math.ceil(piecewise(round2Score || 0, STAR_GAIN_REGIMES));
}

export function getBoostedRound2StarGain(round2Score) {
  return Math.floor(
    getStarGainFromRound2(round2Score) * ROUND2_STAR_GAIN_BOOST,
  );
}

export function calculateTotalStats(params) {
  return params.reduce((sum, p) => sum + clampToRange(p, MAX_PARAMS), 0);
}

export function calculateParamStarRating(
  totalStats,
  preRound2Star,
  round2Score,
) {
  const boostedStarGain = getBoostedRound2StarGain(round2Score);
  const star = clampToRange(preRound2Star, MAX_PRE_ROUND2_STAR);
  return Math.floor(
    totalStats * STAT_MULTIPLIER + (boostedStarGain + star) * STAR_MULTIPLIER,
  );
}

export function calculateTotalRating({
  params,
  preRound2Star,
  round1Score,
  round2Score,
}) {
  const totalStats = calculateTotalStats(params);
  const paramStarRating = calculateParamStarRating(
    totalStats,
    preRound2Star,
    round2Score,
  );
  const round1Rating = getRound1Rating(round1Score);
  const round2Rating = getRound2Rating(round2Score);
  return paramStarRating + round1Rating + round2Rating + RATING_OFFSET;
}

export function calculateTargetRound2Scores({
  params,
  preRound2Star,
  round1Score,
  currentRound2Score,
}) {
  const totalStats = calculateTotalStats(params);
  const round1Rating = getRound1Rating(round1Score);

  const ratingAtRound2 = (round2Score) => {
    const paramStarRating = calculateParamStarRating(
      totalStats,
      preRound2Star,
      round2Score,
    );
    return (
      paramStarRating +
      round1Rating +
      getRound2Rating(round2Score) +
      RATING_OFFSET
    );
  };

  const currentRating = ratingAtRound2(currentRound2Score || 0);

  return HIF_RANKS.map((rank) => {
    const targetRating = TARGET_RATING_BY_RANK[rank];
    if (currentRating >= targetRating) return { rank, score: 0 };

    let lo = 0;
    let hi = MAX_ROUND2_SCORE;
    let requiredScore = null;
    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2);
      if (ratingAtRound2(mid) >= targetRating) {
        requiredScore = mid;
        hi = mid - 1;
      } else {
        lo = mid + 1;
      }
    }
    return { rank, score: requiredScore };
  });
}
