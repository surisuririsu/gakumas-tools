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

// Precomputed delta-field indices and phase strings for the change-trigger
// fields, so `triggerChangeEffects` can index by position instead of
// rebuilding `${fieldName}Delta` / `${fieldName}Increased` strings on each
// iteration.
const INCREASE_DELTA_FIELDS = INCREASE_TRIGGER_FIELDS.map(
  (f) => S[`${ALL_FIELDS[f]}Delta`],
);
const INCREASE_PHASES = INCREASE_TRIGGER_FIELDS.map(
  (f) => `${ALL_FIELDS[f]}Increased`,
);
const DECREASE_DELTA_FIELDS = DECREASE_TRIGGER_FIELDS.map(
  (f) => S[`${ALL_FIELDS[f]}Delta`],
);
const DECREASE_PHASES = DECREASE_TRIGGER_FIELDS.map(
  (f) => `${ALL_FIELDS[f]}Decreased`,
);

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
    // Snapshot the whole state array for diffing. A single native
    // `slice()` is much faster than building an object keyed by
    // FIELDS_TO_DIFF; the extra slots cost nothing (diff sites only
    // read the fields they care about).
    const prev = state.slice();

    // Set modifiers
    const prevGoodConditionTurnsMultiplier =
      state[S.goodConditionTurnsMultiplier];
    const prevConcentrationMultiplier = state[S.concentrationMultiplier];
    const prevMotivationMultiplier = state[S.motivationMultiplier];
    const prevScoreTimes = state[S.scoreTimes];
    state[S.goodConditionTurnsMultiplier] = 1;
    state[S.concentrationMultiplier] = 1;
    state[S.motivationMultiplier] = 1;
    // Seed scoreTimes from the card's g.scoreTimes growth so legacy
    // growth-driven repeats still fire. Actions may also write to
    // state.scoreTimes directly before the first score action.
    state[S.scoreTimes] =
      state[S.cardMap][card]?.growth?.[G["g.scoreTimes"]] || 0;

    // Execute actions, triggering increase/decrease effects per-action
    // (matching actual game behavior where p-items trigger between actions)
    for (let i = 0; i < actions.length; i++) {
      // Only snapshot the full change-trigger field set when the current
      // phase actually fires change triggers. Most effect-action paths
      // (e.g. `cardUsed` phase) don't, so the ~30-field capture is wasted
      // work. Genki is captured unconditionally for the consumed-genki
      // accounting below.
      const phase = state[S.phase];
      const needsChangeTrigger =
        phase === "processCard" || phase === "processCost";
      const actionPrev = needsChangeTrigger ? state.slice() : null;
      const prevGenki = state[S.genki];

      this.executeAction(state, actions[i], card);

      // Apply scoreTimes to the first score action we see, then consume it.
      // `state[S.scoreTimes]` is seeded from g.scoreTimes above but may also
      // be written by a preceding action.
      if (state[S.scoreTimes]) {
        const action = actions[i];
        if (action.type === "assignment" && action.lhs === "score") {
          const times = state[S.scoreTimes];
          state[S.scoreTimes] = 0;
          for (let j = 0; j < times; j++) {
            this.executeAction(state, actions[i], card);
          }
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

      // Fire increase/decrease triggers after each action
      if (needsChangeTrigger) {
        this.triggerChangeEffects(state, actionPrev);
      }

      // Consumed genki
      if (state[S.genki] < prevGenki) {
        state[S.consumedGenki] += prevGenki - state[S.genki];
      }
    }

    // Reset modifiers
    state[S.goodConditionTurnsMultiplier] = prevGoodConditionTurnsMultiplier;
    state[S.concentrationMultiplier] = prevConcentrationMultiplier;
    state[S.motivationMultiplier] = prevMotivationMultiplier;
    state[S.scoreTimes] = prevScoreTimes;

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
  }

  triggerChangeEffects(state, prev) {
    // Cost consumed effects
    if (state[S.phase] == "processCost") {
      for (let i = 0; i < BUFF_FIELDS.length; i++) {
        const f = BUFF_FIELDS[i];
        if (state[f] < prev[f]) {
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
      const curr = state[field];
      const prior = prev[field];
      if (curr > prior) {
        const deltaField = INCREASE_DELTA_FIELDS[i];
        const phase = INCREASE_PHASES[i];
        state[deltaField] = curr - prior;
        this.engine.effectManager.triggerEffectsForPhase(state, phase);
        state[deltaField] = 0;
      }
    }

    // Trigger decrease effects
    for (let i = 0; i < DECREASE_TRIGGER_FIELDS.length; i++) {
      const field = DECREASE_TRIGGER_FIELDS[i];
      const curr = state[field];
      const prior = prev[field];
      if (curr < prior) {
        const deltaField = DECREASE_DELTA_FIELDS[i];
        const phase = DECREASE_PHASES[i];
        state[deltaField] = curr - prior;
        this.engine.effectManager.triggerEffectsForPhase(state, phase);
        state[deltaField] = 0;
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

    // Handle effectCounter assignments
    if (lhs === "effectCounter") {
      const id = state[S.currentEffectInstanceId];
      const name = "main";
      const rhsValue = this.engine.evaluator.evaluateExpression(state, rhs);

      if (!state[S.effectCounters][id]) {
        state[S.effectCounters][id] = {};
      }
      if (state[S.effectCounters][id][name] === undefined) {
        state[S.effectCounters][id][name] = 0;
      }

      if (op === "+=") {
        state[S.effectCounters][id][name] += rhsValue;
      } else {
        console.warn(`Unsupported effectCounter operation: ${op}`);
      }
      return;
    }

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

    // Round whole fields — skip ones already integer to avoid the
    // string round-trip through toFixed, which dominates the hot path.
    for (let i = 0; i < WHOLE_FIELDS.length; i++) {
      const field = WHOLE_FIELDS[i];
      const v = state[field];
      if (v === undefined || Number.isInteger(v)) continue;
      state[field] = Math.ceil(v.toFixed(2));
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
