import { test } from "node:test";
import assert from "node:assert/strict";
import { Stages } from "gakumas-data";
import {
  IdolConfig,
  IdolStageConfig,
  S,
  StageConfig,
  StageEngine,
} from "gakumas-engine";

const UNMEI_NO_DEAI_PLUS = 247;

function createEngine(pItemIds) {
  const idol = new IdolConfig({
    params: [2000, 2700, 800, 50],
    supportBonus: 0,
    pItemIds,
    skillCardIdGroups: [[527]],
    customizationGroups: [[]],
  });
  const stage = new StageConfig(Stages.getById(189));
  const engine = new StageEngine(new IdolStageConfig(idol, stage));
  engine.logger.disable();
  return engine;
}

test("next-turn reservations made at turn start fire on the next turn", () => {
  const engine = createEngine([UNMEI_NO_DEAI_PLUS]);
  let state = engine.startStage(engine.getInitialState());
  assert.equal(state[S.stance], "none");

  state[S.fullPowerCharge] = 10;
  state = engine.endTurn(state);
  assert.equal(state[S.stance], "fullPower");

  state = engine.endTurn(state);
  assert.equal(state[S.stance], "preservation");
});
