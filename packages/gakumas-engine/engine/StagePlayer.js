import { S } from "../constants.js";

export default class StagePlayer {
  constructor(engine, strategy) {
    this.engine = engine;
    this.strategy = strategy;
  }

  async play() {
    this.engine.logger.reset();
    let state = this.engine.getInitialState();
    state = this.engine.startStage(state);

    while (state[S.turnsRemaining] > 0) {
      const decision = await this.strategy.evaluate(state);
      try {
        state = this.engine.executeDecision(state, decision);
      } catch (e) {
        state = await this.strategy.handleException(e, state, decision);
      }
    }

    return {
      score: state[S.score],
      logs: this.engine.logger.pickLogs(state),
      graphData: state[S.graphData],
    };
  }
}
