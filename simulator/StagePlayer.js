export default class StagePlayer {
  constructor(engine, strategy) {
    this.engine = engine;
    this.strategy = strategy;
  }

  play() {
    let state = this.engine.getInitialState();
    state = this.engine.startStage(state);

    while (state.turnsRemaining > 0) {
      this.engine.logger.disable();
      const { scores, selectedCardId } = this.strategy.evaluate(state);
      this.engine.logger.enable();

      this.engine.logger.log("hand", {
        handCardIds: [...state.handCardIds],
        scores,
        selectedCardId: selectedCardId,
      });

      if (selectedCardId) {
        state = this.engine.useCard(state, selectedCardId);
      } else {
        state = this.engine.endTurn(state);
      }
    }

    return {
      score: state.score,
      logs: this.engine.logger.logs,
      graphData: this.engine.logger.graphData,
    };
  }
}
