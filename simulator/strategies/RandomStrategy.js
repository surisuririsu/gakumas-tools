import BaseStrategy from "./BaseStrategy";

export default class RandomStrategy extends BaseStrategy {
  getScore(state, card) {
    if (!this.engine.isCardUsable(state, card)) {
      return -Infinity;
    }
    return Math.round(Math.random() * 10000);
  }
}
