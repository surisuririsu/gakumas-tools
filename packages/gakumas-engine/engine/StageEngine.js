import { S } from "../constants.js";
import BuffManager from "./BuffManager.js";
import CardManager from "./CardManager.js";
import EffectManager from "./EffectManager.js";
import Evaluator from "./Evaluator.js";
import Executor from "./Executor.js";
import StageLogger from "./StageLogger.js";
import TurnManager from "./TurnManager.js";
import { deepCopy } from "../utils.js";

export default class StageEngine {
  constructor(config, linkConfigs) {
    this.config = config;
    this.linkConfigs = linkConfigs;
    this.logger = new StageLogger(this);
    this.cardManager = new CardManager(this);
    this.effectManager = new EffectManager(this);
    this.buffManager = new BuffManager(this);
    this.turnManager = new TurnManager(this);
    this.evaluator = new Evaluator(this);
    this.executor = new Executor(this);
  }

  getConfig(state) {
    if (this.config.stage.type === "linkContest") {
      return this.linkConfigs[state[S.linkPhase] || 0];
    }
    return this.config;
  }

  getInitialState(skipEffects = false) {
    const state = [];

    // Logs
    this.logger.initializeState(state);

    // General
    state[S.cardUsesRemaining] = 0;
    state[S.stamina] = this.getConfig(state).idol.params.stamina;
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

  changeIdol(state) {
    state[S.linkPhase] += 1;
    state[S.stamina] = this.getConfig(state).idol.params.stamina;
    this.cardManager.changeIdol(state);
    this.logger.log(state, "linkPhaseChange", { phase: state[S.linkPhase] });
  }

  startStage(state) {
    this.logger.disable();
    this.effectManager.triggerEffectsForPhase(state, "prestage");
    this.effectManager.clearPrestageEffects(state);
    this.logger.enable();
    this.effectManager.triggerEffectsForPhase(state, "startOfStage");
    this.effectManager.triggerEffectsForPhase(state, "afterStartOfStage");
    this.logger.pushGraphData(state);
    this.turnManager.startTurn(state);
    return state;
  }

  isCardUsable(state, card) {
    return this.cardManager.isCardUsable(state, card);
  }

  executeDecision(state, decision) {
    if (decision.state) {
      return decision.state;
    } else if (decision.card !== null) {
      return this.useCard(state, decision.card);
    } else {
      return this.endTurn(state);
    }
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
