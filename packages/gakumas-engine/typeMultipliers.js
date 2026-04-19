export function getParamCap(season) {
  if (season < 10) return 1800;
  if (season < 16) return 2160;
  if (season < 25) return 2400;
  if (season < 37) return 2760;
  return 3360;
}

export function calculateTypeMultipliers(
  params,
  stage,
  supportBonus = 0,
  enterPercents = false,
) {
  const { type, criteria, season } = stage;

  if (type !== "contest" || enterPercents) {
    return {
      vocal: params.vocal / 100,
      dance: params.dance / 100,
      visual: params.visual / 100,
    };
  }

  const hasFlatBonus = season == 13;
  const hasFlatterBonus = season == 23;

  const multipliers = {};

  for (const key of Object.keys(criteria)) {
    const param = Math.min(params[key], getParamCap(season));
    const criterion = criteria[key];

    let multiplier = 0;
    if (season < 25) {
      if (param > 1200) {
        multiplier = param + 3000;
        if (hasFlatBonus) multiplier += param - 1200;
      } else if (param > 900) {
        multiplier = param * 2 + 1800;
      } else if (param > 600) {
        multiplier = param * 3 + 900;
      } else if (param > 300) {
        multiplier = param * 4 + 300;
      } else if (param > 0) {
        multiplier = param * 5;
      }
    } else if (season < 37) {
      if (param > 2500) {
        multiplier = param + 3000 + (param - 2500) * 0.2;
      } else if (param > 1800) {
        multiplier = param * 1.5 + 1800;
      } else if (param > 1200) {
        multiplier = param * 2 + 900;
      } else if (param > 600) {
        multiplier = param * 2.5 + 300;
      } else if (param > 300) {
        multiplier = param * 3;
      } else if (param > 0) {
        multiplier = param * 4 - 250;
      }
    } else if (season < 39) {
      if (param > 2800) {
        multiplier = param * 0.8525 + 3095;
      } else if (param > 2100) {
        multiplier = param * 1.275 + 1915;
      } else if (param > 1500) {
        multiplier = param * 1.7 + 1020;
      } else if (param > 900) {
        multiplier = param * 2.1225 + 387.5;
      } else if (param > 0) {
        multiplier = param * 2.55;
      }
    } else {
      if (param > 2800) {
        multiplier = param * 0.6 + 4300;
      } else if (param > 2100) {
        multiplier = param * 1 + 3180;
      } else if (param > 1500) {
        multiplier = param * 1.8 + 1500;
      } else if (param > 900) {
        multiplier = param * 2.5 + 450;
      } else if (param > 0) {
        multiplier = param * 3;
      }
    }

    if (hasFlatterBonus) multiplier += param;

    multiplier = multiplier * criterion + 100;
    multiplier =
      Math.ceil(multiplier) *
      (1 + supportBonus + (hasFlatterBonus ? 0.01 : 0));
    multiplier = Math.ceil(Math.floor(multiplier * 10) / 10);

    multipliers[key] = multiplier / 100;
  }

  return multipliers;
}
