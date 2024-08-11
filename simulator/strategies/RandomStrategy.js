import BaseStrategy from "./BaseStrategy";

export default class RandomStrategy extends BaseStrategy {
  getScore() {
    return Math.round(Math.random() * 10000);
  }
}
