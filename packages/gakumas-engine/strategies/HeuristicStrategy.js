import { S } from "../constants";
import { deepCopy } from "../utils";
import BaseStrategy from "./BaseStrategy";

const MAX_DEPTH = 3;

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
      config.idol.recommendedEffect == "concentration" ? 3 : 1;
    this.goodImpressionTurnsMultiplier =
      config.idol.recommendedEffect == "goodImpressionTurns" ? 3.5 : 1;
    this.motivationMultiplier =
      config.idol.recommendedEffect == "motivation" ? 5.5 : 1;
    this.fullPowerMultiplier =
      config.idol.recommendedEffect == "fullPower" ? 5 : 1;

    this.depth = 0;
    this.rootEffectCount = 0;
  }

  evaluate(state) {
    if (this.depth == 0) {
      this.rootEffectCount = state[S.effects].length;
    }

    const logIndex = this.engine.logger.log(state, "hand", null);

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

    this.engine.logger.logs[logIndex].data = {
      handCards: state[S.handCards].map((card) => ({
        id: state[S.cardMap][card].id,
        c: state[S.cardMap][card].c11n,
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
      this.engine.effectManager.triggerEffects(
        postEffectState,
        [{ ...effect, phase: null }],
        null,
        null,
        true
      );
      const scoreDelta =
        this.getStateScore(postEffectState) - this.getStateScore(previewState);
      score += 3 * scoreDelta * Math.min(limit, 6);
    }

    if (this.engine.config.idol.plan != "anomaly") {
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
      0.7 *
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
      1.5;

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
      score += state[S.leisureTimes] * 80;
      score += state[S.fullPowerTimes] * 80 * this.fullPowerMultiplier;

      //Enthusiasm
      score += state[S.enthusiasm] * 5;
      if (state[S.turnsRemaining]) {
        score += state[S.enthusiasmBonus] * 5 * state[S.enthusiasmMultiplier];
      }

      // Full power charge
      score +=
        state[S.cumulativeFullPowerCharge] * 3 * this.fullPowerMultiplier;

      // Growth
      score += this.getGrowthScore(state) * 0.2 * state[S.turnsRemaining];
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
      0.45 *
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

    // Card uses remaining
    score += state[S.cardUsesRemaining] * 50;

    // Good impression turns buffs
    score +=
      state[S.goodImpressionTurnsBuffs].reduce(
        (acc, cur) => acc + cur.amount * (cur.turns || state[S.turnsRemaining]),
        0
      ) *
      10 *
      this.goodImpressionTurnsMultiplier;

    // Good impression turns effects buffs
    score +=
      state[S.goodImpressionTurnsEffectBuffs].reduce(
        (acc, cur) => acc + cur.amount * (cur.turns || state[S.turnsRemaining]),
        0
      ) *
      state[S.goodImpressionTurns] *
      this.goodImpressionTurnsMultiplier;

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
    } else if (recommendedEffect == "preservation") {
      score += state[S.score] * 0.65;
    } else if (recommendedEffect == "fullPower") {
      score += state[S.score] * 0.8;
    } else {
      score += state[S.score];
    }

    return Math.round(score);
  }

  getGrowthScore(state) {
    let growthScore = 0;
    const multipliers = {
      [S["g.score"]]: 2,
      [S["g.scoreTimes"]]: 20,
      [S["g.cost"]]: 1,
      [S["g.typedCost"]]: 1,
      [S["g.genki"]]: 1,
      [S["g.goodConditionTurns"]]: 1,
      [S["g.perfectConditionTurns"]]: 1,
      [S["g.concentration"]]: 2,
      [S["g.goodImpressionTurns"]]: 1,
      [S["g.motivation"]]: 1,
      [S["g.fullPowerCharge"]]: 1,
      [S["g.halfCostTurns"]]: 1,
      [S["g.scoreByGoodImpressionTurns"]]: 20,
      [S["g.scoreByMotivation"]]: 20,
      [S["g.scoreByGenki"]]: 20,
      [S["g.stanceLevel"]]: 2,
    };
    for (let { growth } of state[S.cardMap]) {
      if (!growth) continue;
      for (let key in growth) {
        growthScore += growth[key] * (multipliers[key] || 1);
      }
    }
    return growthScore;
  }

  evaluateForHold(state, card) {
    let previewState = this.engine.getInitialState(true);
    previewState[S.cardMap] = deepCopy(state[S.cardMap]);
    this.engine.buffManager.setStance(previewState, "fullPower");
    previewState[S.nullifyHold] = true;
    previewState = this.engine.useCard(previewState, card);
    return Math.round(previewState[S.score]);
  }

  pickCardToHold(state, cards) {
    let scores = [];
    for (let i = 0; i < cards.length; i++) {
      scores.push(this.evaluateForHold(state, cards[i]));
    }
    const maxScore = Math.max(...scores);
    const maxIndex = scores.indexOf(maxScore);
    return maxIndex;
  }
}
