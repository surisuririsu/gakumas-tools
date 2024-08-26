import { StageStrategy } from "gakumas-engine";

export default class RandomStrategy extends StageStrategy {
  getScore() {
    return Math.round(Math.random() * 10000);
  }
}
