import { LOGGED_FIELDS, S } from "../constants";

export default class StagePlayer {
  constructor(engine, strategy) {
    this.engine = engine;
    this.strategy = strategy;
  }

  play() {
    let state = this.engine.getInitialState();
    this.engine.startStage(state);

    while (state[S.turnsRemaining] > 0) {
      this.engine.logger.disable();
      const { scores, selectedCard } = this.strategy.evaluate(state);
      this.engine.logger.enable();

      this.engine.logger.log("hand", {
        handCardIds: state[S.handCards].map(
          (card) => state[S.cardMap][card].id
        ),
        scores,
        selectedCardId: state[S.cardMap][selectedCard]?.id,
        state: this.getHandStateForLogging(state),
      });

      if (selectedCard != null) {
        this.engine.useCard(state, selectedCard);
      } else {
        this.engine.endTurn(state);
      }
    }

    return {
      score: state[S.score],
      logs: this.engine.logger.logs,
      graphData: this.engine.logger.graphData,
    };
  }

  getHandStateForLogging(state) {
    let res = {};
    for (let i = 0; i < LOGGED_FIELDS.length; i++) {
      if (state[S[LOGGED_FIELDS[i]]]) {
        res[LOGGED_FIELDS[i]] = state[S[LOGGED_FIELDS[i]]];
      }
    }
    if (state[S.scoreBuffs].length) {
      res.scoreBuffs = JSON.parse(JSON.stringify(state[S.scoreBuffs]));
    }
    delete res.turnsRemaining;
    delete res.cardUsesRemaining;
    return res;
  }
}
