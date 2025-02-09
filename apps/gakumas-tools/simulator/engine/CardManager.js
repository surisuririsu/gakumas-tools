import { Customizations, SkillCards } from "gakumas-data/lite";
import {
  CARD_PILES,
  COST_FIELDS,
  FUNCTION_CALL_REGEX,
  HOLD_SOURCES_BY_ALIAS,
  S,
} from "../constants";
import EngineComponent from "./EngineComponent";
import { getRand, shallowCopy, shuffle } from "./utils";

export default class CardManager extends EngineComponent {
  constructor(engine) {
    super(engine);

    this.variableResolvers = {
      cardEffects: (state) => this.getCardEffects(state, state[S.usedCard]),
      usedCardId: (state) =>
        state[S.usedCard] && state[S.cardMap][state[S.usedCard]].id,
      usedCardBaseId: (state) =>
        state[S.usedCard] && state[S.cardMap][state[S.usedCard]].baseId,
      numHeldCards: (state) => state[S.heldCards].length,
    };
  }

  initializeState(state) {
    const cards = this.config.idol.cards.concat(
      this.config.defaultCardIds.map((id) => ({ id }))
    );
    const cardMap = cards.map(({ id, customizations }) => ({
      id,
      baseId: SkillCards.getById(id).upgraded ? id - 1 : id,
      c11n: customizations || {},
    }));

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
    state[S.turnCardsUsed] = 0;
    state[S.turnCardsUpgraded] = 0;
  }

  isForceInitialHand(state, card) {
    const { id, c11n } = state[S.cardMap][card];

    if (SkillCards.getById(id).forceInitialHand) {
      return true;
    }
    if (
      Object.keys(c11n)
        .filter((k) => c11n[k])
        .some((k) => Customizations.getById(k).forceInitialHand)
    ) {
      return true;
    }

    return false;
  }

  getCardEffects(state, card) {
    let cardEffects = new Set();
    if (card == null) return cardEffects;
    const skillCard = SkillCards.getById(state[S.cardMap][card].id);
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
    // TODO: Count customizations?
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

    // Check debuffs
    if (state[S.noActiveTurns] && skillCard.type == "active") return false;
    if (state[S.noMentalTurns] && skillCard.type == "mental") return false;

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
    let cost = skillCard.cost;
    const c11n = state[S.cardMap][card].c11n;
    if (Object.keys(c11n).length) {
      cost = [...cost];
      for (let k in c11n) {
        const c11nCost = Customizations.getById(k).cost;
        for (let i = 0; i < c11nCost.length; i++) {
          if ((c11nCost[i].level || 1) != c11n[k]) continue;
          if (c11nCost[i].line) {
            cost.splice(c11nCost[i].line - 1, 1, ...c11nCost[i].actions);
          } else {
            cost = cost.concat(c11nCost[i].actions);
          }
        }
      }
    }

    previewState[S.phase] = "cost";
    for (let i = 0; i < cost.length; i++) {
      this.engine.executor.executeAction(previewState, cost[i], card);
    }
    delete previewState[S.phase];

    for (let i = 0; i < COST_FIELDS.length; i++) {
      if (previewState[S[COST_FIELDS[i]]] < 0) return false;
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
    let cost = skillCard.cost;
    if (Object.keys(c11n).length) {
      cost = [...cost];
      for (let k in c11n) {
        const c11nCost = Customizations.getById(k).cost;
        for (let i = 0; i < c11nCost.length; i++) {
          if ((c11nCost[i].level || 1) != c11n[k]) continue;
          if (c11nCost[i].line) {
            cost.splice(c11nCost[i].line - 1, 1, ...c11nCost[i].actions);
          } else {
            cost = cost.concat(c11nCost[i].actions);
          }
        }
      }
    }
    state[S.phase] = "cost";
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
    let effects = skillCard.effects;
    if (Object.keys(c11n).length) {
      effects = [...effects];
      for (let k in c11n) {
        const c11nEffects = Customizations.getById(k).effects;
        for (let i = 0; i < c11nEffects.length; i++) {
          if ((c11nEffects[i].level || 1) != c11n[k]) continue;
          if (c11nEffects[i].line) {
            effects[c11nEffects[i].line - 1] = c11nEffects[i];
          } else {
            effects.push(c11nEffects[i]);
          }
        }
      }
    }
    state[S.phase] = "card";
    if (state[S.doubleCardEffectCards]) {
      state[S.doubleCardEffectCards]--;
      this.engine.effectManager.triggerEffects(state, effects, null, card);
    }
    this.engine.effectManager.triggerEffects(state, effects, null, card);
    delete state[S.phase];

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
    } else if (!skillCard.limit) {
      state[S.discardedCards].push(card);
    } else if (
      Object.keys(c11n)
        .map(Customizations.getById)
        .some((c) => c11n[c.id] && c?.limit === 0)
    ) {
      state[S.discardedCards].push(card);
    } else {
      state[S.removedCards].push(card);
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
      baseId: skillCard.id - skillCard.upgraded ? 1 : 0,
      c11n: {},
    });
    state[S.handCards].push(state[S.cardMap].length - 1);
    this.logger.log(state, "addRandomUpgradedCardToHand", {
      type: "skillCard",
      id: skillCard.id,
    });
  }

  // From deck/discards
  moveCardToHand(state, cardId, exact) {
    let cards = state[S.cardMap]
      .map((c, i) => {
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

      const skillCard = SkillCards.getById(state[S.cardMap][card].id);
      this.logger.log(state, "moveCardToHand", {
        type: "skillCard",
        id: skillCard.id,
      });
      return;
    }
    index = state[S.discardedCards].indexOf(card);
    if (index != -1) {
      state[S.discardedCards].splice(index, 1);
      state[S.handCards].push(card);

      const skillCard = SkillCards.getById(state[S.cardMap][card].id);
      this.logger.log(state, "moveCardToHand", {
        type: "skillCard",
        id: skillCard.id,
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

      const skillCard = SkillCards.getById(state[S.cardMap][card].id);
      this.logger.log(state, "moveCardToHand", {
        type: "skillCard",
        id: skillCard.id,
      });
    }
  }

  hold(state, card) {
    // Hold the card
    if (card != null) {
      const skillCard = SkillCards.getById(state[S.cardMap][card].id);
      state[S.heldCards].push(card);
      this.logger.log(state, "holdCard", {
        type: "skillCard",
        id: skillCard.id,
      });
    }

    // Discard cards if over limit
    if (state[S.heldCards].length > 2) {
      const skillCard = SkillCards.getById(
        state[S.cardMap][state[S.heldCards][0]].id
      );
      state[S.heldCards] = state[S.heldCards].slice(1);
      this.logger.log(state, "discardCard", {
        type: "skillCard",
        id: skillCard.id,
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
      const index = state[S[CARD_PILES[i]]].indexOf(card);
      if (index != -1) {
        state[S[CARD_PILES[i]]].splice(index, 1);
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

      const skillCard = SkillCards.getById(state[S.cardMap][card].id);
      this.logger.log(state, "moveCardToHand", {
        type: "skillCard",
        id: skillCard.id,
      });
    }
  }
}
