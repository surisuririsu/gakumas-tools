import { Customizations, SkillCards } from "gakumas-data";
import {
  CARD_PILES,
  COST_FIELDS,
  FUNCTION_CALL_REGEX,
  HOLD_SOURCES_BY_ALIAS,
  S,
} from "../constants";
import EngineComponent from "./EngineComponent";
import { getBaseId, getRand, shallowCopy, shuffle } from "../utils";

export default class CardManager extends EngineComponent {
  constructor(engine) {
    super(engine);

    this.variableResolvers = {
      cardEffects: (state) => this.getCardEffects(state, state[S.usedCard]),
      cardSourceType: (state) =>
        this.getCardSourceType(state, state[S.usedCard]),
      usedCardId: (state) =>
        state[S.usedCard] && state[S.cardMap][state[S.usedCard]].id,
      usedCardBaseId: (state) =>
        state[S.usedCard] && state[S.cardMap][state[S.usedCard]].baseId,
      numHeldCards: (state) => state[S.heldCards].length,
      numRemovedCards: (state) => state[S.removedCards].length,
    };
  }

  initializeState(state) {
    const cards = this.config.idol.cards.concat(
      this.config.defaultCardIds.map((id) => ({ id }))
    );
    const cardMap = cards.map(({ id, customizations }) => {
      const card = {
        id,
        baseId: getBaseId(SkillCards.getById(id)),
      };
      if (customizations && Object.keys(customizations).length) {
        card.c11n = customizations;
      }
      return card;
    });

    state[S.cardMap] = cardMap;
    state[S.deckCards] = cardMap.map((_, i) => i);
    shuffle(state[S.deckCards]);
    state[S.deckCards].sort((a, b) => {
      if (this.isForceInitialHand(state, a)) return 1;
      if (this.isForceInitialHand(state, b)) return -1;
      return 0;
    });
    state[S.handCards] = [];
    state[S.discardedCards] = [];
    state[S.removedCards] = [];
    state[S.heldCards] = [];
    state[S.cardsUsed] = 0;
    state[S.activeCardsUsed] = 0;
    state[S.turnCardsUsed] = 0;
    state[S.turnCardsUpgraded] = 0;

    state[S.pcchiCardsUsed] = 0;
  }

  isForceInitialHand(state, card) {
    const { id, c11n } = state[S.cardMap][card];

    if (SkillCards.getById(id).forceInitialHand) {
      return true;
    }
    if (
      c11n &&
      Object.keys(c11n)
        .filter((k) => c11n[k])
        .some((k) => Customizations.getById(k).forceInitialHand)
    ) {
      return true;
    }

    return false;
  }

  getLines(state, card, attribute) {
    const skillCard = SkillCards.getById(state[S.cardMap][card].id);
    let attr = skillCard[attribute] || [];
    const c11n = state[S.cardMap][card].c11n;
    if (!c11n || !Object.keys(c11n).length) return attr;

    attr = [...attr];
    for (let k in c11n) {
      const c11nAttr = Customizations.getById(k)[attribute] || [];
      for (let i = 0; i < c11nAttr.length; i++) {
        if ((c11nAttr[i].level || 1) != c11n[k]) continue;
        if (c11nAttr[i].line) {
          attr.splice(c11nAttr[i].line - 1, 1, c11nAttr[i]);
        } else {
          attr = attr.concat(c11nAttr[i]);
        }
      }
    }

    return attr;
  }

  getCardEffects(state, card) {
    let cardEffects = new Set();
    if (card == null) return cardEffects;
    const effects = this.getLines(state, card, "effects");
    for (let i = 0; i < effects.length; i++) {
      const effect = effects[i];
      if (effect.phase || !effect.actions) continue;
      for (let j = 0; j < effect.actions.length; j++) {
        const tokens = effect.actions[j];
        if (!tokens?.[0]?.length) continue;
        let cardEffect = tokens[0];
        if (cardEffect.startsWith("setStance")) {
          cardEffect = cardEffect.match(FUNCTION_CALL_REGEX)[2];
          cardEffect = cardEffect.replace(/\d/g, "");
        }
        cardEffects.add(cardEffect);
      }
    }
    return cardEffects;
  }

  getCardSourceType(state, card) {
    if (card == null) return null;
    const skillCard = SkillCards.getById(state[S.cardMap][card].id);
    return skillCard.sourceType;
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

    // Check debuffs
    if (state[S.noActiveTurns] && skillCard.type == "active") return false;
    if (state[S.noMentalTurns] && skillCard.type == "mental") return false;

    // Check conditions
    const conditions = this.getLines(state, card, "conditions")
      .map((c) => c.conditions)
      .flat();
    for (let i = 0; i < conditions.length; i++) {
      if (!this.engine.evaluator.evaluateCondition(state, conditions[i])) {
        return false;
      }
    }

    // Check cost
    const cost = this.getLines(state, card, "cost")
      .map((c) => c.actions)
      .flat();
    const previewState = shallowCopy(state);
    previewState[S.phase] = "processCost";
    for (let i = 0; i < cost.length; i++) {
      this.engine.executor.executeAction(previewState, cost[i], card);
    }
    delete previewState[S.phase];

    for (let i = 0; i < COST_FIELDS.length; i++) {
      if (previewState[COST_FIELDS[i]] < 0) return false;
    }

    return true;
  }

  useCard(state, card) {
    const handIndex = state[S.handCards].indexOf(card);
    const skillCard = SkillCards.getById(state[S.cardMap][card].id);
    const c11n = state[S.cardMap][card].c11n;

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
    const cost = this.getLines(state, card, "cost")
      .map((c) => c.actions)
      .flat();
    state[S.phase] = "processCost";
    this.engine.executor.executeActions(state, cost, card);
    delete state[S.phase];
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
    const effects = this.getLines(state, card, "effects");
    state[S.phase] = "processCard";
    if (state[S.doubleCardEffectCards]) {
      state[S.doubleCardEffectCards]--;
      this.engine.effectManager.triggerEffects(state, effects, null, card);
    }
    this.engine.effectManager.triggerEffects(state, effects, null, card);
    delete state[S.phase];

    // Increment counters
    state[S.cardsUsed]++;
    state[S.turnCardsUsed]++;
    if (skillCard.type == "active") {
      state[S.activeCardsUsed]++;
    }

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
    } else if (!skillCard.limit) {
      state[S.discardedCards].push(card);
    } else if (
      c11n &&
      Object.keys(c11n)
        .map(Customizations.getById)
        .some((c) => c11n[c.id] && c?.limit === 0)
    ) {
      state[S.discardedCards].push(card);
    } else {
      state[S.removedCards].push(card);
      this.engine.effectManager.triggerEffectsForPhase(
        state,
        "cardRemoved",
        conditionState
      );
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
      if (this.isUpgradable(state, state[S.handCards][i])) {
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
      baseId: getBaseId(skillCard),
    });
    state[S.handCards].push(state[S.cardMap].length - 1);
    this.logger.log(state, "addCardToHand", {
      type: "skillCard",
      id: skillCard.id,
    });
  }

  addCardToTopOfDeck(state, cardId) {
    const skillCard = SkillCards.getById(cardId);

    state[S.cardMap].push({
      id: skillCard.id,
      baseId: getBaseId(skillCard),
    });
    state[S.deckCards].push(state[S.cardMap].length - 1);
    this.logger.log(state, "addCardToTopOfDeck", {
      type: "skillCard",
      id: skillCard.id,
    });
  }

  addCardToHand(state, cardId) {
    const skillCard = SkillCards.getById(cardId);

    state[S.cardMap].push({
      id: skillCard.id,
      baseId: getBaseId(skillCard),
    });
    state[S.handCards].push(state[S.cardMap].length - 1);
    this.logger.log(state, "addCardToHand", {
      type: "skillCard",
      id: skillCard.id,
    });
  }

  // From deck/discards
  moveCardToHand(state, cardId, exact) {
    let cards = state[S.cardMap]
      .map((c, i) => {
        if (state[S.handCards].includes(i)) return -1;
        if (exact && c.id == cardId) return i;
        if (!exact && c.baseId == cardId) return i;
        return -1;
      })
      .filter((i) => i != -1);

    if (!cards.length) return;

    const card = cards[Math.floor(getRand() * cards.length)];

    let index = state[S.deckCards].indexOf(card);
    if (index != -1) {
      state[S.deckCards].splice(index, 1);
      state[S.handCards].push(card);

      this.logger.log(state, "moveCardToHand", {
        type: "skillCard",
        id: state[S.cardMap][card].id,
      });
      return;
    }
    index = state[S.discardedCards].indexOf(card);
    if (index != -1) {
      state[S.discardedCards].splice(index, 1);
      state[S.handCards].push(card);

      this.logger.log(state, "moveCardToHand", {
        type: "skillCard",
        id: state[S.cardMap][card].id,
      });
      return;
    }
  }

  moveCardToHandFromRemoved(state, cardBaseId) {
    let cards = state[S.cardMap]
      .map((c, i) => (c.baseId == cardBaseId ? i : -1))
      .filter((i) => i != -1);

    if (!cards.length) return;

    const card = cards[Math.floor(getRand() * cards.length)];

    const index = state[S.removedCards].indexOf(card);
    if (index != -1) {
      state[S.removedCards].splice(index, 1);
      state[S.handCards].push(card);

      this.logger.log(state, "moveCardToHand", {
        type: "skillCard",
        id: state[S.cardMap][card].id,
      });
    }
  }

  hold(state, card) {
    // Hold the card
    if (card != null) {
      state[S.heldCards].push(card);
      this.logger.log(state, "holdCard", {
        type: "skillCard",
        id: state[S.cardMap][card].id,
      });
    }

    // Discard cards if over limit
    if (state[S.heldCards].length > 2) {
      const discardedCard = state[S.heldCards].shift();
      state[S.discardedCards].push(discardedCard);
      this.logger.log(state, "discardCard", {
        type: "skillCard",
        id: state[S.cardMap][discardedCard].id,
      });
    }
  }

  holdSelectedFrom(state, ...sources) {
    if (state[S.nullifyHold]) return;

    // Collect cards from specified sources
    const sourceKeys = sources.map((s) => HOLD_SOURCES_BY_ALIAS[s]);
    const sourceCards = sourceKeys.map((k) => state[k]);
    const cards = [].concat(...sourceCards);
    if (!cards.length) return;

    // Pick card to hold based on strategy
    let indexToHold = this.engine.strategy.pickCardToHold(state, cards);
    if (indexToHold < 0) return;

    // Find card and move to hold
    for (let i = 0; i < sources.length; i++) {
      if (indexToHold < sourceCards[i].length) {
        const card = state[sourceKeys[i]].splice(indexToHold, 1)[0];
        this.hold(state, card);
        return;
      } else {
        indexToHold -= sourceCards[i].length;
      }
    }
  }

  holdCard(state, cardBaseId) {
    const card = state[S.cardMap].findIndex((c) => c.baseId == cardBaseId);
    for (let i = 0; i < CARD_PILES.length; i++) {
      const index = state[CARD_PILES[i]].indexOf(card);
      if (index != -1) {
        state[CARD_PILES[i]].splice(index, 1);
        this.hold(state, card);
        break;
      }
    }
  }

  holdThisCard(state) {
    this.hold(state, state[S.usedCard]);
    state[S.thisCardHeld] = true;
  }

  addHeldCardsToHand(state) {
    while (state[S.heldCards].length) {
      const card = state[S.heldCards].pop();
      state[S.handCards].push(card);

      this.logger.log(state, "moveCardToHand", {
        type: "skillCard",
        id: state[S.cardMap][card].id,
      });
    }
  }

  getTargetRuleCards(state, targetRule, source) {
    let targetRuleCards = null;

    const targets = targetRule.split("*");
    for (let i = 0; i < targets.length; i++) {
      const targetCards = this.getTargetCards(state, targets[i], source);
      if (targetRuleCards) {
        for (let card of targetRuleCards.values()) {
          if (!targetCards.has(card)) {
            targetRuleCards.delete(card);
          }
        }
      } else {
        targetRuleCards = targetCards;
      }
    }

    return targetRuleCards;
  }

  getTargetCards(state, target, source) {
    let targetCards = new Set();

    if (target == "this") {
      if (!source || !("idx" in source)) {
        console.warn("Growth target not found");
      } else {
        targetCards.add(source.idx);
      }
    } else if (target == "hand") {
      for (let k = 0; k < state[S.handCards].length; k++) {
        targetCards.add(state[S.handCards][k]);
      }
    } else if (target == "deck") {
      for (let k = 0; k < state[S.deckCards].length; k++) {
        targetCards.add(state[S.deckCards][k]);
      }
    } else if (target == "held") {
      for (let k = 0; k < state[S.heldCards].length; k++) {
        targetCards.add(state[S.heldCards][k]);
      }
    } else if (target == "all") {
      for (let k = 0; k < state[S.cardMap].length; k++) {
        targetCards.add(k);
      }
    } else if (["active", "mental"].includes(target)) {
      for (let k = 0; k < state[S.cardMap].length; k++) {
        if (SkillCards.getById(state[S.cardMap][k].id).type == target) {
          targetCards.add(k);
        }
      }
    } else if (/^effect\(.+\)$/.test(target)) {
      const effect = target.match(/^effect\((.+)\)/)[1];
      for (let k = 0; k < state[S.cardMap].length; k++) {
        if (this.engine.cardManager.getCardEffects(state, k).has(effect)) {
          targetCards.add(k);
        }
      }
    } else if (/^\d+$/.test(target)) {
      for (let k = 0; k < state[S.cardMap].length; k++) {
        if (state[S.cardMap][k].baseId == target) {
          targetCards.add(k);
        }
      }
    }

    return targetCards;
  }
}
