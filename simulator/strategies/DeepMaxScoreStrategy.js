import BaseStrategy from "./BaseStrategy";

const MAX_DEPTH = 3;

export default class DeepScoreStrategy extends BaseStrategy {
  depth = 0;

  getScore(state, cardId) {
    if (!this.engine.isCardUsable(state, cardId)) {
      return -Infinity;
    }

    state = this.engine.useCard(state, cardId);
    this.depth++;

    if (state.turnsRemaining == 0 || this.depth >= MAX_DEPTH) {
      this.depth--;
      return state.score;
    }

    const { scores } = this.evaluate(state);

    this.depth--;
    return Math.max(...scores);
  }
}
