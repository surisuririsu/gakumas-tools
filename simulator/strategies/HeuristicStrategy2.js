import { StageStrategy } from "gakumas-engine";

const PHASE_FREQUENCY_ESTIMATES = {
  startOfStage: 0,
  startOfTurn: 1,
  cardUsed: 1.2,
  activeCardUsed: 1,
  mentalCardUsed: 1,
  afterCardUsed: 1.2,
  afterActiveCardUsed: 1,
  afterMentalCardUsed: 1,
  endOfTurn: 1,
  goodImpressionTurnsIncreased: 0.75,
  motivationIncreased: 0.75,
  goodConditionTurnsIncreased: 0.75,
  concentrationIncreased: 0.75,
};

export default class HeuristicStrategy2 extends StageStrategy {
  getScore(state, cardId) {
    if (!this.engine.isCardUsable(state, cardId)) {
      return -Infinity;
    }

    let score = 0;

    let previewState = JSON.parse(JSON.stringify(state));
    previewState = this.engine.useCard(previewState, cardId);

    // Additional actions
    if (previewState.turnsRemaining >= state.turnsRemaining) {
      const { scores } = this.evaluate(previewState);
      if (scores.length) return Math.max(...scores, 1);
    }

    const { vocal, dance, visual } = this.engine.idolConfig.typeMultipliers;
    const averageTypeMultiplier = (vocal + dance + visual) / 3;

    const getTrueScore = (score) => {
      // Score buff effects
      score *= state.scoreBuffs.reduce((acc, cur) => acc + cur.amount, 1);
      score = Math.ceil(score);

      // Turn type multiplier
      score *= averageTypeMultiplier;
      score = Math.ceil(score);

      return score;
    };

    const recommendedEffect = this.engine.idolConfig.recommendedEffect;
    const goodConditionTurnsMultiplier =
      recommendedEffect == "goodConditionTurns" ? 5 : 2;
    const concentrationMultiplier =
      recommendedEffect == "concentration" ? 3 : 1;
    const goodImpressionTurnsMultiplier =
      recommendedEffect == "goodImpressionTurns" ? 3 : 1;
    const motivationMultiplier = recommendedEffect == "motivation" ? 4 : 1;

    // Effects
    const effectsDiff = previewState.effects.length - state.effects.length;
    for (let i = 0; i < effectsDiff; i++) {
      const effect = previewState.effects[previewState.effects.length - i - 1];
      const limit = Math.ceil(
        Math.min(
          effect.limit || previewState.turnsRemaining,
          previewState.turnsRemaining
        ) * PHASE_FREQUENCY_ESTIMATES[effect.phase]
      );
      score += 300 * limit;
    }

    // Cards in hand
    score += previewState.handCardIds.length * 5;

    // Cards removed
    score +=
      (((state.removedCardIds.length - previewState.removedCardIds.length) *
        (previewState.score - state.score)) /
        averageTypeMultiplier) *
      Math.floor(previewState.turnsRemaining / 12);

    // Stamina
    score += previewState.stamina * 0.33;

    // Genki
    score +=
      previewState.genki *
      Math.tanh(previewState.turnsRemaining) *
      0.8 *
      motivationMultiplier;

    // Good condition turns
    score +=
      Math.min(previewState.goodConditionTurns, previewState.turnsRemaining) *
      4.5 *
      goodConditionTurnsMultiplier;

    // Perfect condition turns
    score +=
      Math.min(
        previewState.perfectConditionTurns,
        previewState.turnsRemaining
      ) *
      previewState.goodConditionTurns *
      goodConditionTurnsMultiplier;

    // Concentration
    score +=
      previewState.concentration *
      previewState.turnsRemaining *
      1.5 *
      concentrationMultiplier;

    // Good impression turns
    score +=
      previewState.goodImpressionTurns *
      previewState.turnsRemaining *
      1.5 *
      goodImpressionTurnsMultiplier;

    // Motivation
    score +=
      previewState.motivation *
      previewState.turnsRemaining *
      0.5 *
      motivationMultiplier;

    // Score buffs
    score +=
      previewState.scoreBuffs.reduce(
        (acc, cur) =>
          acc + cur.amount * (cur.turns || previewState.turnsRemaining),
        0
      ) * 20;

    // Half cost turns
    score += previewState.halfCostTurns * 9;

    // Double cost turns
    score += previewState.doubleCostTurns * -3;

    // Cost reduction
    score += previewState.costReduction * previewState.turnsRemaining * 2;

    // Double card effect cards
    score += previewState.doubleCardEffectCards * 9;

    // Nullify genki turns
    score += previewState.nullifyGenkiTurns * -9;

    return Math.floor(
      getTrueScore(score) +
        previewState.score * 0.33 +
        previewState.score / (previewState.turnsRemaining + 1)
    );
  }
}
