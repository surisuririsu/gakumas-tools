import { StageStrategy } from "gakumas-engine";

export default class HeuristicStrategy extends StageStrategy {
  constructor(engine) {
    super(engine);

    const { idolConfig, stageConfig } = engine;
    this.averageTypeMultiplier = Object.keys(idolConfig.typeMultipliers).reduce(
      (acc, cur) =>
        acc +
        (idolConfig.typeMultipliers[cur] * stageConfig.turnCounts[cur]) /
          stageConfig.turnCount,
      0
    );

    this.goodConditionTurnsMultiplier =
      idolConfig.recommendedEffect == "goodConditionTurns" ? 3 : 1;
    this.concentrationMultiplier =
      idolConfig.recommendedEffect == "concentration" ? 3 : 1;
    this.goodImpressionTurnsMultiplier =
      idolConfig.recommendedEffect == "goodImpressionTurns" ? 4 : 1;
    this.motivationMultiplier =
      idolConfig.recommendedEffect == "motivation" ? 3 : 1;
  }

  getScore(state, cardId) {
    if (!this.engine.isCardUsable(state, cardId)) {
      return -Infinity;
    }
    const previewState = this.engine.useCard(state, cardId);

    // Additional actions
    if (previewState.turnsRemaining >= state.turnsRemaining) {
      const { scores } = this.evaluate(previewState);
      const filteredScores = scores.filter((s) => s > 0);
      if (filteredScores.length) return Math.max(...filteredScores);
    }

    let score = 0;

    // Effects
    const effectsDiff = previewState.effects.length - state.effects.length;
    for (let i = 0; i < effectsDiff; i++) {
      const effect = previewState.effects[previewState.effects.length - i - 1];
      const limit = Math.ceil(
        Math.min(
          effect.limit || previewState.turnsRemaining,
          previewState.turnsRemaining
        )
      );
      score += 300 * limit;
    }

    // Cards in hand
    score += previewState.handCardIds.length * 5;

    // Cards removed
    score +=
      (((state.removedCardIds.length - previewState.removedCardIds.length) *
        (previewState.score - state.score)) /
        this.averageTypeMultiplier) *
      Math.floor(previewState.turnsRemaining / 12);

    // Stamina
    score += previewState.stamina * previewState.turnsRemaining * 0.25;

    // Genki
    score +=
      previewState.genki *
      Math.tanh(previewState.turnsRemaining) *
      0.42 *
      this.motivationMultiplier;

    // Good condition turns
    score +=
      Math.min(previewState.goodConditionTurns, previewState.turnsRemaining) *
      2 *
      this.goodConditionTurnsMultiplier;

    // Perfect condition turns
    score +=
      Math.min(
        previewState.perfectConditionTurns,
        previewState.turnsRemaining
      ) *
      previewState.goodConditionTurns *
      this.goodConditionTurnsMultiplier;

    // Concentration
    score +=
      previewState.concentration *
      previewState.turnsRemaining *
      this.concentrationMultiplier;

    // Good impression turns
    score +=
      previewState.goodImpressionTurns *
      previewState.turnsRemaining *
      1.5 *
      this.goodImpressionTurnsMultiplier;

    // Motivation
    score +=
      previewState.motivation *
      previewState.turnsRemaining *
      0.25 *
      this.motivationMultiplier;

    // Score buffs
    score +=
      previewState.scoreBuffs.reduce(
        (acc, cur) =>
          acc + cur.amount * (cur.turns || previewState.turnsRemaining),
        0
      ) * 20;

    // Half cost turns
    score +=
      Math.min(previewState.halfCostTurns, previewState.turnsRemaining) * 9;

    // Double cost turns
    score +=
      Math.min(previewState.doubleCostTurns, previewState.turnsRemaining) * -3;

    // Cost reduction
    score += previewState.costReduction * previewState.turnsRemaining * 2;

    // Double card effect cards
    score += previewState.doubleCardEffectCards * 9;

    // Nullify genki turns
    score += previewState.nullifyGenkiTurns * -9;

    // Scale predicted score appropriately
    score *= state.scoreBuffs.reduce((acc, cur) => acc + cur.amount, 1);
    score = Math.ceil(score);
    score *= this.averageTypeMultiplier;
    score = Math.ceil(score);

    return Math.floor(
      score +
        previewState.score * 0.33 +
        previewState.score / (previewState.turnsRemaining + 1)
    );
  }
}
