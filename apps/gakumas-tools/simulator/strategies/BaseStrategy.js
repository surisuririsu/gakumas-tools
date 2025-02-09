export default class BaseStrategy {
  constructor(engine) {
    this.engine = engine;
  }

  evaluate(state) {
    throw new Error("evaluate is not implemented!");
  }

  getScore(state, card) {
    throw new Error("getScore is not implemented!");
  }
}
