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

function createState(engine) {
  engine.logger.disable();
  return engine.getInitialState(true);
}

test("enthusiasm is cleared at the end of the turn", () => {
  const engine = createEngine();
  const state = createState(engine);
  state[S.enthusiasm] = 10;

  engine.turnManager.endTurn(state);

  assert.equal(state[S.enthusiasm], 0);
});

test("enthusiasm extension keeps enthusiasm through the next turn", () => {
  const engine = createEngine();
  const state = createState(engine);
  state[S.enthusiasm] = 10;
  state[S.enthusiasmExtensionTurns] = 1;

  engine.turnManager.endTurn(state);
  assert.equal(state[S.enthusiasm], 10);
  assert.equal(state[S.enthusiasmExtensionTurns], 0);

  engine.turnManager.endTurn(state);
  assert.equal(state[S.enthusiasm], 0);
});

test("an end-of-turn extension applies to the turn it is registered in", () => {
  const engine = createEngine();
  const state = createState(engine);
  state[S.enthusiasm] = 10;

  engine.effectManager.triggerEffects(
    state,
    deserializeEffectSequence(
      "at:endOfTurn { enthusiasmExtensionTurns+=1; limit:1 }",
    ),
  );
  engine.turnManager.endTurn(state);

  assert.equal(state[S.enthusiasm], 10);
});
