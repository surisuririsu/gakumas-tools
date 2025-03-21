export default class BaseStrategy {
  constructor(engine) {
    this.engine = engine;
  }

  /**
   * Evaluates the given state, and selects a card to play.
   * Returns the next state and numeric evaluation of the future state.
   */
  evaluate(state) {
    throw new Error("evaluate is not implemented!");
  }

  /**
   * Given a state and list of cards, selects a card to hold.
   * Returns the index of the card to hold.
   */
  pickCardToHold(state, cards) {
    throw new Error("pickCardToHold is not implemented!");
  }
}
