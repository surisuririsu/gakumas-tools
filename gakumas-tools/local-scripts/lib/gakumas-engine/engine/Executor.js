import {
  ALL_FIELDS,
  ASSIGNMENT_OPERATORS,
  BUFF_FIELDS,
  CHANGE_TRIGGER_PHASES,
  DEBUFF_FIELDS,
  DEBUFF_SPECIAL_ACTIONS,
  DECREASE_TRIGGER_FIELDS,
  EOT_DECREMENT_FIELDS,
  FIELDS_TO_DIFF,
  FUNCTION_CALL_REGEX,
  G,
  GROWABLE_FIELDS,
  INCREASE_TRIGGER_FIELDS,
  LOGGED_FIELDS,
  NON_NEGATIVE_FIELDS,
  S,
  UNFRESH_PHASES,
  WHOLE_FIELDS,
} from "../constants.js";
import EngineComponent from "./EngineComponent.js";
import { formatDiffField } from "../utils.js";

export default class Executor extends EngineComponent {
  constructor(engine) {
    super(engine);

    this.specialActions = {
      ...this.engine.cardManager.specialActions,
      ...this.engine.buffManager.specialActions,
    };

    this.intermediateResolvers = {
      cost: (...args) => this.resolveCost(...args),
      fixedGenki: (...args) => this.resolveFixedGenki(...args),
      fixedStamina: (...args) => this.resolveFixedStamina(...args),
      score: (...args) => this.resolveScore(...args),
      goodImpressionTurns: (...args) =>
        this.resolveGoodImpressionTurns(...args),
      motivation: (...args) => this.resolveMotivation(...args),
      goodConditionTurns: (...args) => this.resolveGoodConditionTurns(...args),
      concentration: (...args) => this.resolveConcentration(...args),
      genki: (...args) => this.resolveGenki(...args),
      stamina: (...args) => this.resolveStamina(...args),
      enthusiasm: (...args) => this.resolveEnthusiasm(...args),
      fullPowerCharge: (...args) => this.resolveFullPowerCharge(...args),
    };
  }

  executeGrowthActions(growth, actions) {
    for (let i = 0; i < actions.length; i++) {
      this.executeGrowthAction(growth, actions[i]);
    }
  }

  executeGrowthAction(growth, action) {
    const tokens = action;

    // Assignments
    if (ASSIGNMENT_OPERATORS.includes(tokens[1])) {
      const lhs = tokens[0];
      const op = tokens[1];
      const rhsTokens = tokens.slice(2);
      if (rhsTokens.length != 1) {
        throw new Error(`Invalid growth action RHS: ${action}`);
      }
      const rhs = parseFloat(rhsTokens[0]);

      let intermediate = growth[G[lhs]] || 0;

      // Execute operation
      if (op == "=") {
        intermediate = rhs;
      } else if (op == "+=") {
        intermediate += rhs;
      } else if (op == "-=") {
        intermediate -= rhs;
      }

      growth[G[lhs]] = intermediate;

      return;
    }
    console.warn(`Invalid growth action: ${action}`);
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
        const tokens = actions[i];
        if (tokens?.[0] == "score") {
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
        // Trigger buff cost consumed effects
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
  }

  executeAction(state, action, card) {
    let growth = null;
    if (card != null) {
      growth = state[S.cardMap][card].growth;
    }
    const tokens = action;

    // Special actions
    if (tokens.length == 1) {
      this.executeSpecialAction(state, tokens[0], growth);
      return;
    }

    // Assignments
    if (ASSIGNMENT_OPERATORS.includes(tokens[1])) {
      const lhs = tokens[0];

      // Nullify debuffs
      if (state[S.nullifyDebuff] && DEBUFF_FIELDS.includes(S[lhs])) {
        state[S.nullifyDebuff]--;
        return;
      }

      const op = tokens[1];
      const rhsTokens = tokens.slice(2);
      let rhs = this.engine.evaluator.evaluateExpression(state, rhsTokens);

      let intermediate = state[S[lhs]] || 0;

      // Special cases with intermediates
      let intermediateField = null;
      if (
        ["cost", "fixedGenki", "fixedStamina"].includes(lhs) ||
        (lhs == "score" && op == "+=") ||
        (lhs == "goodImpressionTurns" && op == "+=") ||
        (lhs == "motivation" && op == "+=") ||
        (lhs == "goodConditionTurns" && op == "+=") ||
        (lhs == "concentration" && op == "+=") ||
        (lhs == "enthusiasm" && op == "+=") ||
        (lhs == "fullPowerCharge" && op == "+=") ||
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
        if (growth?.[G[`g.${lhs}`]] && GROWABLE_FIELDS.includes(S[lhs])) {
          intermediate += growth[G[`g.${lhs}`]];
        }
      } else if (op == "-=") {
        if (
          growth?.[G["g.typedCost"]] &&
          (state[S.phase] == "processCost" || state[S.phase] == "checkCost")
        ) {
          rhs -= growth[G["g.typedCost"]];
          if (rhs < 0) rhs = 0;
        }
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

      if (intermediateField) {
        // Resolve intermediate

        if (intermediateField in this.intermediateResolvers) {
          this.intermediateResolvers[intermediateField](
            state,
            intermediate,
            growth || {},
            rhsTokens
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

      return;
    }

    console.warn(`Invalid action: ${action}`);
  }

  executeSpecialAction(state, action, growth) {
    if (action in this.specialActions) {
      if (state[S.nullifyDebuff] && DEBUFF_SPECIAL_ACTIONS.includes(action)) {
        state[S.nullifyDebuff]--;
        return;
      }
      this.specialActions[action](state);
      return;
    }

    const match = action.match(FUNCTION_CALL_REGEX);
    if (match[1] in this.specialActions) {
      if (state[S.nullifyDebuff] && DEBUFF_SPECIAL_ACTIONS.includes(match[1])) {
        state[S.nullifyDebuff]--;
        return;
      }
      const args = match[2].split(",");
      if (growth && growth[G["g.stanceLevel"]] && match[1] == "setStance") {
        if (args[0].startsWith("str")) {
          args[0] = "strength2";
        } else if (args[0].startsWith("pre")) {
          args[0] = "preservation2";
        }
      }
      this.specialActions[match[1]](state, ...args);
      return;
    }

    console.warn(`Unrecognized special action: ${action}`);
  }

  resolveCost(state, cost, growth) {
    // Nullify cost
    if (state[S.nullifyCostCards]) return;

    // Apply growth
    if (growth[G["g.cost"]]) {
      cost += growth[G["g.cost"]];
      if (cost > 0) cost = 0;
    }

    // Apply stance
    if (state[S.stance].startsWith("strength")) {
      cost *= 2;
    } else if (state[S.stance] == "preservation") {
      cost *= 0.5;
    } else if (state[S.stance] == "preservation2") {
      cost *= 0.25;
    } else if (state[S.stance] == "leisure") {
      cost *= 0;
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

  resolveScore(state, score, growth, rhsTokens) {
    // Apply growth
    if (
      growth[G["g.scoreByGoodImpressionTurns"]] &&
      rhsTokens.includes("goodImpressionTurns")
    ) {
      score +=
        state[S.goodImpressionTurns] *
        growth[G["g.scoreByGoodImpressionTurns"]];
    } else if (
      growth[G["g.scoreByMotivation"]] &&
      rhsTokens.includes("motivation")
    ) {
      score += state[S.motivation] * growth[G["g.scoreByMotivation"]];
    } else if (growth[G["g.scoreByGenki"]] && rhsTokens.includes("genki")) {
      score += state[S.genki] * growth[G["g.scoreByGenki"]];
    } else if (growth[G["g.score"]]) {
      score += growth[G["g.score"]];
    }

    if (score > 0) {
      // Apply concentration
      score += state[S.concentration] * state[S.concentrationMultiplier];

      // Apply enthusiasm
      score += state[S.enthusiasm];

      // Apply good and perfect condition
      if (state[S.goodConditionTurns]) {
        score *=
          1 +
          (0.5 +
            (state[S.perfectConditionTurns]
              ? state[S.goodConditionTurns] * 0.1
              : 0)) *
            state[S.goodConditionTurnsMultiplier];
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
      } else if (state[S.stance] == "leisure") {
        score *= 0;
      }

      // Round
      score = Math.ceil(score);

      // Score buff effects
      let scoreBuff = state[S.scoreBuffs].reduce(
        (acc, cur) => acc + cur.amount,
        0
      );

      if (state[S.prideTurns]) {
        const buffAmount = Math.min(
          state[S.goodImpressionTurns],
          state[S.motivation]
        );
        scoreBuff += Math.min(buffAmount * 0.02, 0.5);
      }

      score *= 1 + scoreBuff;

      // Score debuff effects
      score *= Math.max(
        state[S.scoreDebuffs].reduce((acc, cur) => acc - cur.amount, 1),
        0
      );

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

  resolveGoodImpressionTurns(state, goodImpressionTurns) {
    // Apply good impression turns buffs
    goodImpressionTurns *= state[S.goodImpressionTurnsBuffs].reduce(
      (acc, cur) => acc + cur.amount,
      1
    );

    state[S.goodImpressionTurns] += goodImpressionTurns;
  }

  resolveMotivation(state, motivation) {
    // Apply motivation buffs
    motivation *= state[S.motivationBuffs].reduce(
      (acc, cur) => acc + cur.amount,
      1
    );

    state[S.motivation] += motivation;
  }

  resolveGoodConditionTurns(state, goodConditionTurns) {
    // Apply good condition turns buffs
    goodConditionTurns *= state[S.goodConditionTurnsBuffs].reduce(
      (acc, cur) => acc + cur.amount,
      1
    );

    state[S.goodConditionTurns] += goodConditionTurns;
  }

  resolveConcentration(state, concentration) {
    // Apply concentration buffs
    concentration *= state[S.concentrationBuffs].reduce(
      (acc, cur) => acc + cur.amount,
      1
    );

    state[S.concentration] += concentration;
  }

  resolveGenki(state, genki) {
    // Nullify genki turns
    if (state[S.nullifyGenkiTurns]) return;

    // Apply motivation
    genki += state[S.motivation] * state[S.motivationMultiplier];

    // Apply unease
    if (state[S.uneaseTurns]) {
      genki *= 0.67;
    }

    state[S.genki] += genki;
  }

  resolveStamina(state, stamina) {
    if (state[S.nullifyCostCards]) return;

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

  resolveEnthusiasm(state, enthusiasm) {
    enthusiasm += state[S.enthusiasmBonus];
    enthusiasm *= state[S.enthusiasmBuffs].reduce(
      (acc, cur) => acc + cur.amount,
      1
    );
    state[S.enthusiasm] += enthusiasm;
  }

  resolveFullPowerCharge(state, fullPowerCharge) {
    if (fullPowerCharge > 0) {
      // Apply full power charge buffs
      fullPowerCharge *= state[S.fullPowerChargeBuffs].reduce(
        (acc, cur) => acc + cur.amount,
        1
      );
      state[S.cumulativeFullPowerCharge] += fullPowerCharge;
    }
    state[S.fullPowerCharge] += fullPowerCharge;
  }
}
