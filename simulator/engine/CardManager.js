import { SkillCards } from "gakumas-data/lite";
import EngineComponent from "./EngineComponent";
import { getRand, shallowCopy, shuffle } from "./utils";
import { CARD_PILES, COST_FIELDS, FUNCTION_CALL_REGEX, S } from "../constants";

export default class CardManager extends EngineComponent {
  constructor(engine) {
    super(engine);

    this.variableResolvers = {
      cardEffects: (state) => this.getCardEffects(state, state[S.usedCard]),
      usedCardId: (state) =>
        state[S.usedCard] && state[S.cardMap][state[S.usedCard]].id,
      usedCardBaseId: (state) =>
        state[S.usedCard] && state[S.cardMap][state[S.usedCard]].baseId,
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

    state[S.cardMap] = cardMap;
    state[S.deckCards] = cardMap.map((_, i) => i);
    shuffle(state[S.deckCards]);
    state[S.deckCards].sort((a, b) => {
      if (SkillCards.getById(cardMap[a].id).forceInitialHand) return 1;
      if (SkillCards.getById(cardMap[b].id).forceInitialHand) return -1;
      return 0;
    });
    state[S.handCards] = [];
    state[S.discardedCards] = [];
    state[S.removedCards] = [];
    state[S.heldCards] = [];
    state[S.cardsUsed] = 0;
    state[S.turnCardsUsed] = 0;
    state[S.turnCardsUpgraded] = 0;
  }

  getCardEffects(state, card) {
    const skillCard = SkillCards.getById(state[S.cardMap][card].id);
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
      const card = state[S.cardMap][cards[i]];
      if (!card.growth) card.growth = {};
      this.engine.executor.executeGrowthActions(card.growth, actions);
      this.logger.log(state, "growth", { type: "skillCard", id: card.id });
    }
  }

  drawCard(state) {
    // Hand size limit
    if (state[S.handCards].length >= 5) return;

    // No cards in deck
    if (!state[S.deckCards].length) {
      if (!state[S.discardedCards].length) return;
      this.recycleDiscards(state);
    }

    // Draw card
    const card = state[S.deckCards].pop();
    state[S.handCards].push(card);

    this.logger.debug(
      "Drew card",
      SkillCards.getById(state[S.cardMap][card].id).name
    );
    this.logger.log(state, "drawCard", {
      type: "skillCard",
      id: state[S.cardMap][card].id,
    });
  }

  recycleDiscards(state) {
    shuffle(state[S.discardedCards]);
    state[S.deckCards] = state[S.discardedCards];
    state[S.discardedCards] = [];
    this.logger.debug("Recycled discard pile");
  }

  peekDeck(state) {
    return state[S.deckCards][state[S.deckCards].length - 1];
  }

  isCardUsable(state, card) {
    const skillCard = SkillCards.getById(state[S.cardMap][card].id);

    // Check conditions
    for (let i = 0; i < skillCard.conditions.length; i++) {
      if (
        !this.engine.evaluator.evaluateCondition(state, skillCard.conditions[i])
      ) {
        return false;
      }
    }

    // Check cost
    const previewState = shallowCopy(state);
    for (let i = 0; i < skillCard.cost.length; i++) {
      this.engine.executor.executeAction(previewState, skillCard.cost[i], card);
    }
    for (let i = 0; i < COST_FIELDS.length; i++) {
      if (previewState[S[COST_FIELDS[i]]] < 0) return false;
    }

    return true;
  }

  useCard(state, card) {
    const handIndex = state[S.handCards].indexOf(card);
    const skillCard = SkillCards.getById(state[S.cardMap][card].id);

    this.logger.log(state, "entityStart", {
      type: "skillCard",
      id: skillCard.id,
    });

    this.logger.debug("Using card", skillCard.id, skillCard.name);

    // Set used card
    state[S.usedCard] = card;

    // Apply card cost
    let conditionState = shallowCopy(state);
    this.logger.debug("Applying cost", skillCard.cost);
    this.engine.executor.executeActions(state, skillCard.cost);
    if (state[S.nullifyCostCards]) state[S.nullifyCostCards]--;

    // Remove card from hand
    state[S.handCards].splice(handIndex, 1);
    state[S.cardUsesRemaining]--;

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
    if (state[S.doubleCardEffectCards]) {
      state[S.doubleCardEffectCards]--;
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
    state[S.cardsUsed]++;
    state[S.turnCardsUsed]++;

    // Trigger effects after card used
    conditionState = shallowCopy(state);
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
    delete state[S.usedCard];

    this.logger.log(state, "entityEnd", {
      type: "skillCard",
      id: skillCard.id,
    });

    // Send card to discards or remove
    if (state[S.thisCardHeld]) {
      state[S.thisCardHeld] = false;
    } else if (skillCard.limit) {
      state[S.removedCards].push(card);
    } else {
      state[S.discardedCards].push(card);
    }

    // End turn if no card uses left
    if (state[S.cardUsesRemaining] < 1) {
      this.engine.turnManager.endTurn(state);
    }
  }

  isUpgradable(state, card) {
    const skillCard = SkillCards.getById(state[S.cardMap][card].id);
    return !skillCard.upgraded && skillCard.type != "trouble";
  }

  upgrade(state, card) {
    state[S.cardMap][card].id++;
    state[S.turnCardsUpgraded]++;
  }

  discardHand(state) {
    while (state[S.handCards].length) {
      state[S.discardedCards].push(state[S.handCards].pop());
    }
  }

  upgradeHand(state) {
    for (let i = 0; i < state[S.handCards].length; i++) {
      if (this.isUpgradable(state[S.handCards][i])) {
        this.upgrade(state, state[S.handCards][i]);
      }
    }
    this.logger.log(state, "upgradeHand");
  }

  exchangeHand(state) {
    const numCards = state[S.handCards].length;
    this.discardHand(state);
    this.logger.log(state, "exchangeHand");
    for (let i = 0; i < numCards; i++) {
      this.drawCard(state);
    }
  }

  upgradeRandomCardInHand(state) {
    let unupgradedCards = [];
    for (let i = 0; i < state[S.handCards].length; i++) {
      if (this.isUpgradable(state, state[S.handCards][i])) {
        unupgradedCards.push(state[S.handCards][i]);
      }
    }
    if (!unupgradedCards.length) return;
    const randomCard =
      unupgradedCards[Math.floor(getRand() * unupgradedCards.length)];
    this.upgrade(state, randomCard);
    this.logger.log(state, "upgradeRandomCardInHand", {
      type: "skillCard",
      id: state[S.cardMap][randomCard].id,
    });
  }

  addRandomUpgradedCardToHand(state) {
    const validSkillCards = SkillCards.getFiltered({
      rarities: ["R", "SR", "SSR"],
      plans: [this.config.idol.plan, "free"],
      sourceTypes: ["produce"],
    }).filter((card) => card.upgraded);
    const skillCard =
      validSkillCards[Math.floor(getRand() * validSkillCards.length)];
    state[S.cardMap].push({
      id: skillCard.id,
      baseId: skillCard.id - skillCard.upgraded ? 1 : 0,
    });
    state[S.handCards].push(state[S.cardMap].length - 1);
    this.logger.log(state, "addRandomUpgradedCardToHand", {
      type: "skillCard",
      id: skillCard.id,
    });
  }

  holdCard(state, cardBaseId) {
    const card = state[S.cardMap].findIndex((c) => c.baseId == cardBaseId);
    for (let i = 0; i < CARD_PILES.length; i++) {
      const index = state[S[CARD_PILES[i]]].indexOf(card);
      if (index != -1) {
        state[S[CARD_PILES[i]]].splice(index, 1);
        state[S.heldCards].push(card);
        break;
      }
    }
  }

  holdThisCard(state) {
    state[S.heldCards].push(state[S.usedCard]);
    state[S.thisCardHeld] = true;
  }

  holdSelectedFromHand(state) {
    // TODO: Random for now
    const randomIndex = Math.floor(getRand() * state[S.handCards].length);
    const card = state[S.handCards].splice(randomIndex, 1)[0];
    if (card != null) {
      state[S.heldCards].push(card);
    }
    return state;
  }

  holdSelectedFromDeckOrDiscards(state) {
    // TODO: Random for now
    const randomIndex = Math.floor(
      getRand() * (state[S.deckCards].length + state[S.discardedCards].length)
    );
    let card;
    if (randomIndex >= state[S.deckCards].length) {
      card = state[S.discardedCards].splice(
        randomIndex - state[S.deckCards].length,
        1
      )[0];
    } else {
      card = state[S.deckCards].splice(randomIndex, 1)[0];
    }
    if (card) {
      state[S.heldCards].push(card);
    }
  }

  addHeldCardsToHand(state) {
    for (let i = 0; i < state[S.heldCards].length; i++) {
      state[S.handCards].push(state[S.heldCards].pop());
    }
  }
}
