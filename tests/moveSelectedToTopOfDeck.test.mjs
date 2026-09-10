import { test } from "node:test";
import assert from "node:assert/strict";
import { deserializeEffectSequence, Stages } from "gakumas-data";
import {
  CARD_PILES,
  IdolConfig,
  IdolStageConfig,
  S,
  StageConfig,
  StageEngine,
} from "gakumas-engine";
import ManualStrategy, {
  MoveToTopOfDeckSelectionRequest,
} from "../packages/gakumas-engine/strategies/ManualStrategy.js";

function createEngine() {
  const idol = new IdolConfig({
    params: [100, 100, 100, 30],
    supportBonus: 0,
    pItemIds: [],
    skillCardIdGroups: [[19, 21, 23]],
    customizationGroups: [[]],
  });
  const stage = new StageConfig(Stages.getById(1));
  return new StageEngine(new IdolStageConfig(idol, stage));
}

function parseActions(source) {
  return deserializeEffectSequence(source).flatMap((effect) => effect.actions);
}

test("selected cards move from deck and discard to the top of deck", () => {
  const engine = createEngine();
  engine.logger.disable();
  const state = engine.getInitialState(true);
  const [first, second, third] = state[S.deckCards];

  for (const pile of CARD_PILES) state[pile] = [];
  state[S.deckCards] = [first, second];
  state[S.discardedCards] = [third];
  engine.strategy = {
    pickCardsToMoveToTopOfDeck(_state, cards, num) {
      assert.deepEqual(cards, [first, second, third]);
      assert.equal(num, 2);
      return [0, 2];
    },
  };

  engine.executor.executeActions(
    state,
    parseActions("moveSelectedToTopOfDeck[deck | discarded](2)"),
    null,
  );

  assert.deepEqual(state[S.deckCards], [second, first, third]);
  assert.deepEqual(state[S.discardedCards], []);
  assert.equal(state[S.movedCard], third);
});

test("manual play requests and consumes a top-of-deck selection", async () => {
  const state = [];
  const cards = [4, 7, 9];
  const decision = { card: 1 };
  let request;
  const engine = {
    executeDecision(receivedState, receivedDecision) {
      return { receivedState, receivedDecision };
    },
  };
  const strategy = new ManualStrategy(engine, async (pending) => {
    request = pending;
    return [1, 2];
  });

  let exception;
  try {
    strategy.pickCardsToMoveToTopOfDeck(state, cards, 2);
  } catch (error) {
    exception = error;
  }
  assert.ok(exception instanceof MoveToTopOfDeckSelectionRequest);

  const resumed = await strategy.handleException(exception, state, decision);
  assert.equal(request.type, "MOVE_TO_TOP_OF_DECK_SELECTION");
  assert.deepEqual(strategy.pickCardsToMoveToTopOfDeck(state, cards, 2), [1, 2]);
  assert.deepEqual(resumed, {
    receivedState: state,
    receivedDecision: decision,
  });
});
