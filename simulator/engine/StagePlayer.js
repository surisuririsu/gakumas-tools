import { S } from "../constants";

export default class StagePlayer {
  constructor(engine, strategy) {
    this.engine = engine;
    this.strategy = strategy;
  }

  play() {
    let logs = [];
    let state = this.engine.getInitialState();
    state = this.engine.startStage(state);

    while (state[S.turnsRemaining] > 0) {
      state = this.strategy.evaluate(state).state;
      logs.push(state.logs);
      state.logs = [];
    }

    return {
      score: state[S.score],
      logs: [].concat(...logs),
      graphData: state.graphData,
    };
  }
}
