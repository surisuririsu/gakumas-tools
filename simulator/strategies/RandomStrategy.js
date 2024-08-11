import BaseStrategy from "./BaseStrategy";

export default class RandomStrategy extends BaseStrategy {
  getScore() {
    return Math.random();
  }
}
