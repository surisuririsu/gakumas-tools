import { S } from "../constants";

export default class BaseStrategy {
  constructor(engine) {
    this.engine = engine;
  }

  evaluate(state) {
    const scores = state[S.handCards].map((card) => this.getScore(state, card));

    let selectedCard = null;
    const maxScore = Math.max(...scores);
    if (maxScore > 0) {
      const maxIndex = scores.indexOf(maxScore);
      selectedCard = state[S.handCards][maxIndex];
    }

    return { scores, selectedCard };
  }

  getScore(state, card) {
    throw new Error("getScore is not implemented!");
  }
}