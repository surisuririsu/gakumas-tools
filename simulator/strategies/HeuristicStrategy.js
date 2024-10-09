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
      idolConfig.recommendedEffect == "goodConditionTurns" ? 2 : 0.8;
    this.concentrationMultiplier =
      idolConfig.recommendedEffect == "concentration" ? 7 : 0.8;
    this.goodImpressionTurnsMultiplier =
      idolConfig.recommendedEffect == "goodImpressionTurns" ? 3.5 : 1;
    this.motivationMultiplier =
      idolConfig.recommendedEffect == "motivation" ? 4 : 1;
  }

  scaleScore(score) {
    return Math.ceil(score * this.averageTypeMultiplier);
  }

  getScore(state, cardId) {
    if (!this.engine.isCardUsable(state, cardId)) {
      return -Infinity;
    }
    const previewState = this.engine.useCard(state, cardId);

    let score = 0;

    // Effects
    const effectsDiff = previewState.effects.length - state.effects.length;
    for (let i = 0; i < effectsDiff; i++) {
      const effect = previewState.effects[previewState.effects.length - i - 1];
      let limit = previewState.turnsRemaining;
      if (effect.limit != null && effect.limit < previewState.turnsRemaining) {
        limit = effect.limit + 1;
      }
      if (limit == 0) continue;
      const postEffectState = this.engine._triggerEffects(
        [{ ...effect, phase: null }],
        { ...previewState }
      );
      const scoreDelta =
        this.getStateScore(postEffectState) - this.getStateScore(previewState);
      score += 10 * scoreDelta * limit;
    }

    // Additional actions
    if (previewState.turnsRemaining >= state.turnsRemaining) {
      const { scores } = this.evaluate(previewState);
      const filteredScores = scores.filter((s) => s > 0);
      if (filteredScores.length) {
        return this.scaleScore(score) + Math.max(...filteredScores);
      }
    }

    // Cards removed
    score +=
      (((state.removedCardIds.length - previewState.removedCardIds.length) *
        (previewState.score - state.score)) /
        this.averageTypeMultiplier) *
      Math.floor(previewState.turnsRemaining / 12);

    score += this.getStateScore(previewState);

    return Math.floor(score);
  }

  getStateScore(state) {
    let score = 0;

    // Cards in hand
    score += state.handCardIds.length * 3;

    // Stamina
    score += state.stamina * state.turnsRemaining * 0.05;

    // Genki
    score +=
      state.genki *
      Math.tanh(state.turnsRemaining / 3) *
      0.36 *
      this.motivationMultiplier;

    // Good condition turns
    score +=
      Math.min(state.goodConditionTurns, state.turnsRemaining) *
      1.2 *
      this.goodConditionTurnsMultiplier;

    // Perfect condition turns
    score +=
      Math.min(state.perfectConditionTurns, state.turnsRemaining) *
      state.goodConditionTurns *
      this.goodConditionTurnsMultiplier;

    // Concentration
    score +=
      state.concentration *
      state.turnsRemaining *
      0.8 *
      this.concentrationMultiplier;

    // Good impression turns
    score +=
      state.goodImpressionTurns *
      state.turnsRemaining *
      this.goodImpressionTurnsMultiplier;

    // Motivation
    score +=
      state.motivation * state.turnsRemaining * 0.5 * this.motivationMultiplier;

    // Score buffs
    score +=
      state.scoreBuffs.reduce(
        (acc, cur) => acc + cur.amount * (cur.turns || state.turnsRemaining),
        0
      ) * 8;

    // Half cost turns
    score += Math.min(state.halfCostTurns, state.turnsRemaining) * 6;

    // Double cost turns
    score += Math.min(state.doubleCostTurns, state.turnsRemaining) * -6;

    // Cost reduction
    score += state.costReduction * state.turnsRemaining * 0.5;

    // Double card effect cards
    score += state.doubleCardEffectCards * 9;

    // Nullify genki turns
    score += state.nullifyGenkiTurns * -9;

    // Scale score
    score = this.scaleScore(score);

    const { recommendedEffect } = this.engine.idolConfig;
    if (recommendedEffect == "goodConditionTurns") {
      score += state.score * 0.35;
    } else if (recommendedEffect == "concentration") {
      score += state.score * 0.4;
    } else if (recommendedEffect == "goodImpressionTurns") {
      score += state.score * 1.1;
    } else if (recommendedEffect == "motivation") {
      score += state.score * 0.45;
    } else {
      score += state.score;
    }

    return score;
  }
}
