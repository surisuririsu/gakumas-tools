export function formatStageName(stage, t) {
  let stageName = "";
  if (stage.type == "custom") {
    stageName = t("custom");
  } else if (stage.type == "contest") {
    stageName = t("contestStageName", {
      season: stage.season,
      stage: stage.stage,
    });
  } else if (stage.type == "event") {
    stageName = t("eventStageName", {
      name: stage.name,
      stage: stage.stage,
      round: stage.round,
    });
  }
  return stageName;
}

// Hack

import {
  Stages as StagesData,
  deserializeEffectSequence,
} from "gakumas-data/lite";

const STAGES = StagesData.getAll();

STAGES[STAGES.length - 3] = {
  id: 64,
  name: "シーズン17 ステージ1",
  type: "contest",
  season: 17,
  stage: 1,
  round: "",
  plan: "free",
  criteria: { vocal: 0.3, dance: 0.3, visual: 0.4 },
  turnCounts: { vocal: 4, dance: 3, visual: 5 },
  firstTurns: { vocal: 0.1, dance: 0, visual: 0.9 },
  effects: deserializeEffectSequence(
    "at:startOfTurn,do:setScoreBuff(1.2,5),do:doubleCostTurns+=5,limit:1"
  ),
};
STAGES[STAGES.length - 2] = {
  id: 65,
  name: "シーズン17 ステージ2",
  type: "contest",
  season: 17,
  stage: 2,
  round: "",
  plan: "logic",
  criteria: { vocal: 0.3, dance: 0.3, visual: 0.4 },
  turnCounts: { vocal: 4, dance: 3, visual: 5 },
  firstTurns: { vocal: 0.1, dance: 0, visual: 0.9 },
  effects: deserializeEffectSequence(
    "at:endOfTurn,if:stamina>=maxStamina*0.5,do:genki+=7,do:fixedStamina-=2,limit:5"
  ),
};
STAGES[STAGES.length - 1] = {
  id: 66,
  name: "シーズン17 ステージ3",
  type: "contest",
  season: 17,
  stage: 3,
  round: "",
  plan: "logic",
  criteria: { vocal: 0.3, dance: 0.3, visual: 0.4 },
  turnCounts: { vocal: 3, dance: 3, visual: 4 },
  firstTurns: { vocal: 0.1, dance: 0, visual: 0.9 },
  effects: deserializeEffectSequence(
    "at:endOfTurn,if:turnsRemaining<=1,do:score+=goodImpressionTurns*5,limit:1;at:startOfTurn,if:turnsElapsed==6,do:goodImpressionTurns*=1.5,limit:1"
  ),
};

const STAGES_BY_ID = STAGES.reduce((acc, cur) => {
  acc[cur.id] = cur;
  return acc;
}, {});

export class Stages {
  static getAll() {
    return STAGES;
  }

  static getById(id) {
    return STAGES_BY_ID[id];
  }
}
