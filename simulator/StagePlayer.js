import { GRAPHED_FIELDS } from "./constants";

export default class StagePlayer {
  constructor(engine, strategy) {
    this.engine = engine;
    this.strategy = strategy;
  }

  play() {
    let turnsElapsed = 0;
    let graphData = [];

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

      if (state.turnsElapsed > turnsElapsed) {
        let turnGraphData = {};
        for (let field of GRAPHED_FIELDS) {
          turnGraphData[field] = state[field];
        }
        graphData.push(turnGraphData);
        turnsElapsed = state.turnsElapsed;
      }
    }

    return {
      logs: this.engine.logger.logs,
      score: state.score,
      graphData,
    };
  }
}
