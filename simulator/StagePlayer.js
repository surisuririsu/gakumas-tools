export default class StagePlayer {
  constructor(engine, strategy, debug = false) {
    this.engine = engine;
    this.strategy = strategy;
    this.debug = debug;
  }

  play() {
    this.engine.debug = this.debug;
    let state = this.engine.getInitialState();
    state = this.engine.startStage(state);
    this.engine.debug = false;

    while (state.turnsRemaining > 0) {
      const cardToUse = this.strategy.chooseCard(state);
      this.engine.debug = this.debug;
      if (cardToUse) {
        state = this.engine.useCard(state, cardToUse);
      } else {
        state = this.engine.endTurn(state);
      }
      this.engine.debug = false;
    }

    return state.score;
  }
}
