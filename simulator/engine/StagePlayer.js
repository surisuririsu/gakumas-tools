import { LOGGED_FIELDS } from "../constants";

export default class StagePlayer {
  constructor(engine, strategy) {
    this.engine = engine;
    this.strategy = strategy;
  }

  play() {
    let state = this.engine.getInitialState();
    this.engine.startStage(state);

    while (state.turnsRemaining > 0) {
      this.engine.logger.disable();
      const { scores, selectedCard } = this.strategy.evaluate(state);
      this.engine.logger.enable();

      this.engine.logger.log("hand", {
        handCardIds: state.handCards.map((card) => state.cardMap[card].id),
        scores,
        selectedCardId: state.cardMap[selectedCard]?.id,
        state: this.getHandStateForLogging(state),
      });

      if (selectedCard != null) {
        this.engine.useCard(state, selectedCard);
      } else {
        this.engine.endTurn(state);
      }
    }

    // console.log(state, this.engine.logger.logs);

    return {
      score: state.score,
      logs: this.engine.logger.logs,
      graphData: this.engine.logger.graphData,
    };
  }

  getHandStateForLogging(state) {
    let res = {};
    for (let i = 0; i < LOGGED_FIELDS.length; i++) {
      if (state[LOGGED_FIELDS[i]]) {
        res[LOGGED_FIELDS[i]] = state[LOGGED_FIELDS[i]];
      }
    }
    if (state.scoreBuffs.length) {
      res.scoreBuffs = state.scoreBuffs;
    }
    delete res.turnsRemaining;
    delete res.cardUsesRemaining;
    return res;
  }
}
