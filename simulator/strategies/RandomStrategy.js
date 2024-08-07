export default class RandomStrategy {
  constructor(engine) {
    this.engine = engine;
  }

  chooseCard(state) {
    const usableCards = state.handCards.filter((card) =>
      this.engine.isCardUsable(state, card)
    );
    if (usableCards.length) {
      return usableCards[Math.floor(Math.random() * usableCards.length)];
    }
    return null;
  }
}
