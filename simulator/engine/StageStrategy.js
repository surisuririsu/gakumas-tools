export default class StageStrategy {
  constructor(engine) {
    this.engine = engine;
  }

  evaluate(state) {
    const scores = state.handCardIds.map((id) => this.getScore(state, id));

    let selectedCardId = null;
    const maxScore = Math.max(...scores);
    if (maxScore > 0) {
      const maxIndex = scores.indexOf(maxScore);
      selectedCardId = state.handCardIds[maxIndex];
    }

    return { scores, selectedCardId };
  }

  getScore(state, cardId) {
    throw new Error("getScore is not implemented!");
  }
}
