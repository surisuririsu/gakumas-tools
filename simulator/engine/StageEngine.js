import { PItems, SkillCards } from "gakumas-data/lite";
import { shuffle } from "./utils";
import {
  DEBUFF_FIELDS,
  COST_FIELDS,
  EOT_DECREMENT_FIELDS,
  INCREASE_TRIGGER_FIELDS,
  DECREASE_TRIGGER_FIELDS,
  LOGGED_FIELDS,
  WHOLE_FIELDS,
  UNFRESH_PHASES,
} from "./constants";

const KEYS_TO_DIFF = [
  ...new Set(
    LOGGED_FIELDS.concat(
      INCREASE_TRIGGER_FIELDS,
      DECREASE_TRIGGER_FIELDS,
      EOT_DECREMENT_FIELDS
    )
  ),
];

export default class StageEngine {
  constructor(stageConfig, idolConfig, logger, debug) {
    this.stageConfig = stageConfig;
    this.idolConfig = idolConfig;
    this.logger = logger;
    this.debug = debug;
  }

  getInitialState() {
    return {
      started: false,
      turnTypes: this._generateTurnTypes(),

      // General
      turnsElapsed: 0,
      turnsRemaining: this.stageConfig.turnCount,
      cardUsesRemaining: 0,
      maxStamina: this.idolConfig.params.stamina,
      fixedStamina: 0,
      intermediateStamina: 0,
      stamina: this.idolConfig.params.stamina,
      consumedStamina: 0,
      fixedGenki: 0,
      intermediateGenki: 0,
      genki: 0,
      cost: 0,
      intermediateScore: 0,
      score: 0,
      clearRatio: 0,

      // Skill card piles
      deckCardIds: shuffle(this.idolConfig.skillCardIds).sort((a, b) => {
        if (SkillCards.getById(a).forceInitialHand) return 1;
        if (SkillCards.getById(b).forceInitialHand) return -1;
        return 0;
      }),
      handCardIds: [],
      discardedCardIds: [],
      removedCardIds: [],
      holdCardIds: [],
      cardsUsed: 0,
      turnCardsUsed: 0,
      turnCardsUpgraded: 0,

      // Phase effects
      effects: [],
      triggeredEffects: [],

      // Buffs and debuffs
      halfCostTurns: 0,
      doubleCostTurns: 0,
      costReduction: 0,
      costIncrease: 0,
      doubleCardEffectCards: 0,
      nullifyGenkiTurns: 0,
      nullifyDebuff: 0,
      poorConditionTurns: 0,
      nullifyCostCards: 0,

      // Sense
      goodConditionTurns: 0,
      perfectConditionTurns: 0,
      concentration: 0,
      concentrationMultiplier: 1,

      // Logic
      goodImpressionTurns: 0,
      motivation: 0,
      motivationMultiplier: 1,

      // Anomaly
      stance: "none",
      lockStanceTurns: 0,
      intermediateFullPowerCharge: 0,
      fullPowerCharge: 0,
      cumulativeFullPowerCharge: 0,
      enthusiasm: 0,
      growthByEntity: {},
      strengthTimes: 0,
      preservationTimes: 0,
      fullPowerTimes: 0,

      // Score buffs
      scoreBuffs: [],

      // Used card
      usedCardId: null,
      cardEffects: [],

      // Buffs/debuffs protected from decrement when fresh
      freshBuffs: {},
    };
  }

  _generateTurnTypes() {
    const { turnCounts, firstTurns, criteria } = this.stageConfig;
    const remainingTurns = { ...turnCounts };

    const rand = Math.random();
    let firstTurn = "vocal";
    if (rand > firstTurns.vocal) firstTurn = "dance";
    if (rand > firstTurns.vocal + firstTurns.dance) firstTurn = "visual";
    remainingTurns[firstTurn] -= 1;

    const sortedTypes = Object.keys(criteria).sort(
      (a, b) => criteria[b] - criteria[a]
    );
    const lastThreeTurns = sortedTypes.slice().reverse();
    lastThreeTurns.forEach((t) => (remainingTurns[t] -= 1));

    let turnPool = Object.keys(remainingTurns).reduce(
      (acc, cur) =>
        acc.concat(new Array(Math.max(remainingTurns[cur], 0)).fill(cur)),
      []
    );
    let randomTurns = [];
    while (turnPool.length) {
      const index = Math.floor(Math.random() * turnPool.length);
      randomTurns.push(turnPool.splice(index, 1)[0]);
    }

    return [firstTurn, ...randomTurns, ...lastThreeTurns];
  }

  startStage(state) {
    if (this.debug && state.started) {
      throw new Error("Stage already started!");
    }

    this.logger.clear();

    let nextState = { ...state };

    nextState.started = true;

    // Set default effects
    nextState = this._setEffects(nextState, "default", "好印象", [
      {
        phase: "endOfTurn",
        conditions: ["goodImpressionTurns>=1"],
        actions: ["score+=goodImpressionTurns"],
        group: 100,
      },
    ]);
    nextState = this._setEffects(nextState, "default", "温存", [
      {
        phase: "stanceChanged",
        conditions: ["prevStance==preservation"],
        actions: ["enthusiasm+=5", "cardUsesRemaining+=1"],
      },
      {
        phase: "stanceChanged",
        conditions: ["prevStance==preservation2"],
        actions: ["enthusiasm+=8", "genki+=5", "cardUsesRemaining+=1"],
      },
    ]);
    nextState = this._setEffects(nextState, "default", "強気", [
      {
        phase: "cardUsed",
        conditions: ["stance==strength2"],
        actions: ["fixedStamina-=1"],
      },
    ]);
    nextState = this._setEffects(nextState, "default", "全力", [
      {
        phase: "startOfTurn",
        conditions: ["fullPowerCharge>=10"],
        actions: [
          "setStance(fullPower)",
          "fullPowerCharge-=10",
          "lockStanceTurns+=1",
        ],
      },
      {
        phase: "stanceChanged",
        conditions: ["stance==fullPower"],
        actions: [
          "cardUsesRemaining+=1",
          "addHeldCardsToHand",
          "fullPowerTimes+=1",
        ],
      },
    ]);
    nextState = this._setEffects(nextState, "default", null, [
      {
        phase: "stanceChanged",
        conditions: ["stance==strength"],
        actions: ["strengthTimes+=1"],
      },
      {
        phase: "stanceChanged",
        conditions: ["stance==strength2"],
        actions: ["strengthTimes+=1"],
      },
      {
        phase: "stanceChanged",
        conditions: ["stance==preservation"],
        actions: ["preservationTimes+=1"],
      },
      {
        phase: "stanceChanged",
        conditions: ["stance==preservation2"],
        actions: ["preservationTimes+=1"],
      },
    ]);

    // Set stage effects
    this.logger.debug("Setting stage effects", this.stageConfig.effects);
    nextState = this._setEffects(
      nextState,
      "stage",
      null,
      this.stageConfig.effects
    );

    // Set p-item effects
    for (let id of this.idolConfig.pItemIds) {
      const { effects, name } = PItems.getById(id);
      this.logger.debug("Setting p-item effects", name, effects);
      nextState = this._setEffects(nextState, "pItem", id, effects);
    }

    // Set growth effects
    const uniqueSkillCardIds = new Set(this.idolConfig.skillCardIds);
    for (let id of uniqueSkillCardIds) {
      const { growth, name } = SkillCards.getById(id);
      if (!growth?.length) continue;
      this.logger.debug("Setting growth effects", name, growth);
      const growthEntity = `skillCard_${id}`;
      nextState.growthByEntity[growthEntity] = {
        "growth.cost": 0,
        "growth.score": 0,
        "growth.scoreTimes": 0,
      };
      nextState = this._setEffects(
        nextState,
        "skillCard",
        id,
        growth.map((g) => ({ ...g, growth: true }))
      );
    }

    nextState = this._triggerEffectsForPhase("startOfStage", nextState);

    this.logger.pushGraphData(nextState);

    nextState = this._startTurn(nextState);

    return nextState;
  }

  isCardUsable(state, cardId) {
    const card = SkillCards.getById(cardId);
    const growthEntity = `skillCard_${cardId}`;

    // Check conditions
    for (let condition of card.conditions) {
      if (!this._evaluateCondition(condition, state, growthEntity))
        return false;
    }

    // Check cost
    let previewState = { ...state };
    for (let cost of card.cost) {
      previewState = this._executeAction(cost, previewState, growthEntity);
    }
    for (let field of COST_FIELDS) {
      if (previewState[field] < 0) return false;
    }

    return true;
  }

  useCard(state, cardId) {
    const handIndex = state.handCardIds.indexOf(cardId);

    if (this.debug) {
      if (!state.started) {
        throw new Error("Stage not started!");
      }
      if (state.cardUsesRemaining < 1) {
        throw new Error("No card uses remaining!");
      }
      if (state.turnsRemaining < 1) {
        throw new Error("No turns remaining!");
      }
      if (handIndex == -1) {
        throw new Error("Card is not in hand!");
      }
      if (!this.isCardUsable(state, cardId)) {
        throw new Error("Card is not usable!");
      }
    }

    const card = SkillCards.getById(cardId);

    let nextState = JSON.parse(JSON.stringify(state));

    this.logger.debug("Using card", cardId, card.name);
    this.logger.log("entityStart", { type: "skillCard", id: cardId });

    // Set usedCard variables
    nextState._usedCardId = card.id;
    nextState.usedCardId = card.upgraded ? card.id - 1 : card.id;
    nextState.cardEffects = this._getCardEffects(card);

    // Apply card cost
    let conditionState = { ...nextState };
    this.logger.debug("Applying cost", card.cost);
    nextState = this._executeActions(
      card.cost,
      nextState,
      `skillCard_${cardId}`
    );
    if (nextState.nullifyCostCards) {
      nextState.nullifyCostCards--;
    }

    // Remove card from hand
    nextState.handCardIds.splice(handIndex, 1);
    nextState.cardUsesRemaining -= 1;

    // Trigger events on card used
    nextState = this._triggerEffectsForPhase(
      "cardUsed",
      nextState,
      conditionState
    );
    if (card.type == "active") {
      nextState = this._triggerEffectsForPhase(
        "activeCardUsed",
        nextState,
        conditionState
      );
    } else if (card.type == "mental") {
      nextState = this._triggerEffectsForPhase(
        "mentalCardUsed",
        nextState,
        conditionState
      );
    }

    // Apply card effects
    if (nextState.doubleCardEffectCards) {
      nextState.doubleCardEffectCards--;
      nextState = this._triggerEffects(
        card.effects,
        nextState,
        null,
        `skillCard_${card.id}`
      );
    }
    nextState = this._triggerEffects(
      card.effects,
      nextState,
      null,
      `skillCard_${card.id}`
    );

    nextState.cardsUsed++;
    nextState.turnCardsUsed++;

    // Trigger events after card used
    conditionState = { ...nextState };
    nextState = this._triggerEffectsForPhase(
      "afterCardUsed",
      nextState,
      conditionState
    );
    if (card.type == "active") {
      nextState = this._triggerEffectsForPhase(
        "afterActiveCardUsed",
        nextState,
        conditionState
      );
    } else if (card.type == "mental") {
      nextState = this._triggerEffectsForPhase(
        "afterMentalCardUsed",
        nextState,
        conditionState
      );
    }

    // Reset usedCard variables
    nextState._usedCardId = null;
    nextState.usedCardId = null;
    nextState.cardEffects = [];

    this.logger.log("entityEnd", { type: "skillCard", id: cardId });

    // Send card to discards or remove
    if (nextState.thisCardHeld) {
      nextState.thisCardHeld = false;
    } else if (card.limit) {
      nextState.removedCardIds.push(card.id);
    } else {
      nextState.discardedCardIds.push(card.id);
    }

    // End turn if no card uses left
    if (nextState.cardUsesRemaining < 1) {
      nextState = this.endTurn(nextState);
    }

    return nextState;
  }

  endTurn(state) {
    if (this.debug) {
      if (!state.started) {
        throw new Error("Stage not started!");
      }
      if (state.turnsRemaining < 1) {
        throw new Error("No turns remaining!");
      }
    }

    // Recover stamina if turn ended by player
    if (state.cardUsesRemaining > 0) {
      state.stamina = Math.min(
        state.stamina + 2,
        this.idolConfig.params.stamina
      );
    }

    state = this._triggerEffectsForPhase("endOfTurn", state);

    // Reduce buff turns
    for (let key of EOT_DECREMENT_FIELDS) {
      if (state.freshBuffs[key]) {
        delete state.freshBuffs[key];
      } else {
        state[key] = Math.max(state[key] - 1, 0);
      }
    }

    // Reduce score buff turns
    for (let i = 0; i < state.scoreBuffs.length; i++) {
      if (state.scoreBuffs[i].fresh) {
        state.scoreBuffs[i].fresh = false;
      } else if (state.scoreBuffs[i].turns) {
        state.scoreBuffs[i].turns--;
      }
    }
    state.scoreBuffs = state.scoreBuffs.filter(({ turns }) => turns != 0);

    // Reset one turn buffs
    state.cardUsesRemaining = 0;
    state.turnCardsUsed = 0;
    state.turnCardsUpgraded = 0;
    state.enthusiasm = 0;
    if (state.stance == "fullPower") {
      state = this._resetStance(state);
    }

    // Decrement effect ttl and expire
    for (let i = 0; i < state.effects.length; i++) {
      if (state.effects[i].ttl == null) continue;
      state.effects[i].ttl = Math.max(state.effects[i].ttl - 1, -1);
    }

    // Discard hand
    state.discardedCardIds = state.discardedCardIds.concat(state.handCardIds);
    state.handCardIds = [];

    state.turnsElapsed += 1;
    state.turnsRemaining -= 1;

    this.logger.pushGraphData(state);

    // Start next turn
    if (state.turnsRemaining > 0) {
      state = this._startTurn(state);
    }

    return state;
  }

  _startTurn(state) {
    this.logger.debug("Starting turn", state.turnsElapsed + 1);

    state.turnType =
      state.turnTypes[
        Math.min(state.turnsElapsed, this.stageConfig.turnCount - 1)
      ];

    this.logger.log("startTurn", {
      num: state.turnsElapsed + 1,
      type: state.turnType,
      multiplier: this.idolConfig.typeMultipliers[state.turnType],
    });

    // Draw cards
    for (let i = 0; i < 3; i++) {
      state = this._drawCard(state);
    }

    // Draw more cards if turn 1 and >3 forceInitialHand
    if (state.turnsElapsed == 0) {
      for (let i = 0; i < 2; i++) {
        if (SkillCards.getById(this._peekDeck(state)).forceInitialHand) {
          state = this._drawCard(state);
        }
      }
    }

    state.cardUsesRemaining = 1;
    state = this._triggerEffectsForPhase("startOfTurn", state);
    state = this._triggerEffectsForPhase("everyTurn", state);

    return state;
  }

  _peekDeck(state) {
    return state.deckCardIds[state.deckCardIds.length - 1];
  }

  _drawCard(state) {
    if (state.handCardIds.length >= 5) return state;
    if (!state.deckCardIds.length) {
      if (!state.discardedCardIds.length) return state;
      state = this._recycleDiscards(state);
    }
    const cardId = state.deckCardIds.pop();
    state.handCardIds.push(cardId);
    this.logger.debug("Drew card", SkillCards.getById(cardId).name);
    this.logger.log("drawCard", { type: "skillCard", id: cardId });
    return state;
  }

  _recycleDiscards(state) {
    state.deckCardIds = shuffle(state.discardedCardIds);
    state.discardedCardIds = [];
    this.logger.debug("Recycled discard pile");
    return state;
  }

  _upgradeHand(state) {
    for (let i = 0; i < state.handCardIds.length; i++) {
      const card = SkillCards.getById(state.handCardIds[i]);
      if (!card.upgraded && card.type != "trouble") {
        state.handCardIds[i] += 1;
        state.turnCardsUpgraded++;
      }
    }
    this.logger.log("upgradeHand");
    return state;
  }

  _exchangeHand(state) {
    const numCards = state.handCardIds.length;
    state.discardedCardIds = state.discardedCardIds.concat(state.handCardIds);
    state.handCardIds = [];
    this.logger.log("exchangeHand");
    for (let i = 0; i < numCards; i++) {
      state = this._drawCard(state);
    }
    return state;
  }

  _addRandomUpgradedCardToHand(state) {
    const validBaseCards = SkillCards.getFiltered({
      rarities: ["R", "SR", "SSR"],
      plans: [this.idolConfig.plan, "free"],
      sourceTypes: ["produce"],
    }).filter((card) => card.upgraded);
    const randomCard =
      validBaseCards[Math.floor(Math.random() * validBaseCards.length)];
    state.handCardIds.push(randomCard.id);
    this.logger.log("addRandomUpgradedCardToHand", {
      type: "skillCard",
      id: randomCard.id,
    });
    return state;
  }

  _upgradeRandomCardInHand(state) {
    let unupgradedIndices = [];
    for (let i = 0; i < state.handCardIds.length; i++) {
      const card = SkillCards.getById(state.handCardIds[i]);
      if (card.type != "trouble" && !card.upgraded) {
        unupgradedIndices.push(i);
      }
    }
    if (!unupgradedIndices.length) return state;
    const randomIndex =
      unupgradedIndices[Math.floor(Math.random() * unupgradedIndices.length)];
    state.handCardIds[randomIndex] += 1;
    state.turnCardsUpgraded++;
    this.logger.log("upgradeRandomCardInHand", {
      type: "skillCard",
      id: state.handCardIds[randomIndex],
    });
    return state;
  }

  _setScoreBuff(state, amount, turns) {
    const existingBuffIndex = state.scoreBuffs.findIndex(
      (scoreBuff) => scoreBuff.turns == turns
    );
    if (existingBuffIndex != -1) {
      state.scoreBuffs[existingBuffIndex].amount += amount;
    } else {
      state.scoreBuffs.push({
        amount,
        turns,
        fresh: !UNFRESH_PHASES.includes(state.phase),
      });
    }
    this.logger.log("setScoreBuff", {
      amount,
      turns,
    });
    return state;
  }

  _setStance(state, stance) {
    if (state.lockStanceTurns) return state;
    if (state.stance == "fullPower") return state;

    state.prevStance = state.stance;

    if (stance.startsWith("preservation")) {
      if (state.stance.startsWith("preservation")) {
        state.stance = "preservation2";
      } else {
        state.stance = stance;
      }
    } else if (stance.startsWith("strength")) {
      if (state.stance.startsWith("strength")) {
        state.stance = "strength2";
      } else {
        state.stance = stance;
      }
    } else {
      state.stance = stance;
    }

    if (
      state.stance != state.prevStance &&
      state.stance != `${state.prevStance}2`
    ) {
      state = this._triggerEffectsForPhase("stanceChanged", state);
    }

    return state;
  }

  _resetStance(state) {
    state.prevStance = state.stance;
    state.stance = "none";
    state = this._triggerEffectsForPhase("stanceChanged", state);
    return state;
  }

  _holdThisCard(state) {
    state.holdCardIds.push(state._usedCardId);
    state.thisCardHeld = true;
    return state;
  }

  _holdSelectedFromHand(state) {
    // TODO: Random for now
    const randomIndex = Math.floor(Math.random() * state.handCardIds.length);
    const cardId = state.handCardIds.splice(randomIndex, 1)[0];
    if (cardId) {
      state.holdCardIds.push(cardId);
    }
    return state;
  }

  _holdSelectedFromDeckOrDiscards(state) {
    // TODO: Random for now
    const randomIndex = Math.floor(
      Math.random() * (state.deckCardIds.length + state.discardedCardIds.length)
    );
    let cardId;
    if (randomIndex >= state.deckCardIds.length) {
      cardId = state.discardedCardIds.splice(
        randomIndex - state.deckCardIds.length,
        1
      )[0];
    } else {
      cardId = state.deckCardIds.splice(randomIndex, 1)[0];
    }
    if (cardId) {
      state.holdCardIds.push(cardId);
    }
    return state;
  }

  _addHeldCardsToHand(state) {
    state.handCardIds = state.handCardIds.concat(state.holdCardIds);
    state.holdCardIds = [];
    return state;
  }

  _getCardEffects(card) {
    let cardEffects = [];
    for (let effect of card.effects) {
      if (effect.phase || !effect.actions) continue;
      for (let action of effect.actions) {
        const tokens = action.split(/([=!]?=|[<>]=?|[+\-*/%]=?|&)/);
        if (!tokens?.[0]?.length) continue;
        let cardEffect = tokens[0];
        if (tokens[0].startsWith("setStance")) {
          cardEffect = tokens[0].match(/\(([^)]+)\)/)[1];
        }
        cardEffects.push(cardEffect);
      }
    }
    return cardEffects;
  }

  _setEffects(state, sourceType, sourceId, effects) {
    for (let i = 0; i < effects.length; i++) {
      const effect = { ...effects[i] };
      if (!effect.actions && i < effects.length - 1) {
        effect.effects = [effects[++i]];
      }
      state.effects.push({ ...effect, sourceType, sourceId });
    }
    return state;
  }

  _triggerEffectsForPhase(phase, state, prevState) {
    const parentPhase = state.phase;
    state.phase = phase;

    let phaseEffectsByGroup = {};
    for (let i = 0; i < state.effects.length; i++) {
      const effect = state.effects[i];
      if (effect.phase != phase) continue;
      const group = effect.group || 0;
      if (!phaseEffectsByGroup[group]) {
        phaseEffectsByGroup[group] = [];
      }
      phaseEffectsByGroup[group].push({ ...effect, phase: null, index: i });
    }

    const groupKeys = Object.keys(phaseEffectsByGroup).sort((a, b) => a - b);

    this.logger.debug(phase, phaseEffectsByGroup);

    for (let key of groupKeys) {
      state = this._triggerEffects(phaseEffectsByGroup[key], state, prevState);

      for (let index of state.triggeredEffects) {
        if (state.effects[index].limit) {
          state.effects[index].limit--;
        }
      }
      state.triggeredEffects = [];
    }

    state.phase = parentPhase;

    return state;
  }

  _triggerEffects(effects, state, prevState, growthEntity) {
    const conditionState = prevState || { ...state };

    let triggeredEffects = [];
    let skipNextEffect = false;
    for (let effect of effects) {
      // Skip effect if condition is not satisfied
      if (skipNextEffect) {
        skipNextEffect = false;
        continue;
      }

      if (effect.phase) {
        this.logger.log("setEffect");

        state = this._setEffects(
          state,
          state._usedCardId ? "skillCardEffect" : null,
          state._usedCardId,
          [effect]
        );
        continue;
      }

      // Check limit
      if (effect.limit != null && effect.limit < 1) {
        continue;
      }

      // Check ttl
      if (effect.ttl != null && effect.ttl < 0) {
        continue;
      }

      // Check conditions
      if (effect.conditions) {
        let satisfied = true;
        for (let condition of effect.conditions) {
          if (
            !this._evaluateCondition(condition, conditionState, growthEntity)
          ) {
            satisfied = false;
            break;
          }
        }
        if (!satisfied) {
          if (!effect.actions) {
            skipNextEffect = true;
          }
          continue;
        }
      }

      if (effect.sourceType) {
        this.logger.log("entityStart", {
          type: effect.sourceType,
          id: effect.sourceId,
        });
      }

      this.logger.debug("Executing actions", effect.actions);

      if (effect.targets) {
        for (let target of effect.targets) {
          let growthEntities = [];
          if (target == "this") {
            growthEntities.push(`${effect.sourceType}_${effect.sourceId}`);
          } else if (target == "hand") {
            growthEntities = growthEntities.concat(
              state.handCardIds.map((id) => `skillCard_${id}`)
            );
          } else if (target == "all") {
            growthEntities = growthEntities.concat(
              `${effect.sourceType}_${effect.sourceId}`,
              state.handCardIds.map((id) => `skillCard_${id}`),
              state.deckCardIds.map((id) => `skillCard_${id}`),
              state.discardedCardIds.map((id) => `skillCard_${id}`)
            );
          }
          for (let growthEntity of growthEntities) {
            state.growthByEntity[growthEntity] = this._executeActions(
              effect.actions,
              state.growthByEntity[growthEntity] || {}
            );
            const [sourceType, sourceId] = growthEntity.split("_");
            if (sourceType == "skillCard") {
              this.logger.log("growth", {
                type: sourceType,
                id: sourceId,
              });
            }
          }
        }
      } else {
        // Execute actions
        if (effect.actions) {
          state = this._executeActions(
            effect.actions,
            state,
            growthEntity || `${effect.sourceType}_${effect.sourceId}`
          );

          // Reset modifiers
          state.concentrationMultiplier = 1;
          state.motivationMultiplier = 1;
        }

        // Set effects
        if (effect.effects) {
          this.logger.debug("Setting effects", effect.effects);

          this.logger.log("setEffect");

          state = this._setEffects(
            state,
            effect.sourceType,
            effect.sourceId,
            effect.effects
          );
        }
      }

      if (effect.sourceType) {
        this.logger.log("entityEnd", {
          type: effect.sourceType,
          id: effect.sourceId,
        });
      }

      triggeredEffects.push(effect.index);
    }

    state.triggeredEffects = triggeredEffects;

    return state;
  }

  _evaluateCondition(condition, state, growthEntity) {
    const result = this._evaluateExpression(
      condition.split(/([=!]?=|[<>]=?|[+\-*/%]|&)/),
      state,
      growthEntity
    );
    this.logger.debug("Condition", condition, result);
    return result;
  }

  _evaluateExpression(tokens, state) {
    const variables = {
      ...state,
      isVocalTurn: state.turnType == "vocal",
      isDanceTurn: state.turnType == "dance",
      isVisualTurn: state.turnType == "visual",
      isPreservation: state.stance?.startsWith("preservation"),
      isStrength: state.stance?.startsWith("strength"),
      isFullPower: state.stance == "fullPower",
    };

    function evaluate(tokens) {
      if (tokens.length == 1) {
        // Numeric constants
        if (/^-?[\d]+(\.\d+)?$/.test(tokens[0])) {
          return parseFloat(tokens[0]);
        }

        // Stances
        if (
          [
            "none",
            "strength",
            "strength2",
            "preservation",
            "preservation2",
            "fullPower",
          ].includes(tokens[0])
        ) {
          return tokens[0];
        }

        // Variables
        return variables[tokens[0]];
      }

      // Set contains
      if (tokens.indexOf("&") != -1) {
        if (tokens.length != 3) {
          console.warn("Invalid set contains");
        }
        return variables[tokens[0]].includes(tokens[2]);
      }

      // Comparators (boolean operators)
      const cmpIndex = tokens.findIndex((t) => /[=!]=|[<>]=?/.test(t));
      if (cmpIndex != -1) {
        const lhs = evaluate(tokens.slice(0, cmpIndex));
        const cmp = tokens[cmpIndex];
        const rhs = evaluate(tokens.slice(cmpIndex + 1));

        if (cmp == "==") {
          return lhs == rhs;
        } else if (cmp == "!=") {
          return lhs != rhs;
        } else if (cmp == "<") {
          return lhs < rhs;
        } else if (cmp == "<=") {
          return lhs <= rhs;
        } else if (cmp == ">") {
          return lhs > rhs;
        } else if (cmp == ">=") {
          return lhs >= rhs;
        }
        console.warn("Unrecognized comparator", cmp);
      }

      // Add, subtract
      const asIndex = tokens.findIndex((t) => /[+\-]/.test(t));
      if (asIndex != -1) {
        const lhs = evaluate(tokens.slice(0, asIndex));
        const op = tokens[asIndex];
        const rhs = evaluate(tokens.slice(asIndex + 1));

        if (op == "+") {
          return lhs + rhs;
        } else if (op == "-") {
          return lhs - rhs;
        }
        console.warn("Unrecognized operator", op);
      }

      // Multiply, divide, modulo
      const mdIndex = tokens.findIndex((t) => /[*/%]/.test(t));
      if (mdIndex != -1) {
        const lhs = evaluate(tokens.slice(0, mdIndex));
        const op = tokens[mdIndex];
        const rhs = evaluate(tokens.slice(mdIndex + 1));

        if (op == "*") {
          return lhs * rhs;
        } else if (op == "/") {
          return lhs / rhs;
        } else if (op == "%") {
          return lhs % rhs;
        }
        console.warn("Unrecognized operator", op);
      }
    }

    return evaluate(tokens);
  }

  _executeActions(actions, state, growthEntity) {
    let prev = {};
    for (let key of KEYS_TO_DIFF) {
      prev[key] = state[key];
    }

    const scoreTimes =
      state.growthByEntity?.[growthEntity]?.["growth.scoreTimes"];
    for (let action of actions) {
      state = this._executeAction(action, state, growthEntity);

      if (scoreTimes) {
        const tokens = action.split(/([=!]?=|[<>]=?|[+\-*/%]=?|&)/);
        if (tokens?.[0] == "score") {
          for (let i = 0; i < scoreTimes; i++) {
            state = this._executeAction(action, state, growthEntity);
          }
        }
      }

      if (state.stamina < 0) state.stamina = 0;
      if (state.stamina > state.maxStamina) state.stamina = state.maxStamina;
    }

    // Log changed fields
    if (growthEntity) {
      for (let key of LOGGED_FIELDS) {
        if (state[key] != prev[key]) {
          this.logger.log("diff", {
            field: key,
            prev: isNaN(prev[key])
              ? prev[key]
              : parseFloat(prev[key].toFixed(2)),
            next: isNaN(state[key])
              ? state[key]
              : parseFloat(state[key].toFixed(2)),
          });
        }
      }
    }

    // Protect fresh stats from decrement
    if (!UNFRESH_PHASES.includes(state.phase)) {
      for (let key of EOT_DECREMENT_FIELDS) {
        if (state[key] > 0 && prev[key] == 0) {
          state.freshBuffs[key] = true;
        }
      }
    }

    // Trigger increase effects
    for (let key of INCREASE_TRIGGER_FIELDS) {
      if (state.phase == `${key}Increased`) continue;
      if (state[key] > prev[key]) {
        state = this._triggerEffectsForPhase(`${key}Increased`, state);
      }
    }

    // Trigger decrease effects
    for (let key of DECREASE_TRIGGER_FIELDS) {
      if (state.phase == `${key}Decreased`) continue;
      if (state[key] < prev[key]) {
        state = this._triggerEffectsForPhase(`${key}Decreased`, state);
      }
    }

    return state;
  }

  _executeAction(action, state, growthEntity) {
    const tokens = action.split(/([=!]?=|[<>]=?|[+\-*/%]=?|&)/);

    // Non-assignment actions
    if (tokens.length == 1) {
      if (tokens[0] == "drawCard") {
        state = this._drawCard(state);
      } else if (tokens[0].startsWith("setStance")) {
        state = this._setStance(state, tokens[0].match(/\(([^)]+)\)/)[1]);
      } else if (tokens[0].startsWith("setScoreBuff")) {
        state = this._setScoreBuff(
          state,
          ...tokens[0].match(/[\d\.]+/g).map(parseFloat)
        );
      } else if (tokens[0] == "upgradeHand") {
        state = this._upgradeHand(state);
      } else if (tokens[0] == "exchangeHand") {
        state = this._exchangeHand(state);
      } else if (tokens[0] == "addRandomUpgradedCardToHand") {
        state = this._addRandomUpgradedCardToHand(state);
      } else if (tokens[0] == "upgradeRandomCardInHand") {
        state = this._upgradeRandomCardInHand(state);
      } else if (tokens[0] == "holdThisCard") {
        state = this._holdThisCard(state);
      } else if (tokens[0] == "holdSelectedFromHand") {
        state = this._holdSelectedFromHand(state);
      } else if (tokens[0] == "holdSelectedFromDeckOrDiscards") {
        state = this._holdSelectedFromDeckOrDiscards(state);
      } else if (tokens[0] == "addHeldCardsToHand") {
        state = this._addHeldCardsToHand(state);
      }
      return state;
    }

    // Assignments
    const assignIndex = tokens.findIndex((t) => /[+\-*/%]?=/.test(t));
    if (assignIndex == 1) {
      let lhs = tokens[0];
      const op = tokens[1];
      const rhs = this._evaluateExpression(
        tokens.slice(assignIndex + 1),
        state
      );

      if (state.nullifyDebuff && DEBUFF_FIELDS.includes(lhs)) {
        state.nullifyDebuff--;
        return state;
      }

      if (lhs == "score" && op == "+=") lhs = "intermediateScore";
      else if (lhs == "genki" && op == "+=") lhs = "intermediateGenki";
      else if (lhs == "stamina" && op == "-=") lhs = "intermediateStamina";
      else if (lhs == "fullPowerCharge") lhs = "intermediateFullPowerCharge";

      if (op == "=") {
        state[lhs] = rhs;
      } else if (op == "+=") {
        state[lhs] += rhs;
      } else if (op == "-=") {
        state[lhs] -= rhs;
      } else if (op == "*=") {
        state[lhs] *= rhs;
      } else if (op == "/=") {
        state[lhs] /= rhs;
      } else if (op == "%=") {
        state[lhs] %= rhs;
      } else {
        console.warn("Unrecognized assignment operator", op);
      }

      const growth = state.growthByEntity?.[growthEntity] || {};

      if (lhs == "cost") {
        if (state.nullifyCostCards) {
          // pass
        } else {
          // Apply cost
          let cost = state.cost;
          if (growth["growth.cost"]) {
            cost += growth["growth.cost"];
          }

          if (state.stance.startsWith("strength")) {
            cost *= 2;
          } else if (state.stance == "preservation") {
            cost *= 0.5;
          } else if (state.stance == "preservation2") {
            cost *= 0.25;
          }
          if (state.halfCostTurns) {
            cost *= 0.5;
          }
          if (state.doubleCostTurns) {
            cost *= 2;
          }
          cost = Math.floor(cost);
          cost += state.costReduction;
          cost -= state.costIncrease;
          cost = Math.min(cost, 0);

          state.genki += cost;
          if (state.genki < 0) {
            state.stamina += state.genki;
            state.consumedStamina -= state.genki;
            state.genki = 0;
          }
        }
        state.cost = 0;
      } else if (lhs == "intermediateStamina") {
        if (state.nullifyCostCards) {
          // pass
        } else {
          let stamina = state.intermediateStamina;
          if (growth["growth.cost"]) {
            stamina += growth["growth.cost"];
          }

          if (state.stance.startsWith("strength")) {
            stamina *= 2;
          } else if (state.stance == "preservation") {
            stamina *= 0.5;
          } else if (state.stance == "preservation2") {
            stamina *= 0.25;
          }
          if (state.halfCostTurns) {
            stamina *= 0.5;
          }
          if (state.doubleCostTurns) {
            stamina *= 2;
          }
          stamina = Math.floor(stamina);
          if (stamina <= 0) {
            stamina += state.costReduction;
            stamina -= state.costIncrease;
            stamina = Math.min(stamina, 0);
          }

          state.stamina += stamina;
          if (stamina < 0) {
            state.consumedStamina -= stamina;
          }
        }
        state.intermediateStamina = 0;
      } else if (lhs == "intermediateScore") {
        let score = state.intermediateScore;
        if (growth["growth.score"]) {
          score += growth["growth.score"];
        }

        if (score > 0) {
          // Apply concentration
          score += state.concentration * state.concentrationMultiplier;

          // Apply enthusiasm
          score += state.enthusiasm;

          // Apply good and perfect condition
          if (state.goodConditionTurns) {
            score *=
              1.5 +
              (state.perfectConditionTurns
                ? state.goodConditionTurns * 0.1
                : 0);
          }

          // Apply stance
          if (state.stance == "strength") {
            score *= 2;
          } else if (state.stance == "strength2") {
            score *= 2.5;
          } else if (state.stance == "preservation") {
            score *= 0.5;
          } else if (state.stance == "preservation2") {
            score *= 0.25;
          } else if (state.stance == "fullPower") {
            score *= 3;
          }

          // Score buff effects
          score *= state.scoreBuffs.reduce((acc, cur) => acc + cur.amount, 1);

          // Apply poor condition
          if (state.poorConditionTurns) {
            score *= 0.67;
          }

          score = Math.ceil(score);

          // Turn type multiplier
          score *= this.idolConfig.typeMultipliers[state.turnType];
          score = Math.ceil(score);
        }

        state.score += score;
        state.intermediateScore = 0;
      } else if (lhs == "intermediateGenki") {
        // Apply genki
        let genki = state.intermediateGenki;

        // Apply motivation
        genki += state.motivation * state.motivationMultiplier;

        if (state.nullifyGenkiTurns) {
          genki = 0;
        }

        state.genki += genki;
        state.intermediateGenki = 0;
      } else if (lhs == "fixedGenki") {
        // Apply fixed genki
        state.genki += state.fixedGenki;
        state.fixedGenki = 0;
      } else if (lhs == "fixedStamina") {
        // Apply fixed stamina
        state.stamina += state.fixedStamina;
        if (state.fixedStamina < 0) {
          state.consumedStamina -= state.fixedStamina;
        }
        state.fixedStamina = 0;
      } else if (lhs == "intermediateFullPowerCharge") {
        const fullPowerCharge = state.intermediateFullPowerCharge;
        if (fullPowerCharge > 0) {
          state.cumulativeFullPowerCharge += fullPowerCharge;
        }
        state.fullPowerCharge += fullPowerCharge;
        state.intermediateFullPowerCharge = 0;
      }

      for (let key of WHOLE_FIELDS) {
        if (key in state) {
          state[key] = Math.ceil(state[key]);
        }
      }
    } else {
      console.warn("Invalid action", action);
    }

    return state;
  }
}
