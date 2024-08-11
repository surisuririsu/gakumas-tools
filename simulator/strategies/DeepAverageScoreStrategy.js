import BaseStrategy from "./BaseStrategy";

export const MAX_DEPTH = 4;

export default class DeepAverageScoreStrategy extends BaseStrategy {
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
    let total = 0;
    for (let score of scores) {
      if (score != -Infinity) total += score;
    }

    this.depth--;
    return Math.round(total / scores.length);
  }
}
