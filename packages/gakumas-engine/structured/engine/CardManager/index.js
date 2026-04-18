import { Customizations, SkillCards } from "gakumas-data-structured";
import { CARD_PILES, COST_FIELDS, S } from "../../constants";
import EngineComponent from "../EngineComponent";
import { getBaseId, getRand, shallowCopy, shuffle } from "../../utils";
import { getTargetRuleCards } from "./targeting";

const PATCHABLE_FIELDS = [
  "phase",
  "filter",
  "conditions",
  "targets",
  "actions",
  "effects",
  "limit",
  "ttl",
  "delay",
  "group",
];

function mergePatch(original, delta) {
  const merged = { ...original };
  for (const field of PATCHABLE_FIELDS) {
    if (delta[field] !== undefined) {
      merged[field] = delta[field];
    }
  }
  return merged;
}

// Extract the "effect name" for a single action — what a cardEffects
// membership check (e.g. `if:cardHasEffect(X)`) would match against.
function actionEffectName(action) {
  if (!action) return null;
  if (action.type === "assignment") return action.lhs;
  if (action.type === "call") {
    if (action.name === "setStance" && action.args.length > 0) {
      const arg = action.args[0];
      return arg.type === "identifier"
        ? arg.name.replace(/\d/g, "")
        : String(arg.value).replace(/\d/g, "");
    }
    return action.name;
  }
  if (action.type === "identifier") return action.name;
  return null;
}

export default class CardManager extends EngineComponent {
  constructor(engine) {
    super(engine);

    this.variableResolvers = {
      cardHasEffect: (state, effectName) =>
        this.getCardEffects(state, state[S.usedCard]).has(effectName),
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
      countCards: (state, targetRule) =>
        this.getTargetRuleCards(state, targetRule, null).size,
    };

    this.specialActions = {
      drawCard: (state, num) => {
        const n = num == null ? 1 : parseInt(num, 10);
        for (let i = 0; i < n; i++) this.drawCard(state);
      },
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
      moveCardToTopOfDeck: (state, cardId, exact) =>
        this.moveCardToTopOfDeck(state, cardId, parseInt(exact, 10)),
      moveCardToHand: (state, cardId, exact) =>
        this.moveCardToHand(state, cardId, parseInt(exact, 10)),
      moveCardToHandFromDeckOrDiscards: (state, cardId, exact) =>
        this.moveCardToHandFromDeckOrDiscards(
          state,
          cardId,
          parseInt(exact, 10),
        ),
      moveCardToHandFromRemoved: (state, cardBaseId) =>
        this.moveCardToHandFromRemoved(state, cardBaseId),
      moveSelectedToHand: (state, targetRule, num = 1) =>
        this.moveSelectedToHandByTarget(state, targetRule, parseInt(num, 10)),
      holdCard: (state, cardBaseId) =>
        this.holdCard(state, parseInt(cardBaseId, 10)),
      holdThisCard: (state) => this.holdThisCard(state),
      holdSelected: (state, targetRule, num = 1) =>
        this.holdSelectedByTarget(state, targetRule, parseInt(num, 10)),
      moveHeldCardsToHand: (state) => this.moveHeldCardsToHand(state),
      useRandomCardFree: (state, targetRule) =>
        this.useRandomCardFree(state, targetRule),
      useAllCardsFree: (state, targetRule) =>
        this.useAllCardsFree(state, targetRule),
      useSelectedCardFree: (state, targetRule, num = 1) =>
        this.useSelectedCardFree(state, targetRule, parseInt(num, 10)),
      // Standardized target-rule card-manipulation actions.
      // Naming: moveRandom* / moveSelected* / moveAll* indicates picking mode.
      moveRandomToHand: (state, targetRule, num = 1) =>
        this.moveToHandByTarget(state, targetRule, parseInt(num, 10)),
      moveSelectedToHand: (state, targetRule, num = 1) =>
        this.moveSelectedToHandByTarget(state, targetRule, parseInt(num, 10)),
      moveAllToHand: (state, targetRule) =>
        this.moveAllToHandByTarget(state, targetRule),
      moveRandomToTopOfDeck: (state, targetRule, num = 1) =>
        this.moveToTopOfDeckByTarget(state, targetRule, parseInt(num, 10)),
      moveAllToTopOfDeck: (state, targetRule) =>
        this.moveAllToTopOfDeckByTarget(state, targetRule),
      moveAllToDeck: (state, targetRule) =>
        this.moveToDeckByTarget(state, targetRule),
      holdRandom: (state, targetRule, num = 1) =>
        this.holdRandomByTarget(state, targetRule, parseInt(num, 10)),
      holdAll: (state, targetRule) => this.holdAllByTarget(state, targetRule),
      holdThis: (state) => this.holdThisCard(state),
      useRandomFree: (state, targetRule) =>
        this.useRandomCardFree(state, targetRule),
      useSelectedFree: (state, targetRule, num = 1) =>
        this.useSelectedCardFree(state, targetRule, parseInt(num, 10)),
      useAllFree: (state, targetRule) =>
        this.useAllCardsFree(state, targetRule),
      removeAll: (state, targetRule) =>
        this.removeCardByTarget(state, targetRule),

      // Legacy action aliases (keep for backward-compat during migration).
      removeCard: (state, targetRule) =>
        this.removeCardByTarget(state, targetRule),
      moveToHand: (state, targetRule, num = 1) =>
        this.moveToHandByTarget(state, targetRule, parseInt(num, 10)),
      moveToTopOfDeck: (state, targetRule, num = 1) =>
        this.moveToTopOfDeckByTarget(state, targetRule, num),
      moveToDeck: (state, targetRule) =>
        this.moveToDeckByTarget(state, targetRule),
    };
  }

  // Targeting delegation
  getTargetRuleCards(state, targetRule, source) {
    return getTargetRuleCards(
      state,
      targetRule,
      source,
      (s, k) => this.getCardEffects(s, k),
      (s, k) => this.getCardRarity(s, k),
    );
  }

  findCardPile(state, card) {
    for (let i = 0; i < CARD_PILES.length; i++) {
      if (state[CARD_PILES[i]].includes(card)) {
        return CARD_PILES[i];
      }
    }
    return null;
  }

  // State initialization

  initializeState(state) {
    const config = this.getConfig(state);

    let configs = [config];
    if (config.stage.type === "linkContest") {
      configs = this.engine.linkConfigs || [];
    }

    const cardMaps = [];
    for (let c = 0; c < configs.length; c++) {
      const cards = configs[c].idol.cards.concat(
        configs[c].defaultCardIds.map((id) => ({ id })),
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

  // Card queries

  getLines(state, card, attribute) {
    const skillCard = SkillCards.getById(state[S.cardMap][card].id);
    let attr = skillCard[attribute] || [];
    const c11n = state[S.cardMap][card].c11n;
    if (!c11n || !Object.keys(c11n).length) return attr;

    attr = attr.map((e) => ({ ...e }));
    for (let k in c11n) {
      const patches = Customizations.getById(k)[attribute] || [];
      for (let i = 0; i < patches.length; i++) {
        const patch = patches[i];
        if ((patch.level || 1) != c11n[k]) continue;

        if (patch.op === "append") {
          attr = attr.concat(patch.effect);
        } else if (patch.op === "patch") {
          const idx = attr.findIndex((e) => e.anchor === patch.anchor);
          if (idx < 0) {
            console.warn(
              `Customization ${k} references unknown anchor '@${patch.anchor}' on skill card ${skillCard.id}`,
            );
            continue;
          }
          attr[idx] = mergePatch(attr[idx], patch.delta);
        }
      }
    }

    return attr;
  }

  getCardEffects(state, card) {
    let cardEffects = new Set();
    if (card == null) return cardEffects;
    const lines = this.getLines(state, card, "actions");

    // Walk every action in every effect, recursing into nested `effects`
    // (from conditional-phase blocks like `if:X { at:phase { Y } }`) so the
    // stage's `cardEffects & X` check matches cards where the relevant
    // action only appears in a deferred/conditional branch — parity with
    // legacy, which reads from a flat effects list where those actions are
    // already top-level entries.
    const walk = (effects) => {
      for (const effect of effects || []) {
        for (const action of effect.actions || []) {
          const name = actionEffectName(action);
          if (name) cardEffects.add(name);
        }
        if (effect.effects) walk(effect.effects);
      }
    };
    walk(lines);
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

  // Card usability

  isCardUsable(state, card) {
    const skillCard = SkillCards.getById(state[S.cardMap][card].id);

    if (state[S.noCardUseTurns]) return false;
    if (state[S.noActiveTurns] && skillCard.type == "active") return false;
    if (state[S.noMentalTurns] && skillCard.type == "mental") return false;

    const conditions = this.getLines(state, card, "conditions")
      .map((c) => c.conditions)
      .flat();
    for (let i = 0; i < conditions.length; i++) {
      if (!this.engine.evaluator.evaluateCondition(state, conditions[i])) {
        return false;
      }
    }

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

  // Card usage

  useCard(state, card, pile = S.handCards) {
    const usingFree = state[S.freeCardUses] > 0;
    const pileIndex = state[pile].indexOf(card);
    const skillCard = SkillCards.getById(state[S.cardMap][card].id);
    const c11n = state[S.cardMap][card].c11n;

    this.logger.log(state, "entityStart", {
      type: "skillCard",
      id: skillCard.id,
    });

    this.logger.debug("Using card", skillCard.id, skillCard.name);

    state[S.usedCard] = card;

    let conditionState = shallowCopy(state);
    this.logger.debug("Applying cost", skillCard.cost);

    const cost = this.getLines(state, card, "cost")
      .map((c) => c.actions)
      .flat();
    const hasStaminaCost = cost.some(
      (action) => action.lhs === "cost" || action.lhs === "stamina",
    );
    if (usingFree) {
      // Skip cost entirely when using card free; wrapper (useRandomCardFree
      // / useSelectedCardFree / useAllCardsFree) manages the counter.
    } else if (hasStaminaCost && state[S.nullifyCostCards]) {
      state[S.nullifyCostCards]--;
    } else if (
      hasStaminaCost &&
      skillCard.type === "active" &&
      state[S.nullifyCostActiveCards]
    ) {
      state[S.nullifyCostActiveCards]--;
    } else {
      state[S.phase] = "processCost";
      this.engine.executor.executeActions(state, cost, card);
      delete state[S.phase];
    }

    state[pile].splice(pileIndex, 1);
    if (!usingFree) {
      state[S.cardUsesRemaining]--;
    }

    this.engine.effectManager.triggerEffectsForPhase(
      state,
      "cardUsed",
      conditionState,
    );
    if (skillCard.type == "active") {
      this.engine.effectManager.triggerEffectsForPhase(
        state,
        "activeCardUsed",
        conditionState,
      );
    } else if (skillCard.type == "mental") {
      this.engine.effectManager.triggerEffectsForPhase(
        state,
        "mentalCardUsed",
        conditionState,
      );
    }

    const actions = this.getLines(state, card, "actions");
    state[S.phase] = "processCard";
    if (state[S.doubleCardEffectCards] && skillCard.rarity !== "L") {
      state[S.doubleCardEffectCards]--;
      state[S.effectInstanceId]++;
      this.engine.effectManager.triggerEffects(state, actions, null, card);
    }
    state[S.effectInstanceId]++;
    this.engine.effectManager.triggerEffects(state, actions, null, card);
    delete state[S.phase];

    state[S.cardsUsed]++;
    state[S.turnCardsUsed]++;
    if (skillCard.type == "active") {
      state[S.activeCardsUsed]++;
    }

    conditionState = shallowCopy(state);
    this.engine.effectManager.triggerEffectsForPhase(
      state,
      "afterCardUsed",
      conditionState,
    );
    if (skillCard.type == "active") {
      this.engine.effectManager.triggerEffectsForPhase(
        state,
        "afterActiveCardUsed",
        conditionState,
      );
    } else if (skillCard.type == "mental") {
      this.engine.effectManager.triggerEffectsForPhase(
        state,
        "afterMentalCardUsed",
        conditionState,
      );
    }

    state[S.lastUsedCard] = state[S.usedCard];
    state[S.usedCard] = null;

    this.logger.log(state, "entityEnd", {
      type: "skillCard",
      id: skillCard.id,
    });

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
        conditionState,
      );
    }

    // Free uses don't consume cardUsesRemaining, so they can't end the
    // turn — mirror legacy to keep parity across free-use chains (e.g.
    // `useAllFree[held]` triggered from a card's own actions while
    // cardUsesRemaining is already 0).
    if (!usingFree && state[S.cardUsesRemaining] < 1) {
      this.engine.turnManager.endTurn(state);
    }
  }

  // Card manipulation

  grow(state, cards, actions) {
    for (let i = 0; i < cards.length; i++) {
      const card = state[S.cardMap][cards[i]];
      if (!card.growth) card.growth = {};
      this.engine.executor.executeGrowthActions(card.growth, actions);
      this.logger.log(state, "growth", { type: "skillCard", id: card.id });
    }
  }

  drawCard(state) {
    if (state[S.handCards].length >= 5) return;

    if (!state[S.deckCards].length) {
      if (!state[S.discardedCards].length) return;
      this.recycleDiscards(state);
    }

    const card = state[S.deckCards].pop();
    state[S.handCards].push(card);
    state[S.movedCard] = card;
    this.engine.effectManager.triggerEffectsForPhase(state, "cardMovedToHand");

    this.logger.debug(
      "Drew card",
      SkillCards.getById(state[S.cardMap][card].id).name,
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
    if (state[S.handCards].length >= 5) return;

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

  moveCardToHand(state, cardId, exact) {
    if (state[S.handCards].length >= 5) return;

    let matchingCards = [];
    for (let pile of CARD_PILES) {
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

  moveCardToHandFromDeckOrDiscards(state, cardId, exact) {
    if (state[S.handCards].length >= 5) return;

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
    if (state[S.handCards].length >= 5) return;
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
        "cardMovedToHand",
      );

      this.logger.log(state, "moveCardToHand", {
        type: "skillCard",
        id: state[S.cardMap][card].id,
      });
    }
  }

  // Hold actions

  hold(state, card) {
    if (card != null) {
      state[S.heldCards].push(card);
      this.logger.log(state, "holdCard", {
        type: "skillCard",
        id: state[S.cardMap][card].id,
      });
    }
  }

  enforceHoldLimit(state) {
    while (state[S.heldCards].length > 2) {
      const discardedCard = state[S.heldCards].shift();
      state[S.discardedCards].push(discardedCard);
      this.logger.log(state, "discardCard", {
        type: "skillCard",
        id: state[S.cardMap][discardedCard].id,
      });
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

    this.enforceHoldLimit(state);
  }

  holdThisCard(state) {
    this.hold(state, state[S.usedCard]);
    this.enforceHoldLimit(state);
    state[S.thisCardHeld] = true;
  }

  moveHeldCardsToHand(state) {
    const movedCards = [];
    while (state[S.heldCards].length) {
      const card = state[S.heldCards].pop();
      state[S.handCards].push(card);
      movedCards.push(card);
    }
    for (const card of movedCards) {
      state[S.movedCard] = card;
      this.engine.effectManager.triggerEffectsForPhase(
        state,
        "cardMovedToHand",
      );

      this.logger.log(state, "moveCardToHand", {
        type: "skillCard",
        id: state[S.cardMap][card].id,
      });
    }
  }

  // Target-based card manipulation

  moveSelectedToHandByTarget(state, targetRule, num = 1) {
    if (state[S.nullifySelect]) return;
    if (state[S.handCards].length >= 5) return;

    const targetCards = this.getTargetRuleCards(state, targetRule, null);
    const cards = Array.from(targetCards);
    if (!cards.length) return;

    const indicesToMove = this.engine.strategy.pickCardsToMoveToHand(
      state,
      cards,
      num,
    );
    if (indicesToMove.length === 0) return;

    for (let j = 0; j < indicesToMove.length; j++) {
      if (state[S.handCards].length >= 5) break;
      const cardIdx = cards[indicesToMove[j]];
      for (let i = 0; i < CARD_PILES.length; i++) {
        const pileIndex = state[CARD_PILES[i]].indexOf(cardIdx);
        if (pileIndex !== -1) {
          state[CARD_PILES[i]].splice(pileIndex, 1);
          state[S.handCards].push(cardIdx);
          state[S.movedCard] = cardIdx;
          this.engine.effectManager.triggerEffectsForPhase(
            state,
            "cardMovedToHand",
          );
          this.logger.log(state, "moveCardToHand", {
            type: "skillCard",
            id: state[S.cardMap][cardIdx].id,
          });
          break;
        }
      }
    }
  }

  holdSelectedByTarget(state, targetRule, num = 1) {
    if (state[S.nullifySelect]) return;

    const targetCards = this.getTargetRuleCards(state, targetRule, null);
    const cards = Array.from(targetCards);
    if (!cards.length) return;

    const indicesToHold = this.engine.strategy.pickCardsToHold(
      state,
      cards,
      num,
    );

    if (indicesToHold.length === 0) return;

    indicesToHold.sort((a, b) => b - a);
    for (let j = 0; j < indicesToHold.length; j++) {
      const cardIdx = cards[indicesToHold[j]];
      for (let i = 0; i < CARD_PILES.length; i++) {
        const pileIndex = state[CARD_PILES[i]].indexOf(cardIdx);
        if (pileIndex !== -1) {
          state[CARD_PILES[i]].splice(pileIndex, 1);
          this.hold(state, cardIdx);
          break;
        }
      }
    }

    this.enforceHoldLimit(state);
  }

  useRandomCardFree(state, targetRule) {
    const targetCards = this.getTargetRuleCards(state, targetRule);
    const usableCards = [];
    for (let card of targetCards.values()) {
      const pile = this.findCardPile(state, card);
      if (pile && this.isCardUsable(state, card)) {
        usableCards.push({ card, pile });
      }
    }
    if (!usableCards.length) return;
    const { card, pile } =
      usableCards[Math.floor(getRand() * usableCards.length)];
    state[S.freeCardUses]++;
    this.useCard(state, card, pile);
    state[S.freeCardUses]--;
  }

  useAllCardsFree(state, targetRule) {
    const targetCards = this.getTargetRuleCards(state, targetRule);
    if (!targetCards.size) return;
    // Use all matching cards (check pile each time as cards may move)
    for (const card of targetCards) {
      const pile = this.findCardPile(state, card);
      if (pile) {
        state[S.freeCardUses]++;
        this.useCard(state, card, pile);
        state[S.freeCardUses]--;
      }
    }
  }

  useSelectedCardFree(state, targetRule, num = 1) {
    if (state[S.nullifySelect]) return;

    const targetCards = this.getTargetRuleCards(state, targetRule);
    const cards = [...targetCards];
    if (!cards.length) return;

    const indicesToUse = this.engine.strategy.pickCardsToUseFree(
      state,
      cards,
      num,
    );
    if (!indicesToUse || indicesToUse.length === 0) return;

    for (let j = 0; j < indicesToUse.length; j++) {
      const card = cards[indicesToUse[j]];
      const pile = this.findCardPile(state, card);
      if (pile) {
        state[S.freeCardUses]++;
        this.useCard(state, card, pile);
        state[S.freeCardUses]--;
      }
    }
  }

  removeCardByTarget(state, targetRule) {
    const targetCards = this.getTargetRuleCards(state, targetRule, null);
    const piles = [S.deckCards, S.discardedCards, S.handCards];

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

  moveAllToHandByTarget(state, targetRule) {
    const targetCards = this.getTargetRuleCards(state, targetRule, null);
    const piles = [S.deckCards, S.discardedCards, S.removedCards];
    let candidates = [];
    for (let pile of piles) {
      for (let i = 0; i < state[pile].length; i++) {
        const cardIdx = state[pile][i];
        if (targetCards.has(cardIdx))
          candidates.push({ pile, index: i, cardIdx });
      }
    }
    // Move in reverse-pile-index order to keep splicing indices valid.
    candidates.sort((a, b) => (a.pile === b.pile ? b.index - a.index : 0));
    for (const pick of candidates) {
      if (state[S.handCards].length >= 5) break;
      state[pick.pile].splice(pick.index, 1);
      state[S.handCards].push(pick.cardIdx);
      state[S.movedCard] = pick.cardIdx;
      this.engine.effectManager.triggerEffectsForPhase(
        state,
        "cardMovedToHand",
      );
      this.logger.log(state, "moveCardToHand", {
        type: "skillCard",
        id: state[S.cardMap][pick.cardIdx].id,
      });
    }
  }

  moveAllToTopOfDeckByTarget(state, targetRule) {
    const targetCards = this.getTargetRuleCards(state, targetRule, null);
    const piles = [S.deckCards, S.discardedCards, S.removedCards];
    let candidates = [];
    for (let pile of piles) {
      for (let i = 0; i < state[pile].length; i++) {
        const cardIdx = state[pile][i];
        if (targetCards.has(cardIdx))
          candidates.push({ pile, index: i, cardIdx });
      }
    }
    candidates.sort((a, b) => (a.pile === b.pile ? b.index - a.index : 0));
    for (const pick of candidates) {
      state[pick.pile].splice(pick.index, 1);
      state[S.deckCards].push(pick.cardIdx);
      state[S.movedCard] = pick.cardIdx;
      this.logger.log(state, "moveCardToTopOfDeck", {
        type: "skillCard",
        id: state[S.cardMap][pick.cardIdx].id,
      });
    }
  }

  holdRandomByTarget(state, targetRule, num = 1) {
    const targetCards = this.getTargetRuleCards(state, targetRule, null);
    const cards = Array.from(targetCards);
    if (!cards.length) return;
    for (let j = 0; j < num && cards.length > 0; j++) {
      const pickIndex = Math.floor(getRand() * cards.length);
      const cardIdx = cards.splice(pickIndex, 1)[0];
      for (let i = 0; i < CARD_PILES.length; i++) {
        const pileIdx = state[CARD_PILES[i]].indexOf(cardIdx);
        if (pileIdx !== -1) {
          state[CARD_PILES[i]].splice(pileIdx, 1);
          this.hold(state, cardIdx);
          break;
        }
      }
    }
    this.enforceHoldLimit(state);
  }

  holdAllByTarget(state, targetRule) {
    const targetCards = this.getTargetRuleCards(state, targetRule, null);
    for (const cardIdx of targetCards) {
      for (let i = 0; i < CARD_PILES.length; i++) {
        const pile = state[CARD_PILES[i]];
        const idx = pile.indexOf(cardIdx);
        if (idx !== -1) {
          pile.splice(idx, 1);
          this.hold(state, cardIdx);
          break;
        }
      }
    }
    this.enforceHoldLimit(state);
  }

  // Shared helper: find candidates matching a target rule in the given piles.
  findCardsMatchingTargetInPiles(state, targetRule, piles) {
    const targetCards = this.getTargetRuleCards(state, targetRule, null);
    const candidates = [];
    for (const pile of piles) {
      for (let i = 0; i < state[pile].length; i++) {
        const cardIdx = state[pile][i];
        if (targetCards.has(cardIdx)) {
          candidates.push({ pile, index: i, cardIdx });
        }
      }
    }
    return candidates;
  }

  // Shared helper: move a candidate card from its pile to the destination pile.
  // Caller is responsible for any further effects/logs that depend on the move.
  moveCardBetweenPiles(state, pick, destPile, candidates) {
    // Keep remaining candidate indices valid after the splice.
    if (candidates) {
      for (const c of candidates) {
        if (c.pile === pick.pile && c.index > pick.index) c.index--;
      }
    }
    state[pick.pile].splice(pick.index, 1);
    state[destPile].push(pick.cardIdx);
  }

  moveToHandByTarget(state, targetRule, num = 1) {
    if (state[S.handCards].length >= 5) return;

    // All piles — matches legacy `moveCardToHand` pile coverage. Hand itself
    // is included because legacy picks cards already in hand too (no-op move
    // that reorders to end of hand). Held-pile sources behave the same.
    const piles = [
      S.deckCards,
      S.discardedCards,
      S.removedCards,
      S.heldCards,
      S.handCards,
    ];
    const candidates = this.findCardsMatchingTargetInPiles(
      state,
      targetRule,
      piles,
    );

    for (let j = 0; j < num && candidates.length; j++) {
      if (state[S.handCards].length >= 5) break;

      const pickIndex = Math.floor(getRand() * candidates.length);
      const pick = candidates.splice(pickIndex, 1)[0];
      this.moveCardBetweenPiles(state, pick, S.handCards, candidates);

      state[S.movedCard] = pick.cardIdx;
      this.engine.effectManager.triggerEffectsForPhase(
        state,
        "cardMovedToHand",
      );

      this.logger.log(state, "moveCardToHand", {
        type: "skillCard",
        id: state[S.cardMap][pick.cardIdx].id,
      });
    }
  }

  moveCardToTopOfDeck(state, cardId, exact = false) {
    let matchingCards = [];
    for (let pile of [S.deckCards, S.discardedCards, S.removedCards]) {
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
    state[S.deckCards].push(pick.cardIdx);

    state[S.movedCard] = pick.cardIdx;

    this.logger.log(state, "moveCardToTopOfDeck", {
      type: "skillCard",
      id: state[S.cardMap][pick.cardIdx].id,
    });
  }

  moveToTopOfDeckByTarget(state, targetRule, num = 1) {
    const candidates = this.findCardsMatchingTargetInPiles(state, targetRule, [
      S.deckCards,
      S.discardedCards,
      S.removedCards,
    ]);

    for (let j = 0; j < num && candidates.length; j++) {
      const pickIndex = Math.floor(getRand() * candidates.length);
      const pick = candidates.splice(pickIndex, 1)[0];
      this.moveCardBetweenPiles(state, pick, S.deckCards, candidates);
      state[S.movedCard] = pick.cardIdx;

      this.logger.log(state, "moveCardToTopOfDeck", {
        type: "skillCard",
        id: state[S.cardMap][pick.cardIdx].id,
      });
    }
  }

  moveToDeckByTarget(state, targetRule) {
    const targetCards = this.getTargetRuleCards(state, targetRule, null);

    let candidates = [];
    for (let i = 0; i < state[S.removedCards].length; i++) {
      const cardIdx = state[S.removedCards][i];
      if (targetCards.has(cardIdx)) {
        candidates.push({ index: i, cardIdx });
      }
    }

    candidates.sort((a, b) => b.index - a.index);
    for (let pick of candidates) {
      state[S.removedCards].splice(pick.index, 1);
      const insertIndex = Math.floor(
        getRand() * (state[S.deckCards].length + 1),
      );
      state[S.deckCards].splice(insertIndex, 0, pick.cardIdx);

      this.logger.log(state, "moveCardToDeckAtRandom", {
        type: "skillCard",
        id: state[S.cardMap][pick.cardIdx].id,
      });
    }
  }
}
