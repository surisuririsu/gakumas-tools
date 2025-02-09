import { S } from "../constants";
import BuffManager from "./BuffManager";
import CardManager from "./CardManager";
import EffectManager from "./EffectManager";
import Evaluator from "./Evaluator";
import Executor from "./Executor";
import StageLogger from "./StageLogger";
import TurnManager from "./TurnManager";
import { deepCopy } from "../utils";

export default class StageEngine {
  constructor(config) {
    this.config = config;
    this.logger = new StageLogger();
    this.cardManager = new CardManager(this);
    this.effectManager = new EffectManager(this);
    this.buffManager = new BuffManager(this);
    this.turnManager = new TurnManager(this);
    this.evaluator = new Evaluator(this);
    this.executor = new Executor(this);
  }

  getInitialState(skipEffects = false) {
    const state = {};

    // Logs
    this.logger.initializeState(state);

    // General
    state[S.cardUsesRemaining] = 0;
    state[S.stamina] = this.config.idol.params.stamina;
    state[S.consumedStamina] = 0;
    state[S.genki] = 0;
    state[S.score] = 0;

    // Turns
    this.turnManager.initializeState(state);

    // Buffs
    this.buffManager.initializeState(state);

    // Skill cards
    this.cardManager.initializeState(state);

    // Effects
    if (skipEffects) {
      state[S.effects] = [];
    } else {
      this.effectManager.initializeState(state);
    }

    return state;
  }

  startStage(state) {
    this.logger.disable();
    this.effectManager.triggerEffectsForPhase(state, "prestage");
    this.effectManager.clearPrestageEffects(state);
    this.logger.enable();
    this.effectManager.triggerEffectsForPhase(state, "startOfStage");
    this.logger.pushGraphData(state);
    this.turnManager.startTurn(state);
    return state;
  }

  isCardUsable(state, card) {
    return this.cardManager.isCardUsable(state, card);
  }

  useCard(prevState, card) {
    const state = deepCopy(prevState);
    this.cardManager.useCard(state, card);
    return state;
  }

  endTurn(prevState) {
    const state = deepCopy(prevState);
    this.turnManager.endTurn(state);
    return state;
  }
}
