const CONTEST_DEFAULT_CARD_IDS_BY_PLAN = {
  sense: [5, 7, 1, 1, 15, 15, 17, 17],
  logic: [9, 11, 19, 19, 21, 21, 13, 13],
  anomaly: [370, 372, 1, 1, 374, 374, 376, 376],
};

const EVENT_DEFAULT_CARD_IDS_BY_RECOMMENDED_EFFECT = {
  goodConditionTurns: [15, 15, 5, 1, 1, 3, 13, 13],
  concentration: [17, 17, 7, 1, 1, 3, 13, 13],
  goodImpressionTurns: [19, 19, 9, 1, 1, 3, 13, 13],
  motivation: [21, 21, 11, 1, 1, 3, 13, 13],
  strength: [376, 376, 370, 1, 1, 368, 13, 13],
  fullPower: [370, 372, 1, 1, 374, 374, 376, 376], // TODO: Fix
};

export default class IdolStageConfig {
  constructor(idolConfig, stageConfig) {
    this.idol = idolConfig;
    this.stage = stageConfig;
    this.typeMultipliers = this.calculateTypeMultipliers(
      idolConfig,
      stageConfig
    );
    this.defaultCardIds = this.getDefaultCardIds(idolConfig, stageConfig);
  }

  calculateTypeMultipliers(idolConfig, stageConfig) {
    const { type, criteria, season } = stageConfig;
    const { params, supportBonus } = idolConfig;

    if (type == "event") {
      return {
        vocal: params.vocal / 100,
        dance: params.dance / 100,
        visual: params.visual / 100,
      };
    }

    const hasFlatBonus = season == 13;
    const hasFlatterBonus = season == 23;

    let multipliers = {};

    for (let key of Object.keys(criteria)) {
      let param = params[key];
      if (season < 10) {
        param = Math.min(param, 1800);
      } else if (season < 16) {
        param = Math.min(param, 2160);
      } else if (season < 25) {
        param = Math.min(param, 2400);
      } else {
        param = Math.min(param, 2760);
      }
      const criterion = criteria[key];

      let multiplier = 0;
      if (season < 25) {
        if (param > 1200) {
          multiplier = param + 300 * 10;
          if (hasFlatBonus) {
            multiplier += param - 1200;
          }
        } else if (param > 900) {
          multiplier = param * 2 + 300 * 6;
        } else if (param > 600) {
          multiplier = param * 3 + 300 * 3;
        } else if (param > 300) {
          multiplier = param * 4 + 300;
        } else if (param > 0) {
          multiplier = param * 5;
        }
      } else {
        if (param > 2500) {
          multiplier = param + 3000;
          multiplier += (param - 2500) * 0.2;
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

  getDefaultCardIds(idolConfig, stageConfig) {
    const defaultCardSet = stageConfig.defaultCardSet || stageConfig.type;
    if (defaultCardSet == "event" && idolConfig.recommendedEffect) {
      return EVENT_DEFAULT_CARD_IDS_BY_RECOMMENDED_EFFECT[
        idolConfig.recommendedEffect
      ];
    } else if (idolConfig.plan) {
      return CONTEST_DEFAULT_CARD_IDS_BY_PLAN[idolConfig.plan];
    } else if (stageConfig.plan != "free") {
      return CONTEST_DEFAULT_CARD_IDS_BY_PLAN[stageConfig.plan];
    } else {
      return CONTEST_DEFAULT_CARD_IDS_BY_PLAN.sense;
    }
  }
}
