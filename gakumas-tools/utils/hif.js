import { TARGET_RATING_BY_RANK, getRank } from "@/utils/produceRank";

export { TARGET_RATING_BY_RANK, getRank };

export const MAX_PARAM = 3200;
export const MAX_PRE_ROUND2_STAR = 1110;
export const MAX_ROUND1_SCORE = 1680000;
export const MAX_ROUND2_SCORE = 2400000;
export const MAX_TOTAL_SCORE = MAX_ROUND1_SCORE + MAX_ROUND2_SCORE;

export const STAT_MULTIPLIER = 2;
export const STAR_MULTIPLIER = 7.5;
export const ROUND2_STAR_GAIN_MULTIPLIER = 1.5;
export const EVAL_CONSTANT = -2000;

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

export function getRound1Eval(score) {
  const adjusted = Math.floor((score || 0) / 1.2);
  let res = 0;
  if (adjusted <= 300000) res = 0;
  else if (adjusted <= 700000) res = adjusted * 0.01;
  else if (adjusted <= 1000000) res = 4000 + (adjusted - 700000) * 0.003;
  else if (adjusted <= 1200000) res = 4900 + (adjusted - 1000000) * 0.002;
  else if (adjusted <= 1400000) res = 5300 + (adjusted - 1200000) * 0.001;
  else res = 5500;
  return Math.floor(res);
}

export function getRound2Eval(score) {
  const s = score || 0;
  let res = 0;
  if (s <= 600000) res = 0;
  else if (s <= 900000) res = (s - 600000) * 0.004;
  else if (s <= 1500000) res = 1200 + (s - 900000) * 0.008;
  else if (s <= 2000000) res = 6000 + (s - 1500000) * 0.002;
  else if (s <= 2400000) res = 7000 + (s - 2000000) * 0.001;
  else res = 7400;
  return Math.floor(res);
}

export function getStarGainFromRound2(round2Score) {
  const s = round2Score || 0;
  let value;
  if (s <= 400000) value = s * 0.0001875;
  else if (s <= 600000) value = 75 + (s - 400000) * 0.000225;
  else if (s <= 1000000) value = 120 + (s - 600000) * 0.000075;
  else value = 150;
  return Math.ceil(value);
}

export function getEffectiveRound2StarGain(round2Score) {
  return Math.floor(getStarGainFromRound2(round2Score) * ROUND2_STAR_GAIN_MULTIPLIER);
}

function cap(v, max) {
  return Math.min(max, Math.max(0, v || 0));
}

export function calculateTotalStats(params) {
  return params.reduce((acc, cur) => acc + cap(cur, MAX_PARAM), 0);
}

export function calculateStatStarPart(totalStats, preRound2Star, round2Score) {
  const round2StarGain = getEffectiveRound2StarGain(round2Score);
  const star = cap(preRound2Star, MAX_PRE_ROUND2_STAR);
  return Math.floor(totalStats * STAT_MULTIPLIER + (round2StarGain + star) * STAR_MULTIPLIER);
}

export function calculateTotalEvaluation({
  params,
  preRound2Star,
  round1Score,
  round2Score,
}) {
  const totalStats = calculateTotalStats(params);
  const statStarPart = calculateStatStarPart(
    totalStats,
    preRound2Star,
    round2Score,
  );
  const r1 = getRound1Eval(round1Score);
  const r2 = getRound2Eval(round2Score);
  return statStarPart + r1 + r2 + EVAL_CONSTANT;
}

export function calculateTargetRound2Scores({
  params,
  preRound2Star,
  round1Score,
  currentRound2Score,
}) {
  const totalStats = calculateTotalStats(params);
  const r1 = getRound1Eval(round1Score);

  const evalAtRound2 = (r2Score) => {
    const statStarPart = calculateStatStarPart(
      totalStats,
      preRound2Star,
      r2Score,
    );
    return statStarPart + r1 + getRound2Eval(r2Score) + EVAL_CONSTANT;
  };

  const currentEval = evalAtRound2(currentRound2Score || 0);

  return HIF_RANKS.map((rank) => {
    const target = TARGET_RATING_BY_RANK[rank];
    if (currentEval >= target) return { rank, score: "achieved" };

    let lo = 0;
    let hi = MAX_ROUND2_SCORE;
    let ans = -1;
    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2);
      if (evalAtRound2(mid) >= target) {
        ans = mid;
        hi = mid - 1;
      } else {
        lo = mid + 1;
      }
    }
    return { rank, score: ans === -1 ? "impossible" : ans };
  });
}
