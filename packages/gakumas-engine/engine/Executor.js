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
  GROWABLE_FIELDS,
  CHANGE_TRIGGER_PHASES,
  ALL_FIELDS,
  BUFF_FIELDS,
  DEBUFF_SPECIAL_ACTIONS,
} from "../constants";
import EngineComponent from "./EngineComponent";
import { formatDiffField } from "../utils";

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
      addCardToTopOfDeck: (state, cardId) =>
        engine.cardManager.addCardToTopOfDeck(state, cardId),
      addCardToHand: (state, cardId) =>
        engine.cardManager.addCardToHand(state, cardId),
      moveCardToHand: (state, cardId, exact) =>
        engine.cardManager.moveCardToHand(state, cardId, parseInt(exact, 10)),
      moveCardToHandFromRemoved: (state, cardBaseId) =>
        engine.cardManager.moveCardToHandFromRemoved(state, cardBaseId),
      holdCard: (state, cardBaseId) =>
        engine.cardManager.holdCard(state, parseInt(cardBaseId, 10)),
      holdThisCard: (state) => engine.cardManager.holdThisCard(state),
      holdSelectedFromHand: (state) =>
        engine.cardManager.holdSelectedFrom(state, "hand"),
      holdSelectedFromDeck: (state) =>
        engine.cardManager.holdSelectedFrom(state, "deck"),
      holdSelectedFromDeckOrDiscards: (state) =>
        engine.cardManager.holdSelectedFrom(state, "deck", "discards"),
      addHeldCardsToHand: (state) =>
        engine.cardManager.addHeldCardsToHand(state),

      // Buffs
      setScoreBuff: (state, amount, turns) =>
        engine.buffManager.setScoreBuff(
          state,
          parseFloat(amount),
          turns ? parseInt(turns, 10) : null
        ),
      setScoreDebuff: (state, amount, turns) =>
        engine.buffManager.setScoreDebuff(
          state,
          parseFloat(amount),
          turns ? parseInt(turns, 10) : null
        ),
      setGoodImpressionTurnsBuff: (state, amount, turns) =>
        engine.buffManager.setGoodImpressionTurnsBuff(
          state,
          parseFloat(amount),
          turns ? parseInt(turns, 10) : null
        ),
      setGoodImpressionTurnsEffectBuff: (state, amount, turns) =>
        engine.buffManager.setGoodImpressionTurnsEffectBuff(
          state,
          parseFloat(amount),
          turns ? parseInt(turns, 10) : null
        ),
      setConcentrationBuff: (state, amount, turns) =>
        engine.buffManager.setConcentrationBuff(
          state,
          parseFloat(amount),
          turns ? parseInt(turns, 10) : null
        ),
      removeDebuffs: (state, amount) =>
        engine.buffManager.removeDebuffs(state, parseInt(amount, 10)),
      setStance: (state, stance) => engine.buffManager.setStance(state, stance),
    };

    this.intermediateResolvers = {
      cost: (...args) => this.resolveCost(...args),
      fixedGenki: (...args) => this.resolveFixedGenki(...args),
      fixedStamina: (...args) => this.resolveFixedStamina(...args),
      score: (...args) => this.resolveScore(...args),
      goodImpressionTurns: (...args) =>
        this.resolveGoodImpressionTurns(...args),
      concentration: (...args) => this.resolveConcentration(...args),
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
    const scoreTimes = state[S.cardMap][card]?.growth?.[S["g.scoreTimes"]];
    for (let i = 0; i < actions.length; i++) {
      this.executeAction(state, actions[i], card);

      if (scoreTimes) {
        const tokens = actions[i];
        if (tokens?.[0] == "score") {
          for (let j = 0; j < scoreTimes; j++) {
            this.executeAction(state, actions[i], card);
          }
        }
      }

      // Clamp values
      if (state[S.stamina] < 0) state[S.stamina] = 0;
      if (state[S.stamina] > this.config.idol.params.stamina) {
        state[S.stamina] = this.config.idol.params.stamina;
      }
      if (state[S.phase] != "processCost" && state[S.concentration] < 0) {
        state[S.concentration] = 0;
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
          delete state[S[`${fieldName}Delta`]];
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
          delete state[S[`${fieldName}Delta`]];
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
        ["cost", "fixedGenki", "fixedStamina", "fullPowerCharge"].includes(
          lhs
        ) ||
        (lhs == "score" && op == "+=") ||
        (lhs == "goodImpressionTurns" && op == "+=") ||
        (lhs == "concentration" && op == "+=") ||
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
        if (growth?.[S[`g.${lhs}`]] && GROWABLE_FIELDS.includes(S[lhs])) {
          intermediate += growth[S[`g.${lhs}`]];
        }
      } else if (op == "-=") {
        if (growth?.[S["g.typedCost"]] && state[S.phase] == "processCost") {
          rhs -= growth[S["g.typedCost"]];
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
      if (growth && growth[S["g.stanceLevel"]] && match[1] == "setStance") {
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
    if (growth[S["g.cost"]]) {
      cost += growth[S["g.cost"]];
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
      growth[S["g.scoreByGoodImpressionTurns"]] &&
      rhsTokens.includes("goodImpressionTurns")
    ) {
      score +=
        state[S.goodImpressionTurns] *
        growth[S["g.scoreByGoodImpressionTurns"]];
    } else if (
      growth[S["g.scoreByMotivation"]] &&
      rhsTokens.includes("motivation")
    ) {
      score += state[S.motivation] * growth[S["g.scoreByMotivation"]];
    } else if (growth[S["g.scoreByGenki"]] && rhsTokens.includes("genki")) {
      score += state[S.genki] * growth[S["g.scoreByGenki"]];
    } else if (growth[S["g.score"]]) {
      score += growth[S["g.score"]];
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

      // Score buff effects
      score *= state[S.scoreBuffs].reduce((acc, cur) => acc + cur.amount, 1);

      // // Score debuff effects
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

  resolveFullPowerCharge(state, fullPowerCharge) {
    if (fullPowerCharge > 0) {
      state[S.cumulativeFullPowerCharge] += fullPowerCharge;
    }
    state[S.fullPowerCharge] += fullPowerCharge;
  }
}
