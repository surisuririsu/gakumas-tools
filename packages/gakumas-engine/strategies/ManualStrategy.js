import { S } from "../constants.js";
import BaseStrategy from "./BaseStrategy.js";

export class HoldSelectionRequest extends Error {
  constructor(state, cards, num) {
    super("Hold selection required");
    this.name = "HoldSelectionRequest";
    this.state = state;
    this.cards = cards;
    this.num = num;
  }
}

export class MoveToHandSelectionRequest extends Error {
  constructor(state, cards, num) {
    super("Move to hand selection required");
    this.name = "MoveToHandSelectionRequest";
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

  pickCardsToMoveToHand(state, cards, num = 1) {
    if (!this.pickCardsToMoveToHandIndices) {
      throw new MoveToHandSelectionRequest(state, cards, num);
    }

    const indices = this.pickCardsToMoveToHandIndices;
    delete this.pickCardsToMoveToHandIndices;
    return indices;
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
    } else if (exception instanceof MoveToHandSelectionRequest) {
      const selectedIndices = await this.inputCallback({
        type: "MOVE_TO_HAND_SELECTION",
        state: exception.state,
        cards: exception.cards,
        num: exception.num,
      });

      this.pickCardsToMoveToHandIndices = selectedIndices;
    } else {
      throw exception;
    }

    return this.engine.executeDecision(state, decision);
  }
}
