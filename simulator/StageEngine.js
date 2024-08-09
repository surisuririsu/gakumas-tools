import { PItems, SkillCards } from "gakumas-data";

const COST_FIELDS = [
  "stamina",
  "goodConditionTurns",
  "concentration",
  "goodImpressionTurns",
  "motivation",
];

const DEBUFF_FIELDS = ["doubleCostTurns", "nullifyGenkiTurns"];

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

const KEYS_WITH_TRIGGERS = [
  ...new Set(
    EOT_DECREMENT_FIELDS.concat(
      INCREASE_TRIGGER_FIELDS,
      DECREASE_TRIGGER_FIELDS
    )
  ),
];

export default class StageEngine {
  constructor(stageConfig, idolConfig) {
    this.stageConfig = stageConfig;
    this.idolConfig = idolConfig;
    this.loggingEnabled = false;
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

    let nextState = { ...state };

    this._log("Starting stage...");

    nextState.started = true;

    // Set default effects
    nextState = this._setEffect(nextState, {
      phase: "endOfTurn",
      conditions: ["goodImpressionTurns>=1"],
      actions: ["score+=goodImpressionTurns"],
    });

    // Set stage effects
    this._log("Setting stage effects", this.stageConfig.effects);
    for (let i = 0; i < this.stageConfig.effects.length; i++) {
      nextState = this._setEffect(nextState, this.stageConfig.effects[i]);
    }

    // Set p-item effects
    for (let i = 0; i < this.idolConfig.pItemIds.length; i++) {
      const pItem = PItems.getById(this.idolConfig.pItemIds[i]);
      this._log("Setting p-item effects", pItem.name, pItem.effects);
      for (let j = 0; j < pItem.effects.length; j++) {
        nextState = this._setEffect(nextState, pItem.effects[j]);
      }
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
    for (let i = 0; i < card.cost.length; i++) {
      previewState = this._executeAction(card.cost[i], previewState);
    }
    for (let i = 0; i < COST_FIELDS.length; i++) {
      if (previewState[COST_FIELDS[i]] < 0) {
        return false;
      }
    }

    return true;
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

    this._log("Using card", card);

    // Apply card cost
    for (let i = 0; i < card.cost.length; i++) {
      this._log("Applying cost", card.cost[i]);
      nextState = this._executeAction(card.cost[i], nextState);
    }

    // Remove card from hand
    nextState.handCardIds.splice(handIndex, 1);
    nextState.cardUsesRemaining -= 1;

    // Set usedCard variables
    nextState.usedCardId = card.upgraded ? card.id - 1 : card.id;

    // Trigger events on card used
    nextState = this._triggerEffectsForPhase("cardUsed", nextState);
    if (card.type == "active") {
      nextState = this._triggerEffectsForPhase("activeCardUsed", nextState);
    } else if (card.type == "mental") {
      nextState = this._triggerEffectsForPhase("mentalCardUsed", nextState);
    }

    // Apply card effects
    nextState = this._triggerEffects(card.effects, nextState);
    if (nextState.doubleCardEffectCards) {
      nextState.doubleCardEffectCards--;
      nextState = this._triggerEffects(card.effects, nextState);
    }
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
    const effectPhases = Object.keys(state.effectsByPhase);
    for (let i = 0; i < effectPhases.length; i++) {
      const phase = effectPhases[i];
      const effects = state.effectsByPhase[phase];
      for (let j = 0; j < effects.length; j++) {
        if (effects[j].ttl == null) continue;
        effects[j].ttl = Math.max(effects[j].ttl - 1, -1);
      }
    }

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
    this._log("Starting turn", state.turnsElapsed + 1);

    state.turnType =
      this.stageConfig.turnTypes[
        Math.min(state.turnsElapsed, this.stageConfig.turnCount - 1)
      ];

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
    this._log("Drew card", SkillCards.getById(cardId).name);
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
    this._log("Recycled discard pile");
    return state;
  }

  _upgradeHand(state) {
    for (let i = 0; i < state.handCardIds.length; i++) {
      const card = SkillCards.getById(state.handCardIds[i]);
      if (!card.upgraded && card.type != "trouble") {
        state.handCardIds[i] += 1;
      }
    }
    return state;
  }

  _exchangeHand(state) {
    const numCards = state.handCardIds.length;
    state.discardedCardIds = state.discardedCardIds.concat(state.handCardIds);
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
    return state;
  }

  _setEffect(state, effect) {
    if (!state.effectsByPhase[effect.phase]) {
      state.effectsByPhase[effect.phase] = [];
    }
    state.effectsByPhase[effect.phase].push({ ...effect, phase: null });
    return state;
  }

  _triggerEffectsForPhase(phase, state) {
    if (!state.effectsByPhase[phase]?.length) return state;

    this._log(`Triggering effects for ${phase}`);

    state.phase = phase;
    state = this._triggerEffects(state.effectsByPhase[phase], state);
    state.phase = null;

    // Update remaining trigger limits
    for (let i = 0; i < state.triggeredEffects.length; i++) {
      const triggeredEffectIndex = state.triggeredEffects[i];
      if (state.effectsByPhase[phase][triggeredEffectIndex].limit) {
        state.effectsByPhase[phase][triggeredEffectIndex].limit--;
      }
    }
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
        nextState = this._setEffect(nextState, effect);
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

      this._log("if", effect.conditions, "do", effect.actions);

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
        for (let j = 0; j < effect.actions.length; j++) {
          this._log("Executing action", effect.actions[j]);
          nextState = this._executeAction(effect.actions[j], nextState);
          if (nextState.stamina < 0) nextState.stamina = 0;
        }

        // Reset modifiers
        nextState.concentrationMultiplier = 1;
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
    this._log("Condition", condition, result);
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
      if (lhs == "score") lhs = "intermediateScore";
      if (lhs == "genki") lhs = "intermediateGenki";
      if (lhs == "stamina") lhs = "intermediateStamina";

      let prev = {};
      for (let i = 0; i < KEYS_WITH_TRIGGERS.length; i++) {
        prev[KEYS_WITH_TRIGGERS[i]] = state[KEYS_WITH_TRIGGERS[i]];
      }

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
        cost -= state.costReduction;
        cost = Math.min(cost, 0);

        state.genki += cost;
        state.cost = 0;
        if (state.genki < 0) {
          state.stamina += state.genki;
          state.genki = 0;
        }
      } else if (lhs == "stamina") {
        let stamina = state.intermediateStamina;
        if (state.doubleCostTurns && stamina < state.stamina) {
          stamina -= state.stamina - stamina;
        }
        state.stamina = stamina;
      } else if (lhs == "intermediateScore") {
        state.score += this._calculateTrueScore(
          state.intermediateScore,
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

        state.genki = genki;
        state.intermediateGenki = 0;
      } else if (lhs == "fixedGenki") {
        // Apply fixed genki
        state.genki += state.fixedGenki;
        state.fixedGenki = 0;
      }

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
    } else {
      console.warn("Invalid action", action);
    }

    return state;
  }

  _calculateTrueScore(score, state, typeMultiplier) {
    // Apply score
    let trueScore = score;

    // Apply concentration
    trueScore += state.concentration * state.concentrationMultiplier;

    // Apply good and perfect condition
    if (state.goodConditionTurns) {
      trueScore *= 1.5 + state.perfectConditionTurns * 0.1;
    }

    // Score buff effects
    trueScore *= 1 + state.oneTurnScoreBuff + state.permanentScoreBuff;
    trueScore = Math.ceil(trueScore);

    // Turn type multiplier
    trueScore *= typeMultiplier;
    trueScore = Math.ceil(trueScore);

    return trueScore;
  }

  _log(...args) {
    if (this.loggingEnabled) {
      console.log(...args);
    }
  }
}
