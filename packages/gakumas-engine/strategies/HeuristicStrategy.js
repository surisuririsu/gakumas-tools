import { G, S } from "../constants";
import { deepCopy } from "../utils";
import BaseStrategy from "./BaseStrategy";

const MAX_DEPTH = 3;

export default class HeuristicStrategy extends BaseStrategy {
  constructor(engine) {
    super(engine);

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
        [
          {
            ...effect,
            phase: null,
            delay: effect.delay - previewState[S.turnsRemaining],
          },
        ],
        null,
        null,
        true
      );
      const scoreDelta =
        this.getStateScore(postEffectState) - this.getStateScore(previewState);
      score += 3 * scoreDelta * Math.min(limit, 6);
    }

    if (this.engine.getConfig(state).idol.plan != "anomaly") {
      // Cards removed
      score +=
        (((state[S.removedCards].length - previewState[S.removedCards].length) *
          (previewState[S.score] - state[S.score])) /
          this.getAverageTypeMultiplier(state)) *
        Math.floor(previewState[S.turnsRemaining] / 13);
    }

    score += this.getStateScore(previewState);

    this.depth--;
    return { score: Math.round(score), state: previewState };
  }

  getAverageTypeMultiplier(state) {
    const config = this.engine.getConfig(state);
    return Object.keys(config.typeMultipliers).reduce(
      (acc, cur) =>
        acc +
        (config.typeMultipliers[cur] * config.stage.turnCounts[cur]) /
          config.stage.turnCount,
      0
    );
  }

  scaleScore(score, state) {
    return Math.ceil(score * this.getAverageTypeMultiplier(state));
  }

  getStateScore(state) {
    // Initialize multipliers
    const config = this.engine.getConfig(state);
    this.goodConditionTurnsMultiplier =
      config.idol.recommendedEffect == "goodConditionTurns" ? 1.75 : 1;
    if (config.idol.pIdolId == 114) {
      this.goodConditionTurnsMultiplier = 8;
    }
    this.concentrationMultiplier =
      config.idol.recommendedEffect == "concentration" ? 3 : 1;
    this.goodImpressionTurnsMultiplier =
      config.idol.recommendedEffect == "goodImpressionTurns" ? 3.5 : 1;
    this.motivationMultiplier =
      config.idol.recommendedEffect == "motivation" ? 5.5 : 1;
    this.fullPowerMultiplier =
      config.idol.recommendedEffect == "fullPower" ? 5 : 1;

    // Calc score

    let score = 0;

    // Cards in hand
    score += state[S.handCards].length * 3;

    // Cards used
    score += state[S.cardsUsed] * 8;

    // Stamina
    score += state[S.stamina] * state[S.turnsRemaining] * 0.05;

    // Genki
    score +=
      state[S.genki] *
      Math.tanh(state[S.turnsRemaining] / 3) *
      0.7 *
      this.motivationMultiplier;

    // Good condition turns
    if (config.idol.pIdolId == 114) {
      if (state[S.turnsRemaining] > 0) {
        score +=
          state[S.goodConditionTurns] * 3 * this.goodConditionTurnsMultiplier;
      }
    } else {
      score +=
        Math.min(state[S.goodConditionTurns], state[S.turnsRemaining]) *
        1.6 *
        this.goodConditionTurnsMultiplier;
    }

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
      config.idol.plan == "anomaly" &&
      (state[S.turnsRemaining] || state[S.cardUsesRemaining])
    ) {
      score += state[S.strengthTimes] * 40;
      score += state[S.preservationTimes] * 80;
      score += state[S.leisureTimes] * 80;
      score += state[S.fullPowerTimes] * 80 * this.fullPowerMultiplier;

      //Enthusiasm
      score += state[S.enthusiasm] * 5;

      // Full power charge
      score +=
        state[S.cumulativeFullPowerCharge] * 3 * this.fullPowerMultiplier;

      // Enthusiasm buffs
      score +=
        state[S.enthusiasmBuffs].reduce(
          (acc, cur) =>
            acc + cur.amount * (cur.turns || state[S.turnsRemaining]),
          0
        ) * 5;

      // Full power charge buffs
      score +=
        state[S.fullPowerChargeBuffs].reduce(
          (acc, cur) =>
            acc + cur.amount * (cur.turns || state[S.turnsRemaining]),
          0
        ) * this.fullPowerMultiplier;

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

    // Pride turns
    score += state[S.prideTurns] * state[S.turnsRemaining] * 0.2;

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

    // Good condition turns buffs
    score +=
      state[S.goodConditionTurnsBuffs].reduce(
        (acc, cur) => acc + cur.amount * (cur.turns || state[S.turnsRemaining]),
        0
      ) * this.goodConditionTurnsMultiplier;

    // Concentration buffs
    score +=
      state[S.concentrationBuffs].reduce(
        (acc, cur) => acc + cur.amount * (cur.turns || state[S.turnsRemaining]),
        0
      ) * this.concentrationMultiplier;

    // Nullify genki turns
    score += state[S.nullifyGenkiTurns] * -9;

    // Turn cards upgraded
    score += state[S.turnCardsUpgraded] * 20;

    // Scale score
    score = this.scaleScore(score, state);

    const { recommendedEffect } = config.idol;
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
      [G["g.score"]]: 2,
      [G["g.scoreTimes"]]: 20,
      [G["g.cost"]]: 1,
      [G["g.typedCost"]]: 1,
      [G["g.genki"]]: 1,
      [G["g.goodConditionTurns"]]: 1,
      [G["g.perfectConditionTurns"]]: 1,
      [G["g.concentration"]]: 2,
      [G["g.goodImpressionTurns"]]: 1,
      [G["g.motivation"]]: 1,
      [G["g.fullPowerCharge"]]: 1,
      [G["g.halfCostTurns"]]: 1,
      [G["g.scoreByGoodImpressionTurns"]]: 20,
      [G["g.scoreByMotivation"]]: 20,
      [G["g.scoreByGenki"]]: 20,
      [G["g.stanceLevel"]]: 2,
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
    previewState[S.nullifySelect] = 1;
    previewState = this.engine.useCard(previewState, card);
    return Math.round(previewState[S.score]);
  }

  pickCardsToHold(state, cards, num = 1) {
    let scores = [];
    for (let i = 0; i < cards.length; i++) {
      scores.push(this.evaluateForHold(state, cards[i]));
    }
    const sortedIndices = scores
      .map((score, index) => ({ score, index }))
      .sort((a, b) => b.score - a.score)
      .slice(0, num)
      .map((item) => item.index);
    return sortedIndices;
  }

  pickCardsToMoveToHand(state, cards, num = 1) {
    return this.pickCardsToHold(state, cards, num);
  }
}
