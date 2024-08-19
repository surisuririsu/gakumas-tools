import BaseStrategy from "./BaseStrategy";

const PHASE_FREQUENCY_ESTIMATES = {
  startOfStage: 0,
  startOfTurn: 1,
  cardUsed: 0.5,
  activeCardUsed: 0.2,
  mentalCardUsed: 0.3,
  afterCardUsed: 0.5,
  afterActiveCardUsed: 0.2,
  afterMentalCardUsed: 0.3,
  endOfTurn: 1,
  goodImpressionTurnsIncreased: 0.2,
  motivationIncreased: 0.2,
  goodConditionTurnsIncreased: 0.2,
  concentrationIncreased: 0.2,
};

export default class HeuristicStrategy extends BaseStrategy {
  getScore(state, cardId) {
    if (!this.engine.isCardUsable(state, cardId)) {
      return -Infinity;
    }

    let previewState = JSON.parse(JSON.stringify(state));
    previewState = this.engine.useCard(previewState, cardId);

    // Predict score after effects
    for (let effect of previewState.effects) {
      const limit = Math.ceil(
        Math.min(
          effect.limit || previewState.turnsRemaining,
          previewState.turnsRemaining
        ) * PHASE_FREQUENCY_ESTIMATES[effect.phase]
      );
      for (let i = 0; i < limit; i++) {
        previewState = this.engine._triggerEffects(
          [{ ...effect, phase: null }],
          previewState
        );
      }
    }

    const { vocal, dance, visual } = this.engine.idolConfig.typeMultipliers;
    const averageTypeMultiplier = (vocal + dance + visual) / 3;

    const getTrueScore = (score) => {
      return this.engine._calculateTrueScore(
        score,
        previewState,
        averageTypeMultiplier
      );
    };

    const recommendedEffect = this.engine.idolConfig.recommendedEffect;
    const goodConditionTurnsMultiplier =
      recommendedEffect == "goodConditionTurns" ? 5 : 1;
    const concentrationMultiplier =
      recommendedEffect == "concentration" ? 4 : 1;
    const goodImpressionTurnsMultiplier =
      recommendedEffect == "goodImpressionTurns" ? 3 : 1;
    const motivationMultiplier = recommendedEffect == "motivation" ? 5 : 1;

    let score = 0;

    // Turns remaining
    score += previewState.turnsRemaining == state.turnsRemaining ? 1000 : 0;

    // Card uses remaining
    score += previewState.cardUsesRemaining * 50;

    // Stamina
    score +=
      (Math.log(previewState.stamina + 1) / (previewState.turnsRemaining + 1)) *
      0.5;

    // Genki
    score +=
      (previewState.genki /
        (Math.pow(
          previewState.turnsRemaining - this.engine.stageConfig.turnCount / 2,
          2
        ) +
          2)) *
      3 *
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

    // One turn score buff
    score += previewState.oneTurnScoreBuff * 20;

    // Permament score buff
    score += previewState.permanentScoreBuff * previewState.turnsRemaining * 20;

    // Half cost turns
    score += previewState.halfCostTurns * 4.5;

    // Double cost turns
    score += previewState.doubleCostTurns * -9;

    // Cost reduction
    score += previewState.costReduction * previewState.turnsRemaining * 2;

    // Double card effect cards
    score += previewState.doubleCardEffectCards * 9;

    // Nullify genki turns
    score += previewState.nullifyGenkiTurns * -9;

    return Math.floor(
      getTrueScore(score) +
        previewState.score +
        previewState.score / (previewState.turnsRemaining + 1)
    );
  }
}
