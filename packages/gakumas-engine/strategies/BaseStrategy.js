export default class BaseStrategy {
  constructor(engine) {
    this.engine = engine;
  }

  evaluate(state) {
    throw new Error("evaluate is not implemented!");
  }

  pickCardToHold(state, cards) {
    throw new Error("pickCardToHold is not implemented!");
  }
}
