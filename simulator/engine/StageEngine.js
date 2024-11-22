import BuffManager from "./BuffManager";
import CardManager from "./CardManager";
import EffectManager from "./EffectManager";
import Evaluator from "./Evaluator";
import Executor from "./Executor";
import TurnManager from "./TurnManager";

export default class StageEngine {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    this.cardManager = new CardManager(this);
    this.effectManager = new EffectManager(this);
    this.buffManager = new BuffManager(this);
    this.turnManager = new TurnManager(this);
    this.evaluator = new Evaluator(this);
    this.executor = new Executor(this);
  }

  getInitialState() {
    const state = {
      // General
      cardUsesRemaining: 0,
      stamina: this.config.idol.params.stamina,
      consumedStamina: 0,
      genki: 0,
      score: 0,
    };

    // Turns
    this.turnManager.initializeState(state);

    // Buffs
    this.buffManager.initializeState(state);

    // Skill cards
    this.cardManager.initializeState(state);

    // Effects
    this.effectManager.initializeState(state);

    return state;
  }

  startStage(state) {
    this.effectManager.triggerEffectsForPhase(state, "startOfStage");
    this.logger.pushGraphData(state);
    this.turnManager.startTurn(state);
  }

  isCardUsable(state, card) {
    return this.cardManager.isCardUsable(state, card);
  }

  useCard(state, card) {
    this.cardManager.useCard(state, card);
  }

  endTurn(state) {
    this.turnManager.endTurn(state);
  }
}
