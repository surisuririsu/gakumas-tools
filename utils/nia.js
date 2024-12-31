export const MAX_PARAMS = 2000;

export const PARAM_REGIMES_BY_ORDER_BY_STAGE = {
  melobang: {
    1: [
      { threshold: 2600, multiplier: 0, constant: 92 },
      { threshold: 1200, multiplier: 0.00548, constant: 78.22 },
      { threshold: 0, multiplier: 0.066, constant: 0 },
    ],
    2: [
      { threshold: 2000, multiplier: 0, constant: 76 },
      { threshold: 1000, multiplier: 0.00548, constant: 64.6 },
      { threshold: 0, multiplier: 0.066, constant: 0.25 },
    ],
    3: [
      { threshold: 1600, multiplier: 0, constant: 62 },
      { threshold: 850, multiplier: 0.00548, constant: 53.22 },
      { threshold: 0, multiplier: 0.066, constant: 0.8 },
    ],
  },
  galaxy: {
    1: [
      { threshold: 25000, multiplier: 0, constant: 119 },
      { threshold: 11500, multiplier: 0.00075, constant: 100 },
      { threshold: 0, multiplier: 0.0087, constant: 1.5 },
    ],
    2: [
      { threshold: 18000, multiplier: 0, constant: 98 },
      { threshold: 10000, multiplier: 0.00075, constant: 82.75 },
      { threshold: 0, multiplier: 0.0087, constant: 1.4 },
    ],
    3: [
      { threshold: 16000, multiplier: 0, constant: 80 },
      { threshold: 8500, multiplier: 0.00075, constant: 67.7 },
      { threshold: 0, multiplier: 0.0087, constant: 1.3 },
    ],
  },
  finale: {
    1: [
      { threshold: 80000, multiplier: 0, constant: 172 },
      { threshold: 35000, multiplier: 0.000367, constant: 143.5 },
      { threshold: 0, multiplier: 0.004068, constant: 1.5 },
    ],
    2: [
      { threshold: 65000, multiplier: 0, constant: 142 },
      { threshold: 30000, multiplier: 0.000367, constant: 118.5 },
      { threshold: 0, multiplier: 0.004068, constant: 1 },
    ],
    3: [
      { threshold: 55000, multiplier: 0, constant: 116 },
      { threshold: 25000, multiplier: 0.000367, constant: 96.5 },
      { threshold: 0, multiplier: 0.004068, constant: 1 },
    ],
  },
};

export function calculateGainedParams(stage, paramOrder, scores) {
  const paramRegimesByOrder = PARAM_REGIMES_BY_ORDER_BY_STAGE[stage];
  return paramOrder.map((order, i) => {
    const regimes = paramRegimesByOrder[order];
    for (let j = 0; j < regimes.length; j++) {
      const { threshold, multiplier, constant } = regimes[j];
      if (scores[i] > threshold) {
        return Math.floor(scores[i] * multiplier + constant);
      }
    }
    return 0;
  });
}

export function calculateMaxScores(stage, paramOrder, params, paramBonuses) {
  const paramRegimesByOrder = PARAM_REGIMES_BY_ORDER_BY_STAGE[stage];
  return paramOrder.map((order, i) => {
    const regimes = paramRegimesByOrder[order];
    const maxGain = Math.ceil(
      (MAX_PARAMS - params[i]) / (1 + paramBonuses[i] / 100)
    );
    let regime = regimes[0];
    for (let j = 1; j < regimes.length; j++) {
      const { constant, multiplier } = regimes[j];
      if ((maxGain - constant) / multiplier > regimes[j - 1].threshold) {
        break;
      }
      regime = regimes[j];
    }
    const { threshold, constant, multiplier } = regime;
    if (multiplier == 0) return threshold;
    return Math.ceil((maxGain - constant) / multiplier);
  });
}

export function calculateBonusParams(gainedParams, paramBonuses) {
  return gainedParams.map((param, i) =>
    Math.floor((param * paramBonuses[i]) / 100)
  );
}

export function calculatePostAuditionParams(params, gainedParams, bonusParams) {
  return params.map((param, i) =>
    Math.min(param + gainedParams[i] + bonusParams[i], MAX_PARAMS)
  );
}

export function calculateGainedVotes(score) {
  if (score < 200000) {
    return Math.floor(score * 0.160057 + 3248);
  } else {
    return Math.floor(score * 0.0048 + 34176);
  }
}

const VOTE_RANKS = [
  { rank: "SS", threshold: 100000 },
  { rank: "S+", threshold: 80000 },
  { rank: "S", threshold: 60000 },
  { rank: "A+", threshold: 40000 },
];

export function getVoteRank(votes) {
  for (let i = 0; i < VOTE_RANKS.length; i++) {
    if (votes > VOTE_RANKS[i].threshold) {
      return VOTE_RANKS[i].rank;
    }
  }
  return null;
}

const FAN_RATING_BY_VOTE_RANK = {
  "A+": { base: 900, multiplier: 0.07 },
  S: { base: 1200, multiplier: 0.065 },
  "S+": { base: 1600, multiplier: 0.06 },
  SS: { base: 2100, multiplier: 0.055 },
};

export function calculateVoteRating(votes, voteRank) {
  const { base, multiplier } = FAN_RATING_BY_VOTE_RANK[voteRank];
  return base + Math.ceil(votes * multiplier);
}
