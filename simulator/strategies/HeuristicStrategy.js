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
      idolConfig.recommendedEffect == "goodConditionTurns" ? 2 : 1;
    this.concentrationMultiplier =
      idolConfig.recommendedEffect == "concentration" ? 4 : 0.8;
    this.goodImpressionTurnsMultiplier =
      idolConfig.recommendedEffect == "goodImpressionTurns" ? 3.5 : 1;
    this.motivationMultiplier =
      idolConfig.recommendedEffect == "motivation" ? 4 : 1;

    this.depth = 0;
  }

  scaleScore(score) {
    return Math.ceil(score * this.averageTypeMultiplier);
  }

  getScore(state, cardId) {
    if (!this.engine.isCardUsable(state, cardId)) {
      return -Infinity;
    }
    const previewState = this.engine.useCard(state, cardId);

    this.depth++;

    let score = 0;

    if ([362, 363].includes(cardId)) score += 100000;

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
      score += 3 * scoreDelta * limit;
    }

    // Additional actions
    if (previewState.turnsRemaining >= state.turnsRemaining && this.depth < 4) {
      const { scores } = this.evaluate(previewState);
      const filteredScores = scores.filter((s) => s > 0);
      this.depth--;
      if (filteredScores.length) {
        return score + Math.max(...filteredScores);
      } else {
        const skipState = this.engine.endTurn(previewState);
        return score + this.getStateScore(skipState);
      }
    }

    // Cards removed
    score +=
      (((state.removedCardIds.length - previewState.removedCardIds.length) *
        (previewState.score - state.score)) /
        this.averageTypeMultiplier) *
      Math.floor(previewState.turnsRemaining / 12);

    score += this.getStateScore(previewState);

    this.depth--;
    return Math.round(score);
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
      0.42 *
      this.motivationMultiplier;

    // Good condition turns
    score +=
      Math.min(state.goodConditionTurns, state.turnsRemaining) *
      1.6 *
      this.goodConditionTurnsMultiplier;

    // Perfect condition turns
    score +=
      Math.min(state.perfectConditionTurns, state.turnsRemaining) *
      state.goodConditionTurns *
      this.goodConditionTurnsMultiplier;

    // Concentration
    score +=
      state.concentration * state.turnsRemaining * this.concentrationMultiplier;

    // Stance
    if (state.stance == "fullPower") {
      score += 200;
    } else if (state.stance == "strength") {
      score += 20;
    } else if (state.stance == "strength2") {
      score += 40;
    } else if (state.stance == "preservation") {
      score += 8;
    } else if (state.stance == "preservation2") {
      score += 16;
    }

    score += state.strengthTimes * 40;
    score += state.preservationTimes * 80;
    score += state.fullPowerTimes * 250;

    //Enthusiasm
    score += state.enthusiasm * 5;

    // Full power charge
    score += state.cumulativeFullPowerCharge * 15;

    // Growth
    score +=
      Object.values(state.growthByEntity).reduce((acc, cur) => {
        if (cur["growth.score"]) {
          acc += cur["growth.score"] * 2;
        }
        if (cur["growth.scoreTimes"]) {
          acc += cur["growth.scoreTimes"] * 20;
        }
        if (cur["growth.cost"]) {
          acc += cur["growth.cost"];
        }
        return acc;
      }, 0) * state.turnsRemaining;

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
    score += state.doubleCardEffectCards * 50;

    // Nullify genki turns
    score += state.nullifyGenkiTurns * -9;

    // Turn cards upgraded
    score += state.turnCardsUpgraded * 20;

    // Scale score
    score = this.scaleScore(score);

    const { recommendedEffect } = this.engine.idolConfig;
    if (recommendedEffect == "goodConditionTurns") {
      score += state.score * 0.4;
    } else if (recommendedEffect == "concentration") {
      score += state.score * 0.6;
    } else if (recommendedEffect == "goodImpressionTurns") {
      score += state.score * 0.8;
    } else if (recommendedEffect == "motivation") {
      score += state.score * 0.6;
    } else if (recommendedEffect == "strength") {
      score += state.score * 0.6;
    } else if (recommendedEffect == "fullPower") {
      score += state.score * 0.8;
    } else {
      score += state.score;
    }

    return Math.round(score);
  }
}
