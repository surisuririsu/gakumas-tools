import { test } from "node:test";
import assert from "node:assert/strict";
import { deserializeEffectSequence, Stages } from "gakumas-data";
import {
  IdolConfig,
  IdolStageConfig,
  S,
  StageConfig,
  StageEngine,
} from "gakumas-engine";

function createEngine() {
  const idol = new IdolConfig({
    params: [100, 100, 100, 30],
    supportBonus: 0,
    pItemIds: [],
    skillCardIdGroups: [[19]],
    customizationGroups: [[]],
  });
  const stage = new StageConfig(Stages.getById(1));
  return new StageEngine(new IdolStageConfig(idol, stage));
}

function parseActions(source) {
  return deserializeEffectSequence(source).flatMap((effect) => effect.actions);
}

test("good condition addition applies before the multiplicative buff", () => {
  const engine = createEngine();
  engine.logger.disable();
  const state = engine.getInitialState(true);

  engine.executor.executeActions(
    state,
    parseActions(
      "setGoodConditionTurnsAdditionBuff(2,3); " +
        "setGoodConditionTurnsBuff(0.5,3); goodConditionTurns+=4",
    ),
    null,
  );

  assert.equal(state[S.goodConditionTurns], 9);
});

test("good condition addition buff uses the normal buff duration lifecycle", () => {
  const engine = createEngine();
  engine.logger.disable();
  const state = engine.getInitialState(true);

  engine.executor.executeActions(
    state,
    parseActions("setGoodConditionTurnsAdditionBuff(2,3)"),
    null,
  );

  engine.buffManager.decrementBuffTurns(state);
  assert.equal(state[S.goodConditionTurnsAdditionBuffs][0].turns, 3);
  engine.buffManager.decrementBuffTurns(state);
  assert.equal(state[S.goodConditionTurnsAdditionBuffs][0].turns, 2);
});
