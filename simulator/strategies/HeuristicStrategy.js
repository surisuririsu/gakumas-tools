import BaseStrategy from "./BaseStrategy";

export default class HeuristicStrategy extends BaseStrategy {
  constructor(engine) {
    super(engine);

    const { config } = engine;
    this.averageTypeMultiplier = Object.keys(config.typeMultipliers).reduce(
      (acc, cur) =>
        acc +
        (config.typeMultipliers[cur] * config.stage.turnCounts[cur]) /
          config.stage.turnCount,
      0
    );

    this.goodConditionTurnsMultiplier =
      config.idol.recommendedEffect == "goodConditionTurns" ? 2 : 1;
    this.concentrationMultiplier =
      config.idol.recommendedEffect == "concentration" ? 4 : 0.8;
    this.goodImpressionTurnsMultiplier =
      config.idol.recommendedEffect == "goodImpressionTurns" ? 3.5 : 1;
    this.motivationMultiplier =
      config.idol.recommendedEffect == "motivation" ? 4 : 1;
  }

  scaleScore(score) {
    return Math.ceil(score * this.averageTypeMultiplier);
  }

  getScore(state, card) {
    if (!this.engine.isCardUsable(state, card)) {
      return -Infinity;
    }

    const previewState = JSON.parse(JSON.stringify(state));
    this.engine.useCard(previewState, card);

    let score = 0;

    if (previewState.cardMap[card].baseId == 362) score += 100000;

    // Effects
    const effectsDiff = previewState.effects.length - state.effects.length;
    for (let i = 0; i < effectsDiff; i++) {
      const effect = previewState.effects[previewState.effects.length - i - 1];
      let limit = previewState.turnsRemaining;
      if (effect.limit != null && effect.limit < previewState.turnsRemaining) {
        limit = effect.limit + 1;
      }
      if (limit == 0) continue;
      let postEffectState = { ...previewState };
      this.engine.effectManager.triggerEffects(postEffectState, [
        { ...effect, phase: null },
      ]);
      const scoreDelta =
        this.getStateScore(postEffectState) - this.getStateScore(previewState);
      score += 3 * scoreDelta * limit;
    }

    // Additional actions
    if (previewState.turnsRemaining >= state.turnsRemaining) {
      const { scores } = this.evaluate(previewState);
      const filteredScores = scores.filter((s) => s > 0);
      if (filteredScores.length) {
        return score + Math.max(...filteredScores);
      } else {
        const skipState = { ...previewState };
        this.engine.endTurn(skipState);
        return score + this.getStateScore(skipState);
      }
    }

    // Cards removed
    score +=
      (((state.removedCards.length - previewState.removedCards.length) *
        (previewState.score - state.score)) /
        this.averageTypeMultiplier) *
      Math.floor(previewState.turnsRemaining / 12);

    score += this.getStateScore(previewState);

    return Math.round(score);
  }

  getStateScore(state) {
    let score = 0;

    // Cards in hand
    score += state.handCards.length * 3;

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
    Object.values(state.cardMap).reduce((acc, cur) => {
      if (!cur.growth) return acc;
      if (cur.growth["growth.score"]) {
        acc += cur.growth["growth.score"] * 2;
      }
      if (cur.growth["growth.scoreTimes"]) {
        acc += cur.growth["growth.scoreTimes"] * 20;
      }
      if (cur.growth["growth.cost"]) {
        acc += cur.growth["growth.cost"];
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

    const { recommendedEffect } = this.engine.config.idol;
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
