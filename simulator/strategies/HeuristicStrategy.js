import { SkillCards } from "gakumas-data";

export default class HeuristicStrategy {
  constructor(engine) {
    this.engine = engine;
  }

  chooseCard(state) {
    const usableCardIds = state.handCardIds.filter((cardId) =>
      this.engine.isCardUsable(state, cardId)
    );

    if (usableCardIds.length == 0) return null;

    const heuristicScores = usableCardIds.map((id) =>
      this.getHeuristicScore(state, id)
    );
    const maxHeuristicScore = Math.max(...heuristicScores);
    const maxIndex = heuristicScores.indexOf(maxHeuristicScore);

    console.log(
      usableCardIds.map(SkillCards.getById).map(({ name }) => name),
      heuristicScores
    );

    return usableCardIds[maxIndex];
  }

  getHeuristicScore(state, cardId) {
    state = this.engine.useCard(state, cardId);
    Object.values(state.effectsByPhase).forEach((effects) => {
      state = this.engine._triggerEffects(effects, state);
    });

    const { vocal, dance, visual } = this.engine.idolConfig.typeMultipliers;
    const averageTypeMultiplier = (vocal + dance + visual) / 3;

    const getTrueScore = (score) => {
      return this.engine._calculateTrueScore(
        score,
        state,
        averageTypeMultiplier
      );
    };

    let score = state.score;

    // Turns remaining
    score += state.turnsRemaining * getTrueScore(50);

    // Card uses remaining
    score += state.cardUsesRemaining * getTrueScore(50);

    // Stamina
    score += (state.stamina / (state.turnsRemaining + 1)) * getTrueScore(2);

    // Genki
    score +=
      (state.genki + state.genki / (state.turnsRemaining + 1)) *
      getTrueScore(3);

    // Good condition turns
    score +=
      Math.min(state.goodConditionTurns, state.turnsRemaining) *
      getTrueScore(4.5);

    // Perfect condition turns
    score +=
      Math.min(state.perfectConditionTurns, state.turnsRemaining) *
      state.goodConditionTurns *
      0.1 *
      getTrueScore(9);

    // Concentration
    score +=
      state.concentration *
      state.turnsRemaining *
      state.goodConditionTurns *
      0.5 *
      getTrueScore(1);

    // Good impression turns
    score +=
      state.goodImpressionTurns *
      Math.min(state.goodImpressionTurns, state.turnsRemaining) *
      getTrueScore(1);

    // Motivation
    score += state.motivation * state.turnsRemaining * getTrueScore(2.5);

    // One turn score buff
    score += state.oneTurnScoreBuff * getTrueScore(9);

    // Permament score buff
    score += state.permanentScoreBuff * state.turnsRemaining * getTrueScore(9);

    // Half cost turns
    score += state.halfCostTurns * getTrueScore(4.5);

    // Double cost turns
    score += state.doubleCostTurns * getTrueScore(-9);

    // Cost reduction
    score += state.costReduction * state.turnsRemaining * getTrueScore(2);

    // Double card effect cards
    score += state.doubleCardEffectCards * getTrueScore(9);

    // Nullify genki turns
    score += state.nullifyGenkiTurns * getTrueScore(-9);

    return Math.floor(score);
  }
}
