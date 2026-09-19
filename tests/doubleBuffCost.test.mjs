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

test("buff costs are doubled while double buff cost is active", () => {
  const engine = createEngine();
  engine.logger.disable();
  const state = engine.getInitialState(true);
  state[S.fullPowerCharge] = 10;
  state[S.doubleBuffCostTurns] = 1;
  state[S.phase] = "processCost";

  engine.executor.executeActions(
    state,
    parseActions("fullPowerCharge-=2"),
    null,
  );

  assert.equal(state[S.fullPowerCharge], 6);
});

test("double buff cost does not alter non-cost decreases", () => {
  const engine = createEngine();
  engine.logger.disable();
  const state = engine.getInitialState(true);
  state[S.fullPowerCharge] = 10;
  state[S.doubleBuffCostTurns] = 1;
  state[S.phase] = "processCard";

  engine.executor.executeActions(
    state,
    parseActions("fullPowerCharge-=2"),
    null,
  );

  assert.equal(state[S.fullPowerCharge], 8);
});
