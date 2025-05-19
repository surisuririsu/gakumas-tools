export const MAX_PARAMS_BY_DIFFICULTY = {
  regular: 1000,
  pro: 1500,
  master: 1800,
};

export const PARAM_BONUS_BY_PLACE = {
  1: 30,
  2: 20,
  3: 10,
  4: 0,
};

export const RATING_BY_PLACE = {
  1: 1700,
  2: 900,
  3: 500,
  4: 0,
};

export const TARGET_RATING_BY_RANK = {
  "SSS+": 23000,
  SSS: 20000,
  "SS+": 18000,
  SS: 16000,
  "S+": 14500,
  S: 13000,
  "A+": 11500,
  A: 10000,
  "B+": 8000,
  B: 6000,
  "C+": 4500,
  C: 3000,
};

export const REVERSE_RATING_REGIMES = [
  { threshold: 3650, base: 40000, multiplier: 0.01 },
  { threshold: 3450, base: 30000, multiplier: 0.02 },
  { threshold: 3050, base: 20000, multiplier: 0.04 },
  { threshold: 2250, base: 10000, multiplier: 0.08 },
  { threshold: 1500, base: 5000, multiplier: 0.15 },
  { threshold: 0, base: 0, multiplier: 0.3 },
];

export function calculateRatingExExamScore(place, params, maxParams) {
  const placeParamBonus = PARAM_BONUS_BY_PLACE[place];
  const placeRating = RATING_BY_PLACE[place];
  const paramRating = Math.floor(
    params.reduce(
      (acc, cur) => acc + Math.min(cur + placeParamBonus, maxParams),
      0
    ) * 2.3
  );
  return placeRating + paramRating;
}

export function calculateTargetScores(ratingExExamScore) {
  return Object.keys(TARGET_RATING_BY_RANK).map((rank) => {
    const targetRating = TARGET_RATING_BY_RANK[rank] - ratingExExamScore;
    for (let { threshold, base, multiplier } of REVERSE_RATING_REGIMES) {
      if (targetRating <= threshold) continue;
      return {
        rank,
        score: Math.ceil(base + (targetRating - threshold) / multiplier),
      };
    }
    return { rank, score: 0 };
  });
}

export function calculateActualRating(actualScore, ratingExExamScore) {
  let calcScore = actualScore;
  let actualRating = 0;
  for (let { base, multiplier } of REVERSE_RATING_REGIMES) {
    if (calcScore > base) {
      actualRating += (calcScore - base) * multiplier;
      calcScore = base;
    }
  }
  return Math.floor(actualRating) + ratingExExamScore;
}

export function getRank(rating) {
  for (let rank in TARGET_RATING_BY_RANK) {
    if (rating >= TARGET_RATING_BY_RANK[rank]) return rank;
  }
  return null;
}
