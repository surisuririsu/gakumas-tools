export default class DeepRandomScoreStrategy {
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
      const score = this.predictScore(state, usableCardIds[i]);
      if (score > maxScore) {
        cardId = usableCardIds[i];
        maxScore = score;
      }
    }

    return cardId;
  }

  predictScore(state, cardId) {
    state = this.engine.useCard(state, cardId);
    for (let i = 0; i < this.maxDepth; i++) {
      if (state.turnsRemaining < 1) break;

      let usableCardIds = [];
      for (let i = 0; i < state.handCardIds.length; i++) {
        if (this.engine.isCardUsable(state, state.handCardIds[i])) {
          usableCardIds.push(state.handCardIds[i]);
        }
      }

      if (usableCardIds.length) {
        state = this.engine.useCard(state, usableCardIds[0]);
      } else {
        state = this.engine.endTurn(state);
      }
    }
    return state.score;
  }
}
