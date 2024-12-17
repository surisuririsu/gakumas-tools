import {
  UNFRESH_PHASES,
  WHOLE_FIELDS,
  ASSIGNMENT_OPERATORS,
  DEBUFF_FIELDS,
  DECREASE_TRIGGER_FIELDS,
  EOT_DECREMENT_FIELDS,
  FIELDS_TO_DIFF,
  FUNCTION_CALL_REGEX,
  INCREASE_TRIGGER_FIELDS,
  LOGGED_FIELDS,
  S,
} from "../constants";
import EngineComponent from "./EngineComponent";
import { formatDiffField } from "./utils";

export default class Executor extends EngineComponent {
  constructor(engine) {
    super(engine);

    this.specialActions = {
      // Cards
      drawCard: (state) => engine.cardManager.drawCard(state),
      upgradeHand: (state) => engine.cardManager.upgradeHand(state),
      exchangeHand: (state) => engine.cardManager.exchangeHand(state),
      upgradeRandomCardInHand: (state) =>
        engine.cardManager.upgradeRandomCardInHand(state),
      addRandomUpgradedCardToHand: (state) =>
        engine.cardManager.addRandomUpgradedCardToHand(state),
      holdCard: (state, cardBaseId) =>
        engine.cardManager.holdCard(state, parseInt(cardBaseId, 10)),
      holdThisCard: (state) => engine.cardManager.holdThisCard(state),
      holdSelectedFromHand: (state) =>
        engine.cardManager.holdSelectedFromHand(state),
      holdSelectedFromDeckOrDiscards: (state) =>
        engine.cardManager.holdSelectedFromDeckOrDiscards(state),
      addHeldCardsToHand: (state) =>
        engine.cardManager.addHeldCardsToHand(state),

      // Buffs
      setScoreBuff: (state, amount, turns) =>
        engine.buffManager.setScoreBuff(
          state,
          parseFloat(amount),
          parseInt(turns, 10)
        ),
      setStance: (state, stance) => engine.buffManager.setStance(state, stance),
    };

    this.intermediateResolvers = {
      cost: (...args) => this.resolveCost(...args),
      fixedGenki: (...args) => this.resolveFixedGenki(...args),
      fixedStamina: (...args) => this.resolveFixedStamina(...args),
      score: (...args) => this.resolveScore(...args),
      genki: (...args) => this.resolveGenki(...args),
      stamina: (...args) => this.resolveStamina(...args),
      fullPowerCharge: (...args) => this.resolveFullPowerCharge(...args),
    };
  }

  executeGrowthActions(growth, actions) {
    for (let i = 0; i < actions.length; i++) {
      this.executeAction(growth, actions[i]);
    }
  }

  executeActions(state, actions, card) {
    // Record previous state for diffing
    let prev = {};
    for (let i = 0; i < FIELDS_TO_DIFF.length; i++) {
      prev[S[FIELDS_TO_DIFF[i]]] = state[S[FIELDS_TO_DIFF[i]]];
    }

    // Set modifiers
    const prevConcentrationMultiplier = state[S.concentrationMultiplier];
    const prevMotivationMultiplier = state[S.motivationMultiplier];
    state[S.concentrationMultiplier] = 1;
    state[S.motivationMultiplier] = 1;

    // Execute actions
    const scoreTimes = state[S.cardMap][card]?.growth?.["growth.scoreTimes"];
    for (let i = 0; i < actions.length; i++) {
      this.executeAction(state, actions[i], card);

      if (scoreTimes) {
        const tokens = actions[i];
        if (tokens?.[0] == "score") {
          for (let i = 0; i < scoreTimes; i++) {
            this.executeAction(state, actions[i], card);
          }
        }
      }

      if (state[S.stamina] < 0)
        // Clamp stamina
        state[S.stamina] = 0;
      if (state[S.stamina] > this.config.idol.params.stamina) {
        state[S.stamina] = this.config.idol.params.stamina;
      }
    }

    // Reset modifiers
    state[S.concentrationMultiplier] = prevConcentrationMultiplier;
    state[S.motivationMultiplier] = prevMotivationMultiplier;

    // Log changed fields
    for (let i = 0; i < LOGGED_FIELDS.length; i++) {
      const field = LOGGED_FIELDS[i];
      if (state[S[field]] == prev[S[field]]) continue;
      this.logger.log("diff", {
        field,
        prev: formatDiffField(prev[S[field]]),
        next: formatDiffField(state[S[field]]),
      });
    }

    // Protect fresh stats from decrement
    if (!UNFRESH_PHASES.includes(state[S.phase])) {
      for (let i = 0; i < EOT_DECREMENT_FIELDS.length; i++) {
        const field = EOT_DECREMENT_FIELDS[i];
        if (state[S[field]] > 0 && prev[S[field]] == 0) {
          state[S.freshBuffs][field] = true;
        }
      }
    }

    // Trigger increase effects
    for (let i = 0; i < INCREASE_TRIGGER_FIELDS.length; i++) {
      const field = INCREASE_TRIGGER_FIELDS[i];
      if (state[S.phase] == `${field}Increased`) continue;
      if (state[S[field]] > prev[S[field]]) {
        this.engine.effectManager.triggerEffectsForPhase(
          state,
          `${field}Increased`
        );
      }
    }

    // Trigger decrease effects
    for (let i = 0; i < DECREASE_TRIGGER_FIELDS.length; i++) {
      const field = DECREASE_TRIGGER_FIELDS[i];
      if (state[S.phase] == `${field}Decreased`) continue;
      if (state[S[field]] < prev[S[field]]) {
        this.engine.effectManager.triggerEffectsForPhase(
          state,
          `${field}Decreased`
        );
      }
    }
  }

  executeAction(state, action, card) {
    const tokens = action;

    // Special actions
    if (tokens.length == 1) {
      this.executeSpecialAction(state, tokens[0]);
      return;
    }

    // Assignments
    if (ASSIGNMENT_OPERATORS.includes(tokens[1])) {
      const lhs = tokens[0];

      // Nullify debuffs
      if (state[S.nullifyDebuff] && DEBUFF_FIELDS.includes(lhs)) {
        state[S.nullifyDebuff]--;
        return;
      }

      const op = tokens[1];
      const rhs = this.engine.evaluator.evaluateExpression(
        state,
        tokens.slice(2)
      );

      let intermediate = state[S[lhs]] || 0;

      // Special cases with intermediates
      let intermediateField = null;
      if (
        ["cost", "fixedGenki", "fixedStamina"].includes(lhs) ||
        (lhs == "score" && op == "+=") ||
        (lhs == "genki" && op == "+=") ||
        (lhs == "stamina" && op == "-=")
      ) {
        intermediate = 0;
        intermediateField = lhs;
      }

      // Execute operation
      if (op == "=") {
        intermediate = rhs;
      } else if (op == "+=") {
        intermediate += rhs;
      } else if (op == "-=") {
        intermediate -= rhs;
      } else if (op == "*=") {
        intermediate *= rhs;
      } else if (op == "/=") {
        intermediate /= rhs;
      } else if (op == "%=") {
        intermediate %= rhs;
      } else {
        console.warn(`Unrecognized assignment operator: ${op}`);
      }

      // Resolve intermediate
      if (intermediateField) {
        const growth = state[S.cardMap][card]?.growth || {};
        if (intermediateField in this.intermediateResolvers) {
          this.intermediateResolvers[intermediateField](
            state,
            intermediate,
            growth
          );
        } else {
          console.warn(`Unresolved intermediate: ${intermediateField}`);
        }
      } else {
        state[S[lhs]] = intermediate;
      }

      // Round whole fields
      for (let i = 0; i < WHOLE_FIELDS.length; i++) {
        state[S[WHOLE_FIELDS[i]]] = Math.ceil(state[S[WHOLE_FIELDS[i]]]);
      }

      return;
    }

    console.warn(`Invalid action: ${action}`);
  }

  executeSpecialAction(state, action) {
    if (action in this.specialActions) {
      this.specialActions[action](state);
      return;
    }

    const match = action.match(FUNCTION_CALL_REGEX);
    if (match[1] in this.specialActions) {
      this.specialActions[match[1]](state, ...match[2].split(","));
      return;
    }

    console.warn(`Unrecognized special action: ${action}`);
  }

  resolveCost(state, cost, growth) {
    // Nullify cost
    if (state[S.nullifyCostCards]) return;

    if (growth[S["growth.cost"]]) {
      cost += growth[S["growth.cost"]];
    }

    // Apply stance
    if (state[S.stance].startsWith("strength")) {
      cost *= 2;
    } else if (state[S.stance] == "preservation") {
      cost *= 0.5;
    } else if (state[S.stance] == "preservation2") {
      cost *= 0.25;
    }

    // Multiplicative cost buffs
    if (state[S.halfCostTurns]) {
      cost *= 0.5;
    }
    if (state[S.doubleCostTurns]) {
      cost *= 2;
    }

    // Round
    cost = Math.floor(cost);

    // Additive cost buffs
    cost += state[S.costReduction];
    cost -= state[S.costIncrease];

    // Min cost 0
    cost = Math.min(cost, 0);

    // Apply cost
    state[S.genki] += cost;
    if (state[S.genki] < 0) {
      state[S.stamina] += state[S.genki];
      state[S.consumedStamina] -= state[S.genki];
      state[S.genki] = 0;
    }
  }

  resolveFixedGenki(state, fixedGenki) {
    state[S.genki] += fixedGenki;
  }

  resolveFixedStamina(state, fixedStamina) {
    state[S.stamina] += fixedStamina;
    if (fixedStamina < 0) {
      state[S.consumedStamina] -= fixedStamina;
    }
  }

  resolveScore(state, score, growth) {
    // Apply growth
    if (growth[S["growth.score"]]) {
      score += growth[S["growth.score"]];
    }

    if (score > 0) {
      // Apply concentration
      score += state[S.concentration] * state[S.concentrationMultiplier];

      // Apply enthusiasm
      score += state[S.enthusiasm];

      // Apply good and perfect condition
      if (state[S.goodConditionTurns]) {
        score *=
          1.5 +
          (state[S.perfectConditionTurns]
            ? state[S.goodConditionTurns] * 0.1
            : 0);
      }

      // Apply stance
      if (state[S.stance] == "strength") {
        score *= 2;
      } else if (state[S.stance] == "strength2") {
        score *= 2.5;
      } else if (state[S.stance] == "preservation") {
        score *= 0.5;
      } else if (state[S.stance] == "preservation2") {
        score *= 0.25;
      } else if (state[S.stance] == "fullPower") {
        score *= 3;
      }

      // Score buff effects
      score *= state[S.scoreBuffs].reduce((acc, cur) => acc + cur.amount, 1);

      // Apply poor condition
      if (state[S.poorConditionTurns]) {
        score *= 0.67;
      }

      // Round
      score = Math.ceil(score);

      // Turn type multiplier
      score *= this.engine.turnManager.getTurnMultiplier(state);
      score = Math.ceil(score);
    }

    state[S.score] += score;
  }

  resolveGenki(state, genki) {
    // Nullify genki turns
    if (state[S.nullifyGenkiTurns]) return;

    // Apply motivation
    genki += state[S.motivation] * state[S.motivationMultiplier];

    state[S.genki] += genki;
  }

  resolveStamina(state, stamina, growth) {
    if (state[S.nullifyCostCards]) return;

    if (growth[S["growth.cost"]]) {
      stamina += growth[S["growth.cost"]];
    }

    // Apply stance
    if (state[S.stance].startsWith("strength")) {
      stamina *= 2;
    } else if (state[S.stance] == "preservation") {
      stamina *= 0.5;
    } else if (state[S.stance] == "preservation2") {
      stamina *= 0.25;
    }

    // Multiplicative cost buffs
    if (state[S.halfCostTurns]) {
      stamina *= 0.5;
    }
    if (state[S.doubleCostTurns]) {
      stamina *= 2;
    }

    // Round
    stamina = Math.floor(stamina);

    // Additive cost buffs
    if (stamina <= 0) {
      stamina += state[S.costReduction];
      stamina -= state[S.costIncrease];
      stamina = Math.min(stamina, 0);
    }

    state[S.stamina] += stamina;
    if (stamina < 0) {
      state[S.consumedStamina] -= stamina;
    }
  }

  fullPowerCharge(state, fullPowerCharge) {
    if (fullPowerCharge > 0) {
      state[S.cumulativeFullPowerCharge] += fullPowerCharge;
    }
    state[S.fullPowerCharge] += fullPowerCharge;
  }
}
