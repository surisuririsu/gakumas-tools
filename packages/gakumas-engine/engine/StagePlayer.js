import { S } from "../constants";

export default class StagePlayer {
  constructor(engine, strategy) {
    this.engine = engine;
    this.strategy = strategy;
    this.engine.strategy = strategy;
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
        let exception = e;
        while (exception) {
          try {
            state = await this.strategy.handleException(
              exception,
              state,
              decision,
            );
            exception = null;
          } catch (newException) {
            exception = newException;
          }
        }
      }
    }

    return {
      score: state[S.score],
      logs: this.engine.logger.pickLogs(state),
      graphData: state[S.graphData],
    };
  }
}
