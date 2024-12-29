export function calculateGainedParams(paramOrder, scores) {
  const score1 = scores[paramOrder.indexOf(1)];
  const score2 = scores[paramOrder.indexOf(2)];
  const score3 = scores[paramOrder.indexOf(3)];

  let param1 = Math.min(score1, 35000) * 0.0041;
  if (score1 > 35000) {
    param1 += Math.min(score1, 80000) * 0.000367;
  }

  let param2 = Math.min(score2, 25000) * 0.0041;
  if (score2 > 25000) {
    param2 += Math.min(score2, 65000) * 0.000367 + 16;
  }

  let param3 = Math.min(score3, 24500) * 0.0041;
  if (score3 > 24500) {
    param3 += Math.min(score3, 55000) * 0.000367 - 4;
  }

  const params = [Math.floor(param1), Math.floor(param2), Math.floor(param3)];
  return [
    params[paramOrder[0] - 1],
    params[paramOrder[1] - 1],
    params[paramOrder[2] - 1],
  ];
}

export function calculateBonusParams(auditionBonusParams, paramBonuses) {
  return auditionBonusParams.map((param, i) =>
    Math.floor((param * paramBonuses[i]) / 100)
  );
}

export function calculatePostAuditionParams(params, gainedParams, bonusParams) {
  return params.map((param, i) => param + gainedParams[i] + bonusParams[i]);
}

export function calculateGainedVotes(score) {
  if (score < 200000) {
    return Math.floor(score * 0.16 + 3249);
  } else {
    return Math.floor(score * 0.0048 + 34176);
  }
}
