import { SkillCards } from "gakumas-data";

export default class StagePlayer {
  constructor(engine, strategy) {
    this.engine = engine;
    this.strategy = strategy;
  }

  play() {
    let state = this.engine.getInitialState();
    state = this.engine.startStage(state);

    let usedOrder = [];

    while (state.turnsRemaining > 0) {
      const cardToUse = this.strategy.chooseCard(state);

      if (cardToUse) {
        state = this.engine.useCard(state, cardToUse);
        usedOrder.push(cardToUse);
      } else {
        state = this.engine.endTurn(state);
      }
    }

    return {
      logs: this.engine.logger.logs,
      score: state.score,
    };
  }
}
