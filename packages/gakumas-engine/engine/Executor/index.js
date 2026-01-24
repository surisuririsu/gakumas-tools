import {
  BUFF_FIELDS,
  CHANGE_TRIGGER_PHASES,
  DEBUFF_FIELDS,
  DEBUFF_SPECIAL_ACTIONS,
  DECREASE_TRIGGER_FIELDS,
  EOT_DECREMENT_FIELDS,
  FIELDS_TO_DIFF,
  G,
  GROWABLE_FIELDS,
  INCREASE_TRIGGER_FIELDS,
  LOGGED_FIELDS,
  NON_NEGATIVE_FIELDS,
  S,
  UNFRESH_PHASES,
  WHOLE_FIELDS,
  ALL_FIELDS,
} from "../../constants";
import EngineComponent from "../EngineComponent";
import { formatDiffField } from "../../utils";
import * as resolvers from "./resolvers";

export default class Executor extends EngineComponent {
  constructor(engine) {
    super(engine);

    this.specialActions = {
      ...this.engine.cardManager.specialActions,
      ...this.engine.buffManager.specialActions,
    };

    this.intermediateResolvers = {
      cost: (state, value, growth) => resolvers.resolveCost(state, value, growth),
      fixedGenki: (state, value) => resolvers.resolveFixedGenki(state, value),
      fixedStamina: (state, value) => resolvers.resolveFixedStamina(state, value),
      score: (state, value, growth, rhs) =>
        resolvers.resolveScore(
          state,
          value,
          growth,
          rhs,
          (s) => this.engine.turnManager.getTurnMultiplier(s)
        ),
      goodImpressionTurns: (state, value) =>
        resolvers.resolveGoodImpressionTurns(state, value),
      motivation: (state, value) => resolvers.resolveMotivation(state, value),
      goodConditionTurns: (state, value) =>
        resolvers.resolveGoodConditionTurns(state, value),
      concentration: (state, value) => resolvers.resolveConcentration(state, value),
      genki: (state, value) => resolvers.resolveGenki(state, value),
      stamina: (state, value) => resolvers.resolveStamina(state, value),
      enthusiasm: (state, value) => resolvers.resolveEnthusiasm(state, value),
      fullPowerCharge: (state, value) =>
        resolvers.resolveFullPowerCharge(state, value),
    };
  }

  executeGrowthActions(growth, actions) {
    for (let i = 0; i < actions.length; i++) {
      this.executeGrowthAction(growth, actions[i]);
    }
  }

  executeGrowthAction(growth, action) {
    if (action.type === "assignment") {
      const { lhs, op, rhs } = action;

      if (rhs.type !== "number") {
        throw new Error(`Invalid growth action RHS: expected number`);
      }
      const rhsValue = rhs.value;

      let intermediate = growth[G[lhs]] || 0;

      if (op === "=") {
        intermediate = rhsValue;
      } else if (op === "+=") {
        intermediate += rhsValue;
      } else if (op === "-=") {
        intermediate -= rhsValue;
      }

      growth[G[lhs]] = intermediate;
      return;
    }

    console.warn(`Invalid growth action:`, action);
  }

  executeActions(state, actions, card) {
    // Record previous state for diffing
    let prev = {};
    for (let i = 0; i < FIELDS_TO_DIFF.length; i++) {
      prev[FIELDS_TO_DIFF[i]] = state[FIELDS_TO_DIFF[i]];
    }

    // Set modifiers
    const prevGoodConditionTurnsMultiplier =
      state[S.goodConditionTurnsMultiplier];
    const prevConcentrationMultiplier = state[S.concentrationMultiplier];
    const prevMotivationMultiplier = state[S.motivationMultiplier];
    state[S.goodConditionTurnsMultiplier] = 1;
    state[S.concentrationMultiplier] = 1;
    state[S.motivationMultiplier] = 1;

    // Execute actions
    let scoreTimes = state[S.cardMap][card]?.growth?.[G["g.scoreTimes"]];
    for (let i = 0; i < actions.length; i++) {
      this.executeAction(state, actions[i], card);

      if (scoreTimes) {
        const action = actions[i];
        if (action.type === "assignment" && action.lhs === "score") {
          for (let j = 0; j < scoreTimes; j++) {
            this.executeAction(state, actions[i], card);
          }
          scoreTimes = null;
        }
      }

      // Clamp values
      const config = this.getConfig(state);
      if (state[S.stamina] > config.idol.params.stamina) {
        state[S.stamina] = config.idol.params.stamina;
      }
      for (let i = 0; i < NON_NEGATIVE_FIELDS.length; i++) {
        if (state[NON_NEGATIVE_FIELDS[i]] < 0) {
          state[NON_NEGATIVE_FIELDS[i]] = 0;
        }
      }
    }

    // Reset modifiers
    state[S.goodConditionTurnsMultiplier] = prevGoodConditionTurnsMultiplier;
    state[S.concentrationMultiplier] = prevConcentrationMultiplier;
    state[S.motivationMultiplier] = prevMotivationMultiplier;

    // Log changed fields
    for (let i = 0; i < LOGGED_FIELDS.length; i++) {
      const field = LOGGED_FIELDS[i];
      if (state[field] == prev[field]) continue;
      this.logger.log(state, "diff", {
        field,
        prev: formatDiffField(prev[field]),
        next: formatDiffField(state[field]),
      });
    }

    // Protect fresh stats from decrement
    if (!UNFRESH_PHASES.includes(state[S.phase])) {
      for (let i = 0; i < EOT_DECREMENT_FIELDS.length; i++) {
        const field = EOT_DECREMENT_FIELDS[i];
        if (state[field] > 0 && prev[field] == 0) {
          state[S.freshBuffs][field] = true;
        }
      }
    }

    if (CHANGE_TRIGGER_PHASES.includes(state[S.phase])) {
      this.triggerChangeEffects(state, prev);
    }
  }

  triggerChangeEffects(state, prev) {
    // Calculate diff
    let increasedFields = new Set();
    let decreasedFields = new Set();
    for (let i = 0; i < FIELDS_TO_DIFF.length; i++) {
      let diff = state[FIELDS_TO_DIFF[i]] - prev[FIELDS_TO_DIFF[i]];
      if (diff > 0) {
        increasedFields.add(FIELDS_TO_DIFF[i]);
      } else if (diff < 0) {
        decreasedFields.add(FIELDS_TO_DIFF[i]);
      }
    }

    // Cost consumed effects
    if (state[S.phase] == "processCost") {
      for (let i = 0; i < BUFF_FIELDS.length; i++) {
        if (decreasedFields.has(BUFF_FIELDS[i])) {
          this.engine.effectManager.triggerEffectsForPhase(
            state,
            "buffCostConsumed"
          );
          break;
        }
      }
    }

    // Trigger increase effects
    for (let i = 0; i < INCREASE_TRIGGER_FIELDS.length; i++) {
      const field = INCREASE_TRIGGER_FIELDS[i];
      if (increasedFields.has(field)) {
        const fieldName = ALL_FIELDS[field];
        state[S[`${fieldName}Delta`]] = state[field] - prev[field];
        this.engine.effectManager.triggerEffectsForPhase(
          state,
          `${fieldName}Increased`
        );
        state[S[`${fieldName}Delta`]] = 0;
      }
    }

    // Trigger decrease effects
    for (let i = 0; i < DECREASE_TRIGGER_FIELDS.length; i++) {
      const field = DECREASE_TRIGGER_FIELDS[i];
      if (decreasedFields.has(field)) {
        const fieldName = ALL_FIELDS[field];
        state[S[`${fieldName}Delta`]] = state[field] - prev[field];
        this.engine.effectManager.triggerEffectsForPhase(
          state,
          `${fieldName}Decreased`
        );
        state[S[`${fieldName}Delta`]] = 0;
      }
    }
  }

  executeAction(state, action, card) {
    let growth = null;
    if (card != null) {
      growth = state[S.cardMap][card].growth;
    }

    if (action.type === "identifier") {
      this.executeSpecialAction(state, action.name, growth);
      return;
    }

    if (action.type === "call") {
      this.executeCallAction(state, action, growth);
      return;
    }

    if (action.type === "assignment") {
      this.executeAssignment(state, action, growth);
      return;
    }

    console.warn(`Invalid action:`, action);
  }

  executeAssignment(state, action, growth) {
    const { lhs, op, rhs } = action;

    // Nullify debuffs
    if (state[S.nullifyDebuff] && DEBUFF_FIELDS.includes(S[lhs])) {
      state[S.nullifyDebuff]--;
      return;
    }

    let rhsValue = this.engine.evaluator.evaluateExpression(state, rhs);
    let intermediate = state[S[lhs]] || 0;

    // Special cases with intermediates
    let intermediateField = null;
    if (
      ["cost", "fixedGenki", "fixedStamina"].includes(lhs) ||
      (lhs === "score" && op === "+=") ||
      (lhs === "goodImpressionTurns" && op === "+=") ||
      (lhs === "motivation" && op === "+=") ||
      (lhs === "goodConditionTurns" && op === "+=") ||
      (lhs === "concentration" && op === "+=") ||
      (lhs === "enthusiasm" && op === "+=") ||
      (lhs === "fullPowerCharge" && op === "+=") ||
      (lhs === "genki" && op === "+=") ||
      (lhs === "stamina" && op === "-=")
    ) {
      intermediate = 0;
      intermediateField = lhs;
    }

    // Execute operation
    if (op === "=") {
      intermediate = rhsValue;
    } else if (op === "+=") {
      intermediate += rhsValue;
      if (growth?.[G[`g.${lhs}`]] && GROWABLE_FIELDS.includes(S[lhs])) {
        intermediate += growth[G[`g.${lhs}`]];
      }
    } else if (op === "-=") {
      if (
        growth?.[G["g.typedCost"]] &&
        (state[S.phase] === "processCost" || state[S.phase] === "checkCost")
      ) {
        rhsValue -= growth[G["g.typedCost"]];
        if (rhsValue < 0) rhsValue = 0;
      }
      intermediate -= rhsValue;
    } else if (op === "*=") {
      intermediate *= rhsValue;
    } else if (op === "/=") {
      intermediate /= rhsValue;
    } else if (op === "%=") {
      intermediate %= rhsValue;
    } else {
      console.warn(`Unrecognized assignment operator: ${op}`);
    }

    if (intermediateField) {
      if (intermediateField in this.intermediateResolvers) {
        this.intermediateResolvers[intermediateField](
          state,
          intermediate,
          growth || {},
          rhs
        );
      } else {
        console.warn(`Unresolved intermediate: ${intermediateField}`);
      }
    } else {
      state[S[lhs]] = intermediate;
    }

    // Round whole fields
    for (let i = 0; i < WHOLE_FIELDS.length; i++) {
      if (WHOLE_FIELDS[i] in state) {
        state[WHOLE_FIELDS[i]] = Math.ceil(state[WHOLE_FIELDS[i]].toFixed(2));
      }
    }
  }

  executeCallAction(state, action, growth) {
    const { name, target, args } = action;

    if (name in this.specialActions) {
      if (state[S.nullifyDebuff] && DEBUFF_SPECIAL_ACTIONS.includes(name)) {
        state[S.nullifyDebuff]--;
        return;
      }

      const evaluatedArgs = [];

      if (target) {
        evaluatedArgs.push(target);
      }

      for (const arg of args) {
        if (arg.type === "identifier") {
          evaluatedArgs.push(arg.name);
        } else {
          evaluatedArgs.push(this.engine.evaluator.evaluateAST(state, arg));
        }
      }

      // Handle stance growth modifier
      if (growth && growth[G["g.stanceLevel"]] && name === "setStance") {
        if (evaluatedArgs[0].startsWith("str")) {
          evaluatedArgs[0] = "strength2";
        } else if (evaluatedArgs[0].startsWith("pre")) {
          evaluatedArgs[0] = "preservation2";
        }
      }

      this.specialActions[name](state, ...evaluatedArgs);
      return;
    }

    console.warn(`Unrecognized function call: ${name}`);
  }

  executeSpecialAction(state, actionName) {
    if (actionName in this.specialActions) {
      if (state[S.nullifyDebuff] && DEBUFF_SPECIAL_ACTIONS.includes(actionName)) {
        state[S.nullifyDebuff]--;
        return;
      }
      this.specialActions[actionName](state);
      return;
    }

    console.warn(`Unrecognized special action: ${actionName}`);
  }
}
