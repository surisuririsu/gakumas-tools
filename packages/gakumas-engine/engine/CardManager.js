import { Customizations, SkillCards } from "gakumas-data";
import {
  CARD_PILES,
  COST_FIELDS,
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
      cardRarity: (state) => this.getCardRarity(state, state[S.usedCard]),
      usedCardId: (state) =>
        state[S.usedCard] != null && state[S.cardMap][state[S.usedCard]].id,
      usedCardBaseId: (state) =>
        state[S.usedCard] != null && state[S.cardMap][state[S.usedCard]].baseId,
      lastUsedCardType: (state) =>
        state[S.lastUsedCard] != null &&
        SkillCards.getById(state[S.cardMap][state[S.lastUsedCard]].id).type,
      movedCardId: (state) =>
        state[S.movedCard] != null && state[S.cardMap][state[S.movedCard]].id,
      numHeldCards: (state) => state[S.heldCards].length,
      numRemovedCards: (state) => state[S.removedCards].length,
      unremovedTroubleCards: (state) => this.countUnremovedTroubleCards(state),
      countCards: (state, targetRule) =>
        this.getTargetRuleCards(state, targetRule, null).size,
    };

    this.specialActions = {
      drawCard: (state) => this.drawCard(state),
      upgradeHand: (state) => this.upgradeHand(state),
      exchangeHand: (state) => this.exchangeHand(state),
      upgradeRandomCardInHand: (state) => this.upgradeRandomCardInHand(state),
      addRandomUpgradedCardToHand: (state) =>
        this.addRandomUpgradedCardToHand(state),
      addRandomUpgradedSSRCardToHand: (state) =>
        this.addRandomUpgradedCardToHand(state, ["SSR"]),
      addCardToTopOfDeck: (state, cardId) =>
        this.addCardToTopOfDeck(state, cardId),
      addCardToDeck: (state, cardId) => this.addCardToDeck(state, cardId),
      addCardToHand: (state, cardId) => this.addCardToHand(state, cardId),
      moveCardToHand: (state, cardId, exact) =>
        this.moveCardToHand(state, cardId, parseInt(exact, 10)),
      moveCardToHandFromRemoved: (state, cardBaseId) =>
        this.moveCardToHandFromRemoved(state, cardBaseId),
      moveSelectedFromDeckOrDiscardsToHand: (state, num = 1) =>
        this.moveSelectedCardToHand(state, ["deck", "discards"], num),
      holdCard: (state, cardBaseId) =>
        this.holdCard(state, parseInt(cardBaseId, 10)),
      holdThisCard: (state) => this.holdThisCard(state),
      holdSelectedFromHand: (state, num = 1) =>
        this.holdSelectedFrom(state, ["hand"], num),
      holdSelectedFromDeck: (state, num = 1) =>
        this.holdSelectedFrom(state, ["deck"], num),
      holdSelectedFromDeckOrDiscards: (state, num = 1) =>
        this.holdSelectedFrom(state, ["deck", "discards"], num),
      addHeldCardsToHand: (state) => this.addHeldCardsToHand(state),
      useRandomCardFree: (state, targetRule) =>
        this.useRandomCardFree(state, targetRule),
      // Generic card manipulation actions
      removeCard: (state, targetRule) => this.removeCardByTarget(state, targetRule),
      moveToHand: (state, targetRule, num = 1) =>
        this.moveToHandByTarget(state, targetRule, num),
      moveToTopOfDeck: (state, targetRule, num = 1) =>
        this.moveToTopOfDeckByTarget(state, targetRule, num),
      moveToDeck: (state, targetRule) => this.moveToDeckByTarget(state, targetRule),
    };
  }

  initializeState(state) {
    const config = this.getConfig(state);

    let configs = [config];
    if (config.stage.type === "linkContest") {
      configs = this.engine.linkConfigs || [];
    }

    const cardMaps = [];
    for (let c = 0; c < configs.length; c++) {
      const cards = configs[c].idol.cards.concat(
        configs[c].defaultCardIds.map((id) => ({ id }))
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
      cardMaps.push(cardMap);
    }

    state[S.cardMap] = cardMaps.flat();

    this.changeIdol(state);

    state[S.heldCards] = [];
    state[S.cardsUsed] = 0;
    state[S.activeCardsUsed] = 0;
    state[S.usedCard] = null;
    state[S.lastUsedCard] = null;
    state[S.movedCard] = null;

    state[S.pcchiCardsUsed] = 0;
    state[S.natsuyaCardsUsed] = 0;
    state[S.holidayCardsUsed] = 0;
    state[S.onigiriCardsUsed] = 0;
  }

  changeIdol(state) {
    const config = this.getConfig(state);
    let configs = [config];
    if (config.stage.type === "linkContest") {
      configs = this.engine.linkConfigs || [];
    }
    let index = 0;
    for (let c = 0; c < state[S.linkPhase]; c++) {
      index += configs[c].idol.cards.length + configs[c].defaultCardIds.length;
    }

    let deckCards = [];
    const numCards = config.idol.cards.length + config.defaultCardIds.length;
    for (let i = 0; i < numCards; i++) {
      deckCards.push(index + i);
    }
    state[S.deckCards] = deckCards;
    shuffle(state[S.deckCards]);
    state[S.deckCards].sort((a, b) => {
      if (this.isForceInitialHand(state, a)) return 1;
      if (this.isForceInitialHand(state, b)) return -1;
      return 0;
    });
    state[S.handCards] = [];
    state[S.discardedCards] = [];
    state[S.removedCards] = [];
    state[S.turnCardsUsed] = 0;
    state[S.turnCardsUpgraded] = 0;
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
      if (!effect.actions) continue;
      for (let j = 0; j < effect.actions.length; j++) {
        const action = effect.actions[j];
        if (!action) continue;

        // Handle AST nodes
        let cardEffect = null;
        if (action.type === "assignment") {
          cardEffect = action.lhs;
        } else if (action.type === "call") {
          // For function calls like setStance(strength), extract the argument
          if (action.name === "setStance" && action.args.length > 0) {
            const arg = action.args[0];
            cardEffect =
              arg.type === "identifier"
                ? arg.name.replace(/\d/g, "")
                : String(arg.value).replace(/\d/g, "");
          } else {
            cardEffect = action.name;
          }
        } else if (action.type === "identifier") {
          cardEffect = action.name;
        }

        if (cardEffect) {
          cardEffects.add(cardEffect);
        }
      }
    }
    return cardEffects;
  }

  getCardSourceType(state, card) {
    if (card == null) return null;
    const skillCard = SkillCards.getById(state[S.cardMap][card].id);
    return skillCard.sourceType;
  }

  getCardRarity(state, card) {
    if (card == null) return null;
    const skillCard = SkillCards.getById(state[S.cardMap][card].id);
    return skillCard.rarity;
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
    state[S.movedCard] = card;
    this.engine.effectManager.triggerEffectsForPhase(state, "cardMovedToHand");

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
    if (state[S.noCardUseTurns]) return false;
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
    previewState[S.phase] = "checkCost";
    for (let i = 0; i < cost.length; i++) {
      this.engine.executor.executeAction(previewState, cost[i], card);
    }
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

    if (state[S.nullifyCostCards]) {
      state[S.nullifyCostCards]--;
    } else if (skillCard.type === "active" && state[S.nullifyCostActiveCards]) {
      state[S.nullifyCostActiveCards]--;
    } else {
      const cost = this.getLines(state, card, "cost")
        .map((c) => c.actions)
        .flat();
      state[S.phase] = "processCost";
      this.engine.executor.executeActions(state, cost, card);
      delete state[S.phase];
    }

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

    state[S.lastUsedCard] = state[S.usedCard];
    state[S.usedCard] = null;

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
    return (
      !skillCard.upgraded &&
      skillCard.type != "trouble" &&
      skillCard.rarity != "L"
    );
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

  addRandomUpgradedCardToHand(state, rarities = ["R", "SR", "SSR"]) {
    const validSkillCards = SkillCards.getFiltered({
      rarities: rarities,
      plans: [this.getConfig(state).idol.plan, "free"],
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

  addCardToDeck(state, cardId) {
    const skillCard = SkillCards.getById(cardId);

    state[S.cardMap].push({
      id: skillCard.id,
      baseId: getBaseId(skillCard),
    });
    const cardIdx = state[S.cardMap].length - 1;
    const insertPos = Math.floor(getRand() * (state[S.deckCards].length + 1));
    state[S.deckCards].splice(insertPos, 0, cardIdx);
    this.logger.log(state, "addCardToDeckAtRandom", {
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
    let matchingCards = [];
    for (let pile of [S.deckCards, S.discardedCards]) {
      for (let i = 0; i < state[pile].length; i++) {
        const cardIdx = state[pile][i];
        const card = state[S.cardMap][cardIdx];
        if (exact && card.id == cardId) {
          matchingCards.push({ pile, index: i, cardIdx });
        } else if (!exact && card.baseId == cardId) {
          matchingCards.push({ pile, index: i, cardIdx });
        }
      }
    }

    if (!matchingCards.length) return;

    const pick = matchingCards[Math.floor(getRand() * matchingCards.length)];
    state[pick.pile].splice(pick.index, 1);
    state[S.handCards].push(pick.cardIdx);

    state[S.movedCard] = pick.cardIdx;
    this.engine.effectManager.triggerEffectsForPhase(state, "cardMovedToHand");

    this.logger.log(state, "moveCardToHand", {
      type: "skillCard",
      id: state[S.cardMap][pick.cardIdx].id,
    });
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

      state[S.movedCard] = card;
      this.engine.effectManager.triggerEffectsForPhase(
        state,
        "cardMovedToHand"
      );

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
  }

  enforceHoldLimit(state) {
    // If holding more than 2 cards, discard until only 2 are held
    while (state[S.heldCards].length > 2) {
      const discardedCard = state[S.heldCards].shift();
      state[S.discardedCards].push(discardedCard);
      this.logger.log(state, "discardCard", {
        type: "skillCard",
        id: state[S.cardMap][discardedCard].id,
      });
    }
  }

  moveSelectedCardToHand(state, sources, num = 1) {
    if (state[S.nullifySelect]) return;

    // Collect cards from specified sources
    const sourceKeys = sources.map((s) => HOLD_SOURCES_BY_ALIAS[s]);
    const sourceCards = sourceKeys.map((k) => state[k]);
    const cards = [].concat(...sourceCards);
    if (!cards.length) return;

    // Pick card to move based on strategy (may throw exception if async)
    const indicesToMove = this.engine.strategy.pickCardsToMoveToHand(
      state,
      cards,
      num
    );
    indicesToMove.sort((a, b) => b - a);
    if (indicesToMove.length === 0) return;
    // Find cards and move to hand
    for (let j = 0; j < indicesToMove.length; j++) {
      let indexToMove = indicesToMove[j];
      for (let i = 0; i < sources.length; i++) {
        if (indexToMove < sourceCards[i].length) {
          const card = state[sourceKeys[i]].splice(indexToMove, 1)[0];
          state[S.handCards].push(card);
          state[S.movedCard] = card;
          this.engine.effectManager.triggerEffectsForPhase(
            state,
            "cardMovedToHand"
          );
          this.logger.log(state, "moveCardToHand", {
            type: "skillCard",
            id: state[S.cardMap][card].id,
          });
          break;
        } else {
          indexToMove -= sourceCards[i].length;
        }
      }
    }
  }

  holdSelectedFrom(state, sources, num = 1) {
    if (state[S.nullifySelect]) return;

    // Collect cards from specified sources
    const sourceKeys = sources.map((s) => HOLD_SOURCES_BY_ALIAS[s]);
    const sourceCards = sourceKeys.map((k) => state[k]);
    const cards = [].concat(...sourceCards);
    if (!cards.length) return;

    // Pick card to hold based on strategy (may throw exception if async)
    const indicesToHold = this.engine.strategy.pickCardsToHold(
      state,
      cards,
      num
    );

    indicesToHold.sort((a, b) => b - a);
    if (indicesToHold.length === 0) return;

    // Find cards and move to hold
    for (let j = 0; j < indicesToHold.length; j++) {
      let indexToHold = indicesToHold[j];
      for (let i = 0; i < sources.length; i++) {
        if (indexToHold < sourceCards[i].length) {
          const card = state[sourceKeys[i]].splice(indexToHold, 1)[0];
          this.hold(state, card);
          break;
        } else {
          indexToHold -= sourceCards[i].length;
        }
      }
    }

    this.enforceHoldLimit(state);
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

    this.enforceHoldLimit(state);
  }

  holdThisCard(state) {
    this.hold(state, state[S.usedCard]);
    this.enforceHoldLimit(state);
    state[S.thisCardHeld] = true;
  }

  addHeldCardsToHand(state) {
    while (state[S.heldCards].length) {
      const card = state[S.heldCards].pop();
      state[S.handCards].push(card);

      state[S.movedCard] = card;
      this.engine.effectManager.triggerEffectsForPhase(
        state,
        "cardMovedToHand"
      );

      this.logger.log(state, "moveCardToHand", {
        type: "skillCard",
        id: state[S.cardMap][card].id,
      });
    }
  }

  getTargetRuleCards(state, targetRule, source) {
    // Handle AST nodes
    if (targetRule && typeof targetRule === "object") {
      return this.evaluateTargetAST(state, targetRule, source);
    }

    // Handle simple string identifier (fallback for direct calls)
    if (typeof targetRule === "string") {
      return this.getTargetCards(state, targetRule, source);
    }

    return new Set();
  }

  evaluateTargetAST(state, node, source) {
    switch (node.type) {
      case "binary": {
        const left = this.evaluateTargetAST(state, node.left, source);
        const right = this.evaluateTargetAST(state, node.right, source);
        if (node.op === "&") {
          // Intersection
          const result = new Set();
          for (let card of left) {
            if (right.has(card)) result.add(card);
          }
          return result;
        } else if (node.op === "|") {
          // Union
          const result = new Set(left);
          for (let card of right) result.add(card);
          return result;
        }
        return new Set();
      }

      case "unary": {
        if (node.op === "!") {
          // Complement (relative to all cards)
          const operand = this.evaluateTargetAST(state, node.operand, source);
          const result = new Set();
          for (let k = 0; k < state[S.cardMap].length; k++) {
            if (!operand.has(k)) result.add(k);
          }
          return result;
        }
        return new Set();
      }

      case "call": {
        const name = node.name;
        const args = node.args;
        if (name === "effect" && args.length > 0) {
          const effectName =
            args[0].type === "identifier"
              ? args[0].name
              : String(args[0].value);
          const result = new Set();
          for (let k = 0; k < state[S.cardMap].length; k++) {
            if (this.getCardEffects(state, k).has(effectName)) {
              result.add(k);
            }
          }
          return result;
        }
        console.warn(`Unknown target function: ${name}`);
        return new Set();
      }

      case "identifier":
        return this.getTargetCards(state, node.name, source);

      case "number":
        return this.getTargetCards(state, String(node.value), source);

      default:
        console.warn("Unknown target AST node type:", node.type);
        return new Set();
    }
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
    } else if (target == "discarded") {
      for (let k = 0; k < state[S.discardedCards].length; k++) {
        targetCards.add(state[S.discardedCards][k]);
      }
    } else if (target == "held") {
      for (let k = 0; k < state[S.heldCards].length; k++) {
        targetCards.add(state[S.heldCards][k]);
      }
    } else if (target == "removed") {
      for (let k = 0; k < state[S.removedCards].length; k++) {
        targetCards.add(state[S.removedCards][k]);
      }
    } else if (target == "all") {
      for (let k = 0; k < state[S.cardMap].length; k++) {
        targetCards.add(k);
      }
    } else if (["active", "mental", "trouble"].includes(target)) {
      for (let k = 0; k < state[S.cardMap].length; k++) {
        if (SkillCards.getById(state[S.cardMap][k].id).type == target) {
          targetCards.add(k);
        }
      }
    } else if (target == "basic") {
      for (let k = 0; k < state[S.cardMap].length; k++) {
        if (SkillCards.getById(state[S.cardMap][k].id).name.includes("基本")) {
          targetCards.add(k);
        }
      }
    } else if (target == "pIdol") {
      for (let k = 0; k < state[S.cardMap].length; k++) {
        if (SkillCards.getById(state[S.cardMap][k].id).sourceType == "pIdol") {
          targetCards.add(k);
        }
      }
    } else if (["T", "N", "R", "SR", "SSR", "L"].includes(target)) {
      const rarity = target;
      for (let k = 0; k < state[S.cardMap].length; k++) {
        if (this.getCardRarity(state, k) == rarity) {
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

  countUnremovedTroubleCards(state) {
    let count = 0;
    for (let i = 0; i < state[S.cardMap].length; i++) {
      const card = state[S.cardMap][i];
      const skillCard = SkillCards.getById(card.id);
      if (skillCard.type == "trouble" && !state[S.removedCards].includes(i)) {
        count++;
      }
    }
    return count;
  }

  useRandomCardFree(state, targetRule) {
    const targetCards = this.getTargetRuleCards(state, targetRule);
    const usableCards = [];
    for (let card of targetCards.values()) {
      if (state[S.handCards].includes(card) && this.isCardUsable(state, card)) {
        usableCards.push(card);
      }
    }
    if (!usableCards.length) return;
    const card = usableCards[Math.floor(getRand() * usableCards.length)];
    state[S.nullifyCostCards] += 1;
    this.useCard(state, card);
  }

  // Generic card manipulation methods using target expressions

  removeCardByTarget(state, targetRule) {
    const targetCards = this.getTargetRuleCards(state, targetRule, null);
    const piles = [S.deckCards, S.discardedCards, S.handCards];

    // Find cards that match target AND are in a pile
    let candidates = [];
    for (let pile of piles) {
      for (let i = 0; i < state[pile].length; i++) {
        const cardIdx = state[pile][i];
        if (targetCards.has(cardIdx)) {
          candidates.push({ pile, index: i, cardIdx });
        }
      }
    }

    if (!candidates.length) return;
    const pick = candidates[Math.floor(getRand() * candidates.length)];
    state[pick.pile].splice(pick.index, 1);
    this.logger.log(state, "removeCard", {
      type: "skillCard",
      id: state[S.cardMap][pick.cardIdx].id,
    });
  }

  moveToHandByTarget(state, targetRule, num = 1) {
    const targetCards = this.getTargetRuleCards(state, targetRule, null);
    const piles = [S.deckCards, S.discardedCards];

    // Find cards that match target AND are in deck or discards
    let candidates = [];
    for (let pile of piles) {
      for (let i = 0; i < state[pile].length; i++) {
        const cardIdx = state[pile][i];
        if (targetCards.has(cardIdx)) {
          candidates.push({ pile, index: i, cardIdx });
        }
      }
    }

    for (let j = 0; j < num && candidates.length; j++) {
      const pickIndex = Math.floor(getRand() * candidates.length);
      const pick = candidates.splice(pickIndex, 1)[0];

      // Update indexes for remaining candidates in the same pile
      for (let c of candidates) {
        if (c.pile === pick.pile && c.index > pick.index) {
          c.index--;
        }
      }

      state[pick.pile].splice(pick.index, 1);
      state[S.handCards].push(pick.cardIdx);

      state[S.movedCard] = pick.cardIdx;
      this.engine.effectManager.triggerEffectsForPhase(state, "cardMovedToHand");

      this.logger.log(state, "moveCardToHand", {
        type: "skillCard",
        id: state[S.cardMap][pick.cardIdx].id,
      });
    }
  }

  moveToTopOfDeckByTarget(state, targetRule, num = 1) {
    const targetCards = this.getTargetRuleCards(state, targetRule, null);
    const piles = [S.deckCards, S.discardedCards];

    // Find cards that match target AND are in deck or discards
    let candidates = [];
    for (let pile of piles) {
      for (let i = 0; i < state[pile].length; i++) {
        const cardIdx = state[pile][i];
        if (targetCards.has(cardIdx)) {
          candidates.push({ pile, index: i, cardIdx });
        }
      }
    }

    for (let j = 0; j < num && candidates.length; j++) {
      const pickIndex = Math.floor(getRand() * candidates.length);
      const pick = candidates.splice(pickIndex, 1)[0];

      // Update indexes for remaining candidates in the same pile
      for (let c of candidates) {
        if (c.pile === pick.pile && c.index > pick.index) {
          c.index--;
        }
      }

      state[pick.pile].splice(pick.index, 1);
      state[S.deckCards].push(pick.cardIdx);

      this.logger.log(state, "moveCardToTopOfDeck", {
        type: "skillCard",
        id: state[S.cardMap][pick.cardIdx].id,
      });
    }
  }

  moveToDeckByTarget(state, targetRule) {
    const targetCards = this.getTargetRuleCards(state, targetRule, null);

    // Find cards that match target AND are in removed pile
    let candidates = [];
    for (let i = 0; i < state[S.removedCards].length; i++) {
      const cardIdx = state[S.removedCards][i];
      if (targetCards.has(cardIdx)) {
        candidates.push({ index: i, cardIdx });
      }
    }

    // Move all matching cards to random positions in deck
    // Process in reverse order to avoid index shifting issues
    candidates.sort((a, b) => b.index - a.index);
    for (let pick of candidates) {
      state[S.removedCards].splice(pick.index, 1);
      const insertIndex = Math.floor(getRand() * (state[S.deckCards].length + 1));
      state[S.deckCards].splice(insertIndex, 0, pick.cardIdx);

      this.logger.log(state, "moveCardToDeckAtRandom", {
        type: "skillCard",
        id: state[S.cardMap][pick.cardIdx].id,
      });
    }
  }
}
