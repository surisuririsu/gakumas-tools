import { TARGET_RATING_BY_RANK } from "@/utils/produceRank";

export const MAX_PARAMS_BY_DIFFICULTY = {
  pro: 2000,
  master: 2300,
};

export const MIN_VOTES_BY_STAGE = {
  melobang: 9000,
  galaxy: 25000,
  quartet: 40000,
  finale: 57000,
};

export const PARAM_ORDER_BY_IDOL = {
  1: [3, 2, 1],
  2: [1, 2, 3],
  3: [3, 1, 2],
  4: [1, 3, 2],
  5: [3, 2, 1],
  6: [3, 1, 2],
  7: [3, 1, 2],
  8: [1, 2, 3],
  9: [3, 2, 1],
  10: [2, 1, 3],
  11: [2, 3, 1],
  12: [1, 3, 2],
};

export const BALANCE_BY_IDOL = {
  1: "flat",
  2: "skew",
  3: "skew",
  4: "skew",
  5: "flat",
  6: "skew",
  7: "skew",
  8: "flat",
  9: "flat",
  10: "flat",
  11: "flat",
  12: "skew",
};

export const PARAM_REGIMES_BY_DIFF_STAGE_BALANCE_ORDER = {
  pro: {
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
  },
  master: {
    finale: {
      flat: {
        1: [
          { threshold: 134210, multiplier: 0, constant: 172 },
          { threshold: 66600, multiplier: 0.000756, constant: 69 },
          { threshold: 0, multiplier: 0.0018, constant: 0 },
        ],
        2: [
          { threshold: 63750, multiplier: 0, constant: 142 },
          { threshold: 31600, multiplier: 0.00124, constant: 62 },
          { threshold: 0, multiplier: 0.0032, constant: 0 },
        ],
        3: [
          { threshold: 36900, multiplier: 0, constant: 116 },
          { threshold: 17600, multiplier: 0.00183, constant: 48.5 },
          { threshold: 0, multiplier: 0.0046, constant: 0 },
        ],
      },
      skew: {
        1: [
          { threshold: 136000, multiplier: 0, constant: 215 },
          { threshold: 43920, multiplier: 0.00092, constant: 89 },
          { threshold: 0, multiplier: 0.00292, constant: 0 },
        ],
        2: [
          { threshold: 63000, multiplier: 0, constant: 129 },
          { threshold: 30600, multiplier: 0.0012, constant: 52.5 },
          { threshold: 0, multiplier: 0.00292, constant: 0 },
        ],
        3: [
          { threshold: 36000, multiplier: 0, constant: 86 },
          { threshold: 18000, multiplier: 0.00133, constant: 37 },
          { threshold: 0, multiplier: 0.0034, constant: 0 },
        ],
      },
    },
  },
};

export function calculateGainedParams(paramRegimesByOrder, paramOrder, scores) {
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

export function calculateMaxScores(
  paramRegimesByOrder,
  maxParams,
  paramOrder,
  params,
  paramBonuses
) {
  return paramOrder.map((order, i) => {
    const regimes = paramRegimesByOrder[order];
    const maxGain = Math.ceil(
      (maxParams - params[i]) / (1 + paramBonuses[i] / 100)
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

export function calculateChallengeParams(gainedParams, challengeParamBonus) {
  return gainedParams.map((param) =>
    Math.floor((param * challengeParamBonus) / 100)
  );
}

export function calculatePostAuditionParams(
  maxParams,
  params,
  gainedParams,
  challengeParams,
  bonusParams
) {
  return params.map((param, i) =>
    Math.min(
      param + gainedParams[i] + challengeParams[i] + bonusParams[i],
      maxParams
    )
  );
}

export const VOTE_REGIMES_BY_DIFF_STAGE = {
  pro: {
    melobang: [
      { threshold: 10710, multiplier: 0, constant: 8000 },
      { threshold: 5360, multiplier: 0.0976, constant: 6955 },
      { threshold: 0, multiplier: 1.299, constant: 522.5 },
    ],
    galaxy: [
      { threshold: 258000, multiplier: 0, constant: 10666 },
      { threshold: 64500, multiplier: 0.00361, constant: 9739 },
      { threshold: 0, multiplier: 0.12028, constant: 2240.5 },
    ],
    quartet: [
      { threshold: 207900, multiplier: 0, constant: 20000 },
      { threshold: 103970, multiplier: 0.01339, constant: 17216 },
      { threshold: 0, multiplier: 0.14868, constant: 3150.5 },
    ],
    finale: [
      { threshold: 798000, multiplier: 0, constant: 25334 },
      { threshold: 200000, multiplier: 0.0032025, constant: 22783 },
      { threshold: 0, multiplier: 0.1067045, constant: 2165 },
    ],
  },
  master: {
    finale: [
      { threshold: 1200800, multiplier: 0, constant: 32668 },
      { threshold: 640900, multiplier: 0.004127, constant: 27713 },
      { threshold: 260410, multiplier: 0.018215, constant: 18684 },
      { threshold: 0, multiplier: 0.075927, constant: 3655 },
    ],
  },
};

export function calculateGainedVotes(voteRegimes, affection, score) {
  for (let j = 0; j < voteRegimes.length; j++) {
    const { threshold, multiplier, constant } = voteRegimes[j];
    if (score > threshold) {
      return Math.floor(
        Math.ceil(score * multiplier + constant) * (1 + 0.05 * (affection - 10))
      );
    }
  }
  return 0;
}

function calculateScoreForVotes(voteRegimes, affection, votes) {
  for (let j = 0; j < voteRegimes.length; j++) {
    const { threshold, multiplier, constant } = voteRegimes[j];
    if (votes > constant) {
      return Math.floor(
        (Math.ceil(votes / (1 + 0.05 * (affection - 10))) - constant) /
          multiplier
      );
    }
  }
  return 0;
}

const VOTE_RANKS = [
  { rank: "SSS", threshold: 140000 },
  { rank: "SS+", threshold: 120000 },
  { rank: "SS", threshold: 100000 },
  { rank: "S+", threshold: 80000 },
  { rank: "S", threshold: 60000 },
  { rank: "A+", threshold: 40000 },
];

export function getVoteRank(votes) {
  for (let i = 0; i < VOTE_RANKS.length; i++) {
    if (votes >= VOTE_RANKS[i].threshold) {
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
  "SS+": { base: 3800, multiplier: 0.04 },
  SSS: { base: 5200, multiplier: 0.03 },
};

export function calculateVoteRating(votes, voteRank) {
  const { base, multiplier } = FAN_RATING_BY_VOTE_RANK[voteRank];
  return base + Math.ceil(votes * multiplier);
}

export function calculateRecommendedScores(
  paramRegimesByOrder,
  voteRegimes,
  maxParams,
  paramOrder,
  challengeParamBonus,
  paramBonuses,
  affection,
  params,
  votes
) {
  let sft = 0;
  const maxScores = calculateMaxScores(
    paramRegimesByOrder,
    maxParams,
    paramOrder,
    params,
    paramBonuses
  );
  let recommendedScores = {};
  let currentScores = [0, 0, 0];

  const produceRanks = Object.keys(TARGET_RATING_BY_RANK).slice(0, 8);
  let rankIndex = produceRanks.length - 1;
  while (true) {
    // Current target
    const targetRank = produceRanks[rankIndex];
    const targetRating = TARGET_RATING_BY_RANK[targetRank];

    // Calculate current state
    const gainedParams = calculateGainedParams(
      paramRegimesByOrder,
      paramOrder,
      currentScores
    );
    // console.log(gainedParams);
    const challengeParams = calculateChallengeParams(
      gainedParams,
      challengeParamBonus
    );
    const bonusParams = calculateBonusParams(gainedParams, paramBonuses);
    const postAuditionParams = calculatePostAuditionParams(
      maxParams,
      params,
      gainedParams,
      challengeParams,
      bonusParams
    );

    const totalScore = currentScores.reduce((acc, cur) => acc + cur, 0);
    const gainedVotes = calculateGainedVotes(
      voteRegimes,
      affection,
      totalScore
    );
    const postAuditionVotes = votes + gainedVotes;

    const currentParamRating = Math.floor(
      postAuditionParams.reduce((acc, cur) => acc + cur, 0) * 2.3
    );

    let currentVoteRating = 0;
    const voteRank = getVoteRank(postAuditionVotes);
    if (voteRank) {
      currentVoteRating = calculateVoteRating(postAuditionVotes, voteRank);
    }

    // console.log(currentParamRating, currentVoteRating);

    // Check if target is reached
    if (currentParamRating + currentVoteRating >= targetRating) {
      recommendedScores[targetRank] = [...currentScores];
      rankIndex--;
      if (rankIndex < 0) break;
      continue;
    }

    // Determine parameter to allocate score
    const multipliers = paramOrder.map((order, i) => {
      const regimes = paramRegimesByOrder[order];
      for (let j = 0; j < regimes.length; j++) {
        const { threshold, multiplier } = regimes[j];
        if (currentScores[i] >= threshold) {
          return multiplier;
        }
      }
      return 0;
    });
    const maxMultiplier = Math.max(...multipliers);
    const selectedParam = paramOrder.reduce((acc, cur, i) => {
      if (multipliers[i] != maxMultiplier) return acc;
      if (acc == -1 || cur < paramOrder[acc]) return i;
      return acc;
    }, -1);

    // Score to next vote rank
    let scoreToNextVoteRank = Infinity;
    let voteRankIndex = VOTE_RANKS.findIndex((rank) => rank.rank == voteRank);
    if (voteRankIndex == -1) voteRankIndex = VOTE_RANKS.length;
    if (voteRankIndex > 0) {
      const votesToNextVoteRank =
        VOTE_RANKS[voteRankIndex - 1].threshold - votes;
      scoreToNextVoteRank =
        calculateScoreForVotes(voteRegimes, affection, votesToNextVoteRank) -
        totalScore;
    }

    // Score to max for selected param
    let scoreToMaxParam =
      maxScores[selectedParam] - currentScores[selectedParam];
    if (scoreToMaxParam <= 0) scoreToMaxParam = Infinity;

    // Current regimes
    const paramRegimes = paramRegimesByOrder[paramOrder[selectedParam]];
    const currentParamRegimeIndex = paramRegimes.findIndex(
      (regime) => regime.multiplier == maxMultiplier
    );
    const currentVoteRegimeIndex = voteRegimes.findIndex(
      (regime) => totalScore >= regime.threshold
    );

    // Score to next param regime
    let scoreToNextParamRegime = Infinity;
    if (currentParamRegimeIndex > 0) {
      const nextParamRegime = paramRegimes[currentParamRegimeIndex - 1];
      scoreToNextParamRegime =
        nextParamRegime.threshold - currentScores[selectedParam];
    }

    // Score to next vote regime
    let scoreToNextVoteRegime = Infinity;
    if (currentVoteRegimeIndex > 0) {
      const nextVoteRegime = voteRegimes[currentVoteRegimeIndex - 1];
      scoreToNextVoteRegime = nextVoteRegime.threshold - totalScore;
    }

    // Remaining score
    const currentParamRegime = paramRegimes[currentParamRegimeIndex];
    const currentVoteRegime = voteRegimes[currentVoteRegimeIndex];
    const currentVoteRank = FAN_RATING_BY_VOTE_RANK[voteRank];

    const remainingRating =
      targetRating - currentParamRating - currentVoteRating;

    const remainingScore = Math.floor(
      remainingRating /
        (2.3 *
          currentParamRegime.multiplier *
          (1 + paramBonuses[selectedParam] / 100) +
          currentVoteRegime.multiplier *
            (1 + 0.05 * (affection - 10)) *
            currentVoteRank?.multiplier || 0)
    );

    const targetScores = [
      scoreToNextVoteRank,
      scoreToMaxParam,
      scoreToNextParamRegime,
      scoreToNextVoteRegime,
      remainingScore,
    ].filter((score) => score != Infinity && score > 0);

    if (!targetScores.length) break;
    currentScores[selectedParam] += Math.min(...targetScores);

    sft++;

    // Break if too many iterations
    if (sft > 1000) break;
  }

  return recommendedScores;
}
