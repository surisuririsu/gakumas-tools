/**
 * Intermediate value resolvers
 *
 * These functions resolve intermediate values during action execution,
 * applying buffs, multipliers, and other modifiers.
 */
import { G, S } from "../../constants";

/**
 * Check if an AST node contains a specific identifier
 */
export function astContainsIdentifier(node, identifierName) {
  if (!node) return false;

  switch (node.type) {
    case "identifier":
      return node.name === identifierName;
    case "number":
      return false;
    case "binary":
      return (
        astContainsIdentifier(node.left, identifierName) ||
        astContainsIdentifier(node.right, identifierName)
      );
    case "unary":
      return astContainsIdentifier(node.operand, identifierName);
    case "comparison":
      return (
        astContainsIdentifier(node.left, identifierName) ||
        astContainsIdentifier(node.right, identifierName)
      );
    case "call":
      return node.args.some((arg) => astContainsIdentifier(arg, identifierName));
    default:
      return false;
  }
}

export function resolveCost(state, cost, growth) {
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

export function resolveFixedGenki(state, fixedGenki) {
  state[S.genki] += fixedGenki;
}

export function resolveFixedStamina(state, fixedStamina) {
  state[S.stamina] += fixedStamina;
  if (fixedStamina < 0) {
    state[S.consumedStamina] -= fixedStamina;
  }
}

export function resolveScore(state, score, growth, rhsNode, getTurnMultiplier) {
  // Apply growth
  if (
    growth[G["g.scoreByGoodImpressionTurns"]] &&
    astContainsIdentifier(rhsNode, "goodImpressionTurns")
  ) {
    score +=
      state[S.goodImpressionTurns] * growth[G["g.scoreByGoodImpressionTurns"]];
  } else if (
    growth[G["g.scoreByMotivation"]] &&
    astContainsIdentifier(rhsNode, "motivation")
  ) {
    score += state[S.motivation] * growth[G["g.scoreByMotivation"]];
  } else if (
    growth[G["g.scoreByGenki"]] &&
    astContainsIdentifier(rhsNode, "genki")
  ) {
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
    score *= getTurnMultiplier(state);
    score = Math.ceil(score);
  }

  state[S.score] += score;
}

export function resolveGoodImpressionTurns(state, goodImpressionTurns) {
  // Apply good impression turns buffs
  goodImpressionTurns *= state[S.goodImpressionTurnsBuffs].reduce(
    (acc, cur) => acc + cur.amount,
    1
  );

  state[S.goodImpressionTurns] += goodImpressionTurns;
}

export function resolveMotivation(state, motivation) {
  // Apply motivation buffs
  motivation *= state[S.motivationBuffs].reduce(
    (acc, cur) => acc + cur.amount,
    1
  );

  state[S.motivation] += motivation;
}

export function resolveGoodConditionTurns(state, goodConditionTurns) {
  // Apply good condition turns buffs
  goodConditionTurns *= state[S.goodConditionTurnsBuffs].reduce(
    (acc, cur) => acc + cur.amount,
    1
  );

  state[S.goodConditionTurns] += goodConditionTurns;
}

export function resolveConcentration(state, concentration) {
  // Apply concentration buffs
  concentration *= state[S.concentrationBuffs].reduce(
    (acc, cur) => acc + cur.amount,
    1
  );

  state[S.concentration] += concentration;
}

export function resolveGenki(state, genki) {
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

export function resolveStamina(state, stamina) {
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

export function resolveEnthusiasm(state, enthusiasm) {
  enthusiasm += state[S.enthusiasmBonus];
  enthusiasm *= state[S.enthusiasmBuffs].reduce(
    (acc, cur) => acc + cur.amount,
    1
  );
  state[S.enthusiasm] += enthusiasm;
}

export function resolveFullPowerCharge(state, fullPowerCharge) {
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
