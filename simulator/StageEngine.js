import { PItems, SkillCards } from "gakumas-data";

const COST_FIELDS = [
  "stamina",
  "goodConditionTurns",
  "concentration",
  "goodImpressionTurns",
  "motivation",
];

export const DEBUFF_FIELDS = ["doubleCostTurns", "nullifyGenkiTurns"];

const EOT_DECREMENT_FIELDS = [
  "goodConditionTurns",
  "perfectConditionTurns",
  "goodImpressionTurns",
  "halfCostTurns",
  "doubleCostTurns",
  "nullifyGenkiTurns",
];

const INCREASE_TRIGGER_FIELDS = [
  "goodImpressionTurns",
  "motivation",
  "goodConditionTurns",
  "concentration",
];

const DECREASE_TRIGGER_FIELDS = ["stamina"];

const LOGGED_FIELDS = [
  "turnsRemaining",
  "cardUsesRemaining",
  "stamina",
  "genki",
  "score",
  "goodConditionTurns",
  "perfectConditionTurns",
  "concentration",
  "goodImpressionTurns",
  "motivation",
  "oneTurnScoreBuff",
  "permanentScoreBuff",
  "halfCostTurns",
  "doubleCostTurns",
  "costReduction",
  "doubleCardEffectCards",
  "nullifyGenkiTurns",
];

const KEYS_TO_DIFF = [
  ...new Set(
    LOGGED_FIELDS.concat(
      INCREASE_TRIGGER_FIELDS,
      DECREASE_TRIGGER_FIELDS,
      EOT_DECREMENT_FIELDS
    )
  ),
];

const WHOLE_FIELDS = [
  "stamina",
  "genki",
  "goodConditionTurns",
  "perfectConditionTurns",
  "concentration",
  "goodImpressionTurns",
  "motivation",
];

export default class StageEngine {
  constructor(stageConfig, idolConfig, logger) {
    this.stageConfig = stageConfig;
    this.idolConfig = idolConfig;
    this.logger = logger;
  }

  getInitialState() {
    return {
      started: false,

      // General
      turnsElapsed: 0,
      turnsRemaining: this.stageConfig.turnCount,
      cardUsesRemaining: 0,
      maxStamina: this.idolConfig.parameters.stamina,
      stamina: this.idolConfig.parameters.stamina,
      fixedGenki: 0,
      intermediateGenki: 0,
      genki: 0,
      cost: 0,
      intermediateScore: 0,
      score: 0,
      clearRatio: 0,

      // Skill card piles
      deckCardIds: this.idolConfig.skillCardIds.slice().sort((a, b) => {
        if (SkillCards.getById(a).forceInitialHand) return 1;
        if (SkillCards.getById(b).forceInitialHand) return -1;
        return 0.5 - Math.random();
      }),
      handCardIds: [],
      discardedCardIds: [],
      removedCardIds: [],
      cardsUsed: 0,

      // Phase effects
      effectsByPhase: {},
      effects: [],

      // Buffs and debuffs
      goodConditionTurns: 0,
      perfectConditionTurns: 0,
      concentration: 0,
      goodImpressionTurns: 0,
      motivation: 0,
      oneTurnScoreBuff: 0,
      permanentScoreBuff: 0,
      halfCostTurns: 0,
      doubleCostTurns: 0,
      costReduction: 0,
      doubleCardEffectCards: 0,
      nullifyGenkiTurns: 0,

      // Used card
      usedCardId: null,
      cardEffects: [],

      // Buffs/debuffs protected from decrement when fresh
      freshBuffs: {},

      // Effect modifiers
      concentrationMultiplier: 1,
    };
  }

  startStage(state) {
    if (state.started) {
      throw new Error("Stage already started!");
    }

    this.logger.clear();

    let nextState = { ...state };

    nextState.started = true;

    // Set stage effects
    this.logger.debug("Setting stage effects", this.stageConfig.effects);
    this.stageConfig.effects.forEach((effect) => {
      nextState = this._setEffect(nextState, "stage", null, effect);
    });

    // Set p-item effects
    for (let i = 0; i < this.idolConfig.pItemIds.length; i++) {
      const pItem = PItems.getById(this.idolConfig.pItemIds[i]);
      this.logger.debug("Setting p-item effects", pItem.name, pItem.effects);
      pItem.effects.forEach((effect) => {
        nextState = this._setEffect(nextState, "pItem", pItem.id, effect);
      });
    }

    nextState = this._triggerEffectsForPhase("startOfStage", nextState);

    nextState = this._startTurn(nextState);

    return nextState;
  }

  isCardUsable(state, cardId) {
    const card = SkillCards.getById(cardId);

    // Check conditions
    for (let i = 0; i < card.conditions.length; i++) {
      if (!this._evaluateCondition(card.conditions[i], state)) {
        return false;
      }
    }

    // Check cost
    let previewState = { ...state };
    card.cost.forEach((cost) => {
      previewState = this._executeAction(cost, previewState);
    });
    return !COST_FIELDS.some((field) => previewState[field] < 0);
  }

  useCard(state, cardId) {
    if (!state.started) {
      throw new Error("Stage not started!");
    }
    if (state.cardUsesRemaining < 1) {
      throw new Error("No card uses remaining!");
    }
    if (state.turnsRemaining < 1) {
      throw new Error("No turns remaining!");
    }
    const handIndex = state.handCardIds.indexOf(cardId);
    if (handIndex == -1) {
      throw new Error("Card is not in hand!");
    }
    if (!this.isCardUsable(state, cardId)) {
      throw new Error("Card is not usable!");
    }

    const card = SkillCards.getById(cardId);

    let nextState = JSON.parse(JSON.stringify(state));

    this.logger.debug("Using card", cardId, card.name);
    this.logger.log("entityStart", { type: "skillCard", id: cardId });

    // Set usedCard variables
    nextState.usedCardId = card.upgraded ? card.id - 1 : card.id;
    nextState.cardEffects = this._getCardEffects(card);

    // Apply card cost
    this.logger.debug("Applying cost", card.cost);
    nextState = this._executeActions(card.cost, nextState);

    // Remove card from hand
    nextState.handCardIds.splice(handIndex, 1);
    nextState.cardUsesRemaining -= 1;

    // Trigger events on card used
    nextState = this._triggerEffectsForPhase("cardUsed", nextState);
    if (card.type == "active") {
      nextState = this._triggerEffectsForPhase("activeCardUsed", nextState);
    } else if (card.type == "mental") {
      nextState = this._triggerEffectsForPhase("mentalCardUsed", nextState);
    }

    // Apply card effects
    if (nextState.doubleCardEffectCards) {
      nextState.doubleCardEffectCards--;
      nextState = this._triggerEffects(card.effects, nextState);
    }
    nextState = this._triggerEffects(card.effects, nextState);

    nextState.cardsUsed++;

    // Trigger events after card used
    nextState = this._triggerEffectsForPhase("afterCardUsed", nextState);
    if (card.type == "active") {
      nextState = this._triggerEffectsForPhase(
        "afterActiveCardUsed",
        nextState
      );
    } else if (card.type == "mental") {
      nextState = this._triggerEffectsForPhase(
        "afterMentalCardUsed",
        nextState
      );
    }

    // Reset usedCard variables
    nextState.usedCardId = null;
    nextState.cardEffects = [];

    this.logger.log("entityEnd", { type: "skillCard", id: cardId });

    // Send card to discards or remove
    if (card.limit) {
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
    if (!state.started) {
      throw new Error("Stage not started!");
    }
    if (state.turnsRemaining < 1) {
      throw new Error("No turns remaining!");
    }

    // Recover stamina if turn ended by player
    if (state.cardUsesRemaining > 0) {
      state.stamina = Math.min(
        state.stamina + 2,
        this.idolConfig.parameters.stamina
      );
    }

    state = this._triggerEffectsForPhase("endOfTurn", state);

    // Default effects
    state = this._triggerEffects(
      [
        {
          conditions: ["goodImpressionTurns>=1"],
          actions: ["score+=goodImpressionTurns"],
          sourceType: "default",
          sourceId: "好印象",
        },
      ],
      state
    );

    // Reduce buff turns
    for (let i = 0; i < EOT_DECREMENT_FIELDS.length; i++) {
      const key = EOT_DECREMENT_FIELDS[i];
      if (state.freshBuffs[key]) {
        delete state.freshBuffs[key];
      } else {
        state[key] = Math.max(state[key] - 1, 0);
      }
    }

    // Reset one turn buffs
    state.oneTurnScoreBuff = 0;

    // Decrement effect ttl and expire
    state.effects.forEach((effect) => {
      if (effect.ttl == null) return;
      effect.ttl = Math.max(effect.ttl - 1, -1);
    });

    // Discard hand
    state.discardedCardIds = state.discardedCardIds.concat(state.handCardIds);
    state.handCardIds = [];

    state.turnsElapsed += 1;
    state.turnsRemaining -= 1;

    // Start next turn
    if (state.turnsRemaining > 0) {
      state = this._startTurn(state);
    }

    return state;
  }

  _startTurn(state) {
    this.logger.debug("Starting turn", state.turnsElapsed + 1);

    state.turnType =
      this.stageConfig.turnTypes[
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

    return state;
  }

  _peekDeck(state) {
    return state.deckCardIds[state.deckCardIds.length - 1];
  }

  _drawCard(state) {
    const cardId = state.deckCardIds.pop();
    state.handCardIds.push(cardId);
    this.logger.debug("Drew card", SkillCards.getById(cardId).name);
    this.logger.log("drawCard", { type: "skillCard", id: cardId });
    if (!state.deckCardIds.length) {
      state = this._recycleDiscards(state);
    }
    return state;
  }

  _recycleDiscards(state) {
    state.deckCardIds = state.discardedCardIds
      .slice()
      .sort(() => 0.5 - Math.random());
    state.discardedCardIds = [];
    this.logger.debug("Recycled discard pile");
    return state;
  }

  _upgradeHand(state) {
    for (let i = 0; i < state.handCardIds.length; i++) {
      const card = SkillCards.getById(state.handCardIds[i]);
      if (!card.upgraded && card.type != "trouble") {
        state.handCardIds[i] += 1;
      }
    }
    this.logger.log("upgradeHand");
    return state;
  }

  _exchangeHand(state) {
    const numCards = state.handCardIds.length;
    state.discardedCardIds = state.discardedCardIds.concat(state.handCardIds);
    for (let i = 0; i < numCards; i++) {
      state = this._drawCard(state);
    }
    this.logger.log("exchangeHand");
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

  _getCardEffects(card) {
    let cardEffects = [];
    for (let effect of card.effects) {
      for (let action of effect.actions) {
        const tokens = action.split(/([=!]?=|[<>]=?|[+\-*/%]=?|&)/);
        if (tokens.length && tokens[0].length) {
          cardEffects.push(tokens[0]);
        }
      }
    }
    return cardEffects;
  }

  _setEffect(state, sourceType, sourceId, effect) {
    state.effects.push({ ...effect, sourceType, sourceId });
    return state;
  }

  _triggerEffectsForPhase(phase, state) {
    state.phase = phase;

    let phaseEffects = [];
    for (let i = 0; i < state.effects.length; i++) {
      const effect = state.effects[i];
      if (effect.phase != phase) continue;
      phaseEffects.push({ ...effect, phase: null, index: i });
    }

    this.logger.debug(phase, phaseEffects);

    state = this._triggerEffects(phaseEffects, state);

    state.phase = null;

    state.triggeredEffects.forEach((idx) => {
      const effectIndex = phaseEffects[idx].index;
      if (state.effects[effectIndex].limit) {
        state.effects[effectIndex].limit--;
      }
    });
    state.triggeredEffects = [];

    return state;
  }

  _triggerEffects(effects, state) {
    let nextState = { ...state };

    let triggeredEffects = [];
    let skipNextEffect = false;
    for (let i = 0; i < effects.length; i++) {
      const effect = effects[i];

      // Skip effect if condition is not satisfied
      if (skipNextEffect) {
        skipNextEffect = false;
        continue;
      }

      if (effect.phase) {
        nextState = this._setEffect(
          nextState,
          nextState.usedCardId ? "skillCardEffect" : null,
          nextState.usedCardId,
          effect
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
        for (let j = 0; j < effect.conditions.length; j++) {
          if (!this._evaluateCondition(effect.conditions[j], state)) {
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

      // Execute actions
      if (effect.actions) {
        this.logger.debug("Executing actions", effect.actions);
        if (effect.sourceType) {
          this.logger.log("entityStart", {
            type: effect.sourceType,
            id: effect.sourceId,
          });
        }

        nextState = this._executeActions(effect.actions, nextState);

        // Reset modifiers
        nextState.concentrationMultiplier = 1;

        if (effect.sourceType) {
          this.logger.log("entityEnd", {
            type: effect.sourceType,
            id: effect.sourceId,
          });
        }
      }

      triggeredEffects.push(i);
    }

    nextState.triggeredEffects = triggeredEffects;

    return nextState;
  }

  _evaluateCondition(condition, state) {
    const result = this._evaluateExpression(
      condition.split(/([=!]?=|[<>]=?|[+\-*/%]|&)/),
      state
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
    };

    function evaluate(tokens) {
      if (tokens.length == 1) {
        // Numeric constants
        if (/^-?[\d]+(\.\d+)?$/.test(tokens[0])) {
          return parseFloat(tokens[0]);
        }

        // Variables
        return variables[tokens[0]];
      }

      // Set contains
      if (tokens.findIndex((t) => t == "&") != -1) {
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

      // Add, subtract
      const asIndex = tokens.findIndex((t) => /[+\-]/.test(t));
      if (asIndex != -1) {
        const lhs = evaluate(tokens.slice(0, asIndex));
        const op = tokens[asIndex];
        const rhs = evaluate(tokens.slice(asIndex + 1));

        if (op == "+") {
          return lhs + rhs;
        } else if (op == "i") {
          return lhs - rhs;
        }
        console.warn("Unrecognized operator", op);
      }
    }

    return evaluate(tokens);
  }

  _executeActions(actions, state) {
    let prev = {};
    for (let i = 0; i < KEYS_TO_DIFF.length; i++) {
      prev[KEYS_TO_DIFF[i]] = state[KEYS_TO_DIFF[i]];
    }

    actions.forEach((action) => {
      state = this._executeAction(action, state);
      if (state.stamina < 0) state.stamina = 0;
    });

    // Log changed fields
    LOGGED_FIELDS.forEach((key) => {
      if (state[key] != prev[key]) {
        this.logger.log("diff", {
          field: key,
          prev: parseFloat(prev[key].toFixed(2)),
          next: parseFloat(state[key].toFixed(2)),
        });
      }
    });

    // Protect fresh stats from decrement
    for (let i = 0; i < EOT_DECREMENT_FIELDS.length; i++) {
      const key = EOT_DECREMENT_FIELDS[i];
      if (state[key] > 0 && prev[key] == 0) {
        state.freshBuffs[key] = true;
      }
    }

    // Trigger increase effects
    for (let i = 0; i < INCREASE_TRIGGER_FIELDS.length; i++) {
      const key = INCREASE_TRIGGER_FIELDS[i];
      if (state.phase == `${key}Increased`) continue;
      if (state[key] > prev[key]) {
        state = this._triggerEffectsForPhase(`${key}Increased`, state);
      }
    }

    // Trigger decrease effects
    for (let i = 0; i < DECREASE_TRIGGER_FIELDS.length; i++) {
      const key = DECREASE_TRIGGER_FIELDS[i];
      if (state.phase == `${key}Increased`) continue;
      if (state[key] > prev[key]) {
        state = this._triggerEffectsForPhase(`${key}Increased`, state);
      }
    }

    return state;
  }

  _executeAction(action, state) {
    const tokens = action.split(/([=!]?=|[<>]=?|[+\-*/%]=?|&)/);

    // Non-assignment actions
    if (tokens.length == 1) {
      if (tokens[0] == "drawCard") {
        state = this._drawCard(state);
      } else if (tokens[0] == "upgradeHand") {
        state = this._upgradeHand(state);
      } else if (tokens[0] == "exchangeHand") {
        state = this._exchangeHand(state);
      } else if (tokens[0] == "addRandomUpgradedCardToHand") {
        state = this._addRandomUpgradedCardToHand(state);
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
      if (lhs == "genki" && op == "+=") lhs = "intermediateGenki";
      if (lhs == "stamina" && op == "-=") lhs = "intermediateStamina";

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

      if (lhs == "cost") {
        // Apply cost
        let cost = state.cost;
        if (state.halfCostTurns) {
          cost *= 0.5;
        }
        if (state.doubleCostTurns) {
          cost *= 2;
        }
        cost = Math.ceil(cost);
        cost += state.costReduction;
        cost = Math.min(cost, 0);

        state.genki += cost;
        state.cost = 0;
        if (state.genki < 0) {
          state.stamina += state.genki;
          state.genki = 0;
        }
      } else if (lhs == "stamina") {
        let stamina = state.intermediateStamina;
        if (state.halfCostTurns) {
          stamina *= 0.5;
        }
        if (state.doubleCostTurns) {
          stamina *= 2;
        }
        state.stamina += stamina;
      } else if (lhs == "intermediateScore") {
        let score = state.intermediateScore;
        // Apply concentration
        score += state.concentration * state.concentrationMultiplier;

        // Apply good and perfect condition
        if (state.goodConditionTurns) {
          score *= 1.5 + state.perfectConditionTurns * 0.1;
        }

        state.score += this._calculateTrueScore(
          score,
          state,
          this.idolConfig.typeMultipliers[state.turnType]
        );
        state.intermediateScore = 0;
      } else if (lhs == "intermediateGenki") {
        // Apply genki
        let genki = state.intermediateGenki;

        // Apply motivation
        genki += state.motivation;

        if (state.nullifyGenkiTurns) {
          genki = 0;
        }

        state.genki += genki;
        state.intermediateGenki = 0;
      } else if (lhs == "fixedGenki") {
        // Apply fixed genki
        state.genki += state.fixedGenki;
        state.fixedGenki = 0;
      }

      for (let key of WHOLE_FIELDS) {
        state[key] = Math.round(state[key]);
      }
    } else {
      console.warn("Invalid action", action);
    }

    return state;
  }

  _calculateTrueScore(score, state, typeMultiplier) {
    // Apply score
    let trueScore = score;

    // Score buff effects
    trueScore *= 1 + state.oneTurnScoreBuff + state.permanentScoreBuff;
    trueScore = Math.ceil(trueScore);

    // Turn type multiplier
    trueScore *= typeMultiplier;
    trueScore = Math.ceil(trueScore);

    return trueScore;
  }
}
