import { StageStrategy } from "../engine";

export default class RandomStrategy extends StageStrategy {
  getScore(state, cardId) {
    if (!this.engine.isCardUsable(state, cardId)) {
      return -Infinity;
    }
    return Math.round(Math.random() * 10000);
  }
}
