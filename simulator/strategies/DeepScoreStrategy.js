export default class DeepScoreStrategy {
  constructor(engine, maxDepth) {
    this.engine = engine;
    this.maxDepth = maxDepth;
  }

  chooseCard(state) {
    const usableCards = state.handCards.filter((card) =>
      this.engine.isCardUsable(state, card)
    );
    if (usableCards.length) {
      const { card } = usableCards.reduce(
        (acc, cur) => {
          const score = this.predictScore(state, cur, 1);
          if (score > acc.maxScore) {
            return { card: cur, maxScore: score };
          }
          return acc;
        },
        { card: null, maxScore: 0 }
      );
      return card;
    }
    return null;
  }

  predictScore(state, card, depth) {
    state = this.engine.useCard(state, card);
    if (state.turnsRemaining == 0 || depth == this.maxDepth) {
      return state.score;
    }
    const usableCards = state.handCards.filter((card) =>
      this.engine.isCardUsable(state, card)
    );
    return (
      usableCards.reduce(
        (acc, cur) => acc + this.predictScore(state, cur, depth + 1),
        0
      ) / usableCards.length
    );
  }
}
