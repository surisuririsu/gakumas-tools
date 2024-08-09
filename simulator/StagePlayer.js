export default class StagePlayer {
  constructor(engine, strategy, loggingEnabled = false) {
    this.engine = engine;
    this.strategy = strategy;
    this.loggingEnabled = loggingEnabled;
  }

  play() {
    this.engine.loggingEnabled = this.loggingEnabled;
    let state = this.engine.getInitialState();
    state = this.engine.startStage(state);
    this.engine.loggingEnabled = false;

    while (state.turnsRemaining > 0) {
      const cardToUse = this.strategy.chooseCard(state);
      this.engine.loggingEnabled = this.loggingEnabled;
      if (cardToUse) {
        state = this.engine.useCard(state, cardToUse);
      } else {
        state = this.engine.endTurn(state);
      }
      this.engine.loggingEnabled = false;

      console.log(state.score);
    }

    return state.score;
  }
}
