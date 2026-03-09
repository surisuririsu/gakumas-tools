import STAGES from "../json/stages.json" with { type: "json" };
import { deserializeEffectSequence } from "../utils/effects.js";
STAGES.forEach((stage) => {
  const [vo, da, vi] = stage.criteria.split(",").map((p) => parseFloat(p));
  stage.criteria = { vocal: vo, dance: da, visual: vi };
  const [voT, daT, viT] = stage.turnCounts
    .split(",")
    .map((p) => parseInt(p, 10));
  stage.turnCounts = { vocal: voT, dance: daT, visual: viT };
  const [voFt, daFt, viFt] = stage.firstTurns
    .split(",")
    .map((p) => parseFloat(p));
  stage.firstTurns = { vocal: voFt, dance: daFt, visual: viFt };
  stage.effects = deserializeEffectSequence(stage.effects);
  stage.linkTurnCounts = stage.linkTurnCounts
    .split(",")
    .map((p) => parseInt(p, 10));
});

const STAGES_BY_ID = STAGES.reduce((acc, cur) => {
  acc[cur.id] = cur;
  return acc;
}, {});

class Stages {
  static getAll() {
    return STAGES;
  }

  static getById(id) {
    return STAGES_BY_ID[id];
  }
}

export default Stages;
