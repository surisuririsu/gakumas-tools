export default class DeepScoreStrategy {
  constructor(engine, maxDepth) {
    this.engine = engine;
    this.maxDepth = maxDepth;
  }

  chooseCard(state, depth = 1) {
    this.engine.logger.disabled = true;
    const scores = state.handCardIds.map((id) =>
      this.predictScore(state, id, depth)
    );
    this.engine.logger.disabled = false;

    let cardToUse = null;
    const maxScore = Math.max(...scores);
    if (maxScore > 0) {
      const maxIndex = scores.indexOf(maxScore);
      cardToUse = state.handCardIds[maxIndex];
    }

    this.engine.logger.log("hand", {
      handCardIds: [...state.handCardIds],
      scores,
      selectedCardId: cardToUse,
    });

    return cardToUse;
  }

  predictScore(state, cardId, depth) {
    if (!this.engine.isCardUsable(state, cardId)) {
      return -Infinity;
    }

    state = this.engine.useCard(state, cardId);
    if (state.turnsRemaining == 0 || depth >= this.maxDepth) {
      return state.score;
    }
    while (state.turnsRemaining > 0) {
      const cardToUse = this.chooseCard(state, depth + 1);
      if (cardToUse) {
        state = this.engine.useCard(state, cardToUse);
      } else {
        state = this.engine.endTurn(state);
      }
    }
    return state.score;
  }
}
