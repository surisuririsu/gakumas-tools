import { SkillCards } from "gakumas-data/lite";
import EngineComponent from "./EngineComponent";
import { shuffle } from "./utils";
import { COST_FIELDS, FUNCTION_CALL_REGEX } from "../constants";

export default class CardManager extends EngineComponent {
  constructor(engine) {
    super(engine);

    this.variableResolvers = {
      cardEffects: (state) => this.getCardEffects(state, state.usedCard),
      usedCardId: (state) => state.usedCard && state.cardMap[state.usedCard].id,
      usedCardBaseId: (state) =>
        state.usedCard && state.cardMap[state.usedCard].baseId,
    };
  }

  initializeState(state) {
    const cardIds = this.config.idol.skillCardIds.concat(
      this.config.defaultCardIds
    );
    const cardMap = cardIds.map((id) => ({
      id,
      baseId: SkillCards.getById(id).upgraded ? id - 1 : id,
    }));

    state.cardMap = cardMap;
    state.deckCards = cardMap.map((_, i) => i);
    shuffle(state.deckCards);
    state.deckCards.sort((a, b) => {
      if (SkillCards.getById(cardMap[a].id).forceInitialHand) return 1;
      if (SkillCards.getById(cardMap[b].id).forceInitialHand) return -1;
      return 0;
    });
    state.handCards = [];
    state.discardedCards = [];
    state.removedCards = [];
    state.heldCards = [];
    state.cardsUsed = 0;
    state.turnCardsUsed = 0;
    state.turnCardsUpgraded = 0;
  }

  getCardEffects(state, card) {
    const skillCard = SkillCards.getById(state.cardMap[card].id);
    let cardEffects = new Set();
    for (let i = 0; i < skillCard.effects.length; i++) {
      const effect = skillCard.effects[i];
      if (effect.phase || !effect.actions) continue;
      for (let j = 0; j < effect.actions.length; j++) {
        const tokens = effect.actions[j];
        if (!tokens?.[0]?.length) continue;
        let cardEffect = tokens[0];
        if (cardEffect.startsWith("setStance")) {
          cardEffect = cardEffect.match(FUNCTION_CALL_REGEX)[2];
        }
        cardEffects.add(cardEffect);
      }
    }
    return cardEffects;
  }

  grow(state, cards, actions) {
    for (let i = 0; i < cards.length; i++) {
      const card = state.cardMap[cards[i]];
      if (!card.growth) card.growth = {};
      this.engine.executor.executeGrowthActions(card.growth, actions);
      this.logger.log("growth", { type: "skillCard", id: card.id });
    }
  }

  drawCard(state) {
    // Hand size limit
    if (state.handCards.length >= 5) return;

    // No cards in deck
    if (!state.deckCards.length) {
      if (!state.discardedCards.length) return;
      this.recycleDiscards(state);
    }

    // Draw card
    const card = state.deckCards.pop();
    state.handCards.push(card);

    this.logger.debug(
      "Drew card",
      SkillCards.getById(state.cardMap[card].id).name
    );
    this.logger.log("drawCard", {
      type: "skillCard",
      id: state.cardMap[card].id,
    });
  }

  recycleDiscards(state) {
    shuffle(state.discardedCards);
    state.deckCards = state.discardedCards;
    state.discardedCards = [];
    this.logger.debug("Recycled discard pile");
  }

  peekDeck(state) {
    return state.deckCards[state.deckCards.length - 1];
  }

  isCardUsable(state, card) {
    const skillCard = SkillCards.getById(state.cardMap[card].id);

    // Check conditions
    for (let i = 0; i < skillCard.conditions.length; i++) {
      if (
        !this.engine.evaluator.evaluateCondition(state, skillCard.conditions[i])
      ) {
        return false;
      }
    }

    // Check cost
    const previewState = { ...state };
    for (let i = 0; i < skillCard.cost.length; i++) {
      this.engine.executor.executeAction(previewState, skillCard.cost[i], card);
    }
    for (let i = 0; i < COST_FIELDS.length; i++) {
      if (previewState[COST_FIELDS[i]] < 0) return false;
    }

    return true;
  }

  useCard(state, card) {
    const handIndex = state.handCards.indexOf(card);
    const skillCard = SkillCards.getById(state.cardMap[card].id);

    this.logger.log("entityStart", { type: "skillCard", id: skillCard.id });

    this.logger.debug("Using card", skillCard.id, skillCard.name);

    // Set used card
    state.usedCard = card;

    // Apply card cost
    let conditionState = { ...state };
    this.logger.debug("Applying cost", skillCard.cost);
    this.engine.executor.executeActions(state, skillCard.cost);
    if (state.nullifyCostCards) state.nullifyCostCards--;

    // Remove card from hand
    state.handCards.splice(handIndex, 1);
    state.cardUsesRemaining--;

    // Trigger effects on card used
    this.engine.effectManager.triggerEffectsForPhase(
      state,
      "cardUsed",
      conditionState
    );
    if (skillCard.type == "active") {
      this.engine.effectManager.triggerEffectsForPhase(
        state,
        "activeCardUsed",
        conditionState
      );
    } else if (skillCard.type == "mental") {
      this.engine.effectManager.triggerEffectsForPhase(
        state,
        "mentalCardUsed",
        conditionState
      );
    }

    // Apply card effects
    if (state.doubleCardEffectCards) {
      state.doubleCardEffectCards--;
      this.engine.effectManager.triggerEffects(
        state,
        skillCard.effects,
        null,
        card
      );
    }
    this.engine.effectManager.triggerEffects(
      state,
      skillCard.effects,
      null,
      card
    );

    // Increment counters
    state.cardsUsed++;
    state.turnCardsUsed++;

    // Trigger effects after card used
    conditionState = { ...state };
    this.engine.effectManager.triggerEffectsForPhase(
      state,
      "afterCardUsed",
      conditionState
    );
    if (skillCard.type == "active") {
      this.engine.effectManager.triggerEffectsForPhase(
        state,
        "afterActiveCardUsed",
        conditionState
      );
    } else if (skillCard.type == "mental") {
      this.engine.effectManager.triggerEffectsForPhase(
        state,
        "afterMentalCardUsed",
        conditionState
      );
    }

    // Reset used card
    delete state.usedCard;

    this.logger.log("entityEnd", { type: "skillCard", id: skillCard.id });

    // Send card to discards or remove
    if (state.thisCardHeld) {
      state.thisCardHeld = false;
    } else if (skillCard.limit) {
      state.removedCards.push(card);
    } else {
      state.discardedCards.push(card);
    }

    // End turn if no card uses left
    if (state.cardUsesRemaining < 1) {
      this.engine.turnManager.endTurn(state);
    }
  }

  isUpgradable(state, card) {
    const skillCard = SkillCards.getById(state.cardMap[card].id);
    return !skillCard.upgraded && skillCard.type != "trouble";
  }

  upgrade(state, card) {
    state.cardMap[card].id++;
    state.turnCardsUpgraded++;
  }

  discardHand(state) {
    while (state.handCards.length) {
      state.discardedCards.push(state.handCards.pop());
    }
  }

  upgradeHand(state) {
    for (let i = 0; i < state.handCards.length; i++) {
      if (this.isUpgradable(state.handCards[i])) {
        this.upgrade(state, state.handCards[i]);
      }
    }
    this.logger.log("upgradeHand");
  }

  exchangeHand(state) {
    const numCards = state.handCards.length;
    this.discardHand(state);
    this.logger.log("exchangeHand");
    for (let i = 0; i < numCards; i++) {
      this.drawCard(state);
    }
  }

  upgradeRandomCardInHand(state) {
    let unupgradedCards = [];
    for (let i = 0; i < state.handCards.length; i++) {
      if (this.isUpgradable(state, state.handCards[i])) {
        unupgradedCards.push(state.handCards[i]);
      }
    }
    if (!unupgradedCards.length) return;
    const randomCard =
      unupgradedCards[Math.floor(Math.random() * unupgradedCards.length)];
    this.upgrade(state, randomCard);
    this.logger.log("upgradeRandomCardInHand", {
      type: "skillCard",
      id: state.cardMap[randomCard].id,
    });
  }

  addRandomUpgradedCardToHand(state) {
    const validSkillCards = SkillCards.getFiltered({
      rarities: ["R", "SR", "SSR"],
      plans: [this.config.idol.plan, "free"],
      sourceTypes: ["produce"],
    }).filter((card) => card.upgraded);
    const skillCard =
      validSkillCards[Math.floor(Math.random() * validSkillCards.length)];
    state.cardMap.push({
      id: skillCard.id,
      baseId: skillCard.id - skillCard.upgraded ? 1 : 0,
    });
    state.handCards.push(state.cardMap.length - 1);
    this.logger.log("addRandomUpgradedCardToHand", {
      type: "skillCard",
      id: skillCard.id,
    });
  }

  holdCard(state, cardBaseId) {
    const card = state.cardMap.findIndex((c) => c.baseId == cardBaseId);
    for (let i = 0; i < CARD_PILES.length; i++) {
      const index = state[CARD_PILES[i]].indexOf(card);
      if (index != -1) {
        state[CARD_PILES[i]].splice(index, 1);
        state.heldCards.push(card);
        break;
      }
    }
  }

  holdThisCard(state) {
    state.heldCards.push(state.usedCard);
    state.thisCardHeld = true;
  }

  holdSelectedFromHand(state) {
    // TODO: Random for now
    const randomIndex = Math.floor(Math.random() * state.handCards.length);
    const card = state.handCards.splice(randomIndex, 1)[0];
    if (card != null) {
      state.heldCards.push(card);
    }
    return state;
  }

  holdSelectedFromDeckOrDiscards(state) {
    // TODO: Random for now
    const randomIndex = Math.floor(
      Math.random() * (state.deckCards.length + state.discardedCards.length)
    );
    let card;
    if (randomIndex >= state.deckCards.length) {
      card = state.discardedCards.splice(
        randomIndex - state.deckCards.length,
        1
      )[0];
    } else {
      card = state.deckCards.splice(randomIndex, 1)[0];
    }
    if (card) {
      state.heldCards.push(card);
    }
  }

  addHeldCardsToHand(state) {
    for (let i = 0; i < state.heldCards.length; i++) {
      state.handCards.push(state.heldCards.pop());
    }
  }
}
