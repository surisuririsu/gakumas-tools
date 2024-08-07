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
      stamina: this.idolConfig.parameters.stamina,
      fixedGenki: 0,
      genki: 0,
      cost: 0,
      intermediateScore: 0,
      score: 0,

      // Skill card piles
      deckCards: this.idolConfig.skillCards.slice().sort((a, b) => {
        if (a.forceInitialHand) return 1;
        if (b.forceInitialHand) return -1;
        return 0.5 - Math.random();
      }),
      handCards: [],
      discardedCards: [],
      removedCards: [],

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
      doubleCardEffectCards: 0,

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

    // Set p-item effects
    this.idolConfig.pItems.forEach((pItem) => {
      this._log("Setting p-item effects", pItem.name, pItem.effects);
      pItem.effects.forEach(
        (effect) => (nextState = this._setEffect(nextState, effect))
      );
    });

    nextState = this._triggerEffectsForPhase("startOfStage", nextState);

    nextState = this._startTurn(nextState);

    return nextState;
  }

  isCardUsable(state, card) {
    // Check conditions
    if (
      !card.conditions.every((condition) =>
        this._evaluateCondition(condition, state)
      )
    ) {
      return false;
    }

    // Check cost
    let previewState = { ...state };
    for (let cost of card.cost) {
      previewState = this._executeAction(cost, previewState);
    }
    for (let key in previewState) {
      if (previewState[key] != state[key] && previewState[key] < 0) {
        return false;
      }
    }

    return true;
  }

  useCard(state, card) {
    if (!state.started) {
      throw new Error("Stage not started!");
    }
    if (state.cardUsesRemaining < 1) {
      throw new Error("No card uses remaining!");
    }
    if (state.turnsRemaining < 1) {
      throw new Error("No turns remaining!");
    }
    const handIndex = state.handCards.findIndex((hc) => hc.id == card.id);
    if (handIndex == -1) {
      throw new Error("Card is not in hand!");
    }
    if (!this.isCardUsable(state, card)) {
      throw new Error("Card is not usable!");
    }

    let nextState = JSON.parse(JSON.stringify(state));

    this._log("Using card", card);

    // Apply card cost
    for (let cost of card.cost) {
      this._log("Applying cost", cost);
      nextState = this._executeAction(cost, nextState);
    }

    // Remove card from hand
    nextState.handCards.splice(handIndex, 1);
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
      nextState.removedCards.push(card);
    } else {
      nextState.discardedCards.push(card);
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

    // Discard hand
    state.discardedCards = state.discardedCards.concat(state.handCards);
    state.handCards = [];

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

    state.turnType = this.stageConfig.turnTypes[state.turnsElapsed];

    // Reduce effect turns
    state.goodConditionTurns = Math.max(state.goodConditionTurns - 1, 0);
    state.perfectConditionTurns = Math.max(state.perfectConditionTurns - 1, 0);
    state.goodImpressionTurns = Math.max(state.goodImpressionTurns - 1, 0);
    state.halfCostTurns = Math.max(state.halfCostTurns - 1, 0);
    state.doubleCostTurns = Math.max(state.doubleCostTurns - 1, 0);
    state.oneTurnScoreBuff = 0;

    // Draw cards
    for (let i = 0; i < 3; i++) {
      state = this._drawCard(state);
    }

    // Draw more cards if turn 1 and >3 forceInitialHand
    if (state.turnsElapsed == 0) {
      for (let i = 0; i < 2; i++) {
        if (this._peekDeck(state).forceInitialHand) {
          state = this._drawCard(state);
        }
      }
    }

    state.cardUsesRemaining = 1;
    state = this._triggerEffectsForPhase("startOfTurn", state);

    return state;
  }

  _peekDeck(state) {
    return state.deckCards[state.deckCards.length - 1];
  }

  _drawCard(state) {
    const card = state.deckCards.pop();
    state.handCards.push(card);
    this._log("Drew card", card.name);
    if (!state.deckCards.length) {
      state = this._recycleDiscards(state);
    }
    return state;
  }

  _recycleDiscards(state) {
    state.deckCards = state.discardedCards
      .slice()
      .sort(() => 0.5 - Math.random());
    state.discardedCards = [];
    this._log("Recycled discard pile");
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

    state = this._triggerEffects(state.effectsByPhase[phase], state);

    // Update remaining trigger limits
    for (let i of state.triggeredEffects) {
      if (state.effectsByPhase[phase][i].limit) {
        state.effectsByPhase[phase][i].limit--;
      }
    }
    state.triggeredEffects = [];

    return state;
  }

  _triggerEffects(effects, state) {
    let nextState = { ...state };

    let triggeredEffects = [];
    let skipNextEffect = false;
    for (let i in effects) {
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

      this._log("if", effect.conditions, "do", effect.actions);

      // Check conditions
      if (effect.conditions) {
        const satisfied = effect.conditions.every((condition) =>
          this._evaluateCondition(condition, state)
        );
        if (!satisfied) {
          if (!effect.actions) {
            skipNextEffect = true;
          }
          continue;
        }
      }

      // Execute actions
      if (effect.actions) {
        for (let action of effect.actions) {
          this._log("Executing action", action);
          nextState = this._executeAction(action, nextState);
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
    const tokens = condition.split(/([=!]?=|[<>]=?|[+\-*/%]|&)/);
    const result = this._evaluateExpression(tokens, state);
    this._log("Condition", condition, result);
    return result;
  }

  _evaluateExpression(tokens, state) {
    const variables = {
      ...state,
      isVocalTurn: this.stageConfig.turnTypes[state.turnsElapsed] == "vocal",
      isDanceTurn: this.stageConfig.turnTypes[state.turnsElapsed] == "dance",
      isVisualTurn: this.stageConfig.turnTypes[state.turnsElapsed] == "visual",
      cardEffects: state.cardUsed
        ? this.getCardEffectTypes(state.cardUsed)
        : [],
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
      const ampIndex = tokens.findIndex((t) => t == "&");
      if (ampIndex != -1) {
        if (tokens.length != 3) {
          console.warn("Invalid set contains");
        }
        const [lhs, rhs] = [tokens[0], tokens[2]];
        return variables[lhs].includes(rhs);
      }

      // Comparators (boolean operators)
      const cmpIndex = tokens.findIndex((t) => /[=!]=|[<>]=?/.test(t));
      if (cmpIndex != -1) {
        const [lhs, cmp, rhs] = [
          evaluate(tokens.slice(0, cmpIndex)),
          tokens[cmpIndex],
          evaluate(tokens.slice(cmpIndex + 1)),
        ];
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
        const [lhs, op, rhs] = [
          evaluate(tokens.slice(0, mdIndex)),
          tokens[mdIndex],
          evaluate(tokens.slice(mdIndex + 1)),
        ];
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
        const [lhs, op, rhs] = [
          evaluate(tokens.slice(0, asIndex)),
          tokens[asIndex],
          evaluate(tokens.slice(asIndex + 1)),
        ];
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
      // TODO
      return state;
    }

    // Assignments
    const assignIndex = tokens.findIndex((t) => /[+\-*/%]?=/.test(t));
    if (assignIndex == 1) {
      let [lhs, op, rhs] = [
        tokens.slice(0, assignIndex),
        tokens[assignIndex],
        this._evaluateExpression(tokens.slice(assignIndex + 1), state),
      ];

      if (lhs == "score") lhs = "intermediateScore";
      if (lhs == "genki") lhs = "intermediateGenki";

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

      // Apply cost
      if (lhs == "cost") {
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
      }

      // Apply score
      if (lhs == "intermediateScore") {
        let score = state.intermediateScore;

        // Apply concentration
        score += state.concentration * state.concentrationMultiplier;

        // Apply good and perfect condition
        if (state.goodConditionTurns) {
          score *= 1.5 + state.perfectConditionTurns * 0.1;
        }

        // Score buff effects
        score *= 1 + state.oneTurnScoreBuff + state.permanentScoreBuff;
        score = Math.ceil(score);

        // Turn type multiplier
        score *= this.idolConfig.typeMultipliers[state.turnType];
        score = Math.ceil(score);

        state.score += score;
        state.intermediateScore = 0;
      }

      // Apply genki
      if (lhs == "intermediateGenki") {
        let genki = state.intermediateGenki;

        // Apply motivation
        genki += state.motivation;

        state.genki = genki;
        state.intermediateGenki = 0;
      }

      // Apply fixed genki
      if (lhs == "fixedGenki") {
        state.genki += state.fixedGenki;
        state.fixedGenki = 0;
      }
    } else {
      console.warn("Invalid action", action);
    }

    return state;
  }

  _log(...args) {
    if (this.loggingEnabled) {
      console.log(...args);
    }
  }
}
