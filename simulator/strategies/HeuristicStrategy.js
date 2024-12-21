import { S } from "../constants";
import { deepCopy } from "../engine/utils";
import BaseStrategy from "./BaseStrategy";

const MAX_DEPTH = 4;

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
      config.idol.recommendedEffect == "goodConditionTurns" ? 1.75 : 1;
    this.concentrationMultiplier =
      config.idol.recommendedEffect == "concentration" ? 3 : 0.8;
    this.goodImpressionTurnsMultiplier =
      config.idol.recommendedEffect == "goodImpressionTurns" ? 3.5 : 1;
    this.motivationMultiplier =
      config.idol.recommendedEffect == "motivation" ? 4 : 1;
    this.fullPowerMultiplier =
      config.idol.recommendedEffect == "fullPower" ? 5 : 1;

    this.depth = 0;
    this.rootEffectCount = 0;
  }

  evaluate(state) {
    if (this.depth == 0) {
      this.rootEffectCount = state[S.effects].length;
    }

    const logIndex = state.logs.length;
    this.engine.logger.log(state, "hand", null);

    const futures = state[S.handCards].map((card) =>
      this.getFuture(state, card)
    );

    let nextState;

    const scores = futures.map((f) => (f ? f.score : -Infinity));
    let maxScore = Math.max(...scores);
    let selectedIndex = null;
    if (maxScore > 0) {
      selectedIndex = scores.indexOf(maxScore);
      nextState = futures[selectedIndex].state;
    } else {
      nextState = this.engine.endTurn(state);
      maxScore = this.getStateScore(nextState);
    }

    nextState.logs[logIndex].data = {
      handCards: state[S.handCards].map((card) => ({
        id: state[S.cardMap][card].id,
        c: state[S.cardMap][card].c?.length || 0,
      })),
      scores,
      selectedIndex,
      state: this.engine.logger.getHandStateForLogging(state),
    };

    return { score: maxScore, state: nextState };
  }

  getFuture(state, card) {
    if (!this.engine.isCardUsable(state, card)) {
      return null;
    }

    const previewState = this.engine.useCard(state, card);
    this.depth++;

    // Additional actions
    if (
      previewState[S.turnsRemaining] >= state[S.turnsRemaining] &&
      this.depth < MAX_DEPTH
    ) {
      const future = this.evaluate(previewState);
      this.depth--;
      return { score: future.score, state: future.state };
    }

    let score = 0;

    if (this.engine.config.idol.plan != "anomaly") {
      // Effects -- TODO: make this not suck
      const effectsDiff = previewState[S.effects].length - this.rootEffectCount;
      for (let i = 0; i < effectsDiff; i++) {
        const effect =
          previewState[S.effects][previewState[S.effects].length - i - 1];
        let limit = previewState[S.turnsRemaining];
        if (
          effect.limit != null &&
          effect.limit < previewState[S.turnsRemaining]
        ) {
          limit = effect.limit + 1;
        }
        if (limit == 0) continue;
        const postEffectState = deepCopy(previewState);
        this.engine.effectManager.triggerEffects(postEffectState, [
          { ...effect, phase: null },
        ]);
        const scoreDelta =
          this.getStateScore(postEffectState) -
          this.getStateScore(previewState);
        score += 3 * scoreDelta * limit;
      }

      // Cards removed
      score +=
        (((state[S.removedCards].length - previewState[S.removedCards].length) *
          (previewState[S.score] - state[S.score])) /
          this.averageTypeMultiplier) *
        Math.floor(previewState[S.turnsRemaining] / 13);
    }

    score += this.getStateScore(previewState);

    this.depth--;
    return { score: Math.round(score), state: previewState };
  }

  scaleScore(score) {
    return Math.ceil(score * this.averageTypeMultiplier);
  }

  getStateScore(state) {
    let score = 0;

    // Cards in hand
    score += state[S.handCards].length * 3;

    // Stamina
    score += state[S.stamina] * state[S.turnsRemaining] * 0.05;

    // Genki
    score +=
      state[S.genki] *
      Math.tanh(state[S.turnsRemaining] / 3) *
      0.42 *
      this.motivationMultiplier;

    // Good condition turns
    score +=
      Math.min(state[S.goodConditionTurns], state[S.turnsRemaining]) *
      1.6 *
      this.goodConditionTurnsMultiplier;

    // Perfect condition turns
    score +=
      Math.min(state[S.perfectConditionTurns], state[S.turnsRemaining]) *
      state[S.goodConditionTurns] *
      this.goodConditionTurnsMultiplier *
      this.goodConditionTurnsMultiplier;

    // Concentration
    score +=
      state[S.concentration] *
      state[S.turnsRemaining] *
      this.concentrationMultiplier;

    // Stance
    if (
      this.engine.config.idol.plan == "anomaly" &&
      (state[S.turnsRemaining] || state[S.cardUsesRemaining])
    ) {
      score += state[S.strengthTimes] * 40;
      score += state[S.preservationTimes] * 80;
      score += state[S.fullPowerTimes] * 80 * this.fullPowerMultiplier;

      //Enthusiasm
      score += state[S.enthusiasm] * 5;

      // Full power charge
      score +=
        state[S.cumulativeFullPowerCharge] * 3 * this.fullPowerMultiplier;

      // Growth
      let growthScore = 0;
      for (let { growth } of state[S.cardMap]) {
        if (!growth) continue;
        if (growth[S["growth.score"]]) {
          growthScore += growth[S["growth.score"]] * 2;
        }
        if (growth[S["growth.scoreTimes"]]) {
          growthScore += growth[S["growth.scoreTimes"]] * 20;
        }
        if (growth[S["growth.cost"]]) {
          growthScore += growth[S["growth.cost"]];
        }
      }
      score += growthScore * state[S.turnsRemaining];
    }

    // Good impression turns
    score +=
      state[S.goodImpressionTurns] *
      state[S.turnsRemaining] *
      this.goodImpressionTurnsMultiplier;

    // Motivation
    score +=
      state[S.motivation] *
      state[S.turnsRemaining] *
      0.5 *
      this.motivationMultiplier;

    // Score buffs
    score +=
      state[S.scoreBuffs].reduce(
        (acc, cur) => acc + cur.amount * (cur.turns || state[S.turnsRemaining]),
        0
      ) * 8;

    // Half cost turns
    score += Math.min(state[S.halfCostTurns], state[S.turnsRemaining]) * 6;

    // Double cost turns
    score += Math.min(state[S.doubleCostTurns], state[S.turnsRemaining]) * -6;

    // Cost reduction
    score += state[S.costReduction] * state[S.turnsRemaining] * 0.5;

    // Double card effect cards
    score += state[S.doubleCardEffectCards] * 50;

    // Nullify genki turns
    score += state[S.nullifyGenkiTurns] * -9;

    // Turn cards upgraded
    score += state[S.turnCardsUpgraded] * 20;

    // Scale score
    score = this.scaleScore(score);

    const { recommendedEffect } = this.engine.config.idol;
    if (recommendedEffect == "goodConditionTurns") {
      score += state[S.score] * 0.4;
    } else if (recommendedEffect == "concentration") {
      score += state[S.score] * 0.6;
    } else if (recommendedEffect == "goodImpressionTurns") {
      score += state[S.score] * 1.1;
    } else if (recommendedEffect == "motivation") {
      score += state[S.score] * 0.6;
    } else if (recommendedEffect == "strength") {
      score += state[S.score] * 0.65;
    } else if (recommendedEffect == "fullPower") {
      score += state[S.score] * 0.8;
    } else {
      score += state[S.score];
    }

    return Math.round(score);
  }
}
