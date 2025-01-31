export const MAX_PARAMS = 2000;

export const PARAM_REGIMES_BY_ORDER_BY_STAGE = {
  melobang: {
    1: [
      { threshold: 2550, multiplier: 0, constant: 92 },
      { threshold: 1300, multiplier: 0.0055, constant: 77 },
      { threshold: 0, multiplier: 0.0654, constant: 0 },
    ],
    2: [
      { threshold: 2050, multiplier: 0, constant: 76 },
      { threshold: 1060, multiplier: 0.0055, constant: 63.5 },
      { threshold: 0, multiplier: 0.0654, constant: 0 },
    ],
    3: [
      { threshold: 1600, multiplier: 0, constant: 62 },
      { threshold: 860, multiplier: 0.0055, constant: 52.25 },
      { threshold: 0, multiplier: 0.0654, constant: 0 },
    ],
  },
  galaxy: {
    1: [
      { threshold: 24500, multiplier: 0, constant: 119 },
      { threshold: 12400, multiplier: 0.0008, constant: 98 },
      { threshold: 0, multiplier: 0.00875, constant: 0 },
    ],
    2: [
      { threshold: 20400, multiplier: 0, constant: 98 },
      { threshold: 10200, multiplier: 0.0008, constant: 81 },
      { threshold: 0, multiplier: 0.00875, constant: 0 },
    ],
    3: [
      { threshold: 16400, multiplier: 0, constant: 80 },
      { threshold: 8400, multiplier: 0.0008, constant: 66.25 },
      { threshold: 0, multiplier: 0.00875, constant: 0 },
    ],
  },
  quartet: {
    1: [
      { threshold: 41600, multiplier: 0, constant: 145 },
      { threshold: 20000, multiplier: 0.000578, constant: 120 },
      { threshold: 0, multiplier: 0.00661, constant: 0 },
    ],
    2: [
      { threshold: 34000, multiplier: 0, constant: 120 },
      { threshold: 16500, multiplier: 0.000578, constant: 99.5 },
      { threshold: 0, multiplier: 0.00661, constant: 0 },
    ],
    3: [
      { threshold: 27700, multiplier: 0, constant: 98 },
      { threshold: 13400, multiplier: 0.000578, constant: 81 },
      { threshold: 0, multiplier: 0.00661, constant: 0 },
    ],
  },
  finale: {
    1: [
      { threshold: 79000, multiplier: 0, constant: 172 },
      { threshold: 38400, multiplier: 0.000367, constant: 142.5 },
      { threshold: 0, multiplier: 0.004072, constant: 1.5 },
    ],
    2: [
      { threshold: 65000, multiplier: 0, constant: 142 },
      { threshold: 31800, multiplier: 0.000367, constant: 117.5 },
      { threshold: 0, multiplier: 0.004072, constant: 1 },
    ],
    3: [
      { threshold: 55000, multiplier: 0, constant: 116 },
      { threshold: 26000, multiplier: 0.000367, constant: 95.5 },
      { threshold: 0, multiplier: 0.004072, constant: 1 },
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
        return Math.ceil(scores[i] * multiplier + constant);
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
    return Math.floor((maxGain - constant) / multiplier);
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

export const VOTE_REGIMES_BY_STAGE = {
  melobang: [
    { threshold: 10710, multiplier: 0, constant: 8000 },
    { threshold: 5360, multiplier: 0.0976, constant: 6955 },
    { threshold: 0, multiplier: 1.299, constant: 522.5 },
  ],
  galaxy: [
    { threshold: 64500, multiplier: 0.00361, constant: 9739 },
    { threshold: 0, multiplier: 0.12028, constant: 2240.5 },
  ],
  quartet: [
    { threshold: 207900, multiplier: 0, constant: 20000 },
    { threshold: 103970, multiplier: 0.01339, constant: 17216 },
    { threshold: 0, multiplier: 0.14868, constant: 3150.5 },
  ],
  finale: [
    { threshold: 200000, multiplier: 0.0032025, constant: 22783 },
    { threshold: 0, multiplier: 0.1067045, constant: 2165 },
  ],
};

export function calculateGainedVotes(stage, affection, score) {
  const regimes = VOTE_REGIMES_BY_STAGE[stage];
  for (let j = 0; j < regimes.length; j++) {
    const { threshold, multiplier, constant } = regimes[j];
    if (score > threshold) {
      return Math.floor(
        Math.ceil(score * multiplier + constant) * (1 + 0.05 * (affection - 10))
      );
    }
  }
  return 0;
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
