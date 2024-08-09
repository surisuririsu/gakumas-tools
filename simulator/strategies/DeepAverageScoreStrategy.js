export default class DeepAverageScoreStrategy {
  constructor(engine, maxDepth) {
    this.engine = engine;
    this.maxDepth = maxDepth;
  }

  chooseCard(state) {
    let usableCardIds = [];
    for (let i = 0; i < state.handCardIds.length; i++) {
      if (this.engine.isCardUsable(state, state.handCardIds[i])) {
        usableCardIds.push(state.handCardIds[i]);
      }
    }

    if (usableCardIds.length == 0) return null;

    let cardId = null;
    let maxScore = 0;

    for (let i = 0; i < usableCardIds.length; i++) {
      const score = this.predictScore(state, usableCardIds[i], 1);
      if (score > maxScore) {
        cardId = usableCardIds[i];
        maxScore = score;
      }
    }

    return cardId;
  }

  predictScore(state, cardId, depth) {
    state = this.engine.useCard(state, cardId);
    if (state.turnsRemaining == 0 || depth == this.maxDepth) {
      return state.score;
    }

    let usableCardIds = [];
    for (let i = 0; i < state.handCardIds.length; i++) {
      if (this.engine.isCardUsable(state, state.handCardIds[i])) {
        usableCardIds.push(state.handCardIds[i]);
      }
    }

    let totalScore = 0;
    for (let i = 0; i < usableCardIds.length; i++) {
      totalScore += this.predictScore(state, usableCardIds[i], depth + 1);
    }

    return totalScore / usableCardIds.length;
  }
}
