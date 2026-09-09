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

test("Good Impression card costs accumulate across a lesson", () => {
  const engine = createEngine();
  engine.logger.disable();
  const state = engine.getInitialState(true);
  state[S.goodImpressionTurns] = 12;
  state[S.phase] = "processCost";

  engine.executor.executeActions(
    state,
    parseActions("goodImpressionTurns-=5"),
    null,
  );
  engine.executor.executeActions(
    state,
    parseActions("goodImpressionTurns-=4"),
    null,
  );

  assert.equal(state[S.goodImpressionTurns], 3);
  assert.equal(state[S.consumedGoodImpressionTurns], 9);
});

test("Good Impression decreases outside card costs do not accumulate", () => {
  const engine = createEngine();
  engine.logger.disable();
  const state = engine.getInitialState(true);
  state[S.goodImpressionTurns] = 12;
  state[S.phase] = "processCard";

  engine.executor.executeActions(
    state,
    parseActions("goodImpressionTurns-=6"),
    null,
  );

  assert.equal(state[S.goodImpressionTurns], 6);
  assert.equal(state[S.consumedGoodImpressionTurns], 0);
});
