import { StageStrategy } from "../engine";

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
      idolConfig.recommendedEffect == "goodConditionTurns" ? 5 : 1;
    this.concentrationMultiplier =
      idolConfig.recommendedEffect == "concentration" ? 4.5 : 0.8;
    this.goodImpressionTurnsMultiplier =
      idolConfig.recommendedEffect == "goodImpressionTurns" ? 3.5 : 1;
    this.motivationMultiplier =
      idolConfig.recommendedEffect == "motivation" ? 4 : 1;
  }

  getScore(state, cardId) {
    if (!this.engine.isCardUsable(state, cardId)) {
      return -Infinity;
    }
    const previewState = this.engine.useCard(state, cardId);

    const scaleScore = (value) => {
      // Scale predicted score appropriately
      value *= this.averageTypeMultiplier;
      value = Math.ceil(value);
      return value;
    };

    let score = 0;

    // Effects
    const effectsDiff = previewState.effects.length - state.effects.length;
    for (let i = 0; i < effectsDiff; i++) {
      const effect = previewState.effects[previewState.effects.length - i - 1];
      let limit = previewState.turnsRemaining;
      if (effect.limit != null && effect.limit < previewState.turnsRemaining) {
        limit = effect.limit + 1;
      }
      score += 50 * limit;
    }

    // Additional actions
    if (previewState.turnsRemaining >= state.turnsRemaining) {
      const { scores } = this.evaluate(previewState);
      const filteredScores = scores.filter((s) => s > 0);
      if (filteredScores.length) {
        return scaleScore(score) + Math.max(...filteredScores);
      }
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
    score += previewState.stamina * previewState.turnsRemaining * 0.05;

    // Genki
    score +=
      previewState.genki *
      Math.tanh(previewState.turnsRemaining / 2) *
      0.4 *
      this.motivationMultiplier;

    // Good condition turns
    score +=
      Math.min(previewState.goodConditionTurns, previewState.turnsRemaining) *
      1.5 *
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
      this.goodImpressionTurnsMultiplier;

    // Motivation
    score +=
      previewState.motivation *
      previewState.turnsRemaining *
      0.5 *
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
      Math.min(previewState.doubleCostTurns, previewState.turnsRemaining) * -9;

    // Cost reduction
    score += previewState.costReduction * previewState.turnsRemaining * 2;

    // Double card effect cards
    score += previewState.doubleCardEffectCards * 9;

    // Nullify genki turns
    score += previewState.nullifyGenkiTurns * -9;

    // Scale score
    score = scaleScore(score);

    const { recommendedEffect } = this.engine.idolConfig;
    if (recommendedEffect == "goodConditionTurns") {
      score += previewState.score * 0.35;
    } else if (recommendedEffect == "concentration") {
      score +=
        previewState.score * 0.05 +
        previewState.score / (previewState.turnsRemaining + 1);
    } else if (recommendedEffect == "goodImpressionTurns") {
      score += previewState.score * 1.1;
    } else if (recommendedEffect == "motivation") {
      score +=
        previewState.score * 0.45 +
        previewState.score / (previewState.turnsRemaining + 1);
    }

    return Math.floor(score);
  }
}
