import { StageStrategy } from "gakumas-engine";

export const MAX_DEPTH = 2;

export default class DeepRandomScoreStrategy extends StageStrategy {
  depth = 0;

  getScore(state, cardId) {
    if (!this.engine.isCardUsable(state, cardId)) {
      return -Infinity;
    }

    state = this.engine.useCard(state, cardId);
    this.depth++;

    if (this.depth >= MAX_DEPTH) {
      this.depth--;
      return Math.random();
    }

    while (state.turnsRemaining > 0) {
      const { selectedCardId } = this.evaluate(state);
      if (selectedCardId) {
        state = this.engine.useCard(state, selectedCardId);
      } else {
        state = this.engine.endTurn(state);
      }
    }

    this.depth--;
    return state.score;
  }
}
