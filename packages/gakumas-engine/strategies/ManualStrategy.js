import { S } from "../constants";
import BaseStrategy from "./BaseStrategy";

export class HoldSelectionRequest extends Error {
  constructor(state, cards, num) {
    super("Hold selection required");
    this.name = "HoldSelectionRequest";
    this.state = state;
    this.cards = cards;
    this.num = num;
  }
}

export default class ManualStrategy extends BaseStrategy {
  constructor(engine, inputCallback) {
    super(engine);
    this.inputCallback = inputCallback;
  }

  async evaluate(state) {
    const logIndex = this.engine.logger.log(state, "hand", null);

    const usableCards = state[S.handCards].filter((card) =>
      this.engine.isCardUsable(state, card)
    );

    this.engine.logger.logs[logIndex].data = {
      handCards: state[S.handCards].map((card) => ({
        id: state[S.cardMap][card].id,
        c: state[S.cardMap][card].c11n,
      })),
      scores: state[S.handCards].map((card) =>
        usableCards.includes(card) ? 0 : -Infinity
      ),
      selectedIndex: null,
      state: this.engine.logger.getHandStateForLogging(state),
    };

    const selectedCard = await this.inputCallback({
      type: "CARD_SELECTION",
      state,
      handCards: state[S.handCards],
      usableCards,
    });

    return { card: selectedCard };
  }

  pickCardsToHold(state, cards, num = 1) {
    if (!this.pickCardsToHoldIndices) {
      throw new HoldSelectionRequest(state, cards, num);
    }

    const indices = this.pickCardsToHoldIndices;
    delete this.pickCardsToHoldIndices;
    return indices;
  }

  async handleException(exception, state, decision) {
    if (exception instanceof HoldSelectionRequest) {
      const selectedIndices = await this.inputCallback({
        type: "HOLD_SELECTION",
        state: exception.state,
        cards: exception.cards,
        num: exception.num,
      });

      this.pickCardsToHoldIndices = selectedIndices;
    } else {
      throw exception;
    }

    return this.engine.executeDecision(state, decision);
  }
}
