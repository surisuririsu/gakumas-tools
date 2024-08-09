export default class RandomStrategy {
  constructor(engine) {
    this.engine = engine;
  }

  chooseCard(state) {
    const usableCards = state.handCardIds.filter((cardId) =>
      this.engine.isCardUsable(state, cardId)
    );
    if (usableCards.length) {
      return usableCards[Math.floor(Math.random() * usableCards.length)];
    }
    return null;
  }
}
